"""Independent county verification: every raster pixel, rural policy, exported tiles."""
import importlib.util
import json
from collections import Counter
from pathlib import Path

import mapbox_vector_tile
import mercantile
import numpy as np
import rasterio
from shapely.geometry import Point, box, shape, mapping
from shapely.affinity import affine_transform
from shapely.ops import unary_union
from shapely.strtree import STRtree
from shapely.prepared import prep
from rasterio.warp import transform_geom

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/stockholm'
spec = importlib.util.spec_from_file_location('county_build', ROOT / 'scripts/build-stockholm.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


def main():
    urban = box(0, 0, 1000, 1000)
    rural_school = box(2000, 2000, 2050, 2050)
    excluded, margin = build.exclusion_geometry(rural_school, urban, 100)
    assert excluded.equals(rural_school) and margin == 0
    assert not excluded.covers(Point(2080, 2025)), 'Rural forest proximity must remain available'
    town_school = box(100, 100, 150, 150)
    excluded, _ = build.exclusion_geometry(town_school, urban, 100)
    assert excluded.covers(Point(200, 125)), 'Urban proximity buffer missing'
    edge_school = box(950, 200, 980, 230)
    excluded, _ = build.exclusion_geometry(edge_school, urban, 100)
    assert not excluded.covers(Point(1020, 215)), 'Urban margin leaked into countryside'
    excluded, margin = build.exclusion_geometry(Point(2000, 2000), urban, 100)
    assert margin == 15 and not excluded.covers(Point(2030, 2000))

    meta = json.loads((DATA / 'habitat-metadata.json').read_text())
    profiles = json.loads((DATA / 'species-profiles.json').read_text(encoding='utf-8'))
    assert len(profiles) == len(meta['speciesBits']) == 10
    for name, field in [('habitat.tif', 'sha256'), ('landcover.tif', 'landcoverSha256'),
                        ('exclusions-3006.geojson', 'exclusionsSha256'), ('species-profiles.json', 'profilesSha256')]:
        assert build.digest(DATA / name) == meta[field], name
    counts = Counter()
    excluded_total, missing_total, inspected = 0, 0, 0
    with rasterio.open(DATA / 'landcover.tif') as original, rasterio.open(DATA / 'habitat.tif') as derived:
        assert original.crs == derived.crs and original.transform == derived.transform
        assert (original.width, original.height) == (derived.width, derived.height)
        for _, window in derived.block_windows(1):
            source, inside = original.read(window=window)
            available, bits, excluded = derived.read(window=window)
            assert not np.any(available[excluded == 1])
            assert not np.any(bits[excluded == 1])
            assert not np.any(bits[inside == 0])
            assert np.array_equal(available[excluded == 0], source[excluded == 0])
            reconstructed = np.zeros(bits.shape, dtype='uint16')
            for key, bit in meta['speciesBits'].items():
                expected = np.isin(source, profiles[key]['codes']) & (excluded == 0) & (inside == 1)
                assert np.array_equal((bits & bit) != 0, expected), key
                reconstructed[expected] |= bit
                counts[key] += int(expected.sum())
            assert np.array_equal(reconstructed, bits), 'Unexpected species bits'
            excluded_total += int(excluded.sum())
            missing_total += int(((source == 0) & (inside == 1)).sum())
            inspected += int((inside == 1).sum())
    assert dict(counts) == meta['speciesPixels'] and all(n > 0 for n in counts.values())
    assert excluded_total == meta['excludedPixels'] and missing_total == meta['missingInsideCountyPixels']
    manifest = json.loads((DATA / 'tile-manifest.json').read_text())
    eligible = {code for p in profiles.values() for code in p['codes']}
    excluded_geojson = json.loads((DATA / 'exclusions-3006.geojson').read_text(encoding='utf-8'))
    # Independent vector-space check of rendered max-detail footprints against
    # actual excluded places, rather than trusting the generated raster mask.
    # 1 Web Mercator metre tolerates <0.55 ground metres of MVT rounding here.
    excluded_geoms = [shape(transform_geom('EPSG:3006', 'EPSG:3857', f['geometry'])).buffer(-1)
                      for f in excluded_geojson['features']]
    excluded_tree = STRtree(excluded_geoms)
    native_features = 0
    for index, entry in enumerate(manifest):
        path = ROOT / 'public/data/stockholm' / entry['path']
        assert build.digest(path) == entry['sha256'], entry['path']
        decoded = mapbox_vector_tile.decode(path.read_bytes())['habitat']
        assert decoded['extent'] == 32768
        for feature in decoded['features']:
            assert feature['properties']['code'] in eligible
        if entry['path'].startswith('11/'):
            native_features += len(decoded['features'])
            zoom, x, y = entry['path'].removesuffix('.pbf').split('/')
            left, bottom, right, top = mercantile.xy_bounds(int(x), int(y), int(zoom))
            candidates = excluded_tree.query(box(left, bottom, right, top), predicate='intersects')
            if len(candidates):
                excluded_union = unary_union([excluded_geoms[i] for i in candidates])
                prepared_exclusions = prep(excluded_union)
                scale = (right-left)/32768
                for feature in decoded['features']:
                    geom = affine_transform(shape(feature['geometry']), [scale, 0, 0, scale, left, bottom])
                    assert not prepared_exclusions.intersects(geom) or geom.intersection(excluded_union).area < .01, f'Excluded place rendered: {entry["path"]}'
        if index % 50 == 0:
            print(f'Verified {index+1}/{len(manifest)} vector tiles', flush=True)
    assert native_features > 0
    report = {'status': 'PASS', 'insidePixels': inspected, 'excludedPixels': excluded_total,
              'missingPixels': missing_total, 'speciesPixels': dict(counts), 'tiles': len(manifest),
              'nativeTileFeatures': native_features, 'ruralPolicy': 'PASS', 'vectorExclusionCheck': 'PASS',
              'scope': 'Every raster pixel, tile integrity/class codes, explicit rural/urban policy cases. '
                       'Ecological field validation not performed.'}
    build.save(DATA / 'verification.json', report)
    print(json.dumps(report), flush=True)


if __name__ == '__main__':
    main()

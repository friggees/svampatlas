"""Build bounded-memory county rasters and rural-aware OSM exclusions.

python scripts/build-stockholm.py --stage clip|exclusions|habitat|all
Outputs are data artifacts, not a deployed county UI. No ecological probabilities.
"""
import argparse
from collections import Counter
import importlib.util
import json
from pathlib import Path
import subprocess

import numpy as np
import rasterio
from rasterio.features import geometry_mask, geometry_window
from rasterio.warp import transform_geom
from rasterio.windows import Window, bounds as window_bounds
from shapely import make_valid, prepare
from shapely.geometry import GeometryCollection, LineString, Point, box, mapping, shape
from shapely.ops import unary_union, polygonize_full
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/stockholm'
spec = importlib.util.spec_from_file_location('county_fetch', ROOT / 'scripts/fetch-stockholm.py')
fetch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fetch)
save, digest = fetch.save, fetch.digest


def projected(geom):
    return make_valid(shape(transform_geom('EPSG:4326', 'EPSG:3006', geom)))


def parts(geom):
    return list(geom.geoms) if geom.geom_type in ('MultiPolygon', 'GeometryCollection') else [geom]


def raster_mask(tree, geoms, window, affine, touched=False):
    indexes = tree.query(box(*window_bounds(window, affine)), predicate='intersects')
    height, width = int(window.height), int(window.width)
    if not len(indexes):
        return np.zeros((height, width), dtype=bool)
    return geometry_mask([mapping(geoms[i]) for i in indexes], (height, width),
                         rasterio.windows.transform(window, affine), invert=True, all_touched=touched)


def windows(width, height, size=1024):
    for row in range(0, height, size):
        for col in range(0, width, size):
            yield Window(col, row, min(size, width-col), min(size, height-row))


def clip():
    boundary_path = DATA / 'boundary.geojson'
    boundary = json.loads(boundary_path.read_text(encoding='utf-8'))
    geoms = parts(projected(boundary['features'][0]['geometry']))
    tree = STRtree(geoms)
    national = ROOT / 'data/landcover/NMD2023bas_v2_1.tif'
    metadata_path = DATA / 'landcover-metadata.json'
    target = DATA / 'landcover.tif'
    if metadata_path.exists() and target.exists():
        metadata = json.loads(metadata_path.read_text())
        if metadata['boundarySha256'] != digest(boundary_path) or metadata['sha256'] != digest(target):
            raise ValueError('Cached county clip checksum mismatch')
        print('Verified cached county landcover', flush=True)
        return
    counts, inside_count, missing_count = Counter(), 0, 0
    temporary = target.with_suffix('.partial.tif')
    with rasterio.open(national) as source:
        if str(source.crs) != 'EPSG:3006' or source.res != (10, 10) or source.count != 1:
            raise ValueError('Unexpected national raster')
        extent = geometry_window(source, [mapping(g) for g in geoms])
        affine = source.window_transform(extent)
        profile = source.profile.copy()
        profile.update(width=int(extent.width), height=int(extent.height), transform=affine, count=2,
                       compress='deflate', predictor=2, tiled=True, blockxsize=256, blockysize=256, nodata=0)
        with rasterio.open(temporary, 'w', **profile) as destination:
            destination.set_band_description(1, 'NMD2023 class; zero is missing/outside, never invented water')
            destination.set_band_description(2, 'County coverage mask: 1 inside, 0 outside')
            for index, window in enumerate(windows(profile['width'], profile['height'])):
                inside = raster_mask(tree, geoms, window, affine)
                original = source.read(1, window=Window(window.col_off+extent.col_off,
                    window.row_off+extent.row_off, window.width, window.height))
                original[~inside] = 0
                destination.write(original, 1, window=window)
                destination.write(inside.astype('uint16'), 2, window=window)
                codes, nums = np.unique(original[inside], return_counts=True)
                counts.update({str(int(c)): int(n) for c, n in zip(codes, nums)})
                inside_count += int(inside.sum())
                missing_count += int((inside & (original == 0)).sum())
                if index % 32 == 0:
                    print(f'Clip: {index} windows processed', flush=True)
    temporary.replace(target)
    pilot_meta = json.loads((ROOT / 'data/landcover/metadata.json').read_text(encoding='utf-8'))
    metadata = {key: pilot_meta[key] for key in ('source', 'sourceUrl', 'sourceMember', 'sourceZipCrc32', 'license')}
    metadata.update({'raster': target.name, 'sha256': digest(target), 'boundarySha256': digest(boundary_path),
        'resolutionMetres': 10, 'crs': 'EPSG:3006', 'insideCountyPixels': inside_count,
        'missingInsideCountyPixels': missing_count, 'classPixelCounts': dict(counts),
        'note': 'Nodata remains missing, including offshore areas; coverage mask is separate from class values.'})
    save(metadata_path, metadata)
    print(json.dumps({'stage': 'clip', 'insidePixels': inside_count, 'missingPixels': missing_count,
                      'bytes': target.stat().st_size}), flush=True)


def object_geometry(element):
    if element['type'] != 'relation':
        return fetch.pilot.geometry(element), None
    if element.get('tags', {}).get('type') == 'multipolygon':
        rings = {}
        fallback = None
        for role in ('outer', 'inner'):
            lines = [LineString([(p['lon'], p['lat']) for p in member['geometry'] if p])
                     for member in element['members'] if member['type'] == 'way'
                     and member.get('geometry') and member.get('role', 'outer') in
                     ([role, ''] if role == 'outer' else [role])]
            if not lines:
                rings[role] = GeometryCollection()
                continue
            polygons, cuts, dangles, invalid = polygonize_full(unary_union(lines))
            if not cuts.is_empty or not dangles.is_empty or not invalid.is_empty:
                if role == 'outer':
                    # Broken source geometry is quarantined, not silently treated
                    # as usable habitat. Keep its conservative envelope explicit.
                    return unary_union(lines).envelope, 'unclosed-outer-envelope'
                fallback = 'unclosed-inner-omitted'
            rings[role] = unary_union(list(polygons.geoms))
        if rings['outer'].is_empty:
            raise ValueError(f'Missing outer geometry for relation {element["id"]}')
        return rings['outer'].difference(rings['inner']), fallback
    # Station/site relations may represent several platforms rather than an area.
    members = []
    for member in element.get('members', []):
        if member['type'] == 'node' and 'lat' in member:
            members.append(Point(member['lon'], member['lat']))
        elif member['type'] == 'way' and member.get('geometry'):
            coords = [(p['lon'], p['lat']) for p in member['geometry'] if p]
            if len(coords) >= 2:
                members.append(LineString(coords))
    if not members:
        raise ValueError(f'No geometry for relation {element["id"]}')
    return GeometryCollection(members), 'relation-members'


def exclusion_geometry(geom, urban, metres):
    # Mapped facility footprints remain excluded in the countryside. Only the
    # additional proximity margin is restricted to actual SCB urban polygons.
    # Nodes/lines have no area: use a declared small footprint proxy everywhere.
    core_margin = 0 if geom.geom_type in ('Polygon', 'MultiPolygon') else min(15, metres)
    core = geom.buffer(core_margin) if core_margin else geom
    if urban.is_empty:
        return core, core_margin
    expanded = geom.buffer(metres)
    if urban.covers(expanded):
        return expanded, core_margin
    return make_valid(unary_union([core, expanded.intersection(urban)])), core_margin


def exclusions():
    manifest_path = DATA / 'osm-manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if {entry['municipalityCode'] for entry in manifest['files']} != fetch.MUNICIPALITIES:
        raise ValueError('Incomplete OSM municipality coverage')
    urban_path = DATA / 'urban-2023.geojson'
    urban = unary_union([projected(f['geometry']) for f in json.loads(urban_path.read_text(encoding='utf-8'))['features']])
    urban_parts = parts(urban)
    for geom in urban_parts:
        prepare(geom)
    urban_tree = STRtree(urban_parts)
    county = projected(json.loads((DATA / 'boundary.geojson').read_text(encoding='utf-8'))['features'][0]['geometry'])
    prepare(county)
    seen, features, categories, relation_members, quarantined = set(), [], Counter(), [], []
    for entry in manifest['files']:
        path = DATA / entry['file']
        if digest(path) != entry['sha256']:
            raise ValueError(f'OSM cache changed: {path}')
        for element in json.loads(path.read_text(encoding='utf-8'))['elements']:
            osm_id = f'{element["type"]}/{element["id"]}'
            if osm_id in seen:
                continue
            seen.add(osm_id)
            matches = [(key, value, metres) for key, values in fetch.RULES.items() for value, metres in values.items()
                       if key != 'landcover' and element.get('tags', {}).get(key) == value]
            if not matches:
                continue
            key, value, metres = max(matches, key=lambda match: match[2])
            geom, fallback = object_geometry(element)
            geom = projected(mapping(make_valid(geom)))
            if not geom.buffer(metres).intersects(county):
                continue
            nearby = urban_tree.query(geom.buffer(metres), predicate='intersects')
            local_urban = urban_parts[nearby[0]] if len(nearby) == 1 else unary_union([urban_parts[i] for i in nearby])
            excluded, core_margin = exclusion_geometry(geom, local_urban, metres)
            if not county.covers(excluded):
                excluded = excluded.intersection(county)
            if excluded.is_empty:
                continue
            if fallback == 'relation-members':
                relation_members.append(osm_id)
            elif fallback:
                if geom.area > 100_000_000:
                    raise ValueError(f'Broken source geometry too large to quarantine: {osm_id}')
                quarantined.append({'osmId': osm_id, 'reason': fallback, 'areaSquareMetres': geom.area})
            category = f'{key}={value}'
            categories[category] += 1
            features.append({'type': 'Feature', 'properties': {'osmId': osm_id, 'category': category,
                'urbanBufferMetres': metres, 'coreProxyMetres': core_margin, 'geometryFallback': fallback}, 'geometry': mapping(excluded)})
        print(f'Exclusions: {entry["municipalityCode"]}, {len(features)} unique county objects', flush=True)
    save(DATA / 'exclusions-3006.geojson', {'type': 'FeatureCollection',
        'crs': {'type': 'name', 'properties': {'name': 'urn:ogc:def:crs:EPSG::3006'}}, 'features': features,
        'metadata': {'source': 'OpenStreetMap contributors; SCB Tatorter 2023', 'license': 'ODbL-1.0',
        'osmManifestSha256': digest(manifest_path), 'urbanSha256': digest(urban_path), 'snapshot': manifest['snapshot'],
        'rules': fetch.RULES, 'categories': dict(categories), 'memberGeometryRelations': relation_members,
        'quarantinedGeometries': quarantined,
        'method': 'Mapped footprints excluded everywhere; additional margins only inside SCB urban polygons. '
                  'Point/line proxies up to 15 m. Natural grassland/pasture not excluded by grass cover alone. '
                  'OSM is incomplete; management and mowing frequency are not verified.'}})


def habitat():
    profiles_path = DATA / 'species-profiles.json'
    subprocess.run(['node', '--experimental-strip-types', '--input-type=module', '-e',
        "import {habitatProfiles} from './src/features/exploration/habitat-profiles.ts';"
        "import {writeFileSync} from 'node:fs';"
        "writeFileSync('data/stockholm/species-profiles.json',JSON.stringify(habitatProfiles,null,2));"], cwd=ROOT, check=True)
    profiles = json.loads(profiles_path.read_text(encoding='utf-8'))
    if len(profiles) != 10:
        raise ValueError('Expected all ten species profiles')
    exclusions_path = DATA / 'exclusions-3006.geojson'
    excluded_data = json.loads(exclusions_path.read_text(encoding='utf-8'))
    geoms = [shape(f['geometry']) for f in excluded_data['features']]
    tree = STRtree(geoms)
    lookup = np.zeros(65536, dtype='uint16')
    for index, profile in enumerate(profiles.values()):
        for code in profile['codes']:
            lookup[code] |= 1 << index
    species_counts = {key: 0 for key in profiles}
    excluded_count = 0
    target = DATA / 'habitat.tif'
    temporary = target.with_suffix('.partial.tif')
    with rasterio.open(DATA / 'landcover.tif') as source:
        profile = source.profile.copy()
        profile.update(count=3)
        with rasterio.open(temporary, 'w', **profile) as destination:
            destination.set_band_description(1, 'Available NMD class after county and management masks')
            destination.set_band_description(2, 'Species bitmask; bits listed in habitat-metadata.json')
            destination.set_band_description(3, 'Exclusion mask, 1 excluded; not a suitability score')
            for index, window in enumerate(windows(source.width, source.height)):
                original = source.read(1, window=window)
                inside = source.read(2, window=window).astype(bool)
                excluded = raster_mask(tree, geoms, window, source.transform, touched=True) & inside
                available = np.where(excluded, 0, original).astype('uint16')
                bits = lookup[available]
                destination.write(available, 1, window=window)
                destination.write(bits, 2, window=window)
                destination.write(excluded.astype('uint16'), 3, window=window)
                if (bits[excluded] != 0).any() or (bits[~inside] != 0).any():
                    raise ValueError('Excluded/outside habitat leaked')
                excluded_count += int(excluded.sum())
                for bit, key in enumerate(profiles):
                    species_counts[key] += int(((bits & (1 << bit)) != 0).sum())
                if index % 32 == 0:
                    print(f'Habitat: {index} windows processed', flush=True)
    temporary.replace(target)
    landcover = json.loads((DATA / 'landcover-metadata.json').read_text())
    metadata = {'region': 'Stockholms län', 'countyCode': '01', 'raster': target.name,
        'sha256': digest(target), 'landcoverSha256': digest(DATA / 'landcover.tif'),
        'exclusionsSha256': digest(exclusions_path), 'profilesSha256': digest(profiles_path),
        'profileSourceSha256': digest(ROOT / 'src/features/exploration/habitat-profiles.ts'),
        'resolutionMetres': 10, 'crs': 'EPSG:3006', 'speciesBits': {key: 1 << bit for bit, key in enumerate(profiles)},
        'speciesPixels': species_counts, 'excludedPixels': excluded_count, 'excludedObjects': len(geoms),
        'excludedCategories': excluded_data['metadata']['categories'],
        'quarantinedGeometries': excluded_data['metadata']['quarantinedGeometries'],
        'missingInsideCountyPixels': landcover['missingInsideCountyPixels'],
        'license': 'ODbL-1.0 (OSM-derived); original NMD CC0',
        'method': 'Exact 10 m NMD class match using existing ten app profiles, all touched exclusion pixels removed.',
        'limitations': 'Experimental land-cover proxies, not mushroom probability. Host trees, soil chemistry, '
                      'mowing schedules and field validation are missing. No county weather score generated.'}
    save(DATA / 'habitat-metadata.json', metadata)
    print(json.dumps(metadata, ensure_ascii=True), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stage', choices=['clip', 'exclusions', 'habitat', 'all'], default='all')
    args = parser.parse_args()
    for name, action in [('clip', clip), ('exclusions', exclusions), ('habitat', habitat)]:
        if args.stage in (name, 'all'):
            action()

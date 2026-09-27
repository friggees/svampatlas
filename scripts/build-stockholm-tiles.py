"""Publish county habitat as static vector tiles, loaded only for visible map bounds.

Zoom 11 keeps native 10 m footprints. Zoom 7–10 uses conservative overviews:
only homogeneous blocks survive, so overview aggregation never fills exclusions.
MVT extent 32768 limits quantization to <0.4 m on the ground at max source zoom.
"""
import hashlib
import importlib.util
import json
from pathlib import Path

import mapbox_vector_tile
import mercantile
import numpy as np
import rasterio
from affine import Affine
from rasterio.features import geometry_window, shapes
from rasterio.warp import transform_geom
from rasterio.windows import Window
from shapely import make_valid
from shapely.geometry import box, mapping, shape

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/stockholm'
OUT = ROOT / 'public/data/stockholm'
spec = importlib.util.spec_from_file_location('county_build', ROOT / 'scripts/build-stockholm.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


def overview(source, factor):
    target = DATA / f'overview-{factor}.tif'
    profile = source.profile.copy()
    width = (source.width + factor - 1) // factor
    height = (source.height + factor - 1) // factor
    profile.update(count=1, width=width, height=height, transform=source.transform * Affine.scale(factor))
    with rasterio.open(target, 'w', **profile) as destination:
        for window in build.windows(width, height, 256):
            rows, cols = int(window.height)*factor, int(window.width)*factor
            original = source.read(1, window=Window(window.col_off*factor, window.row_off*factor, cols, rows),
                                   boundless=True, fill_value=0)
            blocks = original.reshape(int(window.height), factor, int(window.width), factor)
            low, high = blocks.min(axis=(1, 3)), blocks.max(axis=(1, 3))
            conservative = np.where(low == high, low, 0).astype('uint16')
            destination.write(conservative, 1, window=window)
    return target


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    metadata = json.loads((DATA / 'habitat-metadata.json').read_text(encoding='utf-8'))
    if build.digest(DATA / 'habitat.tif') != metadata['sha256']:
        raise ValueError('Habitat checksum mismatch')
    boundary = json.loads((DATA / 'boundary.geojson').read_text(encoding='utf-8'))
    bbox = boundary['bbox']
    profiles = json.loads((DATA / 'species-profiles.json').read_text(encoding='utf-8'))
    eligible = np.array(sorted({code for profile in profiles.values() for code in profile['codes']}))
    tile_counts, total_bytes, total_features = {}, 0, 0
    files = []
    with rasterio.open(DATA / 'habitat.tif') as native:
        overview_paths = {factor: overview(native, factor) for factor in (2, 4, 8, 16)}
    for zoom in range(7, 12):
        source_path = DATA / 'habitat.tif' if zoom == 11 else overview_paths[2 ** (11-zoom)]
        tiles = list(mercantile.tiles(*bbox, zooms=zoom))
        tile_counts[zoom] = len(tiles)
        with rasterio.open(source_path) as source:
            for index, tile in enumerate(tiles):
                tile_bounds = mercantile.xy_bounds(tile)
                tile_box = box(*tile_bounds)
                projected_box = transform_geom('EPSG:3857', source.crs, mapping(tile_box))
                features = []
                try:
                    window = geometry_window(source, [projected_box], pad_x=1, pad_y=1)
                except rasterio.errors.WindowError:
                    window = None
                if window is not None:
                    pixels = source.read(1, window=window)
                    mask = np.isin(pixels, eligible)
                    for geom, code in shapes(pixels, mask=mask, transform=source.window_transform(window)):
                        converted = make_valid(shape(transform_geom(source.crs, 'EPSG:3857', geom)))
                        clipped = converted.intersection(tile_box)
                        if clipped.is_empty or clipped.area == 0:
                            continue
                        for polygon in build.parts(clipped):
                            if polygon.geom_type not in ('Polygon', 'MultiPolygon') or polygon.is_empty:
                                continue
                            features.append({'geometry': polygon, 'properties': {'code': int(code)}})
                payload = mapbox_vector_tile.encode({'name': 'habitat', 'features': features},
                    default_options={'quantize_bounds': tuple(tile_bounds), 'extents': 32768})
                target = OUT / str(zoom) / str(tile.x) / f'{tile.y}.pbf'
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(payload)
                total_bytes += len(payload)
                total_features += len(features)
                files.append({'path': str(target.relative_to(OUT)).replace('\\', '/'),
                              'sha256': hashlib.sha256(payload).hexdigest(), 'bytes': len(payload)})
                if index % 25 == 0:
                    print(f'Tiles z{zoom}: {index+1}/{len(tiles)}, {total_bytes/1e6:.1f} MB', flush=True)
    # Full-precision boundary remains available to server-side coordinate validation.
    build.save(OUT / 'boundary.geojson', boundary)
    municipalities = json.loads((DATA / 'municipalities.geojson').read_text(encoding='utf-8'))
    build.save(OUT / 'municipalities.json', [{'code': f['properties']['municipalityCode'],
        'bbox': list(shape(f['geometry']).bounds)} for f in municipalities['features']])
    # The map line can use a simplified outline; never use it for mask/saving checks.
    simple = shape(boundary['features'][0]['geometry']).simplify(.0001, preserve_topology=True)
    build.save(OUT / 'outline.geojson', {'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'properties': {}, 'geometry': mapping(simple)}]})
    build.save(OUT / 'metadata.json', {**metadata, 'bbox': bbox, 'minzoom': 7, 'maxzoom': 11,
        'tileCounts': tile_counts, 'tileBytes': total_bytes, 'tileFeatures': total_features,
        'classLabels': json.loads((ROOT / 'data/landcover/metadata.json').read_text(encoding='utf-8'))['classLabels'],
        'overview': 'Conservative homogeneous 20–160 m blocks; native 10 m footprints from source zoom 11.',
        'osmSnapshot': json.loads((DATA / 'osm-manifest.json').read_text())['snapshot']})
    build.save(DATA / 'tile-manifest.json', files)
    print(json.dumps({'tiles': len(files), 'bytes': total_bytes, 'features': total_features}), flush=True)


if __name__ == '__main__':
    main()

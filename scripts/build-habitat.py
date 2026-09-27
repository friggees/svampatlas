"""Build reproducible 250 m analysis cells with exact 10 m class footprints.
No network; requires the verified local NMD clip. Run python scripts/build-habitat.py.
"""
import hashlib
import json
from pathlib import Path
import numpy as np
import rasterio
from rasterio.features import shapes, geometry_mask, rasterize
from rasterio.warp import transform_geom, transform
from rasterio.windows import Window

def encode_ring(ring):
    """Lossless delta encoding of the already rounded WGS84 coordinates."""
    result, previous = [], [0, 0]
    for point in ring:
        for axis in (0, 1):
            value = round(point[axis] * 1_000_000)
            delta = value - previous[axis]
            previous[axis] = value
            unsigned = ~(delta << 1) if delta < 0 else delta << 1
            while unsigned >= 32:
                result.append(chr((32 | (unsigned & 31)) + 63))
                unsigned >>= 5
            result.append(chr(unsigned + 63))
    return ''.join(result)

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/landcover'
meta = json.loads((DATA / 'metadata.json').read_text(encoding='utf-8'))
raster = DATA / meta['raster']
assert hashlib.sha256(raster.read_bytes()).hexdigest() == meta['sha256'], 'Raster checksum mismatch'
boundary = ROOT / 'public/data/botkyrka-regso.geojson'
assert hashlib.sha256(boundary.read_bytes()).hexdigest() == meta['boundarySha256'], 'Boundary mismatch'
eligible = list(range(111, 118)) + list(range(121, 128)) + [4231, 4232, 4233]
cells, features = [], []
with rasterio.open(raster) as src:
    assert str(src.crs) == 'EPSG:3006' and src.res == (10, 10)
    arr = src.read(1)
    geoms = [transform_geom('EPSG:4326', src.crs, f['geometry']) for f in json.loads(boundary.read_text())['features']]
    inside = geometry_mask(geoms, arr.shape, src.transform, invert=True)
    codes, counts = np.unique(arr[arr != 0], return_counts=True)
    assert {str(int(c)): int(n) for c, n in zip(codes, counts)} == meta['classPixelCounts']
    assert int(inside.sum()) == meta['insidePilotPixels']
    assert int(((arr == 0) & inside).sum()) == meta['missingInsidePilotPixels']
    for row in range(0, src.height, 25):
        for col in range(0, src.width, 25):
            block = arr[row:row+25, col:col+25]
            mask = inside[row:row+25, col:col+25]
            total = int(mask.sum())
            if not total:
                continue
            cell_id = f'{row//25}-{col//25}'
            codes, counts = np.unique(block[mask], return_counts=True)
            cell = {'id': cell_id, 'pixels': total, 'counts': {str(int(c)): int(n) for c, n in zip(codes, counts)}}
            cells.append(cell)
            affine = src.window_transform(Window(col, row, block.shape[1], block.shape[0]))
            for code in codes:
                if code not in eligible:
                    continue
                selected = (block == code) & mask
                parts = [geom for geom, _ in shapes(selected.astype('uint8'), mask=selected, transform=affine)]
                # Check exact footprint before coordinate conversion: no water/buildings/nodata added.
                restored = rasterize(((g, 1) for g in parts), out_shape=block.shape, transform=affine)
                assert np.array_equal(restored.astype(bool), selected)
                polygon = {'type': 'MultiPolygon', 'coordinates': [g['coordinates'] for g in parts]}
                rr, cc = np.where(selected)
                index = int(np.argmin((rr-12)**2 + (cc-12)**2))
                x, y = affine * (int(cc[index])+.5, int(rr[index])+.5)
                lon, lat = transform(src.crs, 'EPSG:4326', [x], [y])
                features.append({'type': 'Feature', 'geometry': transform_geom(src.crs, 'EPSG:4326', polygon, precision=6),
                                 'properties': {'cellId': cell_id, 'code': int(code), 'longitude': round(lon[0], 6), 'latitude': round(lat[0], 6)}})
patches = [[f['properties']['cellId'], f['properties']['code'], f['properties']['longitude'], f['properties']['latitude'],
            [[encode_ring(ring) for ring in polygon] for polygon in f['geometry']['coordinates']]] for f in features]
out = {'encoding': 'delta-wgs84-1e6-v1', 'patches': patches, 'cells': cells,
       'metadata': {**meta, 'cellSizeMetres': 250, 'method': 'Exact class footprints within 25x25 pixel blocks; six-decimal WGS84 export. Cell shares include all pilot pixels, including excluded classes and nodata.'}}
target = ROOT / 'public/data/botkyrka-habitat.json'
payload = json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n'
temporary = target.with_suffix('.tmp')
temporary.write_text(payload, encoding='utf-8')
temporary.replace(target)
print(json.dumps({'cells': len(cells), 'features': len(features), 'bytes': target.stat().st_size, 'missingPixels': meta['missingInsidePilotPixels'], 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))

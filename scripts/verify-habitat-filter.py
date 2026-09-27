"""Independently verify every decoded published footprint against OSM exclusions."""
import json
from pathlib import Path
from shapely.geometry import shape, MultiPolygon
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[1]

def decode_ring(encoded):
    offset, previous, ring = 0, [0, 0], []
    while offset < len(encoded):
        for axis in (0, 1):
            value, shift = 0, 0
            while True:
                byte = ord(encoded[offset]) - 63
                offset += 1
                value |= (byte & 31) << shift
                shift += 5
                if byte < 32:
                    break
            previous[axis] += ~(value >> 1) if value & 1 else value >> 1
        ring.append([v / 1e6 for v in previous])
    return ring

data = json.loads((ROOT / 'public/data/botkyrka-habitat.json').read_text(encoding='utf-8'))
excluded = json.loads((ROOT / 'public/data/botkyrka-exclusions.geojson').read_text(encoding='utf-8'))
geoms = [shape(f['geometry']) for f in excluded['features']]
tree = STRtree(geoms)
assert data['metadata']['exclusions']['excludedPixels'] > 0
for cell, code, lon, lat, polygons in data['patches']:
    decoded = [[decode_ring(ring) for ring in polygon] for polygon in polygons]
    geom = MultiPolygon([(poly[0], poly[1:]) for poly in decoded])
    for index in tree.query(geom, predicate='intersects'):
        # Six-decimal WGS84 export moves edges by centimetres. Permit only rounding
        # slivers < approximately 0.064 m² here, compared with a 100 m² source pixel.
        assert geom.intersection(geoms[index]).area < 1e-11, f'Excluded place still highlighted: {cell}, {code}, {excluded["features"][index]["properties"]}'
print(f'PASS: {len(data["patches"])} decoded footprints checked against {len(geoms)} buffered excluded places; no overlap beyond coordinate-rounding tolerance (0.064 m²).')

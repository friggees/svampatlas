"""Fetch only Botkyrka's surroundings from OSM, then derive buffered exclusions.
Cached raw response is reused; delete that single cache file to intentionally refresh.
Run before build-habitat.py. No live Overpass calls from the app.
"""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
import requests
from rasterio.warp import transform_geom
from shapely.geometry import Point, LineString, Polygon, mapping, shape
from shapely.ops import polygonize, unary_union
from shapely import make_valid

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'data/landcover/exclusions-osm.json'
# Buffers are product preferences for avoiding managed/busy places, not biological limits.
RULES = {
    'amenity': {'school': 100, 'kindergarten': 100, 'college': 100, 'university': 100,
                'hospital': 50, 'parking': 25, 'marketplace': 75, 'grave_yard': 15},
    'leisure': {'park': 15, 'garden': 15, 'playground': 30, 'pitch': 30, 'sports_centre': 30,
                'stadium': 50, 'golf_course': 15, 'swimming_pool': 30},
    'landuse': {'residential': 25, 'retail': 75, 'commercial': 75, 'industrial': 25,
                'cemetery': 15, 'allotments': 15, 'recreation_ground': 30, 'village_green': 15,
                'grass': 15, 'flowerbed': 15, 'construction': 25, 'brownfield': 25, 'railway': 25},
    'shop': {'mall': 75, 'supermarket': 50},
    'place': {'square': 50},
}

def geometry(element):
    if element['type'] == 'node':
        return Point(element['lon'], element['lat'])
    if element['type'] == 'way':
        points = [(p['lon'], p['lat']) for p in element.get('geometry', []) if p]
        if len(points) < 2:
            raise ValueError(f"Missing way geometry {element['id']}")
        return Polygon(points) if len(points) >= 4 and points[0] == points[-1] else LineString(points)
    if element.get('tags', {}).get('type') != 'multipolygon':
        raise ValueError(f"Unsupported relation {element['id']}")
    rings = {}
    for role in ('outer', 'inner'):
        lines = [LineString([(p['lon'], p['lat']) for p in m['geometry']]) for m in element['members']
                 if m['type'] == 'way' and m.get('role', 'outer') in ([role, ''] if role == 'outer' else [role])]
        rings[role] = unary_union(list(polygonize(unary_union(lines)))) if lines else Polygon()
    if rings['outer'].is_empty:
        raise ValueError(f"Unclosed relation {element['id']}")
    return rings['outer'].difference(rings['inner'])

def main():
    bbox = json.loads((ROOT / 'public/data/pilot-metadata.json').read_text(encoding='utf-8'))['bbox']
    # Small margin includes schools/centres just outside pilot whose buffers enter it.
    west, south, east, north = bbox
    bounds = f'{south-.002},{west-.004},{north+.002},{east+.004}'
    query = '[out:json][timeout:90];(' + ''.join(f'nwr["{key}"~"^({"|".join(values)})$"]({bounds});' for key, values in RULES.items()) + ');out geom;'
    if not CACHE.exists():
        response = requests.post('https://overpass-api.de/api/interpreter', data={'data': query},
                                 headers={'User-Agent': 'Svampatlas-Botkyrka-pilot/1.0'}, timeout=120)
        response.raise_for_status()
        raw = response.json()
        if raw.get('remark') or not raw.get('elements'):
            raise ValueError('Overpass returned incomplete data')
        raw['_fetchedAt'] = datetime.now(timezone.utc).isoformat()
        raw['_query'] = query
        CACHE.write_text(json.dumps(raw, ensure_ascii=False), encoding='utf-8')
    raw = json.loads(CACHE.read_text(encoding='utf-8'))
    assert raw['_query'] == query, 'Cache belongs to a different query; refresh explicitly'
    features, categories = [], {}
    for element in raw['elements']:
        matches = [(key, val, metres) for key, values in RULES.items() for val, metres in values.items() if element.get('tags', {}).get(key) == val]
        if not matches:
            continue
        key, val, metres = max(matches, key=lambda match: match[2])
        geom = make_valid(geometry(element))
        projected = shape(transform_geom('EPSG:4326', 'EPSG:3006', mapping(geom)))
        buffered = projected.buffer(metres)
        if buffered.is_empty:
            raise ValueError('Empty exclusion')
        category = f'{key}={val}'
        categories[category] = categories.get(category, 0) + 1
        features.append({'type': 'Feature', 'properties': {'osmId': f"{element['type']}/{element['id']}", 'category': category, 'bufferMetres': metres},
                         'geometry': transform_geom('EPSG:3006', 'EPSG:4326', mapping(buffered), precision=7)})
    out = {'type': 'FeatureCollection', 'features': features, 'metadata': {
        'source': '© OpenStreetMap contributors', 'license': 'ODbL-1.0', 'sourceUrl': 'https://www.openstreetmap.org/copyright',
        'fetchedAt': raw['_fetchedAt'], 'osmTimestamp': raw['osm3s']['timestamp_osm_base'], 'query': query,
        'rawSha256': hashlib.sha256(CACHE.read_bytes()).hexdigest(), 'rules': RULES, 'categories': categories,
        'note': 'Preference filter for managed/busy places, not absence of mushrooms. OSM coverage is incomplete. Buffers in EPSG:3006.'}}
    target = ROOT / 'public/data/botkyrka-exclusions.geojson'
    temporary = target.with_suffix('.tmp')
    temporary.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')
    temporary.replace(target)
    print(json.dumps({'features': len(features), 'categories': categories, 'bytes': target.stat().st_size}))

if __name__ == '__main__':
    main()

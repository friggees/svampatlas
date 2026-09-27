"""Acquire Stockholm county inputs. Cached, sequential, resumable; no app requests.

python scripts/fetch-stockholm.py --stage boundaries|osm|all
Original responses stay in ignored data/stockholm; hashes describe each source.
"""
import argparse
import hashlib
import importlib.util
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from shapely import make_valid
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/stockholm'
WFS = 'https://geodata.scb.se/geoserver/stat/wfs'
OVERPASS = 'https://overpass-api.de/api/interpreter'
MUNICIPALITIES = {'0114', '0115', '0117', '0120', '0123', '0125', '0126',
                  '0127', '0128', '0136', '0138', '0139', '0140', '0160',
                  '0162', '0163', '0180', '0181', '0182', '0183', '0184',
                  '0186', '0187', '0188', '0191', '0192'}
spec = importlib.util.spec_from_file_location('pilot_exclusions', ROOT / 'scripts/fetch-exclusions.py')
pilot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pilot)
RULES = {key: dict(values) for key, values in pilot.RULES.items()}
RULES['amenity']['bus_station'] = 75
RULES['railway'] = {'station': 100, 'halt': 75, 'platform': 25, 'tram_stop': 25}
RULES['public_transport'] = {'station': 100, 'platform': 25}
RULES['landcover'] = {'grass': 15}


def digest(path):
    with path.open('rb') as source:
        return hashlib.file_digest(source, 'sha256').hexdigest()


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.partial')
    temporary.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    temporary.replace(path)


def get_json(path, url, params):
    if path.exists():
        return json.loads(path.read_text(encoding='utf-8'))
    response = requests.get(url, params=params, timeout=(30, 180))
    response.raise_for_status()
    value = response.json()
    if not value.get('features') or int(value.get('numberMatched', -1)) != len(value['features']):
        raise ValueError('Empty or incomplete SCB response')
    value['_provenance'] = {'url': response.url, 'fetchedAt': datetime.now(timezone.utc).isoformat()}
    save(path, value)
    return value


def boundaries():
    params = {'service': 'WFS', 'version': '2.0.0', 'request': 'GetFeature',
              'outputFormat': 'application/json', 'srsName': 'EPSG:4326', 'count': '10000'}
    regso = get_json(DATA / 'regso-2025.json', WFS,
                     {**params, 'typeNames': 'stat:RegSO_2025', 'CQL_FILTER': "kommunkod LIKE '01%'"})
    codes = {f['properties']['kommunkod'] for f in regso['features']}
    if codes != MUNICIPALITIES:
        raise ValueError(f'Expected all 26 county municipalities, received {sorted(codes)}')
    features = []
    for code in sorted(codes):
        geom = unary_union([make_valid(shape(f['geometry'])) for f in regso['features']
                            if f['properties']['kommunkod'] == code])
        if not geom.is_valid or geom.is_empty:
            raise ValueError(f'Invalid municipality {code}')
        features.append({'type': 'Feature', 'properties': {'municipalityCode': code}, 'geometry': mapping(geom)})
    county = unary_union([shape(f['geometry']) for f in features])
    west, south, east, north = county.bounds
    if not (17 < west < east < 20.5 and 58 < south < north < 61):
        raise ValueError(f'Unexpected county bounds {county.bounds}')
    save(DATA / 'municipalities.geojson', {'type': 'FeatureCollection', 'features': features})
    save(DATA / 'boundary.geojson', {'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'properties': {'name': 'Stockholms län', 'countyCode': '01'}, 'geometry': mapping(county)}],
        'bbox': list(county.bounds), 'metadata': {**regso['_provenance'], 'source': 'SCB RegSO 2025',
        'rawSha256': digest(DATA / 'regso-2025.json'), 'municipalities': sorted(codes),
        'note': 'County extent derived from all 26 municipalities; not an access or property map.'}})
    # A spatial query includes towns crossing the county boundary too.
    urban = get_json(DATA / 'urban-2023.geojson', WFS, {**params, 'typeNames': 'stat:Tatorter_2023',
        'CQL_FILTER': f"BBOX(sp_geometry,{west},{south},{east},{north},'EPSG:4326')"})
    print(json.dumps({'stage': 'boundaries', 'municipalities': len(codes), 'regso': len(regso['features']),
                      'urbanFeatures': len(urban['features']), 'bbox': list(county.bounds)}), flush=True)


def osm():
    municipalities = json.loads((DATA / 'municipalities.geojson').read_text(encoding='utf-8'))
    snapshot_path = DATA / 'osm-snapshot.json'
    if not snapshot_path.exists():
        # Consistent historical instant across all municipal requests and resumes.
        response = requests.post(OVERPASS, data={'data': '[out:json];node(1);out;'}, timeout=(30, 60))
        response.raise_for_status()
        raw = response.json()
        if raw.get('remark'):
            raise ValueError(raw['remark'])
        save(snapshot_path, {'timestamp': raw['osm3s']['timestamp_osm_base']})
    timestamp = json.loads(snapshot_path.read_text())['timestamp']
    manifest = []
    for index, feature in enumerate(municipalities['features']):
        code = feature['properties']['municipalityCode']
        west, south, east, north = shape(feature['geometry']).bounds
        # Includes features immediately outside the county/municipality boundary.
        bounds = f'{south-.003},{west-.006},{north+.003},{east+.006}'
        query = f'[out:json][timeout:180][date:"{timestamp}"];(' + ''.join(
            f'nwr["{key}"~"^({"|".join(values)})$"]({bounds});' for key, values in RULES.items()) + ');out geom;'
        path = DATA / 'osm' / f'{code}.json'
        if path.exists():
            raw = json.loads(path.read_text(encoding='utf-8'))
            if raw.get('_query') != query:
                raise ValueError(f'Cache query mismatch: {path}')
        else:
            for attempt in range(3):
                try:
                    response = requests.post(OVERPASS, data={'data': query},
                        headers={'User-Agent': 'Svampatlas-Stockholm-data-import/1.0'}, timeout=(30, 210))
                    response.raise_for_status()
                    raw = response.json()
                    if raw.get('remark') or not raw.get('elements'):
                        raise ValueError(f'Incomplete OSM response for {code}: {raw.get("remark")}')
                    break
                except (requests.RequestException, ValueError):
                    if attempt == 2:
                        raise
                    time.sleep(20 * (attempt + 1))
            raw['_query'] = query
            raw['_fetchedAt'] = datetime.now(timezone.utc).isoformat()
            save(path, raw)
            time.sleep(2)
        manifest.append({'municipalityCode': code, 'file': str(path.relative_to(DATA)),
                         'sha256': digest(path), 'elements': len(raw['elements'])})
        print(f'OSM {index+1}/26: {code}, {len(raw["elements"])} objects', flush=True)
    save(DATA / 'osm-manifest.json', {'source': 'OpenStreetMap / Overpass', 'sourceUrl': OVERPASS,
        'license': 'ODbL-1.0', 'snapshot': timestamp, 'rules': RULES, 'files': manifest})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stage', choices=['boundaries', 'osm', 'all'], default='all')
    args = parser.parse_args()
    DATA.mkdir(parents=True, exist_ok=True)
    if args.stage in ('boundaries', 'all'):
        boundaries()
    if args.stage in ('osm', 'all'):
        osm()

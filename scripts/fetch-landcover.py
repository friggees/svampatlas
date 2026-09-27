"""Download official NMD2023 v2.1 raster member, verify CRC, crop to pilot.
Run: python -m pip install -r scripts/requirements-landcover.txt
     python scripts/fetch-landcover.py
National intermediate is cached outside public; only crop and metadata are needed.
"""
import io
import json
import struct
import zipfile
import zlib
import hashlib
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import requests
import rasterio
from rasterio.mask import mask
from rasterio.features import geometry_mask
from rasterio.warp import transform_geom

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/landcover'
OUT.mkdir(parents=True, exist_ok=True)
URL = 'https://geodata.naturvardsverket.se/nedladdning/marktacke/NMD2023/Basskikt_v2_x/NMD2023_basskikt_v2_1.zip'
SESSION = requests.Session()


class RemoteZip(io.RawIOBase):
    def __init__(self):
        response = SESSION.head(URL, timeout=30)
        response.raise_for_status()
        self.size = int(response.headers['Content-Length'])
        self.pos = 0

    def seekable(self): return True
    def readable(self): return True
    def tell(self): return self.pos

    def seek(self, offset, whence=0):
        self.pos = offset if whence == 0 else self.pos + offset if whence == 1 else self.size + offset
        return self.pos

    def read(self, count=-1):
        count = min(count if count >= 0 else self.size, self.size - self.pos)
        if count <= 0: return b''
        if count > 16_000_000: raise ValueError('Unexpected large metadata read')
        response = SESSION.get(URL, headers={'Range': f'bytes={self.pos}-{self.pos + count - 1}'}, timeout=60)
        if response.status_code != 206: raise ValueError('Server must support byte ranges')
        response.raise_for_status()
        if len(response.content) != count: raise ValueError('Incomplete range')
        self.pos += count
        return response.content


def main():
    remote = RemoteZip()
    member = 'NMD2023_basskikt_v2_1/NMD2023bas_v2_1.tif'
    national = OUT / 'NMD2023bas_v2_1.tif'
    with zipfile.ZipFile(remote) as archive:
        info = archive.getinfo(member)
        for suffix in ('.qml', '.tif.xml', '.tif.vat.dbf'):
            name = 'NMD2023_basskikt_v2_1/NMD2023bas_v2_1' + suffix
            (OUT / Path(name).name).write_bytes(archive.read(name))
    if not national.exists():
        remote.seek(info.header_offset)
        header = remote.read(30)
        if header[:4] != b'PK\x03\x04' or info.compress_type != 8:
            raise ValueError('Unexpected ZIP format')
        name_len, extra_len = struct.unpack_from('<HH', header, 26)
        start = info.header_offset + 30 + name_len + extra_len
        inflater = zlib.decompressobj(-15)
        crc = 0
        written = 0
        partial = national.with_suffix('.partial')
        # Bounded ranges make transient network failures retryable without restarting.
        with partial.open('wb') as target:
            for offset in range(0, info.compress_size, 8_000_000):
                count = min(8_000_000, info.compress_size - offset)
                for attempt in range(3):
                    try:
                        remote.seek(start + offset)
                        compressed = remote.read(count)
                        break
                    except requests.RequestException:
                        if attempt == 2: raise
                raw = inflater.decompress(compressed)
                target.write(raw)
                crc = zlib.crc32(raw, crc)
                written += len(raw)
                if offset % 80_000_000 == 0:
                    print(f'Download {100 * (offset + count) / info.compress_size:.1f}%', flush=True)
            raw = inflater.flush()
            target.write(raw)
            written += len(raw)
            crc = zlib.crc32(raw, crc)
        if not inflater.eof or written != info.file_size or crc != info.CRC:
            raise ValueError('ZIP integrity check failed')
        partial.replace(national)
    elif national.stat().st_size != info.file_size:
        raise ValueError('Cached national raster has wrong size')

    boundary_path = ROOT / 'public/data/botkyrka-regso.geojson'
    boundary = json.loads(boundary_path.read_text(encoding='utf-8'))
    destination = OUT / 'botkyrka-nmd2023-v2.1.tif'
    with rasterio.open(national) as source:
        geometries = [transform_geom('EPSG:4326', source.crs, f['geometry']) for f in boundary['features']]
        clipped, transform = mask(source, geometries, crop=True, nodata=0)
        inside = geometry_mask(geometries, out_shape=clipped.shape[1:], transform=transform, invert=True)
        missing = int(np.count_nonzero(inside & (clipped[0] == 0)))
        legend = {entry.attrib['value']: entry.attrib['label'] for entry in
                  ET.parse(OUT / 'NMD2023bas_v2_1.qml').iter('paletteEntry')}
        profile = source.profile.copy()
        profile.update(height=clipped.shape[1], width=clipped.shape[2], transform=transform,
                       nodata=0, compress='deflate', tiled=True, blockxsize=256, blockysize=256)
        with rasterio.open(destination, 'w', **profile) as target:
            target.write(clipped)
        codes, counts = np.unique(clipped[clipped != 0], return_counts=True)
        metadata = {
            'source': 'NMD2023 v2.1, Naturvårdsverket', 'sourceUrl': URL,
            'license': 'CC0', 'downloadedAt': datetime.now(timezone.utc).isoformat(),
            'sourceMember': member, 'sourceZipCrc32': f'{info.CRC:08x}',
            'crs': str(source.crs), 'resolutionMetres': list(source.res),
            'boundary': str(boundary_path.relative_to(ROOT)),
            'boundarySha256': hashlib.sha256(boundary_path.read_bytes()).hexdigest(),
            'clipRule': 'Pixel centre inside pilot polygons; outside set to nodata 0',
            'raster': destination.name,
            'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(),
            'classPixelCounts': {str(int(c)): int(n) for c, n in zip(codes, counts)},
            'classLabels': {str(int(c)): legend.get(str(int(c)), 'Unknown class') for c in codes},
            'insidePilotPixels': int(np.count_nonzero(inside)),
            'missingInsidePilotPixels': missing,
            'note': 'Land cover only; not soil chemistry, mushroom observations or calibrated suitability.'
        }
    (OUT / 'metadata.json').write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps(metadata, indent=2, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()

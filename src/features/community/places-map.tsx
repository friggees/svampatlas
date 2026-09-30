'use client';

import {useEffect, useRef, useState} from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type {SharedPlace} from './types';

export default function PlacesMap({places, selectedId, onSelect}: {places: SharedPlace[]; selectedId?: string; onSelect: (id: string) => void}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map|null>(null);
  const select = useRef(onSelect);
  const [error, setError] = useState(false);
  useEffect(() => { select.current = onSelect; }, [onSelect]);
  useEffect(() => {
    if (!container.current) return;
    let instance: maplibregl.Map;
    try {
      maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
      instance = new maplibregl.Map({container: container.current, center: [18.05, 59.3], zoom: 8, maxZoom: 18,
        style: {version: 8, sources: {osm: {type: 'raster', tiles: [process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}}, layers: [{id: 'base', type: 'raster', source: 'osm'}]}});
      instance.addControl(new maplibregl.NavigationControl({showCompass: false}));
      instance.on('error', () => setError(true));
      instance.on('load', () => container.current?.setAttribute('data-ready', 'true'));
      map.current = instance;
    } catch {
      // Map initialization can fail when WebGL is unavailable; the list remains usable.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(true);
      return;
    }
    return () => {instance.remove(); map.current = null;};
  }, []);
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const markers = places.map(place => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `place-marker ${place.visibility}`;
      button.setAttribute('aria-label', `Visa ${place.name}`);
      button.setAttribute('aria-pressed', String(place.id === selectedId));
      button.textContent = '●';
      button.addEventListener('click', () => select.current(place.id));
      return new maplibregl.Marker({element: button}).setLngLat([place.longitude, place.latitude]).addTo(instance);
    });
    const selected = places.find(place => place.id === selectedId);
    if (selected) instance.jumpTo({center: [selected.longitude, selected.latitude], zoom: 13});
    else if (places.length) {
      const bounds = new maplibregl.LngLatBounds();
      for (const place of places) bounds.extend([place.longitude, place.latitude]);
      instance.fitBounds(bounds, {padding: 55, maxZoom: 12, duration: 0});
    }
    return () => {for (const marker of markers) marker.remove();};
  }, [places, selectedId]);
  return <div className="shared-map-wrap"><div ref={container} className="shared-map" role="region" aria-label="Karta över platser"/>
    {error && <p className="map-fallback" role="status">Kartan kunde inte laddas helt. Du kan fortfarande välja platser och öppna vägbeskrivning i listan.</p>}
  </div>;
}

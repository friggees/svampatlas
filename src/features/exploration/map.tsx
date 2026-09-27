'use client';
import {useEffect,useRef,useState} from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type {FeatureCollection,Polygon,MultiPolygon} from 'geojson';
import type {Point} from './domain';
type Props={boundary:FeatureCollection<Polygon|MultiPolygon>;bbox:number[];point:Point|null;onSelect:(point:Point)=>void};
export default function PilotMap({boundary,bbox,point,onSelect}:Props) {
  const container=useRef<HTMLDivElement>(null), map=useRef<maplibregl.Map|null>(null), marker=useRef<maplibregl.Marker|null>(null);
  const select=useRef(onSelect);
  useEffect(()=>{select.current=onSelect;},[onSelect]);
  const [error,setError]=useState(false);
  useEffect(()=>{
    if(!container.current) return;
    let instance:maplibregl.Map;
    try {
      maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
      instance=new maplibregl.Map({container:container.current,style:{version:8,sources:{osm:{type:'raster',tiles:[process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}},layers:[{id:'base',type:'raster',source:'osm',paint:{'raster-saturation':-0.55,'raster-opacity':0.9}}]},bounds:[[bbox[0],bbox[1]],[bbox[2],bbox[3]]],fitBoundsOptions:{padding:35},maxZoom:17,minZoom:8});
      map.current=instance;
      instance.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
      instance.on('error',()=>setError(true));
      instance.on('load',()=>{instance.addSource('pilot',{type:'geojson',data:boundary});instance.addLayer({id:'pilot-fill',type:'fill',source:'pilot',paint:{'fill-color':'#547356','fill-opacity':0.055}});instance.addLayer({id:'pilot-line',type:'line',source:'pilot',paint:{'line-color':'#547356','line-width':1.3,'line-opacity':0.55}});});
      instance.on('click',event=>select.current({longitude:event.lngLat.lng,latitude:event.lngLat.lat}));
    } catch {
      // Map initialization is an external-system failure, not derived render state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(true); return;
    }
    return ()=>{marker.current?.remove();marker.current=null;instance.remove();map.current=null;};
  },[boundary,bbox]);
  useEffect(()=>{
    if(!map.current || !point) return;
    marker.current?.remove();
    marker.current=new maplibregl.Marker({color:'#365443'}).setLngLat([point.longitude,point.latitude]).addTo(map.current);
  },[point]);
  return <div className="map-container"><div ref={container} className="map-canvas" aria-label="Interaktiv karta över Botkyrka. Välj en punkt genom att klicka, eller använd koordinatformuläret."/>{error?<div className="map-notice" role="status">Kartan kunde inte laddas helt. Du kan fortfarande ange koordinater i formuläret.</div>:null}<div className="map-legend"><span className="legend-line"/> Pilotområde · SCB RegSO 2025</div></div>;
}

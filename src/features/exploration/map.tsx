'use client';
import {useEffect,useRef,useState} from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type {FeatureCollection,Polygon,MultiPolygon} from 'geojson';
import type {Point} from './domain';
type Props={boundary:FeatureCollection<Polygon|MultiPolygon>;bbox:number[];point:Point|null;onSelect:(point:Point)=>void;habitat:FeatureCollection|null;onSelectArea:(id:string)=>void};
export default function PilotMap({boundary,bbox,point,onSelect,habitat,onSelectArea}:Props) {
  const container=useRef<HTMLDivElement>(null), map=useRef<maplibregl.Map|null>(null), marker=useRef<maplibregl.Marker|null>(null);
  const select=useRef(onSelect);
  useEffect(()=>{select.current=onSelect;},[onSelect]);
  const selectArea=useRef(onSelectArea);
  useEffect(()=>{selectArea.current=onSelectArea;},[onSelectArea]);
  const [loaded,setLoaded]=useState(false);
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
      instance.on('load',()=>{
        instance.addSource('pilot',{type:'geojson',data:boundary});
        instance.addLayer({id:'pilot-fill',type:'fill',source:'pilot',paint:{'fill-color':'#547356','fill-opacity':0.055}});
        instance.addLayer({id:'pilot-line',type:'line',source:'pilot',paint:{'line-color':'#547356','line-width':1.3,'line-opacity':0.55}});
        instance.addSource('habitat',{type:'geojson',data:{type:'FeatureCollection',features:[]},tolerance:0});
        instance.addLayer({id:'habitat-fill',type:'fill',source:'habitat',paint:{'fill-color':['step',['get','score'],'#909896',0,'#c6a458',40,'#88ac69',70,'#26724d'],'fill-opacity':0.65}});
        instance.addLayer({id:'habitat-best',type:'line',source:'habitat',filter:['==',['get','best'],true],paint:{'line-color':'#174b36','line-width':1.5}});
        instance.addLayer({id:'habitat-selected',type:'line',source:'habitat',filter:['==',['get','selected'],true],paint:{'line-color':'#2462b5','line-width':3}});
        setLoaded(true);
      });
      instance.on('click',event=>{
        const feature=instance.getLayer('habitat-fill')?instance.queryRenderedFeatures(event.point,{layers:['habitat-fill']})[0]:null;
        if(feature?.properties?.cellId)selectArea.current(String(feature.properties.cellId));
        else select.current({longitude:event.lngLat.lng,latitude:event.lngLat.lat});
      });
    } catch {
      // Map initialization is an external-system failure, not derived render state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(true); return;
    }
    return ()=>{marker.current?.remove();marker.current=null;instance.remove();map.current=null;};
  },[boundary,bbox]);
  useEffect(()=>{
    if(!loaded)return;
    const source=map.current?.getSource('habitat') as maplibregl.GeoJSONSource|undefined;
    source?.setData(habitat??{type:'FeatureCollection',features:[]});
  },[habitat,loaded]);
  useEffect(()=>{
    if(!map.current || !point) return;
    marker.current?.remove();
    marker.current=new maplibregl.Marker({color:'#365443'}).setLngLat([point.longitude,point.latitude]).addTo(map.current);
  },[point]);
  return <div className="map-container"><div ref={container} className="map-canvas" aria-label="Interaktiv karta över Botkyrka. Välj en punkt genom att klicka, eller använd koordinatformuläret."/>{error?<div className="map-notice" role="status">Kartan kunde inte laddas helt. Du kan fortfarande ange koordinater i formuläret.</div>:null}<div className="map-legend"><span className="legend-line"/> Pilotområde · SCB RegSO 2025</div></div>;
}

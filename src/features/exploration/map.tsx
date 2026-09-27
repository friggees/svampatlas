'use client';
import {useEffect,useRef,useState} from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type {FeatureCollection,Polygon,MultiPolygon} from 'geojson';
import type {Point} from './domain';
type Props={boundary:FeatureCollection<Polygon|MultiPolygon>;bbox:number[];point:Point|null;onSelect:(point:Point)=>void;habitat:FeatureCollection|null;selectedId:string|null;onSelectArea:(id:string)=>void};
export default function PilotMap({boundary,bbox,point,onSelect,habitat,selectedId,onSelectArea}:Props) {
  const container=useRef<HTMLDivElement>(null), map=useRef<maplibregl.Map|null>(null), marker=useRef<maplibregl.Marker|null>(null);
  const select=useRef(onSelect);
  useEffect(()=>{select.current=onSelect;},[onSelect]);
  const selectArea=useRef(onSelectArea);
  useEffect(()=>{selectArea.current=onSelectArea;},[onSelectArea]);
  const [loaded,setLoaded]=useState(false);
  const [renderedHabitat,setRenderedHabitat]=useState<FeatureCollection|null>(null);
  const sourceReady=renderedHabitat===habitat;
  const [satellite,setSatellite]=useState(false),[showHabitat,setShowHabitat]=useState(true),[satelliteError,setSatelliteError]=useState(false);
  const fillOpacity=useRef(0.65);
  useEffect(()=>{fillOpacity.current=satellite?0.4:0.65;},[satellite]);
  const [error,setError]=useState(false);
  useEffect(()=>{
    if(!container.current) return;
    let instance:maplibregl.Map;
    try {
      maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
      instance=new maplibregl.Map({container:container.current,style:{version:8,sources:{osm:{type:'raster',tiles:[process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}},layers:[{id:'base',type:'raster',source:'osm',paint:{'raster-saturation':-0.55,'raster-opacity':0.9}}]},bounds:[[bbox[0],bbox[1]],[bbox[2],bbox[3]]],fitBoundsOptions:{padding:35},maxZoom:17,minZoom:8});
      map.current=instance;
      instance.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
      instance.on('error',event=>{if('sourceId' in event&&event.sourceId==='satellite')setSatelliteError(true);else setError(true);});
      instance.on('load',()=>{
        instance.addSource('pilot',{type:'geojson',data:boundary});
        instance.addLayer({id:'pilot-fill',type:'fill',source:'pilot',paint:{'fill-color':'#547356','fill-opacity':0.055}});
        instance.addLayer({id:'pilot-line',type:'line',source:'pilot',paint:{'line-color':'#547356','line-width':1.3,'line-opacity':0.55}});
        instance.addSource('habitat',{type:'geojson',data:{type:'FeatureCollection',features:[]},tolerance:0,attribution:'Habitat: NMD2023 / <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> · <a href="/om#habitat">Metod</a>'});
        instance.addLayer({id:'habitat-fill',type:'fill',source:'habitat',paint:{'fill-color':['step',['get','score'],'#909896',0,'#c6a458',40,'#88ac69',70,'#26724d'],'fill-opacity':0.65}});
        instance.addLayer({id:'habitat-best',type:'line',source:'habitat',filter:['==',['get','best'],true],paint:{'line-color':'#174b36','line-width':0.6,'line-opacity':0.65}});
        instance.addLayer({id:'habitat-selected',type:'line',source:'habitat',filter:['==',['get','cellId'],''],paint:{'line-color':'#2462b5','line-width':3}});
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
    const instance=map.current;
    const source=instance?.getSource('habitat') as maplibregl.GeoJSONSource|undefined;
    let active=true;
    const finish=()=>{
      if(active&&instance?.isSourceLoaded('habitat')){
        setRenderedHabitat(habitat);
        instance.off('render',finish);
      }
    };
    // Transparent paint keeps source loading active; hidden layout would stop tile preparation.
    map.current?.setPaintProperty('habitat-fill','fill-opacity',0);
    map.current?.setPaintProperty('habitat-best','line-opacity',0);
    map.current?.setPaintProperty('habitat-selected','line-opacity',0);
    // MapLibre 6 setData resolves once the worker has processed the current data.
    // Updating paint inside sourcedata would itself emit more source events.
    void source?.setData(habitat??{type:'FeatureCollection',features:[]}).then(()=>{
      if(!active||!instance)return;
      instance.setPaintProperty('habitat-fill','fill-opacity',fillOpacity.current);
      instance.setPaintProperty('habitat-best','line-opacity',0.65);
      instance.setPaintProperty('habitat-selected','line-opacity',1);
      // Indexing is complete, but viewport tiles still need to render.
      instance.on('render',finish);
      finish();
    }).catch(()=>{if(active)setError(true);});
    return()=>{active=false;instance?.off('render',finish);};
  },[habitat,loaded]);
  useEffect(()=>{
    if(!loaded)return;
    for(const id of ['habitat-fill','habitat-best','habitat-selected'])map.current?.setLayoutProperty(id,'visibility',showHabitat?'visible':'none');
  },[loaded,showHabitat]);
  useEffect(()=>{
    const instance=map.current;
    if(!loaded||!instance)return;
    if(satellite&&!instance.getSource('satellite')){
      instance.addSource('satellite',{type:'raster',tiles:['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857/default/g/{z}/{y}/{x}.jpg'],tileSize:256,maxzoom:14,
        attribution:'<a href="https://cloudless.eox.at">EOxCloudless</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2024 &amp; 2025) · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>'});
      instance.addLayer({id:'satellite-base',type:'raster',source:'satellite'},'pilot-fill');
    }
    if(instance.getLayer('satellite-base'))instance.setLayoutProperty('satellite-base','visibility',satellite?'visible':'none');
    instance.setLayoutProperty('base','visibility',satellite?'none':'visible');
    instance.setPaintProperty('habitat-fill','fill-opacity',satellite?0.4:0.65);
  },[satellite,loaded]);
  useEffect(()=>{
    if(loaded)map.current?.setFilter('habitat-selected',['==',['get','cellId'],selectedId??'']);
  },[selectedId,loaded]);
  useEffect(()=>{
    if(!map.current || !point) return;
    marker.current?.remove();
    marker.current=new maplibregl.Marker({color:'#365443'}).setLngLat([point.longitude,point.latitude]).addTo(map.current);
  },[point]);
  return <div className="map-container"><div ref={container} className="map-canvas" data-habitat-ready={sourceReady} data-basemap={satellite?'satellite':'map'} aria-busy={!!habitat&&!sourceReady} aria-label="Interaktiv karta över Botkyrka. Välj en punkt genom att klicka, eller använd koordinatformuläret."/>
    <div className="map-view-controls"><div role="group" aria-label="Kartbakgrund"><button type="button" aria-pressed={!satellite} onClick={()=>setSatellite(false)}>Karta</button><button type="button" aria-pressed={satellite} onClick={()=>{setSatelliteError(false);setSatellite(true);}}>Satellit</button></div>{habitat?<label><input type="checkbox" checked={showHabitat} onChange={e=>setShowHabitat(e.target.checked)}/> Visa habitatytor</label>:null}</div>
    {error?<div className="map-notice" role="status">Kartan kunde inte laddas helt. Du kan fortfarande ange koordinater i formuläret.</div>:satellite&&satelliteError?<div className="map-notice" role="status">Satellitbilden kunde inte laddas. Välj Karta för vanlig kartbakgrund.</div>:habitat&&!sourceReady?<div className="map-notice" role="status">Ritar artens markytor…</div>:null}
    <div className="map-legend"><span className="legend-line"/> {satellite?'Satellit 2024–2025 · 10 m/pixel · inte live':'Pilotområde · SCB RegSO 2025'}</div></div>;
}

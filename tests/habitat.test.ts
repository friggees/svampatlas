import { describe,it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { species } from '../src/features/species/catalog';
import { habitatProfiles } from '../src/features/exploration/habitat-profiles';
import { habitatShare,rankHabitat,habitatMap,spacedSuggestions,distanceKm } from '../src/features/exploration/habitat-domain';
import { decodeHabitat,decodeRing } from '../src/features/exploration/habitat-codec';
import { weatherAreas } from '../src/features/exploration/climate-contract';
import { shiftDate } from '../src/features/exploration/climate-domain';
const data=decodeHabitat(JSON.parse(readFileSync('public/data/botkyrka-habitat.json','utf8')));
const now=new Date('2026-09-27T10:00:00Z'),endDate='2026-09-26';
const climate={endDate,retrievedAt:now.toISOString(),source:'test',model:'synthetic',areas:weatherAreas.map(a=>({...a,grid:null,days:Array.from({length:14},(_,i)=>({date:shiftDate(endDate,i-13),temperature:12,minimumTemperature:8,rain:3,humidity:85,soilMoisture:0.3}))}))};
describe('real habitat export and model',()=>{
  it('retains source pixel counts and excludes water, buildings and nodata footprints',()=>{
    expect(data.cells.reduce((n,c)=>n+c.pixels,0)).toBe(2234266);
    const actual:Record<string,number>={};
    for(const c of data.cells)for(const [code,n]of Object.entries(c.counts))actual[code]=(actual[code]??0)+n;
    const packed=JSON.parse(readFileSync('public/data/botkyrka-habitat.json','utf8'));
    expect(actual).toEqual(packed.metadata.classPixelCounts);
    for(const feature of data.features){
      expect([0,3,51,52,53,54,61,62,118,128]).not.toContain(feature.properties.code);
      expect(booleanPointInPolygon([feature.properties.longitude,feature.properties.latitude],feature)).toBe(true);
    }
  });
  it('has supported profiles for all ten species with distinct forest and grass matching',()=>{
    expect(species).toHaveLength(10);
    for(const s of species){
      expect(habitatProfiles[s.id].source).toMatch(/^https:/);
      const results=rankHabitat(data,s.id,climate,now);
      expect(results.length).toBeGreaterThan(0);
      for(const r of results){expect(r.score).toBeLessThanOrEqual(r.weatherScore!);expect(r.score).toBeLessThanOrEqual(r.share*100);if(habitatProfiles[s.id].limited)expect(r.score).toBeLessThanOrEqual(59);}
      const map=habitatMap(data,s.id,results);
      expect(map.features.length).toBeGreaterThan(0);
      expect(map.features.every(f=>habitatProfiles[s.id].codes.includes(f.properties!.code))).toBe(true);
      const picks=spacedSuggestions(results);
      for(let i=0;i<picks.length;i++)for(let j=i+1;j<picks.length;j++)expect(distanceKm(picks[i].point,picks[j].point)).toBeGreaterThanOrEqual(.75);
    }
    expect(habitatShare({id:'grass',pixels:100,counts:{4232:100}},'kantarell')).toBe(0);
    expect(habitatShare({id:'grass',pixels:100,counts:{4232:100}},'toppslatskivling')).toBe(1);
    expect(habitatShare({id:'spruce',pixels:100,counts:{112:100}},'smorsopp')).toBe(0);
  });
  it('does not treat missing pixels, water or malformed counts as supportive',()=>{
    expect(habitatShare({id:'missing',pixels:100,counts:{111:99,0:1}},'kantarell')).toBeNull();
    expect(habitatShare({id:'water',pixels:100,counts:{61:100}},'kantarell')).toBe(0);
    expect(habitatShare({id:'bad',pixels:100,counts:{111:101}},'kantarell')).toBeNull();
  });
  it('removes managed places from habitat support as well as from map footprints',()=>{
    expect(habitatShare({id:'park',pixels:100,counts:{111:100},availableCounts:{},excludedPixels:100},'kantarell')).toBe(0);
    expect(habitatShare({id:'edge',pixels:100,counts:{111:100},availableCounts:{111:20},excludedPixels:80},'kantarell')).toBe(.2);
    expect(habitatShare({id:'invalid',pixels:100,counts:{111:100},availableCounts:{111:101}},'kantarell')).toBeNull();
    expect(data.metadata.exclusions?.excludedPixels).toBeGreaterThan(0);
    expect(data.cells.reduce((n,c)=>n+(c.excludedPixels??0),0)).toBe(data.metadata.exclusions?.excludedPixels);
    for(const feature of data.features){
      const cell=data.cells.find(c=>c.id===feature.properties.cellId)!;
      expect(cell.availableCounts?.[feature.properties.code]).toBeGreaterThan(0);
    }
  });
  it('hides ratings on missing/stale weather and does not borrow another reference when nearest fails',()=>{
    for(const weather of [null,{...climate,endDate:'2026-09-25'}]){
      const results=rankHabitat(data,'kantarell',weather,now);
      expect(results.every(r=>r.score===null&&r.rank===null)).toBe(true);
      expect(spacedSuggestions(results)).toEqual([]);
      expect(habitatMap(data,'kantarell',results).features.every(f=>f.properties!.score===-1&&!f.properties!.best)).toBe(true);
    }
    const failed={...climate,areas:climate.areas.filter(a=>a.id!=='tumba')};
    const results=rankHabitat(data,'kantarell',failed,now).filter(r=>r.weatherName==='Tumba');
    expect(results.length).toBeGreaterThan(0);expect(results.every(r=>r.score===null)).toBe(true);
  });
  it('poor climate prevents high combined ranking',()=>{
    const dry={...climate,areas:climate.areas.map(a=>({...a,days:a.days.map(d=>({...d,rain:0,soilMoisture:0.03,temperature:30}))}))};
    expect(rankHabitat(data,'kantarell',dry,now).every(r=>r.score!<40)).toBe(true);
  });
  it('rejects incomplete coordinate encodings',()=>{expect(()=>decodeRing('?')).toThrow();});
});

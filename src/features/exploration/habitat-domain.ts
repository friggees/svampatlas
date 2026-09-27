import type { FeatureCollection, MultiPolygon } from 'geojson';
import { assessClimate, lastCompletedDate } from './climate-domain';
import { climateProfiles } from './climate-profiles';
import { weatherAreas, type ClimateResponse } from './climate-contract';
import type { Point } from './domain';
import type { SpeciesId } from '../species/catalog';
import { habitatProfiles } from './habitat-profiles';

export type HabitatCell = { id: string; pixels: number; counts: Record<string, number>; availableCounts?:Record<string,number>; excludedPixels?:number };
export type Footprint = Point & { cellId: string; code: number };
export type HabitatData = FeatureCollection<MultiPolygon, Footprint> & {
  cells: HabitatCell[];
  metadata: { source: string; sourceUrl: string; downloadedAt: string; classLabels: Record<string,string>; missingInsidePilotPixels: number; cellSizeMetres: number; exclusions?:{fetchedAt:string;excludedPixels:number;source:string} };
};
export type HabitatResult = { cell: HabitatCell; point: Point; share: number; score: number | null; label: string; weatherName: string; distance: number; weatherScore: number | null; rank: number | null };
export function distanceKm(a: Point, b: Point) {
  return 111 * Math.hypot(a.latitude-b.latitude, (a.longitude-b.longitude)*Math.cos(a.latitude*Math.PI/180));
}
export function habitatShare(cell: HabitatCell, speciesId: SpeciesId): number | null {
  const sum = Object.values(cell.counts).reduce((a,b)=>a+b,0);
  if (cell.pixels <= 0 || sum !== cell.pixels || (cell.counts['0'] ?? 0) > 0 || Object.values(cell.counts).some(n=>!Number.isFinite(n)||n<0)) return null;
  const available=cell.availableCounts??cell.counts;
  if(Object.entries(available).some(([code,n])=>!Number.isFinite(n)||n<0||n>(cell.counts[code]??0)))return null;
  return habitatProfiles[speciesId].codes.reduce((n,code)=>n+(available[code]??0),0)/cell.pixels;
}
export function rankHabitat(data: HabitatData, speciesId: SpeciesId, climate: ClimateResponse | null, now = new Date()): HabitatResult[] {
  const profile = habitatProfiles[speciesId];
  const points = new Map<string, Footprint>();
  const cells = new Map(data.cells.map(cell=>[cell.id,cell]));
  for (const f of data.features) {
    if (!profile.codes.includes(f.properties.code)) continue;
    const old = points.get(f.properties.cellId), cell = cells.get(f.properties.cellId)!;
    const counts=cell.availableCounts??cell.counts;
    if (!old || counts[f.properties.code] > counts[old.code]) points.set(cell.id,f.properties);
  }
  const weather = new Map(weatherAreas.map(area=>{
    const received = climate?.areas.find(a=>a.id===area.id);
    return [area.id, received && climate?.endDate === lastCompletedDate(now) ? assessClimate(received.days,climate.endDate,climateProfiles[speciesId],now).score : null];
  }));
  const results: HabitatResult[] = [];
  for (const cell of data.cells) {
    const point = points.get(cell.id), share = habitatShare(cell,speciesId);
    if (!point || share === null || share === 0) continue;
    // Always choose the geographically nearest reference, never a farther one with better data.
    const reference = [...weatherAreas].sort((a,b)=>distanceKm(point,a)-distanceKm(point,b))[0];
    const weatherScore = weather.get(reference.id) ?? null;
    const score = weatherScore === null ? null : Math.floor(Math.min(share*100,weatherScore,profile.limited?59:100));
    results.push({ cell, point, share, score, weatherScore, weatherName: reference.name, distance: distanceKm(point,reference), rank:null,
      label: score === null ? 'Väderunderlag saknas' : score >= 70 ? 'Starkare modellstöd' : score >= 40 ? 'Begränsat modellstöd' : 'Svagt modellstöd' });
  }
  results.sort((a,b)=>(b.score??-1)-(a.score??-1)||a.cell.id.localeCompare(b.cell.id));
  let rank: number|null = null;
  results.forEach((r,i)=>{ if(r.score !== null){if(i===0||r.score!==results[i-1].score)rank=i+1;r.rank=rank;} });
  return results;
}
export function habitatMap(data: HabitatData, speciesId: SpeciesId, results: HabitatResult[]): FeatureCollection {
  const byId = new Map(results.map(r=>[r.cell.id,r]));
  const best = results[0]?.score;
  return { type:'FeatureCollection', features: data.features.flatMap(f=>{
    const result=byId.get(f.properties.cellId);
    if(!result || !habitatProfiles[speciesId].codes.includes(f.properties.code))return [];
    return [{...f,properties:{...f.properties,score:result.score??-1,best:best!==null&&best!==undefined&&best>=40&&result.score===best}}];
  }) };
}
export function spacedSuggestions(results: HabitatResult[], limit=6) {
  const chosen: HabitatResult[]=[];
  for(const result of results){
    if(result.score===null||result.score<40)continue;
    if(chosen.every(other=>distanceKm(result.point,other.point)>=0.75))chosen.push(result);
    if(chosen.length===limit)break;
  }
  return chosen;
}

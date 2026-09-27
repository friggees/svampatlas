import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';
export type Point = { longitude: number; latitude: number };
export function isInPilot(point: Point, boundary: FeatureCollection<Polygon | MultiPolygon>) {
  return Number.isFinite(point.longitude) && Number.isFinite(point.latitude) && boundary.features.some(f => booleanPointInPolygon([point.longitude, point.latitude], f));
}
export function habitatAssessment(inPilot: boolean) {
  return inPilot
    ? { status: 'missing_data' as const, title: 'Habitatbedömning kommer senare', description: 'Marktäckedata och artprofiler är ännu inte validerade för piloten. Du kan utforska kartan och spara dina egna platser.' }
    : { status: 'outside_pilot' as const, title: 'Utanför pilotområdet', description: 'Vi börjar i Botkyrka kommun. Välj en punkt inom den markerade gränsen.' };
}
export function directionsUrl(point: Point) {
  const url = new URL('https://www.google.com/maps/dir/');
  url.search = new URLSearchParams({ api:'1', destination:`${point.latitude},${point.longitude}`, travelmode:'walking' }).toString();
  return url.toString();
}

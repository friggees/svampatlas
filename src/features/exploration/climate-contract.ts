import type { ClimateDay } from './climate-domain';
export const weatherAreas = [
  { id: 'norsborg', name: 'Norsborg', latitude: 59.25, longitude: 17.80 },
  { id: 'tullinge', name: 'Tullinge', latitude: 59.20, longitude: 17.90 },
  { id: 'tumba', name: 'Tumba', latitude: 59.20, longitude: 17.83 },
  { id: 'varsta', name: 'Vårsta', latitude: 59.16, longitude: 17.80 },
  { id: 'grodinge', name: 'Grödinge', latitude: 59.10, longitude: 17.80 },
] as const;
export type WeatherArea = { id: string; name: string; latitude: number; longitude: number; grid: { latitude: number; longitude: number } | null; days: ClimateDay[]; error?: string };
export type ClimateResponse = { endDate: string; retrievedAt: string; source: string; model: string; areas: WeatherArea[] };

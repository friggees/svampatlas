import 'server-only';
import { lastCompletedDate, shiftDate, CLIMATE_DAYS } from '@/features/exploration/climate-domain';
import { weatherAreas, type ClimateResponse } from '@/features/exploration/climate-contract';
import { normalizeWeather } from './normalize';

export async function getPilotWeather(): Promise<ClimateResponse> {
  const endDate = lastCompletedDate();
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: weatherAreas.map(a => a.latitude).join(','), longitude: weatherAreas.map(a => a.longitude).join(','),
    start_date: shiftDate(endDate, 1 - CLIMATE_DAYS), end_date: endDate, timezone: 'Europe/Stockholm', timeformat: 'unixtime',
    models: 'icon_seamless', daily: 'temperature_2m_mean,temperature_2m_min,rain_sum',
    hourly: 'relative_humidity_2m,soil_moisture_3_to_9cm', temperature_unit: 'celsius', precipitation_unit: 'mm',
  }).toString();
  // Fixed public reference areas: never send a user's saved coordinates or notes.
  // Date in cache key prevents yesterday's window surviving local midnight.
  const response = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Weather provider HTTP ${response.status}`);
  const raw: unknown = await response.json();
  if (!Array.isArray(raw) || raw.length !== weatherAreas.length) throw new Error('Unexpected weather area count');
  return { endDate, retrievedAt: new Date().toISOString(), source: 'Open-Meteo / DWD', model: 'ICON Seamless',
    areas: weatherAreas.map((area, i) => {
      try { return { ...area, ...normalizeWeather(raw[i], endDate) }; }
      catch { return { ...area, grid: null, days: [], error: 'Komplett väderhistorik saknas för området.' }; }
    }),
  };
}

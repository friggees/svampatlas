import { z } from 'zod';
import { CLIMATE_DAYS, shiftDate, stockholmDate, type ClimateDay } from '../../features/exploration/climate-domain';

const values = z.array(z.number().finite().nullable());
const schema = z.object({
  latitude: z.number().finite(), longitude: z.number().finite(), timezone: z.literal('Europe/Stockholm'),
  daily_units: z.object({ time: z.literal('unixtime'), temperature_2m_mean: z.literal('°C'), temperature_2m_min: z.literal('°C'), rain_sum: z.literal('mm') }),
  hourly_units: z.object({ time: z.literal('unixtime'), relative_humidity_2m: z.literal('%'), soil_moisture_3_to_9cm: z.literal('m³/m³') }),
  daily: z.object({ time: z.array(z.number().int()), temperature_2m_mean: values, temperature_2m_min: values, rain_sum: values }),
  hourly: z.object({ time: z.array(z.number().int()), relative_humidity_2m: values, soil_moisture_3_to_9cm: values }),
});

/** UTC timestamps avoid duplicated/missing local clock-hour ambiguity at DST changes. */
export function normalizeWeather(raw: unknown, endDate: string) {
  const data = schema.parse(raw);
  const start = shiftDate(endDate, 1 - CLIMATE_DAYS);
  const hours = data.hourly.time;
  if (new Set(hours).size !== hours.length || hours.some((t, i) => i > 0 && t !== hours[i - 1] + 3600)) throw new Error('Non-contiguous hourly series');
  if (data.hourly.relative_humidity_2m.length !== hours.length || data.hourly.soil_moisture_3_to_9cm.length !== hours.length ||
    [data.daily.temperature_2m_mean, data.daily.temperature_2m_min, data.daily.rain_sum].some(a => a.length !== data.daily.time.length)) throw new Error('Misaligned series');
  const byDay = new Map<string, number[]>();
  hours.forEach((t, i) => { const date = stockholmDate(t * 1000); const indices = byDay.get(date) ?? []; indices.push(i); byDay.set(date, indices); });
  function average(date: string, series: (number | null)[], minimum: number, maximum: number) {
    const indices = byDay.get(date) ?? [];
    if (indices.length < 23 || indices.length > 25) return null;
    // Require actual local day boundaries, not merely 23 arbitrary observations.
    const first = hours[indices[0]], last = hours[indices.at(-1)!];
    if (stockholmDate((first - 3600) * 1000) === date || stockholmDate((last + 3600) * 1000) === date) return null;
    const items = indices.map(i => series[i]);
    if (items.some(v => v === null || v < minimum || v > maximum)) return null;
    return (items as number[]).reduce((a, b) => a + b, 0) / items.length;
  }
  const days: ClimateDay[] = data.daily.time.map((t, i) => {
    const date = stockholmDate(t * 1000);
    return { date, temperature: data.daily.temperature_2m_mean[i], minimumTemperature: data.daily.temperature_2m_min[i], rain: data.daily.rain_sum[i],
      humidity: average(date, data.hourly.relative_humidity_2m, 0, 100), soilMoisture: average(date, data.hourly.soil_moisture_3_to_9cm, 0, 1) };
  }).filter(d => d.date >= start && d.date <= endDate);
  if (days.length !== CLIMATE_DAYS || days.some((d, i) => d.date !== shiftDate(start, i))) throw new Error('Incomplete daily history');
  return { grid: { latitude: data.latitude, longitude: data.longitude }, days };
}

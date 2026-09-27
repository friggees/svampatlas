import { describe, expect, it } from 'vitest';
import { assessClimate, lastCompletedDate, rankClimate, shiftDate, type ClimateDay } from '../src/features/exploration/climate-domain';
import { climateProfiles } from '../src/features/exploration/climate-profiles';
import { normalizeWeather } from '../src/infrastructure/weather/normalize';
import { weatherAreas } from '../src/features/exploration/climate-contract';
import { isInPilot } from '../src/features/exploration/domain';
import { readFileSync } from 'node:fs';
const now = new Date('2026-09-27T10:00:00Z');
const end = '2026-09-26';
const days: ClimateDay[] = Array.from({ length: 14 }, (_, i) => ({ date: shiftDate(end, i - 13), temperature: 14, minimumTemperature: 8, rain: 3, humidity: 85, soilMoisture: 0.3 }));
const profile = climateProfiles.kantarell;
const evaluate = (input = days) => assessClimate(input, end, profile, now);

describe('weather ranking', () => {
  it('penalizes sustained temperature stress more than a single poor day', () => {
    const one = evaluate(days.map((d, i) => ({ ...d, temperature: i === 13 ? 25 : 14 })));
    const seven = evaluate(days.map((d, i) => ({ ...d, temperature: i > 6 ? 25 : 14 })));
    const all = evaluate(days.map(d => ({ ...d, temperature: 25 })));
    expect(evaluate().score).toBeGreaterThan(one.score!);
    expect(one.score).toBeGreaterThan(seven.score!);
    expect(seven.score).toBeGreaterThan(all.score!);
    expect(all.score).toBeLessThan(40);
  });
  it('requires supportive moisture and penalizes excess rain, drought and recent frost', () => {
    for (const variant of [
      days.map(d => ({ ...d, rain: 0 })), days.map(d => ({ ...d, rain: 30 })),
      days.map(d => ({ ...d, humidity: 25, soilMoisture: 0.05 })), days.map(d => ({ ...d, minimumTemperature: -3 })),
    ]) expect(evaluate(variant).score).toBeLessThan(evaluate().score!);
    expect(evaluate(days.map(d => ({ ...d, rain: 0, soilMoisture: 0.05 }))).score).toBeLessThan(40);
  });
  it('gives different results by profile and never interprets unknown data as good weather', () => {
    const cold = days.map(d => ({ ...d, temperature: 5, minimumTemperature: 2 }));
    expect(assessClimate(cold, end, climateProfiles.trattkantarell, now).score).toBeGreaterThan(evaluate(cold).score!);
    for (const key of ['temperature', 'minimumTemperature', 'rain', 'humidity', 'soilMoisture']) {
      expect(evaluate(days.map((d, i) => i === 7 ? { ...d, [key]: null } : d)).score).toBeNull();
      expect(evaluate(days.map((d, i) => i === 7 ? { ...d, [key]: NaN } : d)).score).toBeNull();
    }
    expect(evaluate(days.slice(1)).score).toBeNull();
    expect(evaluate([...days, days[0]]).score).toBeNull();
    expect(evaluate(days.map(d => ({ ...d, soilMoisture: 2 }))).score).toBeNull();
  });
  it('excludes forecasts and expires the score after local midnight', () => {
    expect(evaluate([...days, { ...days[0], date: '2026-09-27', temperature: 60 }])).toEqual(evaluate());
    expect(assessClimate(days, end, profile, new Date('2026-09-27T22:00:00Z')).score).toBeNull();
    expect(lastCompletedDate(new Date('2026-09-27T21:59:59Z'))).toBe('2026-09-26');
    expect(lastCompletedDate(new Date('2026-09-27T22:00:00Z'))).toBe('2026-09-27');
    expect(assessClimate(days, '2026-02-30', profile, now).score).toBeNull();
  });
  it('removes historical penalties when they leave the rolling window', () => {
    expect(evaluate([{ ...days[0], date: shiftDate(end, -14), temperature: -15 }, ...days])).toEqual(evaluate());
  });
  it('ties equal scores and ranks missing data last without assigning it a rank', () => {
    const ranked = rankClimate([{ id: 'missing', assessment: evaluate([]) }, { id: 'b', assessment: evaluate() },
      { id: 'a', assessment: evaluate() }, { id: 'dry', assessment: evaluate(days.map(d => ({ ...d, rain: 0 }))) }]);
    expect(ranked.map(a => [a.id, a.rank])).toEqual([['a', 1], ['b', 1], ['dry', 3], ['missing', null]]);
  });
  it('keeps every public reference area inside the pilot', () => {
    const boundary = JSON.parse(readFileSync('public/data/botkyrka-regso.geojson', 'utf8'));
    for (const area of weatherAreas) expect(isInPilot(area, boundary)).toBe(true);
  });
});

function fixture(endDate: string) {
  const start = shiftDate(endDate, -13);
  const hours = Array.from({ length: 16 * 24 }, (_, i) => Date.parse(`${shiftDate(start, -1)}T00:00:00Z`) / 1000 + i * 3600)
    .filter(t => { const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(t * 1000); return date >= start && date <= endDate; });
  const daily = hours.filter((t, i) => i === 0 || new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(t * 1000) !== new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(hours[i - 1] * 1000));
  return { latitude: 59.2, longitude: 17.8, timezone: 'Europe/Stockholm',
    daily_units: { time: 'unixtime', temperature_2m_mean: '°C', temperature_2m_min: '°C', rain_sum: 'mm' },
    hourly_units: { time: 'unixtime', relative_humidity_2m: '%', soil_moisture_3_to_9cm: 'm³/m³' },
    daily: { time: daily, temperature_2m_mean: daily.map(() => 12), temperature_2m_min: daily.map(() => 6), rain_sum: daily.map(() => 3) },
    hourly: { time: hours, relative_humidity_2m: hours.map(() => 80) as (number | null)[], soil_moisture_3_to_9cm: hours.map(() => 0.3) as (number | null)[] },
  };
}
describe('weather normalization', () => {
  it('accepts complete 23-hour and 25-hour Stockholm days across DST', () => {
    for (const endDate of ['2026-03-30', '2026-10-26']) {
      const parsed = normalizeWeather(fixture(endDate), endDate);
      expect(parsed.days).toHaveLength(14);
      expect(parsed.days.every(d => d.humidity === 80 && Math.abs(d.soilMoisture! - 0.3) < 1e-10)).toBe(true);
    }
  });
  it('propagates missing hourly values and rejects gaps, duplicates or wrong units', () => {
    const data = fixture(end); data.hourly.relative_humidity_2m[28] = null;
    expect(normalizeWeather(data, end).days.some(d => d.humidity === null)).toBe(true);
    const gap = fixture(end); gap.hourly.time[28] += 3600;
    expect(() => normalizeWeather(gap, end)).toThrow();
    const units = fixture(end); units.daily_units.rain_sum = 'inch';
    expect(() => normalizeWeather(units, end)).toThrow();
    const short = fixture(end); short.daily.time.pop();
    expect(() => normalizeWeather(short, end)).toThrow();
  });
});

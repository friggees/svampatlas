/** Experimental weather suitability, never a probability of finding mushrooms. */
export type ClimateDay = {
  date: string;
  temperature: number | null;
  minimumTemperature: number | null;
  rain: number | null;
  humidity: number | null;
  soilMoisture: number | null;
};
export type ClimateProfile = {
  version: string;
  label: string;
  temperature: [number, number];
  rain: [number, number];
  humidity: [number, number];
  soilMoisture: [number, number];
  stressDays: number;
  dryDays: number;
  frostSensitivity: number;
};
export const CLIMATE_DAYS = 14;
const DAY = 86_400_000;
const dateFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' });
export function stockholmDate(time: number | Date) { return dateFormatter.format(time); }
export function shiftDate(date: string, offset: number) {
  const time = Date.parse(`${date}T12:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date) throw new Error('Invalid date');
  return new Date(time + offset * DAY).toISOString().slice(0, 10);
}
export function lastCompletedDate(now = new Date()) { return shiftDate(stockholmDate(now), -1); }
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
function fit(value: number, [low, high]: [number, number], margin: number) {
  return clamp(value < low ? 1 - (low - value) / margin : value > high ? 1 - (value - high) / margin : 1);
}
function longestRun(days: ClimateDay[], predicate: (d: ClimateDay) => boolean) {
  let run = 0, longest = 0;
  for (const day of days) { run = predicate(day) ? run + 1 : 0; longest = Math.max(longest, run); }
  return longest;
}
export type ClimateAssessment =
  | { status: 'unavailable'; score: null; reason: string }
  | { status: 'experimental'; score: number; label: string; startDate: string; endDate: string;
      factors: { temperature: number; rain: number; humidity: number; soilMoisture: number };
      metrics: { temperature: number; rain: number; humidity: number; soilMoisture: number; stressDays: number; dryDays: number; frostDays: number };
      penalties: { temperature: number; drought: number; frost: number }; profileVersion: string };

export function assessClimate(input: ClimateDay[], endDate: string, profile: ClimateProfile, now = new Date()): ClimateAssessment {
  const unavailable = (reason: string): ClimateAssessment => ({ status: 'unavailable', score: null, reason });
  let startDate: string;
  try { startDate = shiftDate(endDate, 1 - CLIMATE_DAYS); } catch { return unavailable('Ogiltigt analysdatum.'); }
  if (endDate !== lastCompletedDate(now)) return unavailable('Väderhistoriken är inte aktuell. Hämta nya uppgifter.');
  const ranges = [profile.temperature, profile.rain, profile.humidity, profile.soilMoisture];
  if (ranges.some(([a, b]) => !Number.isFinite(a) || !Number.isFinite(b) || a >= b) ||
    !Number.isFinite(profile.stressDays) || profile.stressDays <= 0 || !Number.isFinite(profile.dryDays) || profile.dryDays <= 0 ||
    !Number.isFinite(profile.frostSensitivity) || profile.frostSensitivity < 0 || profile.frostSensitivity > 1) return unavailable('Ogiltig väderprofil.');
  const days = input.filter(d => d.date >= startDate && d.date <= endDate).sort((a, b) => a.date.localeCompare(b.date));
  if (days.length !== CLIMATE_DAYS || days.some((d, i) => d.date !== shiftDate(startDate, i))) return unavailable('14 sammanhängande dygn behövs. Luckor får inget väderbetyg.');
  if (days.some(d => [d.temperature, d.minimumTemperature, d.rain, d.humidity, d.soilMoisture].some(v => v === null || !Number.isFinite(v)) ||
    d.temperature! < -60 || d.temperature! > 60 || d.minimumTemperature! < -70 || d.minimumTemperature! > d.temperature! ||
    d.rain! < 0 || d.humidity! < 0 || d.humidity! > 100 || d.soilMoisture! < 0 || d.soilMoisture! > 1)) return unavailable('Vädervärden saknas eller är ogiltiga. Ingen ranking visas.');
  const metrics = {
    temperature: mean(days.map(d => d.temperature!)), rain: days.reduce((sum, d) => sum + d.rain!, 0),
    humidity: mean(days.map(d => d.humidity!)), soilMoisture: mean(days.map(d => d.soilMoisture!)),
    stressDays: longestRun(days, d => d.temperature! < profile.temperature[0] || d.temperature! > profile.temperature[1]),
    dryDays: longestRun(days, d => d.rain! < 1), frostDays: days.slice(-7).filter(d => d.minimumTemperature! < 0).length,
  };
  const factors = {
    temperature: mean(days.map(d => fit(d.temperature!, profile.temperature, 8))),
    rain: fit(metrics.rain, profile.rain, metrics.rain < profile.rain[0] ? profile.rain[0] : profile.rain[1]),
    humidity: fit(metrics.humidity, profile.humidity, 30),
    soilMoisture: fit(metrics.soilMoisture, profile.soilMoisture, 0.15),
  };
  const penalties = {
    temperature: 0.65 * clamp(metrics.stressDays / profile.stressDays),
    drought: 0.55 * clamp(metrics.dryDays / profile.dryDays),
    frost: profile.frostSensitivity * clamp(metrics.frostDays / 3),
  };
  const base = factors.temperature * 0.35 + factors.rain * 0.25 + factors.humidity * 0.15 + factors.soilMoisture * 0.25;
  const score = Math.round(100 * base * (1 - penalties.temperature) * (1 - penalties.drought) * (1 - penalties.frost));
  return { status: 'experimental', score, label: score >= 70 ? 'Gynnsamt väder' : score >= 40 ? 'Blandade förutsättningar' : 'Svagt väderstöd',
    startDate, endDate, factors, metrics, penalties, profileVersion: profile.version };
}

export function rankClimate<T extends { assessment: ClimateAssessment; id: string }>(areas: T[]) {
  const sorted = [...areas].sort((a, b) => (b.assessment.score ?? -1) - (a.assessment.score ?? -1) || a.id.localeCompare(b.id));
  let rank = 0;
  return sorted.map((area, index) => {
    if (area.assessment.score === null) return { ...area, rank: null };
    if (index === 0 || area.assessment.score !== sorted[index - 1].assessment.score) rank = index + 1;
    return { ...area, rank };
  });
}

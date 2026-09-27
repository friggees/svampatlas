import type { SpeciesId } from '../species/catalog';
import type { ClimateProfile } from './climate-domain';

// Explicit pilot assumptions, NOT published species-specific biological optima.
// Research supports weather factors, not these numerical thresholds for Botkyrka.
// Keep the experimental label until local ecological/field validation is complete.
const common = { version: 'botkyrka-weather-pilot-1', rain: [15, 65] as [number, number], humidity: [75, 95] as [number, number],
  soilMoisture: [0.22, 0.40] as [number, number], stressDays: 7, dryDays: 10, frostSensitivity: 0.65 };
const mild: ClimateProfile = { ...common, label: 'Mild skogshöst · preliminär', temperature: [10, 20] };
const autumn: ClimateProfile = { ...common, label: 'Sval skogshöst · preliminär', temperature: [8, 17] };
const cool: ClimateProfile = { ...common, label: 'Sen skogshöst · preliminär', temperature: [4, 13], frostSensitivity: 0.4 };
const grass: ClimateProfile = { ...common, label: 'Sval gräsmark · preliminär', temperature: [6, 15], soilMoisture: [0.25, 0.42] };
export const climateProfiles: Record<SpeciesId, ClimateProfile> = {
  kantarell: mild, trattkantarell: cool, 'svart-trumpetsvamp': autumn, stensopp: mild,
  'blek-taggsvamp': autumn, 'rodgul-trumpetsvamp': cool, smorsopp: autumn, farticka: autumn,
  'rod-flugsvamp': autumn, toppslatskivling: grass,
};

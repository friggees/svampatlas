import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {isInPilot,habitatAssessment,directionsUrl} from '../src/features/exploration/domain';
import {savedAreaSchema} from '../src/features/saved-areas/schema';
const boundary=JSON.parse(readFileSync('public/data/botkyrka-regso.geojson','utf8'));
describe('Pilotgräns och ärligt modellstöd',()=>{
 it('accepterar Tumba, avvisar Stockholm och omvända koordinater',()=>{expect(isInPilot({latitude:59.198,longitude:17.834},boundary)).toBe(true);expect(isInPilot({latitude:59.33,longitude:18.06},boundary)).toBe(false);expect(isInPilot({latitude:17.834,longitude:59.198},boundary)).toBe(false);});
 it('ger inte en fyndprognos när data saknas',()=>{expect(habitatAssessment(true).status).toBe('missing_data');expect(habitatAssessment(false).status).toBe('outside_pilot');});
 it('skickar latitud först till extern navigation',()=>{expect(new URL(directionsUrl({latitude:59.198,longitude:17.834})).searchParams.get('destination')).toBe('59.198,17.834');});
 it('avvisar felaktiga koordinater och okänd art',()=>{expect(savedAreaSchema.safeParse({name:'Test',species_id:'unknown',latitude:91,longitude:18}).success).toBe(false);});
});

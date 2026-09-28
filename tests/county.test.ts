import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {isInPilot} from '../src/features/exploration/domain';
import {habitatProfiles} from '../src/features/exploration/habitat-profiles';
const boundary=JSON.parse(readFileSync('public/data/stockholm/boundary.geojson','utf8'));
const metadata=JSON.parse(readFileSync('public/data/stockholm/metadata.json','utf8'));
describe('Länsgräns och artunderlag',()=>{
  it('omfattar norr, söder och skärgård',()=>{
    for(const [latitude,longitude] of [[59.757,18.704],[58.903,17.947],[59.402,18.352],[59.444,18.068]]){
      expect(isInPilot({latitude,longitude},boundary)).toBe(true);
    }
  });
  it('avvisar angränsande län och omvända koordinater',()=>{
    for(const [latitude,longitude] of [[59.858,17.638],[59.609,16.545],[18.704,59.757]]){
      expect(isInPilot({latitude,longitude},boundary)).toBe(false);
    }
  });
  it('har faktiskt matchande filtrerat markunderlag för alla tio profiler',()=>{
    expect(Object.keys(metadata.speciesPixels).sort()).toEqual(Object.keys(habitatProfiles).sort());
    expect(Object.values(metadata.speciesPixels).every(n=>typeof n==='number'&&n>0)).toBe(true);
    expect(metadata.excludedPixels).toBeGreaterThan(0);
    expect(metadata.excludedCategories['railway=station']).toBeGreaterThan(0);
    expect(metadata.excludedCategories['amenity=school']).toBeGreaterThan(0);
  });
});

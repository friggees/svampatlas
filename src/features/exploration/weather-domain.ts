/** Internal prototype. No real species profiles are approved or published. */
export type WeatherDay = { date:string; temperatureC:number|null; rainMm:number|null; relativeHumidityPct:number|null };
export type WeatherProfile = {
  version:string; reviewed:boolean; windowDays:number;
  temperatureRange:[number,number]; humidityRange:[number,number]; rainTotalRange:[number,number];
  weights:{temperature:number;humidity:number;rain:number;stress:number}; stressDays:number;
};
const DAY=86400000;
function dayTime(date:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return NaN;const time=Date.parse(`${date}T00:00:00Z`);return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===date?time:NaN;}
function rangeFit(value:number,[low,high]:[number,number]){const scale=Math.max(high-low,1);return Math.max(0,1-(value<low?low-value:value>high?value-high:0)/scale);}
export function assessWeather(days:WeatherDay[],asOf:string,profile:WeatherProfile){
  const unavailable=(reason:string)=>({status:'unavailable' as const,reason,index:null});
  if(!profile.reviewed)return unavailable('Artprofilen är inte granskad.');
  const end=dayTime(asOf), weights=Object.values(profile.weights), ranges=[profile.temperatureRange,profile.humidityRange,profile.rainTotalRange];
  if(!Number.isFinite(end)||!Number.isInteger(profile.windowDays)||profile.windowDays<1||profile.windowDays>90||!Number.isFinite(profile.stressDays)||profile.stressDays<=0||ranges.some(([a,b])=>!Number.isFinite(a)||!Number.isFinite(b)||a>b)||weights.some(w=>!Number.isFinite(w)||w<0)||weights.reduce((a,b)=>a+b,0)<=0)return unavailable('Ogiltig modellprofil eller datum.');
  const start=end-(profile.windowDays-1)*DAY;
  const relevant=days.filter(d=>dayTime(d.date)>=start&&dayTime(d.date)<=end).sort((a,b)=>a.date.localeCompare(b.date));
  if(new Set(relevant.map(d=>d.date)).size!==relevant.length)return unavailable('Dubbla dygn i underlaget.');
  if(relevant.length!==profile.windowDays||relevant.some(d=>d.temperatureC===null||!Number.isFinite(d.temperatureC)||d.rainMm===null||!Number.isFinite(d.rainMm)||d.rainMm<0||d.relativeHumidityPct===null||!Number.isFinite(d.relativeHumidityPct)||d.relativeHumidityPct<0||d.relativeHumidityPct>100))return unavailable('Komplett och giltig väderhistorik saknas.');
  let temperature=0,humidity=0,rain=0,run=0,longest=0;
  for(const day of relevant){
    const t=day.temperatureC!,h=day.relativeHumidityPct!;
    temperature+=rangeFit(t,profile.temperatureRange);humidity+=rangeFit(h,profile.humidityRange);rain+=day.rainMm!;
    run=t<profile.temperatureRange[0]||t>profile.temperatureRange[1]?run+1:0;longest=Math.max(longest,run);
  }
  const factors={temperature:temperature/profile.windowDays,humidity:humidity/profile.windowDays,rain:rangeFit(rain,profile.rainTotalRange),stress:Math.max(0,1-longest/profile.stressDays)};
  const total=weights.reduce((a,b)=>a+b,0);
  const index=Math.round(100*(factors.temperature*profile.weights.temperature+factors.humidity*profile.weights.humidity+factors.rain*profile.weights.rain+factors.stress*profile.weights.stress)/total);
  return {status:'available' as const,index,factors,longestUnsuitableRun:longest,windowDays:profile.windowDays,profileVersion:profile.version,asOf};
}

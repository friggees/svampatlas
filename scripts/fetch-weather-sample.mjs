import {mkdir,writeFile} from 'node:fs/promises';
const base='https://opendata-download-metobs.smhi.se/api/version/1.0';
const reference={latitude:59.198,longitude:17.834}; // Tumba reference, not an interpolated grid.
const distance=(s)=>(s.latitude-reference.latitude)**2+(s.longitude-reference.longitude)**2*Math.cos(reference.latitude*Math.PI/180)**2;
async function json(url){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error(`SMHI HTTP ${r.status}`);return r.json();}
await mkdir('data/weather',{recursive:true});
const summary=[];
for(const parameter of [1,6,7]){
 const stations=await json(`${base}/parameter/${parameter}.json`);
 const station=stations.station.filter(s=>s.active&&s.owner==='SMHI').sort((a,b)=>distance(a)-distance(b))[0];
 const url=`${base}/parameter/${parameter}/station/${station.key}/period/latest-months/data.json`;
 const data=await json(url);
 if(!data.value?.length)throw new Error('SMHI returned no observations');
 const artifact={fetchedAt:new Date().toISOString(),sourceUrl:url,selection:'Nearest active SMHI station to Tumba for each parameter; representativeness not yet reviewed.',station,data};
 await writeFile(`data/weather/parameter-${parameter}.json`,JSON.stringify(artifact));
 summary.push({parameter,station:station.name,stationKey:station.key,count:data.value.length,first:data.value[0],last:data.value.at(-1)});
}
await writeFile('data/weather/summary.json',JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));

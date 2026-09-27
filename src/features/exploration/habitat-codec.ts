import type { HabitatData } from './habitat-domain';
type PackedData = Pick<HabitatData,'cells'|'metadata'> & { encoding:string; patches:[string,number,number,number,string[][]][] };
export function decodeRing(encoded:string):number[][] {
  let offset=0;
  const previous=[0,0], points:number[][]=[];
  while(offset<encoded.length){
    for(let axis=0;axis<2;axis++){
      let value=0,shift=0,byte:number;
      do {
        if(offset>=encoded.length||shift>30)throw new Error('Invalid coordinate');
        byte=encoded.charCodeAt(offset++)-63;
        if(byte<0||byte>63)throw new Error('Invalid coordinate');
        value|=(byte&31)<<shift;shift+=5;
      }while(byte>=32);
      previous[axis]+=(value&1)?~(value>>>1):value>>>1;
    }
    points.push([previous[0]/1e6,previous[1]/1e6]);
  }
  return points;
}
export function decodeHabitat(packed:PackedData):HabitatData {
  if(packed.encoding!=='delta-wgs84-1e6-v1'||!packed.cells?.length||!packed.patches?.length||!packed.metadata)throw new Error('Invalid habitat dataset');
  return {type:'FeatureCollection',cells:packed.cells,metadata:packed.metadata,features:packed.patches.map(([cellId,code,longitude,latitude,polygons])=>({
    type:'Feature',properties:{cellId,code,longitude,latitude},geometry:{type:'MultiPolygon',coordinates:polygons.map(rings=>rings.map(decodeRing))},
  }))};
}

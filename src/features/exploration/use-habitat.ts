'use client';
import { useEffect, useState } from 'react';
import type { HabitatData } from './habitat-domain';
import { decodeHabitat } from './habitat-codec';
export function useHabitat(enabled: boolean) {
  const [data,setData]=useState<HabitatData|null>(null);
  const [error,setError]=useState(false);
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    if(!enabled)return;
    const controller=new AbortController();
    const timeout=window.setTimeout(()=>controller.abort(),60_000);
    let active=true;
    fetch('/data/botkyrka-habitat.json',{signal:controller.signal}).then(async response=>{
      if(!response.ok)throw new Error('Habitat unavailable');
      const result=decodeHabitat(await response.json());
      if(!result.cells?.length||!result.features?.length||!result.metadata)throw new Error('Invalid habitat');
      if(active)setData(result);
    }).catch(()=>{if(active)setError(true);}).finally(()=>window.clearTimeout(timeout));
    return()=>{active=false;controller.abort();window.clearTimeout(timeout);};
  },[enabled,attempt]);
  return {data,error,retry:()=>{setError(false);setAttempt(n=>n+1);}};
}

'use client';
import { useEffect, useState } from 'react';
import type { ClimateResponse } from './climate-contract';
import { lastCompletedDate } from './climate-domain';
export type WeatherState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: ClimateResponse };
export function useWeather(enabled: boolean) {
  const [attempt,setAttempt] = useState(0);
  const [state, setState] = useState<WeatherState>({ status: 'loading' });
  const [today, setToday] = useState(() => lastCompletedDate());
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    let active = true;
    async function load() {
      try {
        const response = await fetch('/api/weather', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Vädertjänsten är inte tillgänglig just nu.');
        const data = await response.json() as ClimateResponse;
        if (!Array.isArray(data.areas) || !data.endDate) throw new Error('Vädertjänsten gav ett ofullständigt svar.');
        if (active) setState({ status: 'ready', data });
      } catch {
        if (active) setState({ status: 'error', message: 'Väderanalysen kunde inte hämtas. Försök igen. Inga gamla betyg visas.' });
      } finally { window.clearTimeout(timeout); }
    }
    void load();
    const refreshDate = () => setToday(lastCompletedDate());
    const timer = window.setInterval(refreshDate, 60_000);
    window.addEventListener('focus', refreshDate);
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); window.clearInterval(timer); window.removeEventListener('focus', refreshDate); };
  }, [enabled, attempt]);

  function retry() { setState({status:'loading'}); setAttempt(value=>value+1); }
  const data = enabled && state.status === 'ready' && state.data.endDate === today ? state.data : null;
  return {state,today,data,retry};
}
export type WeatherModel = ReturnType<typeof useWeather>;

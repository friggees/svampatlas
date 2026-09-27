'use client';

import { useEffect, useState } from 'react';
import { CloudRain, Droplets, Thermometer, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { assessClimate, lastCompletedDate, rankClimate } from './climate-domain';
import { climateProfiles } from './climate-profiles';
import type { ClimateResponse } from './climate-contract';
import type { Point } from './domain';
import type { SpeciesId } from '../species/catalog';
import { findSpecies } from '../species/catalog';

const number = (value: number, digits = 1) => value.toLocaleString('sv-SE', { maximumFractionDigits: digits });
const date = (value: string) => new Date(`${value}T12:00:00Z`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', timeZone: 'Europe/Stockholm' });
function distance(a: Point, b: Point) {
  return 111 * Math.hypot(a.latitude - b.latitude, (a.longitude - b.longitude) * Math.cos(a.latitude * Math.PI / 180));
}
type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: ClimateResponse };
type Props = { speciesId: SpeciesId; point: Point | null; inside: boolean; onSelect: (point: Point) => void };

export function WeatherPanel(props: Props) {
  const [attempt, setAttempt] = useState(0);
  // Remount for retry: old ratings disappear immediately, including after a failed refresh.
  return <WeatherRequest key={attempt} {...props} onRetry={() => setAttempt(value => value + 1)} />;
}

function WeatherRequest({ speciesId, point, inside, onSelect, onRetry }: Props & { onRetry: () => void }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [today, setToday] = useState(() => lastCompletedDate());
  useEffect(() => {
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
  }, []);

  const profile = climateProfiles[speciesId];
  const results = state.status === 'ready' && state.data.endDate === today
    ? rankClimate(state.data.areas.map(area => ({ ...area, assessment: assessClimate(area.days, state.data.endDate, profile) }))) : [];
  const selected = point && inside
    ? [...results].sort((a, b) => distance(point, a) - distance(point, b))[0] : results[0];
  const assessment = selected?.assessment;

  return <section className="weather-section" aria-labelledby="weather-heading" aria-busy={state.status === 'loading'}>
    <div className="weather-heading"><div><div className="eyebrow"><CloudRain size={16} /> VÄDRET INFÖR DIN TUR</div>
      <h2 id="weather-heading">Väderläge för {findSpecies(speciesId)?.name.toLocaleLowerCase('sv-SE')}</h2>
      <p>De senaste 14 avslutade dygnen. Jämför fem områden i Botkyrka.</p></div><Badge variant="outline">Preliminär modell</Badge></div>
    {state.status === 'loading' ? <Card className="weather-empty"><p role="status">Analyserar temperatur, regn och fuktighet…</p></Card> : null}
    {state.status === 'error' || (state.status === 'ready' && state.data.endDate !== today) ? <Card className="weather-empty">
      <p role="alert">{state.status === 'error' ? state.message : 'Ett nytt dygn har börjat. Uppdatera väderanalysen innan du jämför områden.'}</p>
      <Button variant="outline" onClick={onRetry}><RefreshCw size={15} /> Försök igen</Button></Card> : null}
    {results.length ? <>
      <p className="weather-caveat">Betyget gäller väder, inte fyndchans. Artprofilerna är preliminära och habitatet är ännu inte bedömt. Högt betyg betyder inte att svampen finns där.</p>
      {!inside ? <p role="status" className="weather-caveat">Din punkt ligger utanför piloten. Jämförelsen nedan gäller bara Botkyrka.</p> : null}
      <div className="weather-layout"><Card className="weather-ranking"><h3>Områden efter väderbetyg</h3>
        <p className="small-note">Lika betyg delar placering. Små skillnader är osäkra.</p>
        <ol>{results.map(area => <li key={area.id}><button type="button" aria-pressed={inside && selected?.id === area.id}
          aria-label={`Visa väder för ${area.name}`} onClick={() => onSelect({ latitude: area.latitude, longitude: area.longitude })}>
          <span className="weather-rank">{area.rank ?? '–'}</span><span className="weather-area-name"><strong>{area.name}</strong>
            <small>{area.assessment.status === 'experimental' ? area.assessment.label : 'Underlag saknas'}</small></span>
          <span className="weather-score-small">{area.assessment.score === null ? '–' : `${area.assessment.score}/100`}</span>
        </button></li>)}</ol>
        <p className="small-note">Referenspunkter för väderområden, inte föreslagna svampställen. Närliggande områden kan dela vädercell.</p>
      </Card>
      <Card className="weather-detail" aria-label="Väderanalys för valt område">
        <div className="weather-detail-title"><div><span className="eyebrow"><MapPin size={14} /> {selected?.name}</span>
          <h3>{assessment?.status === 'experimental' ? assessment.label : 'Väderunderlag saknas'}</h3></div>
          {assessment?.status === 'experimental' ? <div className="weather-score"><strong>{assessment.score}</strong><span>/100</span></div> : null}</div>
        {point && inside && selected ? <p className="small-note">Närmaste jämförelseområde, cirka {number(distance(point, selected))} km från din punkt. Lokal terräng och skugga kan ge andra förhållanden.</p> : null}
        {assessment?.status === 'unavailable' ? <p>{assessment.reason}</p> : null}
        {assessment?.status === 'experimental' ? <>
          <p className="small-note">{date(assessment.startDate)}–{date(assessment.endDate)} · modellerad historik</p>
          <dl className="weather-metrics">
            <div><dt><Thermometer size={16} /> Medeltemperatur</dt><dd>{number(assessment.metrics.temperature)} °C</dd><small>{profile.temperature[0]}–{profile.temperature[1]} °C i pilotprofilen</small></div>
            <div><dt><CloudRain size={16} /> Regn på 14 dygn</dt><dd>{number(assessment.metrics.rain)} mm</dd><small>{profile.rain[0]}–{profile.rain[1]} mm i pilotprofilen</small></div>
            <div><dt><Droplets size={16} /> Luftfuktighet</dt><dd>{number(assessment.metrics.humidity, 0)} %</dd><small>Medelvärde på 2 meters höjd</small></div>
            <div><dt><Droplets size={16} /> Markfuktighet</dt><dd>{number(assessment.metrics.soilMoisture, 3)} m³/m³</dd><small>Modellerat vatteninnehåll på 3–9 cm djup</small></div>
          </dl>
          <h4>Det här påverkar betyget</h4><ul className="weather-reasons">
            <li>{assessment.metrics.stressDays} dygn i längsta perioden utanför temperaturintervallet. Temperaturavdrag: {number(assessment.penalties.temperature * 100, 0)} %.</li>
            <li>{assessment.metrics.dryDays} dygn i längsta torra perioden (under 1 mm regn/dygn). Torrperiodsavdrag: {number(assessment.penalties.drought * 100, 0)} %.</li>
            <li>{assessment.metrics.frostDays} frostdygn senaste veckan. Frostavdrag: {number(assessment.penalties.frost * 100, 0)} %.</li>
          </ul>
          <details className="weather-method"><summary>Se dygnshistorik och hur betyget räknas</summary>
            <p>Profil: {profile.label}. Temperatur väger 35 %, regn 25 %, luftfuktighet 15 % och markfuktighet 25 %. Långvarig temperaturstress, torrperioder och frost sänker sedan betyget stegvis. Saknade värden ger inget betyg.</p>
            <p>Antagna gynnsamma intervall: temperatur {profile.temperature.join('–')} °C, regn {profile.rain.join('–')} mm/14 dygn, luftfuktighet {profile.humidity.join('–')} %, markfuktighet {profile.soilMoisture.join('–')} m³/m³. Det här är öppna pilotantaganden, inte fastställda biologiska gränser för arten.</p>
            <p>14-dygnsfönstret fångar eftersläpning från tidigare väder. Artens exakta responstid, skogstyp och jordart är ännu inte kalibrerade. Version {profile.version}.</p>
            <div className="weather-table-scroll" tabIndex={0} role="region" aria-label="Dygnsvärden, rulla i sidled vid behov"><table><caption>Väderhistorik för {selected.name}</caption><thead><tr><th>Datum</th><th>Medel °C</th><th>Min °C</th><th>Regn mm</th><th>Luft %</th><th>Mark m³/m³</th></tr></thead>
              <tbody>{selected.days.map(day => <tr key={day.date}><th scope="row">{date(day.date)}</th>{[day.temperature, day.minimumTemperature, day.rain, day.humidity, day.soilMoisture].map((v, i) => <td key={i}>{v === null ? 'Saknas' : number(v, i === 4 ? 3 : 1)}</td>)}</tr>)}</tbody></table></div>
          </details>
        </> : null}
      </Card></div>
      <div className="weather-source"><p><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Väderdata: Open-Meteo</a> / DWD ICON · modellrutor på flera kilometer, inte lokala mätningar. <a href="/om#vader">Metod och källor</a>.</p>
        <Button variant="ghost" size="sm" onClick={onRetry}><RefreshCw size={14} /> Uppdatera väder</Button></div>
    </> : null}
  </section>;
}

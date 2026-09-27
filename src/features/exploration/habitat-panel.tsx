import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SpeciesId } from '../species/catalog';
import { findSpecies } from '../species/catalog';
import { habitatProfiles } from './habitat-profiles';
import { spacedSuggestions, type HabitatData, type HabitatResult } from './habitat-domain';

type Props={data:HabitatData;speciesId:SpeciesId;results:HabitatResult[];selectedId:string|null;onSelect:(result:HabitatResult)=>void};
export function HabitatPanel({data,speciesId,results,selectedId,onSelect}:Props){
  const profile=habitatProfiles[speciesId], suggestions=spacedSuggestions(results);
  const selected=results.find(r=>r.cell.id===selectedId);
  return <section className="habitat-section" aria-labelledby="habitat-heading">
    <div className="weather-heading"><div><div className="eyebrow">MARK OCH VÄDER TILLSAMMANS</div><h2 id="habitat-heading">Kartytor för {findSpecies(speciesId)?.name.toLocaleLowerCase('sv-SE')}</h2><p>250 meters analysrutor. Färgen visas endast på markklasser som ingår i artprofilen.</p></div><Badge variant="outline">Experimentell modell</Badge></div>
    <p>{profile.ecology} {profile.gaps}</p>
    <p className="habitat-filter-note"><strong>Skogsturfilter aktivt.</strong> Kartlagda parker, skolor, bostadsområden, centrum, idrottsytor och skötta grönytor är borttagna. Skolor har 100 meters marginal; handel och centrum 75 meter. Kartdata kan sakna platser. <a href="/om#platsfilter">Så fungerar filtret</a>.</p>
    <p className="small-note">Mörkgrönt: starkare stöd (70–100). Ljusgrönt: begränsat stöd (40–69). Gult: svagt stöd (0–39). Grått: väderunderlag saknas. Mörk kant markerar högsta aktuella betyg från 40; blå kant är ditt val. Betygen är inte fyndchanser.</p>
    <div className="habitat-layout"><div><h3>Ytor att jämföra</h3><p className="small-note">Upp till sex alternativ med minst 750 meter mellan punkterna. Lika betyg delar placering.</p>
      {suggestions.length?<ol className="habitat-ranking">{suggestions.map(r=><li key={r.cell.id}><button type="button" aria-pressed={r.cell.id===selectedId} onClick={()=>onSelect(r)} data-cell-id={r.cell.id}><span><strong>Yta {r.cell.id} · {r.weatherName}</strong><small>{r.label} · placering {r.rank}</small></span><strong>{r.score}/100</strong></button></li>)}</ol>:<p role="status">{results.some(r=>r.score!==null)?'Inga ytor når begränsat modellstöd just nu. Svaga ytor kan granskas på kartan.':'Väntar på komplett, aktuellt väder. Inga kombinerade betyg visas.'}</p>}
    </div><div className="habitat-detail" aria-live="polite">
      {selected?<><h3>Vald yta {selected.cell.id}</h3><p><strong>{selected.label}{selected.score===null?'':` · ${selected.score}/100`}</strong></p><p>{Math.round(selected.share*100)} % av analysytans mark matchar profilens markklasser efter platsfiltret. Ytans storlek inom piloten: {(selected.cell.pixels/100).toLocaleString('sv-SE')} hektar.</p><p>Väderreferens: {selected.weatherName}, cirka {selected.distance.toLocaleString('sv-SE',{maximumFractionDigits:1})} km från ytans markerade punkt. Väderbetyg: {selected.weatherScore??'saknas'}.</p><details><summary>Markfördelning och bedömning</summary><p>Bortfiltrerat: {Math.round((selected.cell.excludedPixels??0)/selected.cell.pixels*100)} % av rutan. Ursprungliga markklasser före filtret:</p><ul>{Object.entries(selected.cell.counts).map(([code,n])=><li key={code}>{data.metadata.classLabels[code]??'Underlag saknas'}: {(n/selected.cell.pixels*100).toLocaleString('sv-SE',{maximumFractionDigits:1})} %</li>)}</ul><p>Minsta värdet av markandel × 100 och väderbetyg styr. {profile.limited?'Profilens viktiga dataluckor begränsar betyget till 59. ':''}Regeln är ett pilotantagande och är inte fältvaliderad. Punktmarkeringen ligger på relevant marktäcke men är ingen verifierad entré.</p></details><Button variant="outline" asChild><a href="#save-heading">Spara den valda platsen</a></Button></>:<><h3>Vad säger kartan?</h3><p>Välj en färgad yta eller ett alternativ i listan för att se markfördelning och väderstöd. Ofärgad mark har inget stöd i profilen eller saknar data; den bevisar inte att arten saknas.</p></>}
    </div></div>
    <p className="small-note">{data.metadata.source} · CC0 · hämtat {data.metadata.downloadedAt.slice(0,10)}. Saknade rasterpixlar inom piloten: {data.metadata.missingInsidePilotPixels}. {data.metadata.exclusions?<>Platsfilter: © OpenStreetMap contributors · ODbL · {data.metadata.exclusions.fetchedAt.slice(0,10)}. </>:null}Väderfönster och dygnsdata visas nedan. <a href={profile.source} target="_blank" rel="noopener noreferrer">Artkälla</a> · <a href="/om#habitat">Metod och begränsningar</a>.</p>
  </section>;
}

import Link from 'next/link';
import {habitatProfiles} from './habitat-profiles';
import {findSpecies, type SpeciesId} from '../species/catalog';
import type {CountyMetadata} from './county-contract';
export function CountyPanel({speciesId,metadata,selectedCode}:{speciesId:SpeciesId;metadata:CountyMetadata;selectedCode:number|null}) {
  const profile=habitatProfiles[speciesId];
  const matches=selectedCode!==null&&profile.codes.includes(selectedCode);
  return <section className="county-panel" aria-labelledby="county-heading">
    <div className="eyebrow">ALLA 26 KOMMUNER · SKOG, LANDSBYGD OCH SKÄRGÅRD</div>
    <h2 id="county-heading">Markmiljöer för {findSpecies(speciesId)!.name.toLocaleLowerCase('sv-SE')}</h2>
    <p>{profile.ecology} {profile.gaps}</p>
    <p><span className="county-legend-dot"/> Grönt visar markklasser som matchar artens experimentella profil. Zooma in för de detaljerade ytorna från 10-metersunderlaget. Små ytor utelämnas i översikten.</p>
    <div className="county-detail" aria-live="polite">{selectedCode!==null?<><strong>{metadata.classLabels[selectedCode]??`Markklass ${selectedCode}`}</strong><p>{matches?'Vald markklass ingår i artens profil.':'Den valda markklassen ingår inte i den nu valda artens profil.'}</p></>:<p>Klicka på en grön yta för att se markklassen. En ofärgad yta kan vara bortfiltrerad, sakna matchande markklass eller vara för liten för översikten.</p>}</div>
    <p><strong>Skötta miljöer bortfiltrerade.</strong> Kartlagda parker, gräsmattor, skolområden, centrum och stationsmiljöer undantas. Extra avstånd används inom tätorter; naturmark på landsbygden utanför själva anläggningen kan finnas kvar. Kartläggningen kan vara ofullständig.</p>
    <p className="small-note">NMD2023 v2.1 · OSM {metadata.osmSnapshot.slice(0,10)} · SCB tätorter 2023. Länskartan visar markstöd, utan väderbetyg eller fyndsannolikhet. <Link href="/om#stockholm">Metod, dataluckor och licenser</Link>.</p>
    <Link href="/botkyrka">Öppna Botkyrkas fördjupning med väderjämförelse →</Link>
  </section>;
}

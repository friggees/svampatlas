# Väderbaserad ranking – uttryckligt produktkrav

## Implementerad pilot, 2026-09-27

Väderjämförelsen är nu aktiv under Utforska området. Fem fasta referensområden hämtas i ett serverbaserat batchanrop till Open-Meteo med modellen DWD ICON Seamless. Värdena är modellerad historik, inte SMHI-observationer. De tidigare SMHI-provutdragen bevaras separat och är inte fallback för aktuella betyg.

Indata: daily temperature_2m_mean, temperature_2m_min, rain_sum och hourly relative_humidity_2m, soil_moisture_3_to_9cm. Regn skiljs från total nederbörd inklusive snö. Alla 14 avslutade svenska dygn behövs; enheter valideras. UTC-tidsstämplar grupperas i Europe/Stockholm, vilket ger korrekt 23/25-timmarsdygn. Inga framtida eller ofullständiga dygn används. Saknade värden, dataluckor eller gamla datum ger ingen ranking.

Väderindex: 35 % temperaturpassning, 25 % regnpassning, 15 % luftfuktighet och 25 % modellerad markfuktighet. Både för låga och för höga värden tappar poäng utanför profilens intervall. Sedan multipliceras indexet med kvarvarande andelar efter temperaturstress (max 65 % avdrag vid 7 sammanhängande ogynnsamma dygn), torrperiod (max 55 % avdrag vid 10 dygn under 1 mm regn/dygn) och frost (profilberoende max 40–65 % vid minst tre frostdygn senaste veckan). Indexet är inte procentuell fyndchans.

**Numeriska antaganden:** fyra preliminära profiltyper för mild skogshöst, sval skogshöst, sen skogshöst och sval gräsmark. Exakta intervall finns i climate-profiles.ts och visas i metodpanelen. Profilerna är produktantaganden för experimentell jämförelse, inte publicerade artoptima eller granskade ekologiska trösklar. Forskningen nedan stödjer val av faktorer men validerar inte dessa vikter, tidsfönster eller grupperingar för Botkyrka. Denna märkning får inte tas bort utan fält-/ekologisk validering.

UI visar ranking med delad placering, faktiska vädermått, profilintervall, avdrag och 14-dygnstabell. Egna punkter kopplas till närmaste referensområde med avstånd. Tumba och Vårsta delade cell i provet och fick identiska betyg. Ingen låtsad mikroklimatskillnad läggs till. Habitat är ännu inte medräknat.

Cache: datum i fetch-nyckeln, revalidate 3600 sekunder. Publikt endpoint /api/weather tillåter bara dessa fasta områden; inga privata koordinater eller anteckningar lämnar appen. Server-timeout 15 sekunder, klient-timeout 20 sekunder, avbrutna anrop hanteras, nytt dygn döljer tidigare analys. Leverantörsfel visas med återförsök utan gammalt betyg.

Verifierat: 17 domän-/normaliseringstester, lint, typkontroll, produktionsbygge, live-API och browserflöde inklusive artbyte, områdesval, dygnstabell, mobil och simulerat tjänstefel/återförsök. Inga databasmigrationer behövdes.

### Källor och begränsningar för piloten

- [Open-Meteo API](https://open-meteo.com/en/docs): vädermodellernas parametrar och enheter. [Licens](https://open-meteo.com/en/licence) CC BY 4.0; [gratis-API:s villkor](https://open-meteo.com/en/terms) gäller icke-kommersiell användning. Kommersiell drift behöver separat lösning/avtal.
- [USDA: Ecology and Management of Commercially Harvested Chanterelle Mushrooms](https://www.fs.usda.gov/pnw/pubs/pnw_gtr576.pdf): översikt över miljöfaktorer och kantareller; andra regioner och arter innebär begränsad överförbarhet.
- [Salerni et al., Boletus edulis och klimat/extremhändelser](https://italianmycology.unibo.it/article/view/16464): effekter beror på lokala skogsförhållanden och fördröjning; ger inga generella svenska optimumgränser.

Fortsatt arbete: samla oberoende fynd-/fältunderlag, kalibrera artprofiler och responstider, integrera habitat, jordart och lokal representativitet innan samlad områdeslämplighet publiceras. Resterande modellkontrakt nedan beskriver den avsedda validerade produkten.

Användartillägg 2026-09-27: bästa platser ska rankas med hänsyn till väderhistorik, temperatur och fuktighet. Ett område som haft olämplig temperatur under längre tid ska rankas lägre för den aktuella arten. Detta är kärnfunktion, inte en senare valfri förbättring.

## Modellkontrakt

Separera stabil habitatlämplighet från tidsberoende förutsättningar. Varje artprofil måste beskriva relevanta temperaturintervall, ackumulerad exponering, antal sammanhängande olämpliga dygn, regnackumulering, torra perioder, fuktighetsvariabel och fördröjning mellan väder och möjlig fruktkroppsbildning. Hänsyn till frost och återhämtning läggs till när artspecifikt stöd finns.

Använd artspecifika rullande tidsfönster, inte bara dagens väder. Beräkna temperaturavvikelse över tid och varaktighet för olämpliga perioder. En lång olämplig period ska kunna ge större avdrag än en enstaka avvikelse. Om vädret förbättras ska gamla avvikelser lämna fönstret; historiska straff får inte permanent ligga kvar.

Relativ luftfuktighet (%) är inte markfuktighet. Markfuktighet behöver egen mätning/modell med enhet, djup och källa. Regn används som separat signal och får inte presenteras som uppmätt markfukt. Extrem nederbörd behöver inte vara positiv; stöd för optimum och övre gräns ingår i profilen.

Kombinera habitat och väder först när båda har tillräckligt underlag. Poängen är ett relativt index, inte procentuell fyndchans. Datakvalitet visas separat. Ett geografiskt område med saknade väderdata får inte en neutral eller positiv väderpoäng av misstag.

## Datapipeline

SMHI:s parameterindex kontrollerades live: 1 = temperatur timvärde, 2 = dygnsmedeltemperatur, 6 = relativ luftfuktighet timvärde, 5 = dygnsnederbörd (dygn kl 06), 7 = timnederbörd. Hämta serier med kvalitetsflaggor och faktisk mätperiod. Normalisera innan dygn kombineras; blanda inte nederbördsdygn kl 06 med kalenderdygn utan dokumenterad omräkning.

Välj stationer efter parameter, avstånd, representativitet, aktualitet och täckning. Lagra stationens avstånd och sänk tillförlitligheten när den är långt bort. En station som representerar hela piloten kan inte skapa trovärdiga småskaliga skillnader mellan närliggande platser. Interpolerade data märks som modellerade. Historik och prognos hålls isär; framtida observationer får inte läcka in i historisk utvärdering.

Vid import sparas UTC-tid samt den ursprungliga tidsperioden. Lokala besöksdatum tolkas i Europe/Stockholm, inklusive sommartid. Täckning mäts i förväntade observationer, inte bara antal rader. Dubbletter, saknade dygn, icke ändliga värden och felaktiga enheter ska avvisas eller markeras.

## Test- och lanseringskrav

- Samma habitat med längre temperaturstress får lägre väderindex för samma artprofil.
- Samma väderserie kan ge olika resultat för olika arter.
- Saknat regn eller fuktighet blir underlag saknas, aldrig implicit noll eller optimalt.
- Datagap bryter sammanhängande observerad stress; luckan får inte räknas som ett känt dygn.
- Ingen framtidsläcka; modelldatum och tidsfönster är explicita.
- Förklaring anger vilka vädersignaler som drog upp/ned indexet och vilka som saknas.
- Trösklar och vikter behöver källreferens och granskning. Syntetiska testprofiler är endast tester och publiceras aldrig som verklig artkunskap.

## Källor

[SMHI relativ luftfuktighet](https://www.smhi.se/data/nederbord-och-fuktighet/relativ-luftfuktighet), [SMHI parameterindex](https://opendata-download-metobs.smhi.se/api/version/1.0.json). Artprofiler och ekologiska responstider återstår att belägga och granska.

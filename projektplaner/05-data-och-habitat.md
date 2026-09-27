# Datakällor och habitatmodell

## Vad modellen får säga

Första modellen ger relativ habitatlämplighet inom det sökta området. Den ger inte sannolikheten att faktiskt hitta en fruktkropp. ”Hög”, ”medel” och ”låg” kompletteras av datakvalitet och ”underlag saknas”. Historiska fynd är ett separat bevislager; frånvaro av rapporter betyder inte frånvaro av svamp.

## Datakällor att verifiera i förstudien

| Källa | Planerad användning | Kontroller före integration |
|---|---|---|
| SLU Artdatabanken: SOS och artinformation | Taxonomi, offentliga observationer, artprofiler | API-avtal, autentisering, kvoter, licens per dataset/bild, koordinatosäkerhet och skyddade fynd |
| Naturvårdsverket NMD | Mark- och skogstyper | Version, klassdefinitioner, täckning, rasterstorlek, förändringsår och användningsvillkor |
| SMHI öppna data | Nederbörd och temperatur, historik och tillgänglig prognos | Kvalitetskoder, stationsavstånd, tidszon, prognoshorisont och attribution |
| Kartleverantör med OSM-baserad karta | Baskarta, ortsökning, eventuellt entréer | Tile-/geokodningsavtal, kvoter, nyckelskydd, kostnad och offlinevillkor |
| Skyddade områden, senare terräng/jorddata | Kontext och förbättrade habitatvariabler | Maskinläsbarhet, aktualitet, lokal täckning och relevans |

SLU beskriver öppna API:er för artobservationer och artinformation; faktisk åtkomst och villkor måste provas för de valda datamängderna. NMD ger rikstäckande marktäckekartering, men utgör inte ensamt en karta över svampförekomst. SMHI dokumenterar väder-API:er. [SLU](https://www.slu.se/artdatabanken/rapportering-och-fynd/oppna-data-och-apier/om-slu-artdatabankens-apier/), [NMD](https://www.naturvardsverket.se/verktyg-och-tjanster/kartor-och-karttjanster/nationella-marktackedata/), [SMHI](https://opendata.smhi.se/).

Använd inte OSM:s publika standardtiles som oavtalad bulk- eller offlinekälla. Välj en leverantör med dokumenterade produktionsvillkor. MapLibre är renderaren, inte en dataleverantör. [OSM tile-policy](https://operations.osmfoundation.org/policies/tiles/), [MapLibre](https://maplibre.org/maplibre-gl-js/docs/).

## Modell v0: transparenta regler

1. Matcha artens verifierade habitatprofil mot cellernas marktäcke och tillgängliga miljöegenskaper.
2. Tillämpa granskad säsongsprofil med regional variation där underlag finns.
3. Lägg till vädermodifierare enbart för arter och tidsfönster som har ett dokumenterat stöd.
4. Sammanställ förklaringar och separat datakvalitet. Saknade viktiga variabler kan stoppa rankning.
5. Gruppera närliggande celler till rimliga besöksområden; undvik fem nästan identiska toppresultat.
6. Presentera observationer separat i v0. Inför dem som modellsignal först efter analys av rapporteringsbias.

Vikter, regntrösklar och tidsfönster är ännu inte fastställda. De ska motiveras med artkällor och expertgranskning, inte uppfinnas för att få kartan att se komplett ut. Samma skogsmodell får inte återanvändas för arter med andra habitatkrav.

Datakvalitet bedömer täckning, aktualitet, källprecision och profilens granskningsstatus. Visa aldrig hög säkerhet enbart för att ett område har många rapportörer. Tillgänglighet och avstånd påverkar användarens val, men hålls separata från den ekologiska poängen.

## Import och uppdatering

Hämta → spara licens/proveniens → validera → normalisera taxon/koordinater → deduplicera → beräkna cellvariabler → publicera ny datasetversion. Alla steg ska vara idempotenta och ha checkpoint, begränsade retries och fellogg utan privata platser. Ofullständig import ersätter inte senaste fungerande version.

Föreslagen startfrekvens: väder enligt källans uppdateringstakt, observationer dagligen inom tillåtna kvoter, NMD vid ny publicerad version. Frekvenser fastställs efter åtkomsttest. Spara både observationstid och hämtningstid. Kör först en liten pilotexport, inte nationell rasterimport.

Privata sparningar och besök används inte i publik modellträning utan separat frivilligt medgivande. Skyddade eller redan generaliserade fynd får inte rekonstrueras till mer exakta koordinater.

## Vetenskaplig utvärdering

Jämför habitatmodellen mot enkel säsongsbaslinje och geografiskt stratifierade kontrollområden. Gör geografiskt och tidsmässigt separata testmängder; observationer från samma tur eller närliggande celler får inte läcka mellan träning och test.

Pilotbesök registrerar söktid, datum, art och även uteblivna fynd. Modellmått: träffandel bland topprankade områden vid jämförbar sökinsats, täckning och osäkerhet. Frivilliga fyndrapporter ensamma räcker inte för kalibrerad sannolikhet. Publicera först modellen som experimentell; ge ingen effektutfästelse före prospektiv pilot.

Godkänn varje art för sig. Om data inte stöder användbar ranking finns arten kvar i katalogen med tydlig status ”Habitatbedömning saknas”.

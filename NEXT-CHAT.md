# Aktuell status – klart och publicerat 2026-09-28

## Levererat enligt användarens beställning
- Fas 1 i Botkyrka är verifierad, inklusive hela habitatflödet lokalt och i produktion.
- Startsidan visar nu **hela Stockholms län**, alla 26 kommuner och samtliga tio arters experimentella markprofiler. Kommunväljare, satellit, klickbara ytor och privata sparade platser fungerar även på mobil.
- Kartlagda parker, skötta gräsytor, skolor, stationer, bostäder, handel och andra definierade anläggningar undantas. Extra avstånd tillämpas inom SCB:s tätorter; omkringliggande natur på landsbygden undantas inte automatiskt. OSM kan inte bevisa verklig klippfrekvens eller fullständig täckning.
- Svampguiden `/arter` har **tre separata fotografier per art (30 totalt)**, tre kännetecken, kort jämförelse/anmärkning, källänkar, bildväxling, tangentbordsstöd och fotograf/licens för varje bild. Google bildsökning blockerade automatisering med kontrollsida; licensierade original hämtades i stället via Wikimedia Commons. Samtliga bilder granskades visuellt. Inga AI-genererade svampbilder.
- Kod och data är pushade till main. Länskartan publicerades först, bildguiden därefter. Senaste funktionscommit: `e68e818` (Vercel READY). Efterföljande dokumentations-/testcommit ändrar inte appbeteendet.
- Produktion: https://svampatlas.vercel.app · guide: https://svampatlas.vercel.app/arter

## Verifierat
- 27 domäntester, lint, TypeScript och produktionsbygge: PASS.
- `npm run test:stockholm-data`: PASS för 168 154 037 länspixlar, tio artmasker, 474 kartfiler och alla 6 240 942 detaljgeometrier mot platsfiltret. Tolerans: 1 meter i Web Mercator (<0,55 meter på marken), tillåten restarea <0,01 m². Rapport finns i `projektplaner/stockholm-verification.json` och lokalt i `data/stockholm/verification.json`.
- `test:stockholm-browser`: PASS lokalt och mot produktion. Alla tio arter, 26 kommunalternativ, oförändrad kartinstans, klickbara ytor, satellit, mobil utan sidledes överflöde, simulerat tilefel/återförsök, inga page errors eller fabricerade länsväderanrop.
- `test:browser`: PASS för inloggning → spara syntetisk plats inom länet men utanför Botkyrka → återläsning → vägbeskrivning → radering, samt Botkyrkas väderflöde.
- `test:integration`: PASS för auth, skapa/läsa/radera, anonym nekad åtkomst, användarisolering, förfalskad ägare och ägarbyte. Tillfälliga testkonton borttagna. Ingen schema- eller RLS-ändring.
- `test:guide-browser`: PASS lokalt och mot produktion. Alla 30 distinkta bilder laddar, tio gallerier/texter, bildväxling, käll-/licenslänkar, mobil, tangentbord och artnavigering. Desktop- och mobilbilder granskade visuellt.

## Data och reproducerbarhet
- SCB RegSO 2025: 524 delområden, 26 kommuner. Tätorter 2023: 229 geometrier. NMD2023 v2.1: 10 meter, fem saknade klasspixlar lämnas saknade.
- OSM: samtliga 26 kommunuttag klara, snapshot `2026-09-27T17:41:00Z`. 60 795 unika undantagsobjekt; 9 705 582 pixlar (970,5582 km²) bortfiltrerade. Relation 15619708 har trasig ytterring och en uttryckligen dokumenterad konservativ omslutande undantagsyta.
- Publicerat MVT: zoom 6–11, 474 tiles, 230 212 781 byte okomprimerat. Endast synligt utsnitt laddas. Översikter använder homogena 80/40/20-metersblock; källzoom 11 har ursprungliga 10-metersytor. Alla source tiles är versionshanterade; rådata/raster i `data/stockholm/` är ignorerade.
- `fetch-stockholm.py`, `build-stockholm.py`, `build-stockholm-tiles.py` återskapar underlaget. `--refresh-county-overviews` uppdaterar bara zoom 6–7. Första översikten behövde zoom 6; det är rättat. Återförsök skapar om endast länets källa/lager, med bibehållen art/visning, eftersom en vanlig refresh inte återställde misslyckade worker-anrop.
- Bilder: `public/images/species/`, metadata/filhash/licens i `SOURCES.json`; appdata i `src/features/species/photos.json`, källstödda kännetecken i `guide.ts`. Bilder är Wikimedia-genererade 960px-versioner och visas utan beskärning. Behåll fotograf/licens vid återanvändning.

## Kvarvarande begränsningar, inte blockerande leveransarbete
- Länskartan visar **markstöd**, inte fyndsannolikhet eller länstäckande väderbetyg. Botkyrkas väder/ranking finns på `/botkyrka`.
- Ekologisk fältvalidering och expertgranskning av markprofiler återstår. Värdträd, markkemi, faktisk gräsklippning och fullständig OSM-täckning saknas. Små habitatytor utelämnas i översikten och syns vid inzoomning.
- Bildguide och kännetecken är inte tillräckliga för säker artbestämning eller beslut att äta ett fynd.
- Satellitlagrets tidigare CC BY-NC-SA-villkor gäller fortsatt för den icke-kommersiella piloten.
- Inget mer arbete återstår i den beställda leveransen. Nästa ändring utgår från användarens återkoppling.

Projekt: C:/Users/albin/dev/svampatlas. Vercel project prj_Ra3f5zblOTziayUMbwtJaAult4T5, team_ofmSi6R58ZAqEzb9Mn7n3hdK. Bevara `.env.local`, skriv aldrig ut hemligheter. Lokal produktionsserver kan köras på port 3001; port 3000 kan tillhöra annat projekt.

---

## Föregående överlämning (historik)

# Överlämning vid chattbyte – 2026-09-27

Detta är aktuell status och ersätter äldre uppgifter om nästa steg.

## Uppdrag och avgränsning
Projekt: C:/Users/albin/dev/svampatlas. Läs AGENTS.md, detta dokument och README.md. Användaren vill avsluta fas 1 i Botkyrka innan fas 2 med data för hela Stockholmsregionen. Ingen Stockholmshämtning har påbörjats. Starta inte sådan hämtning utan ny instruktion. Användaren vill pusha fungerande ändringar tidigt före omfattande tester.

## Implementerat och publicerat
- Habitatytor för alla tio arter, baserade på NMD-markklasser och befintligt väder. Karta och lista använder samma experimentella index, inte fyndsannolikhet. Saknat/gammalt väder tar bort kombinerade betyg.
- Platsfilter för kartlagda parker, skolor, skötta grönytor, centrum/handel, bostäder och andra definierade miljöer. OSM-underlag: 3 261 objekt. 390 005 pixlar (39,0005 km²) undantas. Återstående webbdata: 3 791 analysrutor, 25 419 geometrier, cirka 8,7 MB. OSM:s täckning är inte fullständig; filtret bevisar inte faktisk skötsel eller besöksantal.
- Satellitväxling Karta/Satellit och Visa habitatytor. EOxCloudless 2025, Sentinel-2-bilder från 2024–2025, 10 m grundupplösning. CC BY-NC-SA 4.0 för icke-kommersiell pilot; kommersiell drift kräver licens eller byte. Attribution och metod finns i appen.
- Senaste kartfixen väntar på renderade habitattiles. Val av yta ändrar filter utan att ladda om geometrin; artbyte behåller kartinstansen.
- Kodcommit a902e65f5fa4ec520afbb332122e03faeac7df92 är pushad till origin/main och verifierad READY i Vercel. Produktion: https://svampatlas.vercel.app. Användarens tidigare produktionsfixar är bevarade. Ingen ny databas- eller authändring.

## Verifierat och återstående kontroll
Godkänt: 24 domäntester, lint, produktionsbygge inklusive TypeScript samt oberoende Pythonkontroll av alla publicerade geometrier mot platsfiltret. Kontrollens avrundningstolerans är cirka 0,064 m²; observerade rester under 0,01 m². Satellitbilder laddades och granskades visuellt i riktig browser. Användaren har också bekräftat att karta och områden fungerar.

Det samlade browsertestet är INTE bekräftat godkänt. Senaste körningens slutresultat saknas vid chattbytet. Tidigare körningar fastnade eller föll på väntan på MapLibre-rendering och markörposition mitt under zoomanimation. Dessa har fått kod-/testjusteringar, men hela flödet måste slutföras innan fas 1 kallas slutverifierad.

## Nästa steg
1. Läs scripts/verify-habitat-browser.mjs och kör npm run test:habitat-browser mot lokalt produktionsbygge på port 3001. Kontrollera först om server redan körs; port 3000 kan tillhöra annat projekt. Undvik att upprepa fulla byggen utan förändring.
2. Slutför kontroll av kartklick, listval, zoom, satellit, alla tio arter, mobil, väderfel/gammalt dygn/återförsök och habitatfel. Undersök rendering och testets väntan om det stannar. Senaste testet väntar på data-habitat-ready och heltal i markörens transform efter zoom; det senare kan behöva säkrare väntan på avslutad animation.
3. Gör endast nödvändiga korrigeringar, pusha dem tidigt och kontrollera deployment. Uppdatera denna status med verkliga testresultat.
4. Stanna och redovisa fas 1. Fas 2: utöka till Stockholmsregionen först efter användarens nästa instruktion. Fältvalidering och ekologisk expertgranskning återstår separat.

## Viktiga filer och reproducerbarhet
- projektplaner/13-fas1-platsfilter-satellit.md: regler, källor, licenser och fasgräns.
- scripts/fetch-exclusions.py: avgränsad OSM-hämtning; cache i data/landcover, inte Stockholm.
- scripts/build-habitat.py och scripts/verify-habitat-filter.py: export och oberoende geometrikontroll.
- public/data/botkyrka-habitat.json och botkyrka-exclusions.geojson: publicerat underlag.
- habitat-profiles.ts, habitat-domain.ts, use-habitat.ts, use-weather.ts, map.tsx och habitat-panel.tsx: centrala implementationsfiler; hitta deras sökvägar med rg --files.
- /om#habitat och /om#platsfilter: användarsynlig metod, begränsningar och källor.
- Artifacts och lokala raster/cacher är ignorerade. Befintlig .env.local ska bevaras och aldrig skrivas ut.

PowerShell: sätt $OutputEncoding = [System.Text.UTF8Encoding]::new($false) före Python via stdin, så svenska tecken inte blir frågetecken.

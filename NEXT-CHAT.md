# Aktuell status – 2026-09-28

## Aktuellt uppdrag (ersätter äldre fasgränser)
1. Fas 1-verifieringen är klar: hela `test:habitat-browser` passerade mot lokalt produktionsbygge, alla tio arter, kartklick/listval, zoom, satellit, mobil, väderfel/gamla dygn/återförsök, habitatfel/återförsök. Inga page errors. Bilder granskade.
2. Användaren beställde därefter **hela Stockholms län**, med habitat för alla tio arter och undantag för parker, klippta gräsytor, centrum, stationer, skolor m.m. Extra närhetsbuffertar ska skilja tätort från landsbygd. Regional karta ska pushas och verifieras i Vercel så användaren kan se den från mobilen.
3. **Efter länspubliceringen:** hämta tre bilder per svamp via Google/bildsökning, kontrollera originalkälla/art/licens, lägg in snyggt i Svampguiden tillsammans med korta kännetecken. Pusha och verifiera Vercel igen. Detta steg är ännu inte påbörjat.
Användaren har lämnat datorn och senare sagt ”fortsätt”. Ingen ny bekräftelse behövs. Pusha fungerande ändringar före omfattande tester.

## Fas 2 just nu
- SCB-gränser hämtade: alla 26 kommuner/524 RegSO. Tätorter 2023: 229 geometrier.
- Nationellt NMD återanvänt och länsutdrag klart: 168 154 037 pixlar, fem saknade klassvärden; 36,96 MB `data/stockholm/landcover.tif` (band 1 klass, band 2 länsmask).
- OSM: 24 kommunuttag klara inklusive Norrtälje. Sigtuna (0191) och Nynäshamn (0192) återstår. Timeout i Overpass; skriptet delar nu även dessa i fyra cachade deluttag. Samma snapshot 2026-09-27T17:41:00Z för samtliga. Återuppta med `python scripts/fetch-stockholm.py --stage osm`.
- Ett trasigt OSM-bostadsområde, relation 15619708, får uttryckligt dokumenterat konservativt omslutande undantag. Inga andra geometrifel i hittills kontrollerade objekt. `landcover=grass` hämtas som kontext men filtreras inte ensamt; `landuse=grass` filtreras.
- Alla skript och återanvändbar kartimplementation är pushade. Länsaktivering i startsida, spargräns och apptexter är fortfarande lokala ändringar, eftersom slutliga kartdata inte är klara.

## Fortsätt i ordning
1. Avsluta OSM-uttag. Manifestet `data/stockholm/osm-manifest.json` skapas endast när alla 26 är klara.
2. `python scripts/build-stockholm.py --stage exclusions`, därefter `--stage habitat`.
3. `python scripts/build-stockholm-tiles.py`: publicerar MVT z7–11 och metadata i `public/data/stockholm/`. z11 är native 10m-geometrier; översikter har bara homogena block för att inte fylla igen undantag.
4. Pusha komplett länsaktivering + data efter snabb byggkontroll. Kör sedan `python scripts/verify-stockholm.py`, npm test/lint/build, `node scripts/verify-stockholm-browser.mjs`, integration/sparflöde och Vercelkontroll. Regional spargräns ändras, inte RLS eller DB-schema.
5. Länskartan visar ärligt markstöd utan regionala väderbetyg. Botkyrkas oförändrade vädermodell finns på `/botkyrka`. Appens root ska visa länet när data finns.
6. Därefter bildguiden enligt uppdraget ovan.

Projekt: C:/Users/albin/dev/svampatlas. Produktion: https://svampatlas.vercel.app. Vercel project prj_Ra3f5zblOTziayUMbwtJaAult4T5, team_ofmSi6R58ZAqEzb9Mn7n3hdK. Befintlig .env.local bevaras, skriv inte ut hemligheter. Rådata/raster i data/stockholm ignoreras i Git och Vercel. Läs projektplaner/14-stockholms-lan.md. Fältvalidering och ekologisk expertgranskning återstår separat.

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

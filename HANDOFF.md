# Startsida och auth – 2026-09-28

Ny leverans: marknadsstartsida på /, befintlig länskarta flyttad till /utforska, tydliga registrerings-/inloggningsvyer och nytt bekräftelseflöde. /auth/confirm verifierar token_hash (över flera enheter) eller PKCE-kod, skriver cookies och använder relativ Location för att bevara publik host. Ogiltiga/förbrukade länkar visar ny-bekräftelseformulär. Befintliga komponenter i shadcn återanvänds.

Verifierat lokalt: lint, produktionsbygge/TypeScript, 27 domäntester, auth-browsertest på dator och 390/320 px samt integrationstest för privata platser och användarisolering. Tillfälliga konton borttagna. Inga ändringar i schema eller RLS. Screenshots i ignorerade artifacts/.

Supabase cyyozcmhlewapesojvot hade Site URL http://localhost:3000 och tom redirectlista. Ny exakt konfiguration och svensk token_hash-mall finns i supabase/ och scripts/configure-auth.mjs. Senaste funktionscommit c287009 är pushad till main. Site URL och exakt redirectlista är nu ändrade och återlästa via Management API. Slutpubliceringen är READY (dpl_BWbi2JBKXn3AfSYUDfMZj93rfy2e). Det utökade auth-browsertestet passerar även mot https://svampatlas.vercel.app: både verklig standardlänk via Supabase och token_hash, session efter reload, in-/utloggning, felaktiga/förbrukade länkar, formulär och mobilbredder. Standardmallens fragmentlänkar hanteras av /auth/callback. Alla syntetiska testkonton är borttagna. E-postbekräftelse är fortsatt aktiverad.

Supabase avvisade malländring med HTTP 400: gratisplan utan egen SMTP tillåter inte ändrade e-postmallar. Standardmallen är bevarad. Den svenska mallen finns förberedd och kan aktiveras med scripts/configure-auth.mjs --with-template --apply efter SMTP-konfigurering. PKCE-länkar i en annan webbläsare saknar verifieringscookie: adressen kan bekräftas men användaren behöver då logga in med lösenord.

Kvar: egen SMTP saknas (smtp_host null). Standardutskick tillåter endast projektteamets adresser. Användaren är tillfrågad om leverantör och avsändardomän. Ingen verklig inkorgsleverans har verifierats; admin-genererad token och formulär har verifierats. Stäng inte av e-postbekräftelse för att kringgå detta.

---

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

---

# Äldre arbetshistorik (status ovan gäller)

## Fas 1 – 2026-09-27: platsfilter och satellit

**Aktuell avgränsning:** slutför Botkyrka och stanna före datahämtning för Stockholmsregionen. Användaren vill kontrollera kontexten innan fas 2. Ingen Stockholmshämtning är gjord i detta arbetspass.

Implementerat: OSM-baserat platsfilter för parker, skolor, skötta grönytor, bostäder, centrum/handel och andra definierade miljöer. 3 261 kartobjekt i Botkyrkauttaget, 390 005 borttagna 10-meterspixlar (39,0005 km² inom piloten). Markstödet använder kvarvarande pixlar; ursprunglig klassfördelning finns kvar. 3 791 analysrutor och 25 419 markklassgeometrier, cirka 8,7 MB packad webbdata före HTTP-komprimering. Skolbuffert 100 m, handel/centrum 75 m, övriga regler och osäkerheter finns i projektplaner/13-fas1-platsfilter-satellit.md samt /om#platsfilter.

Satellit: EOxCloudless/Sentinel-2, bilder 2024–2025, 10 m grundupplösning, attribution i kartan. Knappar Karta/Satellit och Visa habitatytor. Icke-kommersiell pilotlicens CC BY-NC-SA 4.0; kommersiell drift kräver licens eller leverantörsbyte. Ingen bulk-/offlinehämtning. Art- och bakgrundsbyte behåller kartinstansen och vald punkt.

Verifierat: 24 domäntester, lint och produktionsbygge inklusive TypeScript passerar. Oberoende Pythonkontroll av alla 25 419 avkodade geometrier mot 3 261 undantagsytor passerar med koordinatavrundningstolerans 0,064 m² (observerade rester under 0,01 m², källpixel 100 m²). Satellitbilder laddas i riktig browser och bildkontroll är gjord. Det samlade browsertestet pågår; ett exakt pixelklick kräver inzoomning eftersom markören avrundas till skärmpixel i översiktsläge. Kartans källuppdatering är korrigerad så transparenta lager fortfarande får laddas.

Första habitatpushen 8824a66 är verifierad READY i Vercel på https://svampatlas.vercel.app. Vercel-projekt prj_Ra3f5zblOTziayUMbwtJaAult4T5, team_ofmSi6R58ZAqEzb9Mn7n3hdK, Git main i friggees/svampatlas. Användarens fem tidigare produktionsfixar har mergats och bevarats.

Nästa steg i detta arbetspass: avsluta browserkontroll, verifiera fas 1-deployment, uppdatera status och stanna inför användarens kontextkontroll. Därefter endast på ny instruktion: fas 2 för Stockholm. Fältvalidering och expertgranskning kvarstår.

## Senaste implementation – 2026-09-27, habitatintegration

Detta avsnitt ersätter äldre uppgifter nedan om nästa kartuppgift. Habitatlagret är nu implementerat lokalt för alla tio arter. 3 791 analysrutor och 29 770 markklassgeometrier har härletts från det verifierade NMD-rastret. Webbexporten är cirka 10,6 MB med förlustfri deltakodning av sexdecimaliga koordinater. `python scripts/build-habitat.py` återskapar den från den lokala rasterfilen.

Kartan och listan använder samma kombinerade index: minsta värdet av matchande markandel × 100 och artens befintliga väderbetyg. Fyra profiler med viktiga dataluckor begränsas till 59. Detta är deklarerade experimentella regler, inte fyndsannolikhet eller fältvaliderad habitatlämplighet. Artkällor, klassurval och luckor finns i habitat-profiles.ts och /om#habitat. Väderhämtningen delas genom useWeather; fel och gamla dygn tar bort kombinerade betyg.

Verifierat: 23 tester passerar, lint passerar, typecheck och produktionsbygge passerar. Agent-browser visar karta och habitatlager utan page errors. Fördjupat browsertest pågår: listval fungerade, men testets klick på markörens spets träffade inte avsedd yta; utred klickkoordinat och rendering innan flödet anses slutverifierat. Testskript: npm run test:habitat-browser. Ingen databas- eller authändring gjord.

Användaren har bett att prioritera push till befintliga origin/main före ytterligare tester, så Vercel kan uppdateras. Git finns faktiskt och origin är https://github.com/friggees/svampatlas.git; äldre text om att Git saknas är fel. Vercels nya byggstatus är ännu inte kontrollerad.

Nästa steg: slutför browserkontrollen (alla arter, klick, zoom, mobil, väderfel/gamla dygn/återförsök), kontrollera Verceldeployment och uppdatera verifieringsstatus. Fältvalidering och ekologisk expertgranskning återstår.

# Överlämning till nästa chatt

**Senaste överlämning 2026-09-27: läs [NEXT-CHAT.md](NEXT-CHAT.md) först.** Den ersätter äldre uppgifter här om markunderlag, publicering och nästa uppgift. Användaren har själv publicerat till Vercel. NMD2023 v2.1 är hämtat och klippt till Botkyrkapiloten: 10 meters upplösning, 49 klasser, inga saknade pixlar i pilotmasken, integritetskontroller godkända. Filer och nästa arbetsordning finns i NEXT-CHAT.md. Kartans habitatintegration återstår till nästa chatt.

## AKTUELL IMPLEMENTATION, INKLUSIVE VÄDERANALYS – 2026-09-27

**Detta avsnitt ersätter ALL status i äldre avsnitt nedan. De äldre avsnitten är historik, inte aktuella instruktioner.**

Projektet finns i C:/Users/albin/dev/svampatlas. Appkod och databasschema ÄR implementerade. Supabase-projektet är cyyozcmhlewapesojvot i Minority/Stockholm. .env.local innehåller URL, publishable key och användarens secret key; skriv aldrig ut hemligheten. Skapa inte ett nytt projekt. WorkPal pausades på användarens begäran; senaste historiska status var PAUSING, ingen ny kontroll gjord.

### Vad som finns

- Next.js App Router, TypeScript, shadcn och Supabase Auth/RLS.
- Utforska (/), Mina platser (/sparat), Svampguiden (/arter), Mitt konto (/konto) och källor (/om).
- Privata sparade platser med koordinater, art, anteckningar och extern vägbeskrivning.
- MapLibre/OpenStreetMap-karta och pilotgräns från 20 SCB RegSO 2025-områden. Gränsen är inte habitatdata.
- Migration i supabase/migrations/20260927095815_initial_pilot.sql, redan implementerad mot valt projekt i tidigare session. Applicera inte blint igen.
- Reproducerbara SCB- och SMHI-provuttag i scripts/fetch-pilot.mjs och scripts/fetch-weather-sample.mjs. SMHI-prov från Tullinge med temperatur, luftfuktighet, regn och kvalitetsflaggor i data/weather.
- Aktiv preliminär väderanalys: src/features/exploration/climate-domain.ts, climate-profiles.ts, weather-panel.tsx och src/infrastructure/weather/. GET /api/weather hämtar DWD ICON via Open-Meteo för fem fasta referensområden. 14 avslutade svenska dygn, temperatur, regn, luftfuktighet och modellerad markfuktighet 3–9 cm. Ingen databasändring behövdes.
- Den äldre weather-domain.ts är en separat historisk prototyp med syntetiska tester; den används inte av den nya vyn.

### Senaste leverans: väderbaserad jämförelse

Användaren bad att bra temperatur och fuktförhållanden ska krävas för hög ranking. Klicka på **Utforska området**: områden sorteras efter ett preliminärt väderindex 0–100 för vald art. Artbyte räknar om betygen. Områdesval markerar referenspunkten på kartan; vald egen punkt använder närmaste referensområde med visat avstånd. Exakta egna koordinater skickas inte till väderleverantören.

Temperatur väger 35 %, regn 25 %, luftfuktighet 15 % och markfuktighet 25 %. Längsta temperaturstress, torrperiod (<1 mm/dygn) och frostdygn senaste veckan ger multiplikativa avdrag. Alla 14 dygn och fuktvärden krävs. Dagens/prognostiserade dygn utesluts, sommartid hanteras med UTC-tidsstämplar och svensk datumindelning. Gamla analysfönster döljs vid nytt dygn. Hämtfel ger felmeddelande med återförsök och inga gamla betyg.

**Artgrupper, numeriska intervall och vikter är öppet deklarerade pilotantaganden, inte vetenskapligt validerade artoptima.** Alla resultat märks Preliminär modell. Antaganden, dygnsvärden och avdrag går att öppna i gränssnittet. Forskningen stödjer väderfaktorer, inte våra numeriska gränser. Det är väderjämförelse, inte en validerad samlad habitat-/fyndranking. Markfuktigheten är modellerat vatteninnehåll, inte uppmätt tillgängligt vatten i lokal jord.

Leverantör: Open-Meteo / DWD ICON Seamless, CC BY 4.0, gratis-API för lokal icke-kommersiell pilot. Kommersiell drift behöver rätt avtal innan lansering. Anropen är serverbaserade, fem fasta områden i ett batchanrop, 15 sekunders timeout, timcache med datum i nyckeln. Ingen service key används. Referenser, integritet och metod finns på /om#vader och i projektplaner/11-vaderbaserad-ranking.md.

Senaste verifiering efter väderleveransen:

- npm test: **17 tester** passerar, inklusive dataluckor, gamla datum, framtidsläckage, 23/25-timmarsdygn, torrperiod, frost, temperaturstress och delad placering.
- npm run lint, npm run typecheck och npm run build passerar.
- Produktions-API: fem områden med 14 giltiga dygn till 2026-09-26. Tumba och Vårsta delar modellcell och får samma betyg.
- Browser: inloggning/sparning/radering, verklig väderranking, artbyte, referenspunkt på kartan, 14 dygn i tabellen, mobil utan overflow, simulerat 503-fel döljer betyg och återförsök återställer dem. Testkontot raderades. Inga page errors.
- Bildkontroll: artifacts/weather-desktop.png och artifacts/mobile.png. Produktionsservern kör på http://127.0.0.1:3001.

### Viktigt kvar

**Habitatbaserad ranking är ännu inte aktiverad. Väderjämförelsen är aktiv men experimentell.** Läs projektplaner/11-vaderbaserad-ranking.md för antaganden och kvarstående validering.

Nästa steg: verifierat habitatunderlag för Botkyrka, källstödda och granskade artprofiler, normalisering av väderdygn och kvalitetsflaggor, därefter förklarbar kombinerad ranking och validering. En väderstation ger inte trovärdiga småskaliga skillnader över kommunen. Produktionsdrift och kartleverantörens produktionsvillkor återstår. Ingen driftsättning eller Git-initiering är gjord.

### Återupptagningens ändringar och kontroller

Den gamla sessionen avbröts under slutkontroll utan att uppdatera denna fil. Återupptagningen hittade ett kartfel som sparflödestestet missade: MapLibres CSS överstyrde positioneringen och kartbehållaren fick höjd 0 trots lyckade nätverksanrop. Fixen använder `.map-container > .map-canvas` i src/app/app.css. Browsertestet kontrollerar nu synlig karthöjd på desktop och mobil. Lint undantar genererade MapLibre-filer, som kopieras från node_modules vid predev/prebuild.

Verifierat 2026-09-27 efter fixen:

- npm run lint: passerade utan varningar.
- npm test: 8 tester i 2 filer passerade (geografi/vädermodell).
- npm run build: passerade inklusive TypeScript.
- npm run test:browser mot produktionsbygget: inloggning → spara → omladdning → vägbeskrivning → radera; synlig kartbehållare desktop/mobil, ingen mobil overflow, artkatalog och inga page errors. Testkontot raderades.
- Bildkontroll av artifacts/resumed-fixed.png bekräftade synlig baskarta och pilotgränser.
- Tidigare sessionens integrationstest verifierade nekad anonym åtkomst, isolering mellan två konton och nekad ägarförfalskning/ägaröverföring. Ej omkört nu eftersom auth/databaskod inte ändrats.

### Köra lokalt

Port 3000 används av demo-intelligence. Svampatlas startades på http://127.0.0.1:3001. Processen kan behöva startas igen efter sessionsbyte.

```powershell
npm run build
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3001
```

För utveckling: `node scripts/copy-map-worker.mjs`, sedan `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3001`.

Browsertest: sätt `$env:TEST_BASE_URL = 'http://127.0.0.1:3001'` och kör `npm run test:browser`. Integrationstest: `npm run test:integration`. Testskripten använder tillfälliga konton i valt Supabase-projekt och tar bort dem i finally.

För nästa chatt: läs AGENTS.md, detta aktuella avsnitt, README.md och relevanta projektplaner. Fortsätt med habitatunderlag och validering av den nu inkopplade vädermodellen. En intern codex resume-process flyttar inte historiken till aktuell chatt.

---

## ARKIVERAD HISTORIK – INTE AKTUELL STATUS

## Aktuell status efter provisionering, 2026-09-27

Denna status ersätter äldre uppgifter om att projektval, kostnadsbekräftelse eller projektkapacitet återstår.

- Användaren godkände Minority, projektkostnaden 0 per månad och pausning av WorkPal.
- WorkPal (jjrexkrrzsajrwrumshr) har fått pausningskommandot accepterat; senaste kontroll visade PAUSING.
- Svampatlas är skapat i Minority (vxmccdongtdzkqvyakbb), region eu-north-1, med status ACTIVE_HEALTHY.
- Projekt-ID: cyyozcmhlewapesojvot.
- API-URL: https://cyyozcmhlewapesojvot.supabase.co
- Dashboard: https://supabase.com/dashboard/project/cyyozcmhlewapesojvot
- .env.local innehåller verifierad URL och aktiv modern publishable key. SUPABASE_SECRET_KEY lämnades för användaren att fylla i. Skriv aldrig ut filens hemliga innehåll.
- .gitignore undantar lokala miljöfiler; .env.example innehåller bara tomma variabler.
- Inget app-schema, migrationer eller appkod har skapats. Ingen SQL-åtkomst eller appanslutning har testats.
- Nästa steg: användaren fyller i secret key om den behövs för privilegierade serverjobb; fortsätt sedan Botkyrkas dataförstudie och appgrund mot detta projekt. Vanliga användaranrop ska använda publishable key med användarens session och RLS.
- Skapa inte ännu ett projekt och återuppta inte WorkPal utan användarens instruktion.


Senast uppdaterad: 2026-09-27. Detta dokument sammanfattar arbetskontexten; planerna i `projektplaner/` innehåller detaljerna. Ingen tidigare chatthistorik behövs för att fortsätta.

## Senaste uppdraget: skapa separat Supabase-projekt

Användaren har nu uttryckligen bett att skapa ett nytt projekt, hämta URL och anslutningsuppgifter och skapa lokal env-fil där användaren själv fyller i secret key. Använd `.env.local` (Next.js-konvention), inte det omvända filnamnet `.local.env` i användarens formulering.

`supabase_list_organizations` lyckades och visade organisationen **Minority**, ID `vxmccdongtdzkqvyakbb`. Användaren bekräftade Minority i uppföljningen (”Precis i minoritt”), som svar på projektförslaget med region `eu-north-1` (Stockholm). `get_cost` returnerade `amount: 0`, `recurrence: monthly`, `type: project`. Valuta angavs inte i svaret. Användaren bekräftade kostnaden med ”ja”. `confirm_cost` kördes och därefter `create_project` för `svampatlas`.

**Aktuellt hinder:** skapandet avvisades av Supabase med `BadRequestException`: organisationsmedlemmen `friggees` har nått gränsen två aktiva gratisprojekt. Supabase kräver att ett eller flera befintliga projekt pausas, tas bort eller uppgraderas. Inget nytt projekt skapades och inga befintliga projekt ändrades. Användaren behöver välja hur kapacitet ska frigöras; pausa eller uppgradera inte andra projekt på eget initiativ. Vid senaste projektlistningen var WorkPal (`jjrexkrrzsajrwrumshr`) och demointelligence (`nslfnuhdnrmshpjzpgke`) ACTIVE_HEALTHY; kontrollera aktuell status igen före eventuell användarauktoriserad åtgärd.

När kapacitet finns: återkontrollera att svampatlas inte redan skapats, använd bekräftad organisation/region, kontrollera kostnaden igen om förutsättningarna ändrats och skapa projektet. Hämta sedan status, URL och aktiv publishable key. Användaren har godkänt projektkostnaden 0 per månad, inte en betald uppgradering av andra projekt.

`.env.local`, `.env.example` och `.gitignore` är skapade. URL, publishable key och `SUPABASE_SECRET_KEY` är fortfarande tomma. Fyll i URL och aktiv publishable key när projektet är klart; lämna secret key till användaren. Bevara eventuella värden användaren hunnit lägga in. Inget Supabase-projekt har ännu skapats. Denna uppdatering har företräde framför äldre formuleringar om att bara planeringsdokument finns.

## Användarens mål

Bygg en användarvänlig svampapp med Next.js, Supabase som backend och shadcn-design. Hjälp användaren hitta lovande områden för vald svamp, spara egna bra områden och få vägbeskrivning. Stöd både vanliga matsvampar och arter för naturfotografi, uttryckligen flugsvamp och toppslätskivling. Användaren vill ha best practices och SoC, här tolkat som separation of concerns.

Första uppdraget var att planera och skapa en projektmapp. Uppföljningen valde Stockholmsregionen eller Botkyrka som mindre pilot och bad att all relevant kontext sparas inför en helt ny chatt. Botkyrka valdes inom det erbjudna alternativet. Implementationen har ännu inte påbörjats.

## Beslut och produktgränser

- Arbetsnamn Svampatlas, svenska och mobil webb först.
- Botkyrka kommun första pilot, Stockholmsregionen därefter.
- Next.js App Router, TypeScript, shadcn/ui, Supabase Auth/PostgreSQL/PostGIS.
- Modulär monolit med separata UI-, applikations-, domän- och infrastrukturlager.
- MapLibre föreslås; tile- och geokodningsleverantör är inte vald.
- Förklarbar regelbaserad habitatmodell först. Ingen påhittad procentuell fyndchans.
- Artkatalog, historiska fynd och modellstöd är olika saker. Ranking kräver validerat underlag per art.
- Privata sparade platser med RLS; extern navigation till tydligt vald startpunkt.
- Önskade arter behålls; ”flugsvamp” preciseras till namngivna arter, initialt röd flugsvamp. Toppslätskivling ingår för observation/fotografi.
- Fotouppladdning, projektmappar, delning och offlinekartor är föreslagna senare etapper.

## Vad som faktiskt finns

Projektrot: `C:\Users\albin\dev\svampatlas`.

README och tio plandokument beskriver produkt, UX, arkitektur, datamodell, habitatmodell, kvalitet/drift, backlog, beslut, källor och Botkyrkapilot. Dokumentens interna länkar har kontrollerats. Ingen appkod, package.json, installerade projektberoenden, databas, migration, hosting eller dataintegration är skapad. Inga app-/databastester är körda eftersom implementation saknas. Inget Git-repo har initierats för projektet av denna session.

## Supabase: senaste verifierade status

Första listningsförsöket gav transportfel mot connector-tjänsten. Nytt anrop till `supabase_list_projects` lyckades i uppföljningen: anslutningen kan läsa projektlistan. Användaren behöver inte återansluta på grund av det gamla felet.

11 befintliga projekt listades, samtliga under organisation-ID `vxmccdongtdzkqvyakbb`. Inget heter Svampatlas. Inget av dem är valt för denna app. Vi har inte läst deras tabeller, hämtat nycklar eller ändrat något. Skriv-/SQL-åtkomst är inte testad. Ett separat app-projekt rekommenderas för isolering.

Kvar före ny provisionering: verifiera organisationens namn och användarens avsedda organisation, tillgänglig plan/kapacitet, region och faktisk kostnad. Följ Supabase-verktygets krav på organisationsval och kostnadsbekräftelse. Ingen kostnad eller provisionering är redan godkänd genom denna överlämning. Lägg aldrig hemliga nycklar i dokumentationen.

## Vad användaren behöver göra

Ingen anslutningsåtgärd krävs nu. Vid nästa steg behöver användaren ange ett befintligt projekt som uttryckligen får användas, eller välja organisation för ett nytt separat projekt. Föreslaget namn är `svampatlas`; EU-region föreslås, men väljs först efter tillgänglighetskontroll. Agenten kan sköta tekniken genom pluginet. Användaren ska inte behöva klistra in hemliga API-nycklar i chatten.

## Nästa arbetsordning

1. Läs README, denna överlämning och pilotplanen, därefter relevanta detaljplaner.
2. Återkontrollera verktygsåtkomst och befintligt projektläge; återupprepa inte gamla anslutningsfel som aktuell status.
3. Fastställ appens Supabase-projekt/organisation när implementation ska börja. Fortsätt oberoende dataförstudie medan projektval saknas.
4. Verifiera officiell Botkyrkapolygon, SLU/SOS-taxonomi/observationer, NMD och SMHI: åtkomst, licenser, upplösning och små riktiga provuttag. Dokumentationssidor har granskats, men faktiska data-API:er har inte provats.
5. Gör reproducerbar habitatprototyp för en art, förslagsvis kantarell. Granska kvalitet innan större datainhämtning.
6. Implementera appgrund och första kompletta flödet: art → områdesförslag → privat sparning → vägbeskrivning.
7. Uppdatera denna fil med faktiska ändringar, tester, beslut och nästa steg innan överlämning.

## Öppna frågor och kvarstående osäkerheter

Supabase-projekt/organisation, budget, kartleverantör, API-villkor, officiell kommungeometri, artprofiler och habitatvikter. Slutlig artlista är inte godkänd; utgångsurval finns i produktplanen. Stockholmsregionens exakta avgränsning beslutas inför expansion. Insatsuppskattningen 27–44 persondagar är grov och exkluderar väntan och fältarbete.

## Text att klistra in i en ny chatt

> Fortsätt med Svampatlas i C:\Users\albin\dev\svampatlas. Läs först AGENTS.md, HANDOFF.md, README.md och projektplaner/10-pilot-botkyrka.md, sedan relevanta detaljplaner. Vi börjar med Botkyrka kommun och expanderar senare till Stockholmsregionen. Supabase-projektlistningen fungerade senast, men inget app-projekt är valt eller skapat. Fortsätt med dataförstudien och appens första genomgående flöde enligt planerna. Skilj verifierat läge från förslag och uppdatera överlämningen efter arbetet.


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

# Beslut, osäkerheter och integrationsstatus

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


## Arkitekturbeslut

| ID | Beslut | Skäl och konsekvens |
|---|---|---|
| ADR-001 | Next.js + Supabase + shadcn | Användarens teknikval; en sammanhållen webbapp med tydliga gränser |
| ADR-002 | Modulär monolit, SoC per lager och feature | Enklare drift och testbar domän; inga onödiga tjänstegränser |
| ADR-003 | PostGIS | Geografiska frågor görs nära data med spatiala index |
| ADR-004 | Regelbaserad habitatmodell först | Förklarbar och möjlig att granska med begränsat pilotunderlag |
| ADR-005 | Privata områden som standard | Svampställen ska inte oavsiktligt bli offentliga |
| ADR-006 | Extern navigation i MVP | Ger användaren fungerande vägbeskrivning utan egen ruttmotor |
| ADR-007 | MapLibre föreslås | Separat val av renderare och tileleverantör minskar beroenden |
| ADR-008 | Artkatalog skiljs från modellstöd | Alla önskade arter kan beskrivas utan att hitta på ranking |

## Antaganden och öppna beslut

Svenska är första språk, Sverige första geografiska område och mobil webb första plattform. Arbetsnamn Svampatlas. Botkyrka kommun är vald första pilot inom användarens erbjudna alternativ; Stockholmsregionen är nästa expansionssteg. Slutlig artlista, månadsbudget, Supabase-projekt och kartleverantör återstår att välja. Inget av detta hindrar dokumentationsleveransen.

Förslaget är Supabase Auth med e-postbaserad inloggning. Exakt metod och behov av e-postleverantör avgörs vid implementation; testa leveransbarhet och inte bara auth-koden. Fotoprojekt och delning ligger efter MVP tills pilotbehoven talar för annat.

## Riskregister

| Risk | Åtgärd | Beslutsgräns |
|---|---|---|
| Dålig ekologisk träffsäkerhet | Förstudie och fältpilot per art | Ingen procentuell chans eller godkänd ranking utan evidens |
| Otillräcklig data/licens | Verifiera små uttag och villkor först | Ingen import/publicering innan användningsrätt är klar |
| Rapporteringsbias | Separera observationslager och habitatmodell | Ingen automatisk träning på rå rapporttäthet |
| Privata koordinater läcker | RLS, cacheisolering, loggmaskning och negativa tester | Blockerar lansering |
| Dyr GIS-bearbetning | Pilotområde, förberäkning, mätning och kvoter | Ingen nationell körning före kostnads-/kapacitetstest |
| Missvisande navigation | Explicit startpunkt och separerad områdesgeometri | Ingen automatisk bilrutt till godtycklig polygonmitt |
| Oklart artbegrepp | Verifierade taxon-ID:n och alias | Ingen generisk ”flugsvamp”-modell |

## Faktisk verktygsstatus 2026-09-27

Supabase-pluginets verktyg är exponerade i sessionen. Första läsförsöket med `supabase_list_projects` misslyckades med transport-/HTTP-fel mot connector-tjänsten. Ett nytt försök i användarens uppföljning lyckades: projektlistan är läsbar. Den tidigare anslutningsblockeringen är därmed inte längre aktuell.

Listan innehöll 11 projekt i organisation `vxmccdongtdzkqvyakbb`. Inget hette Svampatlas. Inget projekt har valts för appen. Organisationens visningsnamn, plan, nya projektkostnader och tillgänglig kapacitet är inte kontrollerade. Läsbar projektlista bevisar inte skrivåtkomst, SQL-åtkomst eller att ett framtida app-projekt är konfigurerat. Återanvänd inte något befintligt projekt utan att först fastställa användarens avsedda projekt.

Inga nycklar hämtades, inga projekt skapades och inga migrationer kördes. Planeringsmappen är det enda skapade projektresultatet. Vid implementation: kontrollera aktuell läsåtkomst, verifiera projektidentitet och följ pluginets kostnads-/organisationskrav om ett nytt projekt behövs.

Officiella webbdokument för Next.js, Supabase, shadcn, MapLibre och tänkta svenska datakällor granskades för planen. Supabase changelog i markdown kunde inte hämtas via webbläsverktyget; HTML-sidan gick att läsa. Exakta paketversioner, API-kontrakt och ändringar kontrolleras igen vid byggstart.

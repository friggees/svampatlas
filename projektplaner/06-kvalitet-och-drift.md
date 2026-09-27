# Säkerhet, kvalitet och drift

## Privat som standard

Egna svampställen och GPS-positioner är privata. Ingen offentlig delning i MVP. Begär GPS vid aktiv handling och lagra inte löpande positionshistorik. Avlägsna exakta koordinater, tokens och privata anteckningar från loggar, analys och felrapporter. Kart- och navigeringsleverantörer kan få platsinformation; beskriv detta i integritetstexten.

Publik publishable key kan användas med korrekt RLS. Secret/service-role-nycklar hör endast hemma i skyddade server-/jobbmiljöer. Validera miljövariabler, separera dev/staging/produktion och kopiera aldrig produktionsdata till test av bekvämlighet. Auktorisering får inte bygga på användarredigerbar metadata.

## Kontroller inför lansering

Ägarkontroll på varje mutation; kvot och inmatningsgränser på geografiska frågor; parameteriserade databasfrågor; ingen rå HTML från externa artkällor. Inloggningsredirects begränsas till godkända URL:er. Fotofunktionen får storleks-/typgränser och EXIF-rensning när den införs.

Kontoradering spärrar användning omedelbart och återupptagbart raderingsjobb städar databas och filer. Hantera att befintliga access tokens kan leva vidare; känsliga operationer kontrollerar aktuell kontostatus/session. Retention, laglig grund, personuppgiftsbiträden och överföringar granskas inför lansering. EU-region är ett arkitekturval, inte i sig en garanti om regelefterlevnad.

Visa innehållsnära information: habitatbedömning är inte artbestämning eller besked om ätlighet. Vägbeskrivning är inte ett tillstånd att beträda en plats. Platsspecifika regler visas där tillförlitliga uppgifter finns; frånvaro av regellager tolkas inte som fri åtkomst.

## Teststrategi

| Nivå | Viktiga fall |
|---|---|
| Domäntester | Deterministisk ranking, saknade data, art utan modell, datum utanför prognos, geometri och koordinatordning |
| Databas/RLS | Anonym, användare A och B; B får inte läsa/ändra A:s plats, barnrader eller foton; ägarbyte och främmande area_id nekas |
| Integration | Riktig lokal Supabase, auth-callback, sessionsförnyelse, databasfel, paginerad import, idempotens och leverantörskontrakt |
| E2E | Välj art → sök → spara → logga ut/in → hitta sparat → öppna korrekt destination → registrera besök → radera |
| Tillgänglighet | Tangentbord, skärmläsare, fokus, kontrast, mobil, nekad GPS och användbart listalternativ |
| Last och data | Stort utsnitt begränsas, spatialt index används, API-timeout, cacheisolering och gammalt underlag |

Använd Vitest för domän, SQL/pgTAP eller motsvarande för RLS, Playwright för kärnflöden. Använd fixtures för deterministiska CI-körningar och separat schemalagt kontraktstest mot externa tjänster. Testa betydelsefulla risker, inte varje trivial UI-wrapper.

## Prestandamål

Föreslagna mål i definierad pilotmiljö: mobil LCP ≤ 2,5 s, INP ≤ 200 ms vid 75:e percentilen; cachad områdessökning p95 ≤ 1 s och okachad ≤ 3 s. Mät realistiskt mobilnät, datavolym och cachegrad. Första listresultatet ska kunna visas innan kartpaketet laddats. Begränsa geometristorlek och förenkla efter zoomnivå.

## Drift

CI: lint, typkontroll, domän-/integrationstester, migrations- och RLS-test, produktionsbygge samt E2E-kärnflöde. Allt körs mot isolerad testmiljö. Staging används före produktion; Vercel är föreslagen men inte provisionerad hosting.

Övervaka svarstider, felandel, importfördröjning, täckningsgrad, antal ”underlag saknas”, databaslast, kvoter och kostnad. Larma när uppdateringar passerat källspecifik maxålder. En trasig källa sänker synlig datakvalitet; senaste fungerande data märks med ålder.

Budget omfattar apphosting, databas/lagring/backup, karttiles, geokodning, jobb och eventuell e-post. Exakta priser hämtas vid leverantörsval. Fastställ månatlig budget och larmnivå innan betald provisionering.

Dokumentera återställning av både databas och filer; verifiera vald backupplans faktiska innehåll och genomför återställningstest. Föreslaget pilotmål RPO 24 h/RTO 8 h kräver verifierad backup och bemanning. Rollback av app/modell ska kunna ske separat från databasmigrationer. Publicera inte ny poängversion förrän valideringen passerat.

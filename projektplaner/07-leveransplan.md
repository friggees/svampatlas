# Leveransplan och backlog

Planera efter godkända resultat, inte en fast kalender. Insatsintervall nedan är grova persondagar för en erfaren utvecklare, exklusive väntan på dataåtkomst, specialistgranskning och fältbesök. Total första MVP uppskattas till 27–44 persondagar plus sådana beroenden.

| Etapp | Innehåll | Klart när | Insats |
|---|---|---|---|
| 0. Förstudie | Pilotregion, artprofil, källvillkor, små verkliga datauttag, Supabase-projektval | En art kan få reproducerbara, förklarade områdesförslag och datarättigheter är dokumenterade | 3–5 dagar |
| 1. Grund | Next.js, shadcn, Supabase lokalt/staging, auth, PostGIS, RLS, CI | Två konton är isolerade och migrationer reproducerbara | 4–6 dagar |
| 2. Vertikal leverans | Karta/lista, en art, habitat v0, spara område, extern vägbeskrivning | Hela kärnflödet fungerar med verkliga pilotdata | 7–10 dagar |
| 3. MVP-bredd | Artkatalog, fler godkända profiler, besök, redigering, export/radering, felstatus | Alla MVP-acceptanskriterier passerar | 7–11 dagar |
| 4. Pilot och härdning | Användartest, fältutvärdering, prestanda, tillgänglighet, restore-test | Kända begränsningar dokumenterade, kritiska fel lösta, drift verifierad | 6–12 dagar |

## Prioriterade arbetsuppgifter

| ID | Prioritet | Leverans och acceptans | Beroende |
|---|---|---|---|
| DATA-01 | P0 | Licens- och källregister med autentisering, kvot, attribution och provdata per källa | Pilotregion |
| DATA-02 | P0 | Granskad taxonomi och artprofil för första pilotarten | DATA-01 |
| DATA-03 | P0 | Idempotent import; avbruten körning återupptas utan dubbletter | DATA-01 |
| MODEL-01 | P0 | Ren versionerad habitatfunktion med förklaringar och explicit databortfall | DATA-02/03 |
| INFRA-01 | P0 | Reproducerbart repo, låsta beroenden, miljövalidering och CI | Projektval |
| DB-01 | P0 | PostGIS-schema, index, migrationer, typer och negativa RLS-tester | INFRA-01 |
| AUTH-01 | P0 | In-/utloggning, callback och fungerande sessionsförnyelse | DB-01 |
| UX-01 | P0 | Mobil prototyp; art → område → spara → navigation | Produktplan |
| MAP-01 | P0 | Karta/lista med attribution, avbrutna sökningar och tydliga fel | UX-01, DATA-01 |
| AREA-01 | P0 | Privata områden kan skapas, återläsas, uppdateras och raderas | DB-01, AUTH-01 |
| ROUTE-01 | P0 | Vald startpunkt blir rätt destination; mittpunkt blir inte automatisk entré | MAP-01 |
| VISIT-01 | P1 | Besök registrerar även inga fynd och sökinsats | AREA-01 |
| CATALOG-01 | P1 | Föreslaget arturval sökbart; modellstatus per art synlig | DATA-02 |
| PRIVACY-01 | P0 före pilot | Export och radering verifierade; inga koordinater i analys/loggar | AREA-01 |
| QA-01 | P0 före pilot | Kärnflöde E2E, RLS, tillgänglighet, last och återställning verifierade | Övriga MVP-poster |

## Definition of done

Funktionen uppfyller acceptans, har relevanta tester och hanterar tomt/laddning/fel. Ägarkontroll och datarättigheter är granskade. Typkontroll, lint och bygge passerar. Inga hemligheter finns i repo eller klient. Modellresultat har källa, version och tidsstämpel. Viktiga flöden verifieras på mobil. Driftdokumentation uppdateras när beteendet ändras.

## Startordning nästa arbetspass

1. Använd Botkyrka kommun som vald pilot och verifiera kommungräns och datatäckning enligt pilotplanen.
2. Supabase-projektlistning fungerar vid senaste kontroll. Identifiera rätt organisation/projekt för appen; inget projekt är valt ännu.
3. Verifiera leverantörsvillkor och hämta små datauttag för en pilotart.
4. Gör en reproducerbar habitatprototyp och granska om resultatet är användbart.
5. Skapa appgrunden och första kompletta användarflödet.

Ingen skarp databas ska väljas enbart därför att den råkar vara den första i projektlistan. Projekt, region och eventuella kostnader fastställs före provisionering.

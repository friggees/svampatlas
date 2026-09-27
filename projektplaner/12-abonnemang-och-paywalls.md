# Abonnemang, betalspärrar och gratis provanvändning

Status: **plan för senare implementation**. Ingen betalspärr, Stripe-integration, betalprodukt eller ny kvot aktiveras vid publiceringen 2026-09-27.

## Uppdrag

Användaren vill införa subscription/paywalls med gratis provanvändning som tillåter:

- Att spara **1 location/plats**.
- Att söka upp **2 områden**.
- Ett abonnemang för fortsatt användning över dessa gränser.

Pris, valuta, faktureringsperiod och betalplanens gränser är inte beslutade. Inga prisuppgifter eller automatisk debitering ska införas utan ett senare produktbeslut.

## Föreslagen tolkning av gratisnivån

Detta är ett konkret implementationsförslag; tolkningarna nedan behöver fastställas när arbetet börjar.

| Funktion | Gratis provanvändning | Abonnemang |
|---|---|---|
| Sparade platser | Högst 1 aktiv sparad plats | Högre gräns enligt beslutad plan |
| Områdesanalys | 2 unika upplåsta områden totalt per konto | Fler områden enligt beslutad plan |
| Samma upplåsta område igen | Tillåtet utan ny kvotförbrukning | Tillåtet |
| Byte av art inom upplåst område | Tillåtet utan ny områdeskvot | Tillåtet |
| Artkatalog, grundkarta och metod | Fritt tillgängliga | Fritt tillgängliga |
| Läsning/radering av egna befintliga platser | Alltid tillåtet | Alltid tillåtet |

Föreslå konto med verifierad e-post för gratis analys/sparning, utan betalkort. Detta är en användningsbegränsad provnivå, inte ett beslutat antal gratis dagar och inte ett Stripe-abonnemang med automatisk konvertering. Visa inte exempelvis ”14 dagar gratis” om det inte senare beslutas.

En aktiv plats innebär att den får redigeras och raderas. Radering frigör samma platsutrymme; det är inte en återställd områdeskvot. Om avsikten i stället är **en enda sparhändelse under kontots livstid**, byt till en separat livstidsräknare och dokumentera detta innan implementation.

En områdesupplåsning identifieras av ett stabilt områdes-ID, inte exakta koordinater, art, modellversion eller datum. Nytt dygn, utloggning, ominstallation och en annan enhet återställer inte de två områdena. Föreslaget: användaren kan fortsätta se aktuella bedömningar i sina två upplåsta områden. Väderhistorik måste ändå vara aktuell och giltig.

## Anpassning till dagens app

I dag lämnar `/api/weather` ut hela väderunderlaget för fem områden och klienten räknar alla betyg. Det är avsiktligt öppet i första publiceringen. **Det räcker inte att dölja tre kort i gränssnittet när paywall införs.** Allt skyddat underlag skulle fortfarande kunna läsas direkt i nätverkssvaret.

Senare ändring:

1. Visa offentliga områdesnamn, utbredning och en tydlig förhandsvisning utan skyddade analyser.
2. Låt användaren uttryckligen välja ”Lås upp analys för [område]”. Visa exempelvis ”1 av 2 gratis områden kvar”.
3. Servern verifierar Supabase-session, abonnemang och kvot. Inget skyddat väderunderlag eller betyg skickas före kontrollen.
4. Returnera bara tillåtna områden. Beräkna den skyddade analysen på servern, eller filtrera all rådata strikt innan den når klienten. Även alternativa endpoints måste följa samma åtkomstmodell.
5. Ett klick på Utforska får inte tyst förbruka fem områden genom dagens batchjämförelse. Artbyte, renderingar, automatisk uppdatering och retries får inte förbruka nya krediter.

Intern cache får fortfarande hämta alla offentliga väderceller effektivt. **Cache för rå väderdata är skild från användarens rätt att få ett visst resultat.** Dela inte personliga, kvotfiltrerade API-svar via publik CDN-cache.

## Arkitektur och separation of concerns

- `features/billing/domain`: plan, status och rättigheter som rena typer/regler.
- `features/entitlements`: `canSaveLocation`, `canUnlockArea` och återstående kvot.
- `infrastructure/billing`: Stripe-klient, servervalda produkter/priser, portal och webhookadapter.
- `infrastructure/repositories`: prenumerationsstatus, förbrukning och upplåsta områden i Supabase.
- UI-komponenter för kvotindikator, planval, paywall och kontostatus.
- Server Actions/Route Handlers som använder samma rättighetskontroll. Klientens plan, roll, pris eller räknare är aldrig auktoritativ.

Föreslå Stripe Checkout för abonnemang och Stripe Customer Portal för hantering. Använd aktuella officiella SDK/API-versioner vid implementation, inte en hårdkodad gammal version från detta dokument. Skapa inte Stripe-konto, produkt eller betalt integrationstillägg enbart på grund av planen.

## Föreslagen datamodell

Nya tabeller är förslag, inte befintligt schema:

- `billing_customers`: unik `user_id` och unik `stripe_customer_id`.
- `subscriptions`: leverantörens abonnemangs-ID, ägare, tillåtet price-ID, status, aktuell åtkomstperiod, avslut vid periodslut och senaste synkronisering.
- `account_entitlements`: plan och åtkomstgränser härledda på servern, aldrig skrivbara av vanlig klient.
- `trial_area_unlocks`: unik kombination `(user_id, area_id)` och tidpunkt; två kostnadsfria upplåsningar totalt. Behåll trialbokföringen vid uppgradering/nedgradering.
- `usage_reservations`: idempotent operations-ID, ägare, område och `reserved/completed/released`, med utgångstid för fastnade reservationer.
- `billing_events`: unikt Stripe event-ID, typ, behandlingstillstånd och tid för idempotent webhookhantering. Lagra endast det som behövs, inte kompletta betaldata slentrianmässigt.

RLS ska skydda användarrader och alla exponerade tabeller. Vanliga konton får inte tilldela premium, ändra kvoter eller skriva webhookstatus. Använd befintligt Supabase-projekt, migrera versionshanterat och testa användarisolering. Bevara privata platskoordinater.

### Atomära kvoter

Kvotkontroll och platsinläggning måste ske i samma databastransaktion med låsning per användare. `count → insert` i två separata anrop är inte tillräckligt: två flikar kan annars spara två platser samtidigt. Direktanrop till Supabase REST får inte kringgå begränsningen. Använd en kontrollerad databasoperation/trigger och begränsade grants, med explicit ägarskap och RLS. Eventuella privilegierade funktioner placeras utanför exponerat schema och granskas separat.

Områdesanalys: reservera kvot atomärt, hämta/validera underlag, slutför upplåsning först när användbart resultat finns. Fel, timeout, datalucka eller avbruten operation ska inte permanent förbruka provutrymmet. Unik ägare/område och idempotensnyckel ska hindra dubbeldebitering. Återställ förfallna reservationer efter krasch. Parallella olika områden får aldrig överstiga återstående kvot, inklusive reservationer.

Betalda områdesupplåsningar ska inte förbruka gratislivstidskvoten. När betalåtkomst upphör tillämpas den tidigare gratisnivån; kvoten nollställs inte.

## Betalflöde och livscykel

1. Inloggad användare väljer en serverdefinierad plan. Servern skapar Checkout Session med kundkoppling och idempotensnyckel; klienten får inte ange godtyckligt pris.
2. Stripe hanterar betaluppgifter. Appen lagrar inga kortuppgifter.
3. Signerad webhook är auktoritativ för abonnemangsstatus. En success-URL får aldrig ensam aktivera premium.
4. Verifiera signaturen mot den råa request-body:n och webhookhemligheten. Hantera dubbletter, retries och händelser som anländer i fel ordning; hämta aktuell prenumeration när det behövs.
5. Aktivering, förnyelse, uppsägning, misslyckad betalning och återaktivering uppdaterar rättigheter. Separera test- och livemiljö.
6. Periodisk avstämning reparerar missade webhookleveranser. Åtkomst får inte leva för evigt från en gammal `active`-flagga när den betalda perioden löpt ut.

| Tillstånd | Föreslaget beteende |
|---|---|
| Gratis konto | 1 aktiv plats, 2 totalt upplåsta områden |
| Betalt och aktivt inom betald period | Betalplanens gränser |
| Uppsagt med återstående betald tid | Betalåtkomst till periodslut |
| `past_due` | Visa betalningsproblem; eventuell respit måste uttryckligen beslutas |
| `unpaid`, `incomplete_expired` eller avslutat efter periodslut | Gratisnivå, inga nya premiumåtgärder |
| Betalstatus okänd eller osynkroniserad | Skydda betalda funktioner tills status verifierats, bevara läsning av egna data |

Radera aldrig användarens platser vid nedgradering. Har kontot fler än en plats kvar visas de fortfarande, inklusive export/radering enligt produktbeslut, men nya sparningar blockeras tills kontot ryms inom gränsen eller åter uppgraderar. Upplåst analys under betalt medlemskap är inte automatiskt en evig gratisrätt.

## Paywall och användarupplevelse

- Visa kvot innan åtgärden och förstärk den när användaren närmar sig gränsen.
- Vid andra aktiva sparade platsen: förklara ”Gratisnivån rymmer en sparad plats”, behåll formulärets inmatning och erbjud planval eller hantering av befintlig plats.
- Vid tredje unika gratisområdet: visa planval innan analysen hämtas. Backa utan att förlora kartläge eller vald art.
- Visa faktiska rättigheter från servern efter inloggning, köp, återkomst från kundportal och i annan flik/enhet.
- Ingen automatisk debitering enbart för att kvoten tar slut. Användaren initierar ett tydligt köp med pris och period innan betalning.
- Betalspärr är inte samma sak som saknade väderdata eller ett dåligt väderbetyg; skilj meddelandena åt.

## Test- och acceptanskrav

1. Ett nytt gratis konto kan ha en aktiv plats; andra samtidiga sparningen nekas även med parallella requests/direktanrop.
2. Två unika områden går att låsa upp. Tredje nekas server-side utan att rådata läcker ut.
3. Samma område, annan art, cacheträff, reload eller retry förbrukar inte extra kvot.
4. Ogiltigt område, extern timeout, saknade väderdata och avbrutet flöde lämnar ingen permanent förbrukning.
5. Konto A kan varken läsa eller ändra konto B:s platser, kvot, upplåsningar eller betalstatus.
6. Falsk success-URL, manipulerat price-ID och osignerad webhook ger aldrig premium.
7. Dubbla/omkastade webhooks och förnyelser är idempotenta. Avslut och periodslut stoppar betalda åtgärder korrekt.
8. Uppgradering låser upp beslutad plan; nedgradering bevarar sparade data och tidigare gratisförbrukning.
9. Paywall fungerar med tangentbord och på mobil och bevarar påbörjad inmatning.
10. Feature flag av återställer nuvarande produktbeteende utan att radera betal-/kvotdata. Flaggan kontrolleras på servern.

## Genomförandeordning

1. Fastställ kvottolkning, planens pris/gränser, faktureringsperiod, eventuellt prövotidsantal dagar och regler vid nedgradering.
2. Ordna kommersiella rättigheter för väder-/kartleverantörer före betald lansering. Nuvarande Open-Meteo gratis-API avser icke-kommersiell användning.
3. Implementera tabeller, migrationer, RLS, atomära kvoter och tester bakom avslagen serverflagga.
4. Flytta skyddad områdesanalys till servergränsen och stäng vägar runt kvoten, inklusive dagens öppna `/api/weather`.
5. Implementera Checkout, Portal, webhook och avstämning i Stripe testläge.
6. Bygg kvotindikator/paywall och verifiera hela flödet med flera konton och enheter.
7. Granska prisinformation, abonnemangsvillkor, integritet, avbeställning och aktuella tillämpliga krav inför lansering.
8. Aktivera först efter separat beslut om betalprodukt och pris. Definiera hur befintliga pilotkonton behandlas; sätt inte oförklarat nya kvoter på deras redan sparade data.

## Referenser att återkontrollera vid implementation

- [Stripe: prenumerationer och webhooks](https://docs.stripe.com/billing/subscriptions/webhooks)
- [Stripe: Checkout för abonnemang](https://docs.stripe.com/payments/checkout/build-subscriptions)
- [Stripe: Customer Portal](https://docs.stripe.com/customer-management)
- [Supabase: RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Open-Meteo: API-villkor](https://open-meteo.com/en/terms)

Detta dokument är en implementationplan, inte ett beslut om pris, köp eller aktivering av paywalls.

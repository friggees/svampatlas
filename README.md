# Svampatlas

Projektplan för en svensk svamp- och fotoapp med Next.js, Supabase och shadcn/ui.

Status: karta, artkatalog, Supabase-inloggning, privata sparade platser och preliminär väderbaserad områdesjämförelse fungerar. Välj art och klicka på **Utforska området** för att analysera 14 dygns temperatur, regn, luft- och markfuktighet för fem områden i Botkyrka. Längre temperaturstress, torka och frost sänker betyget. Artprofilernas intervall är deklarerade pilotantaganden; habitat och fyndchans är ännu inte bedömda. Ingen driftsättning är gjord. Se HANDOFF.md för tester och nästa steg.

## Starta lokalt

Behåll befintlig `.env.local`. Kör `npm ci` om beroenden saknas, sedan `npm run build` och `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3001`. Öppna http://127.0.0.1:3001.

Kontroller: `npm run lint`, `npm test`, `npm run build`. Integrationstest och browsertest beskrivs i HANDOFF.md.

## Läsordning

**Ny chatt: börja med [överlämningen](HANDOFF.md).** Där finns senaste beslut, verifierad anslutningsstatus och nästa steg.

1. [Produkt och omfattning](projektplaner/01-produkt.md)
2. [Användarflöden och design](projektplaner/02-design.md)
3. [Arkitektur och separation of concerns](projektplaner/03-arkitektur.md)
4. [Datamodell och åtkomst](projektplaner/04-datamodell.md)
5. [Datakällor och habitatmodell](projektplaner/05-data-och-habitat.md)
6. [Säkerhet, kvalitet och drift](projektplaner/06-kvalitet-och-drift.md)
7. [Leveransplan och backlog](projektplaner/07-leveransplan.md)
8. [Beslut, osäkerheter och integrationsstatus](projektplaner/08-beslut.md)
9. [Källor](projektplaner/09-kallor.md)
10. [Botkyrkapilot](projektplaner/10-pilot-botkyrka.md)
11. [Väderbaserad ranking](projektplaner/11-vaderbaserad-ranking.md)
12. [Framtida abonnemang, paywalls och gratis provanvändning](projektplaner/12-abonnemang-och-paywalls.md)

## Rekommenderad första leverans

En användare väljer art och sökområde, får förklarade habitatförslag, sparar ett privat område och öppnar vägbeskrivning till en vald startpunkt. Botkyrka kommun är första pilot, med Stockholmsregionen som nästa expansionssteg. Se [pilotavgränsningen](projektplaner/10-pilot-botkyrka.md).

Största osäkerheten är kvaliteten på habitatbedömningen, inte kartgränssnittet. Därför kommer en dataprotyp före full produktutveckling. Alla arter kan finnas i katalogen, men områdesrankning aktiveras bara där artprofil och data har validerats.

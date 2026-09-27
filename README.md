# Svampatlas

Projektplan för en svensk svamp- och fotoapp med Next.js, Supabase och shadcn/ui.

Status: karta, artkatalog, Supabase-inloggning och privata sparade platser fungerar. **Utforska området** visar nu experimentella artberoende habitatytor från NMD2023 v2.1 tillsammans med 14 dygns väder. Alla tio arter har källstödda ekologiska beskrivningar och öppet deklarerade, ännu inte fältvaliderade markprofiler. Kartan och listan delar bedömning och väderdata; inga procentuella fyndchanser visas. Se NEXT-CHAT.md för verifieringsstatus och kvarvarande arbete.

## Starta lokalt

Behåll befintlig `.env.local`. Kör `npm ci` om beroenden saknas, sedan `npm run build` och `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3001`. Öppna http://127.0.0.1:3001.

Kontroller: `npm run lint`, `npm test`, `npm run build`. Integrationstest och browsertest beskrivs i HANDOFF.md.

## Läsordning

**Ny chatt: börja med [senaste överlämningen](NEXT-CHAT.md).** Där finns senaste beslut, markunderlag, publiceringsstatus och nästa steg. Äldre verifieringshistorik finns i [HANDOFF.md](HANDOFF.md).

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

## Habitatunderlag

Webbdata finns i `public/data/botkyrka-habitat.json`. Återskapa med `python scripts/build-habitat.py` efter rasterhämtningen enligt NEXT-CHAT.md. Ingen Python eller nationell rasterfil behövs vid Vercelbygge. Kör `npm run test:habitat-browser` mot lokal produktionsserver för det nya kartflödet.

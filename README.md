# Svampatlas

Projektplan för en svensk svamp- och fotoapp med Next.js, Supabase och shadcn/ui.

Status: **hela Stockholms län är publicerat** med filtrerat markunderlag för tio arter, kommunval, satellit och privata sparade platser. Svampguiden har tre licensierade fotografier och tre kännetecken per art. Länskartan visar experimentellt markstöd, inte fyndsannolikhet. Botkyrkas väderfördjupning finns kvar på `/botkyrka`. Se [NEXT-CHAT.md](NEXT-CHAT.md) för källor, verifiering och begränsningar.

Produktion: https://svampatlas.vercel.app

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

## Fas 1: platsfilter och satellit

Kartlagda skötta/tätbebyggda miljöer filtreras bort från både ytor och markstöd. Byt till **Satellit** och dölj habitatytorna för en ren Sentinel-2-bild (2024–2025, 10 m/pixel). EOX-tjänsten gäller icke-kommersiell pilot; kommersiell användning kräver licens. Filtrerade data delas under ODbL, original-NMD är CC0.

Reproduktion: `python scripts/fetch-exclusions.py`, sedan `python scripts/build-habitat.py`. Kontroll: `python scripts/verify-habitat-filter.py`. Se [fas 1 och gränsen till fas 2](projektplaner/13-fas1-platsfilter-satellit.md). Länsutökningen är genomförd och verifierad enligt [länsplanen](projektplaner/14-stockholms-lan.md).

## Stockholms län och bildguide

Alla 26 kommuner ingår. 60 795 kartlagda anläggnings-/skötselobjekt används i filtret. Extra närhetsbuffertar begränsas till tätorter, så naturmark omkring landsbygdens anläggningar kan finnas kvar. OSM är ofullständigt och verklig klippfrekvens är okänd. Fältvalidering av artprofiler återstår.

Länets 474 statiska MVT-filer ligger i `public/data/stockholm/`. Reproduktion: `fetch-stockholm.py`, `build-stockholm.py`, `build-stockholm-tiles.py`. Kontroll: `npm run test:stockholm-data` och `npm run test:stockholm-browser`. Rådata/raster är lokala och ignorerade; Vercel behöver inte Python.

Fotografierna ligger i `public/images/species/`. `SOURCES.json` anger fotograf, originalkälla, licens, nedladdningsadress och SHA-256 för varje bild. Kännetecknen har separata artkällor. Kontroll: `npm run test:guide-browser`. Bildguiden ersätter inte säker artbestämning.

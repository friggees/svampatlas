# Svampatlas

Projektplan för en svensk svamp- och fotoapp med Next.js, Supabase och shadcn/ui.

Status: **hela Stockholms län är publicerat** med filtrerat markunderlag för tio arter, kommunval, satellit och privata sparade platser. Svampguiden har tre licensierade fotografier och tre kännetecken per art. Länskartan visar experimentellt markstöd, inte fyndsannolikhet. Botkyrkas väderfördjupning finns kvar på `/botkyrka`. Se [NEXT-CHAT.md](NEXT-CHAT.md) för källor, verifiering och begränsningar.

Produktion: https://svampatlas.vercel.app

## Startsida och registrering

`/` presenterar tjänsten. Kartan finns på `/utforska`; `/konto?mode=signup` öppnar registrering och `/konto` inloggning. Efter inloggning öppnas kartan. Bekräftelse sker på `/auth/confirm`, som verifierar e-posttoken och skapar en cookie-session även på en annan enhet. Ogiltiga eller förbrukade länkar leder till kontosidan med möjlighet att begära nytt mejl.

Produktionsadress för mejl är `https://svampatlas.vercel.app`. `NEXT_PUBLIC_SITE_URL` kan ange annan tillåten adress för explicita testmiljöer. Supabases Site URL är uppdaterad till produktion. Standardmallen används tills egen SMTP finns; `/auth/callback` hanterar även dess äldre fragmentbaserade sessioner. PKCE-länkar öppnade i en annan webbläsare kan bekräfta adressen men sakna verifieringscookie; användaren får då logga in med sitt lösenord. Ändra både Site URL och tillåtna adresser vid domänbyte.

Supabase-konfiguration: `supabase/config.toml`, förberedd e-postmall: `supabase/templates/confirmation.html`. Efter att callback-routen publicerats kan `node scripts/configure-auth.mjs --apply` uppdatera och återläsa Site URL och tillåtna returadresser via Management API. Kräver `SUPABASE_ACCESS_TOKEN` i processmiljön; spara aldrig token i Git. Utan `--apply` visas bara vilka fält som behöver ändras. När SMTP konfigurerats kan `--with-template --apply` även aktivera den svenska token_hash-mallen för automatisk inloggning mellan enheter. Supabase avvisade malländringen med HTTP 400: gratisplanens standardleverantör tillåter inte malländringar. CLI `config push` hanterar inte mallinnehållet i den installerade versionen.

**E-postleverans:** egen SMTP saknas vid kontroll 2026-09-28. Supabases standardutskick är begränsat till projektteamets adresser. Publik registrering kräver en ansluten e-postleverantör och verifierad avsändare. Behåll e-postbekräftelse aktiverad. [Supabases SMTP-dokumentation](https://supabase.com/docs/guides/auth/auth-smtp).

`npm run test:auth-browser` testar startsida, registreringsformulär, verklig engångstoken, bekräftelse utan tidigare cookies, session, in-/utloggning, felaktiga länkar och mobilbredder 390/320 px mot lokal produktionsserver på port 3001. `TEST_BASE_URL` väljer publicerad miljö. Tillfälliga konton raderas i testets `finally`. Mejlleverans till en inkorg ingår inte; testlänken skapas med admin-API utan utskick.

## Förbered domänbyte

`node scripts/configure-auth.mjs --preview --site-url https://DIN-DOMAN` visar föreslagen Supabase-konfiguration utan nätverksanrop eller token. Ange den faktiska domänen när den är vald. Utan `--preview` läser skriptet aktuell konfiguration och visar vilka fält som skulle ändras; endast `--apply` skriver ändringar. `--with-template --apply` kräver att egen SMTP redan är konfigurerad.

Vid domänbytet ska även `NEXT_PUBLIC_SITE_URL` i driftsmiljön och adresserna i `supabase/config.toml` uppdateras. Publicera appen med rätt adress före authändringen. Skriptet behåller Vercel-adressens och lokala testmiljöers bekräftelserutter under övergången. Domän, DNS och SMTP konfigureras separat.

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

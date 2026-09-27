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

# Fortsätt Svampatlas – 2026-09-27

Detta är den senaste överlämningen och har företräde framför äldre status i HANDOFF.md.

## Uppdraget och var vi stannade

Projekt: `C:/Users/albin/dev/svampatlas`. Läs AGENTS.md, detta dokument och README.md först.

Användaren vill att kartan markerar de mest lovande områdena för **var och en av de tio arterna i katalogen**, med både markmiljö och väder i bedömningen. Senaste deluppdraget var att hämta markunderlag. Användaren bad därefter att avsluta detta steg och lämna över inför en ny chatt. Kartans habitatlager är alltså **nästa uppgift**, inte en redan levererad funktion.

Användaren har själv publicerat till Vercel och uppger att public keys behövde läggas i frontend för att undvika internal server error. Den publicerade versionen, dess URL och eventuella skillnader mot denna lokala kod har inte verifierats. Bevara användarens ändringar. Gör inte om provisionering eller publicering utifrån äldre formuleringar om att appen inte är publicerad. Ingen driftsättning har gjorts av denna agent.

## Markunderlaget

**Slutkontroll klar:** filen är hämtad, ZIP CRC32 verifierad och Botkyrka-utdraget skapat. EPSG:3006, 10 × 10 meter, 49 markklasser och 2 234 266 giltiga pixlar (223,4266 km² inklusive vatten). Inga nodata-pixlar innanför pilotens pixelmask. Samtliga förekommande koder finns i den officiella legenden. Det klippta rastrets SHA256 har återkontrollerats; omkörning från cachad nationell TIFF gav identiskt raster. Dessa kontroller avser datatäckning/integritet, inte klassificeringens ekologiska träffsäkerhet.

- Källa: **NMD2023 v2.1, Naturvårdsverket**, CC0, nationellt kategoriskt marktäckeraster. Det är marktäcke, inte en jordarts-/pH-karta och inte observerade svampfynd.
- Officiellt arkiv: https://geodata.naturvardsverket.se/nedladdning/marktacke/NMD2023/Basskikt_v2_x/NMD2023_basskikt_v2_1.zip
- Produktbeskrivning: https://geodata.naturvardsverket.se/nedladdning/marktacke/NMD2023/Basskikt_v2_x/NMD2023_Produktbeskrivning_Basskikt_NMD2023_v2_x.pdf
- Reproducerbart skript: `scripts/fetch-landcover.py`. Pythonberoenden: `scripts/requirements-landcover.txt`. Installera vid behov med `python -m pip install -r scripts/requirements-landcover.txt`, kör sedan `python scripts/fetch-landcover.py`.
- Skriptet hämtar TIFF-medlemmen med HTTP Range ur ZIP, verifierar ZIP CRC32 vid första hämtningen, sparar officiell QGIS-legend/XML/klasstabell och klipper raster mot de 20 befintliga SCB RegSO-polygonerna i `public/data/botkyrka-regso.geojson`.
- Resultat: `data/landcover/botkyrka-nmd2023-v2.1.tif` och `data/landcover/metadata.json`. Metadata innehåller koordinatsystem, upplösning, klassantal, SHA256 och källhänvisning. Kontrollera dessa filer innan integration.
- Nationell mellanfil: `data/landcover/NMD2023bas_v2_1.tif` (cirka 10,9 GB). Behåll för omklippning; den ska inte skickas till Vercel. Hela `data/landcover/` undantas från Git och Vercel. Webbanpassade härledda filer ska senare läggas i `public/data/`.
- Klassnamn och färger finns i `data/landcover/NMD2023bas_v2_1.qml`. **Använd v2.1:s faktiska koder**, inte en gammal NMD2018-tabell: nya öppna markklasser har andra underindelningar. Skog 111–118 på fastmark, 121–128 på våtmark; vatten 61/62; bebyggelse 51–54.
- Pilotgränsen är en sammansättning av SCB-områden, inte ett separat verifierat kommungränsuttag. Rasterklipp använder pixelcentrum, utsida blir nodata 0.

## Vad som redan fungerar

- Next.js 16.3.6, React, TypeScript, MapLibre, Supabase Auth och privata sparade platser med RLS.
- Karta, artlista, inloggning, spara/radera platser och extern vägbeskrivning.
- Artkatalog: kantarell, trattkantarell, svart trumpetsvamp, stensopp, blek taggsvamp, rödgul trumpetsvamp, smörsopp, fårticka, röd flugsvamp och toppslätskivling. De sista arterna ingår även för naturfotografi.
- Preliminär väderjämförelse via `GET /api/weather`: Open-Meteo/DWD ICON, fem referensområden, 14 avslutade svenska dygn med temperatur, regn, luftfuktighet och modellerad markfuktighet. Temperaturstress, torka och frost ger avdrag. Saknade/gamla data ger inga betyg.
- Numeriska artintervall och vikter är tydligt deklarerade pilotantaganden, inte validerade artoptima eller procentuell fyndchans. Närliggande orter kan dela vädermodellcell.
- Kartans tidigare nollhöjd är fixad i `src/app/app.css`. Bevara `.map-container > .map-canvas` och worker-kopieringen i predev/prebuild.

## Nästa konkreta uppgift

1. Verifiera lokalt klippt raster och dess klassfördelning. Skapa små geografiska analysytor eller habitatpolygoner med verkliga klassandelar och källmetadata. Uteslut vatten/bebyggelse från lovande svampytor; hantera nodata synligt. Undvik att färga hela orter som om vädret vore ett lokalt habitatmått.
2. Ta fram källstödda habitatprofiler för samtliga tio arter. Märk antaganden och dataluckor; marktäcke bevisar inte värdträd, kalkhalt, beteshävd eller svampfynd. Använd inte påhittade exakta sannolikheter.
3. Kombinera markstöd och befintlig vädermodell så olämplig mark eller dåligt klimat inte får hög ranking. Visa förklaringar och källdatum. Behåll tydlig experimentell märkning.
4. Koppla färgade ytor till artvalet i MapLibre. Klick ska välja yta och visa varför den rankas. Markera de bästa ytorna för vald art och låt samma bedömning styra kartan och listan.
5. Flytta väderhämtning från `weather-panel.tsx` till gemensam hook/Explorer-state, så karta och panel delar resultat och rensar gamla betyg samtidigt vid fel/nytt dygn. Artbyte ska räkna om utan att starta om kartan eller tappa zoom.
6. Verifiera alla tio arter, vatten/nodata, byte av art, klick, väderfel/återförsök och mobil. Kör relevanta tester, lint, typecheck/build och browserkontroll. Uppdatera `/om`, README och överlämningen med faktiskt levererat läge.
7. Verifiera vilket Vercel-projekt och vilken kod användaren publicerat innan en eventuell senare deployment. Inga nya projekt eller databasändringar behövs för rastersteget.

## Filer att börja i

- `src/features/exploration/map.tsx`: just nu endast pilotpolygoner och vald punkt; inga habitatytor.
- `src/features/exploration/explorer.tsx`: artval, sökknapp, punkt och spara-formulär.
- `src/features/exploration/weather-panel.tsx`: äger idag fetch/retry/stale-state och väderranking.
- `src/features/exploration/climate-domain.ts`, `climate-profiles.ts`, `climate-contract.ts`: modell och fem väderreferenspunkter.
- `src/infrastructure/weather/open-meteo.ts`, `normalize.ts`: API-hämtning och dygnsnormalisering.
- `src/features/species/catalog.ts`: alla tio arter.
- `src/app/page.tsx`: läser pilotgeometri/metadata och skickar till Explorer.
- `tests/climate.test.ts`, `tests/domain.test.ts`, `scripts/verify-browser.mjs`: uppdatera vid kartintegration; browserkontrollen förväntar ännu den äldre habitat-placeholdern.

## Kontroller, drift och avgränsningar

Senaste **appverifiering före markhämtningen**: 17 tester, lint, typecheck och build passerade. Browser verifierade inloggning/spara/radera, väder, artbyte, 14-dygnstabell, 503/återförsök, synlig karta och mobil utan overflow. Dessa resultat bevisar inte den ännu oimplementerade habitatfunktionen. Marksteget ändrar inga appkomponenter.

Port 3000 används av ett annat projekt. Svampatlas har körts på 127.0.0.1:3001; kontrollera processen i ny chatt. Bygg med `npm run build`, starta med `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3001`. Browsertest: `$env:TEST_BASE_URL = 'http://127.0.0.1:3001'` och `npm run test:browser`.

Behåll `.env.local` och skriv aldrig ut secret key. Supabase-projekt: `cyyozcmhlewapesojvot` i Minority. Migrationen är redan applicerad; kör inte om blint. Projektet saknar lokalt initierat Git-repo enligt senaste kontroll.

Plan för framtida abonnemang/paywalls finns i `projektplaner/12-abonnemang-och-paywalls.md`: gratis spara 1 plats och söka 2 områden. **Inte implementerat och ska inte implementeras i nästa kartuppgift.** Öppet väder-API måste senare inkluderas i serverbaserad kvotkontroll. Betalningsnivåer och exakta kvotregler återstår.

## Starttext för ny chatt

> Fortsätt Svampatlas i C:/Users/albin/dev/svampatlas. Läs AGENTS.md och NEXT-CHAT.md först; den senare har senaste status. Markunderlaget har förberetts från NMD2023 v2.1. Nästa uppgift är att använda det tillsammans med vädermodellen och markera de mest lovande kartytorna för var och en av katalogens tio arter. Användaren har själv publicerat appen; bevara dennes ändringar. Subscription är endast planerad i separat dokument.

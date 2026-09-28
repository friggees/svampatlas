# Stockholms län – beställt 2026-09-27

Användaren godkände uttryckligen hela Stockholms län efter godkänd fas 1. Länsuppdateringen ska pushas och verifieras i Vercel så att den kan användas från mobilen. Därefter ska Svampguiden få tre återanvändbara bilder per art och korta kännetecken, följt av ytterligare push/publiceringskontroll.

## Underlag och avgränsning

- SCB RegSO 2025, kommunkoder 01xx: 524 delområden i samtliga 26 kommuner. Sammanfogad länsgräns, inklusive skärgård och havsområde.
- SCB tätorter 2023 i och omkring länet: 229 geometrier. Används för extra närhetsbuffertar, inte som ett generellt förbud mot skog i tätort.
- NMD2023 v2.1, CC0: nationellt raster återanvänds. Länsutdrag har 168 154 037 pixlar inom gränsen; fem saknar klassvärde och lämnas saknade. Raster läses i minnesbegränsade block.
- OSM-uttag per kommun, inklusive marginal utanför gränsen, samma historiska tidpunkt i samtliga anrop. Kommunernas överlapp dedupliceras på objekttyp och OSM-id. Inga privata koordinater används.

## Platsfilter

Kartlagda parker, trädgårdar, landuse=grass, skolor, bostäder, handel, stationer, idrott, parkering och övriga definierade skötta/bebyggda anläggningar undantas. Naturlig gräsmark, betesmark och grästäckning i sig betyder inte att en yta är klippt; landcover=grass hämtas som kontext men används inte ensamt som undantag.

Anläggningens kartlagda polygon undantas överallt. Extra kategoribaserad buffert används endast där den överlappar SCB:s tätortspolygoner. En skola eller station på landsbygden utesluter därför inte automatiskt naturmark 100 meter bort. Punkt- och linjeobjekt har en deklarerad proxyzon på högst 15 meter även på landsbygden. Naturmark utanför själva anläggningen kan finnas kvar. Alla berörda 10-meterspixlar rasteriseras bort med all_touched.

OSM är ofullständigt, verklig klippfrekvens och besökstryck är okända, och tätort 2023 är en produktregel snarare än ekologisk gräns. Alla artprofiler är fortfarande experimentella.

## Kartleverans

Separat trebandsraster: kvarvarande markklass, bitmask för tio arter och undantagsmask. Artklasser exporteras direkt från appens TypeScript-profiler, utan en separat manuellt duplicerad artlista.

Statiska MVT-karttiles laddas endast för synligt kartutsnitt. Källzoom 11 bevarar ursprungliga 10-metersytor; zoom 7–10 använder homogena block om 160–20 meter. Om ett block innehåller blandade klasser eller en bortfiltrerad pixel utelämnas det i översikten. MVT-koordinater kvantiseras med extent 32768.

Länskartan visar markstöd utan väderbetyg. Botkyrkas fem väderpunkter får inte extrapoleras till länet. Den befintliga fördjupningen med ranking och väder finns kvar på `/botkyrka`. Sparade platser utökas med länsgränskontroll på servern; befintlig användarisolering bevaras.

## Reproduktion

1. `python scripts/fetch-stockholm.py` – SCB och OSM; cachat och återupptagbart.
2. `python scripts/build-stockholm.py` – klippning, landsbygdsanpassade filter och artmasker.
3. `python scripts/build-stockholm-tiles.py` – publicerbara tiles och metadata.
4. `python scripts/verify-stockholm.py` – raster, policyfall, hash och tileklasskontroll.
5. `node scripts/verify-stockholm-browser.mjs` – desktop/mobil, alla arter, kommunval, klick, satellit och felkontroll.

Rådata och raster i `data/stockholm/` är ignorerade av Git och Vercel. Publicerat underlag ligger i `public/data/stockholm/`. Filtrerad härledning delas under ODbL 1.0, ursprungligt NMD är CC0. Leveransstatus och faktiska testresultat ska redovisas i NEXT-CHAT.md och HANDOFF.md.

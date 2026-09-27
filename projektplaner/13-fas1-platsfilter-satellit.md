# Fas 1: Botkyrka, platsfilter och satellit

Användarens avgränsning 2026-09-27: slutför Botkyrka och stanna **innan** datahämtning för Stockholmsregionen. Stockholmsutökningen är fas 2 och påbörjas först efter användarens kontroll av kontexten. Ingen Stockholmshämtning ingår i detta arbetspass.

## Leverans

- Alla tio arter har experimentella NMD-profiler och gemensamt mark-/väderindex för karta och lista.
- Platsfilter utesluter kartlagda parker, skolor, skötta grönytor, bostadsområden, handel/centrum och andra definierade skötta eller bebyggda miljöer.
- Satellitknapp och möjlighet att dölja habitatytorna; zoom och vald punkt bevaras vid byte av art/bakgrund.
- Alla ekologiska antaganden och saknade variabler redovisas. Platsfiltret är en utflyktspreferens, inte bevis för att svamp saknas.

## Data och reproduktion

1. Befintligt NMD2023 v2.1-utdrag verifieras mot raster- och gränshash samt samtliga klassantal.
2. `python scripts/fetch-exclusions.py`: ett avgränsat OSM/Overpass-uttag över Botkyrkas bounding box med liten buffert. Cache i ignorerade `data/landcover/exclusions-osm.json`; publicerad härledning i `public/data/botkyrka-exclusions.geojson`. Inga användarkoordinater skickas. Körningen återanvänder cache och avvisar ofullständiga svar.
3. `python scripts/build-habitat.py`: 250-metersrutor med exakta 10-metersklassytor. Undantagsytor rasteriseras med `all_touched=True`. Originalklassantal bevaras; `availableCounts` och `excludedPixels` styr kvarvarande markstöd. Alla borttagna pixlar ingår fortfarande i nämnaren.
4. `python scripts/verify-habitat-filter.py`: oberoende överlappskontroll av avkodade webbpolygoner mot varje undantagsyta. Tolerans cirka 0,064 m² för sexdecimalig koordinatavrundning; källpixeln är 100 m². Observerade avrundningsrester är under 0,01 m².

Utfall: 3 791 analysrutor, 25 419 klassgeometrier, 390 005 bortfiltrerade pixlar (39,0005 km²), noll saknade NMD-pixlar inom pilotmasken. Webbhabitat cirka 8,7 MB före HTTP-komprimering. OSM-filen har 3 261 objekt i uttagsrutan; en del ligger utanför själva pilotgränsen.

Marginaler i meter finns maskinläsbart i skriptet och metadatan och beskrivs på `/om#platsfilter`: skolor 100, handel/centrum 75, sjukhus/torg/stormarknad/stadion 50, lek/idrott/rekreation/bassäng 30, bostäder/industri/parkering/bygg/järnväg 25, park/trädgård/gräs/kyrkogård/kolonilotter 15. Punktobjekt buffras med samma avstånd och bevisar inte platsens verkliga gräns. Inga besöksräkningar eller faktiska klippscheman finns. OSM är inte fullständigt. Naturreservat och naturlig gräsmark undantas inte generellt.

## Källor och licenser

- Ursprunglig NMD: Naturvårdsverket, CC0. OSM-härlett filter och filtrerad databas: ODbL 1.0; publicerade data och reproduktionskod medföljer.
- [OSM parker](https://wiki.openstreetmap.org/wiki/Tag:leisure%3Dpark), [skolor](https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dschool), [bostadsområden](https://wiki.openstreetmap.org/wiki/Tag:landuse%3Dresidential), [handel](https://wiki.openstreetmap.org/wiki/Tag:landuse%3Dretail).
- [Overpass driftpolicy](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html): engångsuttag/cachad import; inte runtime-backend.
- Satellit: [EOxCloudless Acquisition year 2025](https://www.eox.at/2026/06/eoxcloudless-2025/), EOX IT Services GmbH, modifierade Copernicus Sentinel-data 2024 & 2025. Sentinel-2-mosaik, 10 meters grundupplösning, ingen livebild. WMTS `s2cloudless-2025_3857`, GoogleMaps-kompatibelt raster. Inga bilder laddas förrän Satellit väljs. Ingen offline-/bulkhämtning.
- [EOX licens](https://cloudless.eox.at/documentation/license): CC BY-NC-SA 4.0 för icke-kommersiell pilot. Kommersiell drift kräver licens eller leverantörsbyte innan abonnemang aktiveras. Attribution visas i kartan. Esris publika imagery-URL valdes inte eftersom rätt ArcGIS-licens inte verifierats.

## Fas 2 – endast planerat

Bekräfta avgränsning (Stockholms län eller annan region) efter användarens kontextkontroll. Välj därefter skalbar geodataleverans, regional vädertäckning, leverantörsavtal och valideringsupplägg. Den nuvarande GeoJSON-avkodningen och fem väderreferenser är byggda för Botkyrka och bör inte bara multipliceras till ett län. Hämta ingen regional data innan fas 2 påbörjas av användaren.

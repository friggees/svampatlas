# Datamodell och åtkomst

Detta är en logisk design, inte en exekverad migration. Använd PostgreSQL-constraints och främmande nycklar som komplement till servervalidering.

## Tabeller

| Tabell | Viktiga fält och relationer | Åtkomst |
|---|---|---|
| profiles | id → auth.users, display_name, settings, created_at | Endast ägare |
| species | id, taxon_source_id UNIQUE, slug UNIQUE, svenska/latinska namn, review_status | Publicerade rader läsbara |
| species_aliases | species_id, namn, språk | Läsbar med publicerad art |
| species_profiles | species_id, version, habitatregler, källor, reviewed_at, model_enabled | Granskade profiler publika |
| data_sources | id, namn, dataset, licens, attribution, källa, upplösning | Publicerbar metadata |
| import_runs | source_id, cursor, status, started_at, finished_at, errors | Intern drift |
| habitat_cells | id, geom, marktäckesegenskaper, dataset_version, kvalitet | Internt underlag |
| weather_summaries | cell_id, period, egenskaper, source_id, quality_flags | Internt underlag |
| source_observations | source_id, external_id, species_id, observed_at, geom, coordinate_uncertainty_m, license, validation_status | Intern lagring; endast godkänd aggregering ut |
| area_scores | cell_id, species_id, date_bucket, model_version, score, quality, reasons, computed_at | Endast publicerade versioner via begränsad läsning |
| model_versions | id, parameters, dataset_versions, review_status, published_at | Publicerbar metadata; intern styrning |
| saved_areas | id, user_id, name, geom, arrival_point, notes, created_at, updated_at | Ägare |
| saved_area_species | area_id, species_id | Ägare via området |
| visits | id, user_id, area_id, visited_at, searched_species_id, duration_minutes, result, notes | Ägare |
| photos (senare) | id, user_id, visit_id, storage_path, credit | Ägare, privat bucket |

`result` begränsas till found/not_found/uncertain. Ogiltiga koordinater, negativ söktid och tomma områdesnamn avvisas. Fynd är användaruppgifter, inte verifierad artbestämning. Externa observationer dedupliceras med UNIQUE(source_id, external_id); även överlapp mellan leverantörer måste hanteras.

## Geografi och index

API använder WGS84/EPSG:4326, GeoJSON-koordinater i ordningen longitud, latitud. Lagra områden som giltiga MultiPolygon-geometrier och startpunkter som Point. Meterbaserad distans använder geography eller en uttryckligen vald metrisk projektion; beräkna aldrig meter direkt på gradkoordinater.

Bearbeta svenskt rutnät i SWEREF 99 TM/EPSG:3006 i datapipelinen och transformera till API-format. Börja utvärderingen med 250 m celler, jämför med 1 km. Kartans presentation får inte antyda bättre precision än källorna ger.

GiST-index på sökta geometrier; B-tree på user_id, FK-kolumner och art/datum. Unik nyckel för poäng: cell/art/datum/modellversion. Använd bbox-filter före dyrare spatiala operationer. Kontrollera `EXPLAIN (ANALYZE, BUFFERS)` med realistisk datamängd. PostGIS ger spatiala typer och indexering. [Supabase PostGIS](https://supabase.com/docs/guides/database/extensions/postgis).

## RLS och behörigheter

Interna import- och rådatatabeller ligger i icke exponerat schema. API-exponerade tabeller har RLS och uttryckliga grants. `profiles`, `saved_areas` och `visits` tillåter bara ägaren; SELECT/DELETE använder ägarvillkor, INSERT använder WITH CHECK, UPDATE använder både USING och WITH CHECK. Ägarskapet får inte kunna ändras till en annan användare.

Barnrelationer kontrollerar ägare genom föräldraraden. Besök får inte kopplas till någon annans område: genomför med sammansatt FK `(area_id, user_id)` till motsvarande unik nyckel på saved_areas, utöver RLS. Bestäm att radering av ett område raderar dess besök i MVP och visa omfattningen före radering.

Views använder `security_invoker` där tillämpligt. RPC använder SECURITY INVOKER som standard, fast search_path, begränsade EXECUTE-rättigheter och validerade parametrar. Om intern aggregering behöver privilegierad funktion granskas den särskilt; exponera aldrig en generell SQL- eller rådatafunktion. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

Storage-policy kontrollerar användar-ID i sökvägen och kopplad ägare. Signerade bildlänkar är kortlivade. Kontoexport inkluderar alla privata rader; radering omfattar även Storage-objekt via ett återupptagbart jobb.

## Migrationer

Skapa versionshanterade migrationer med Supabase CLI och generera TypeScript-typer från schemat. Lokala seeddata är syntetiska. Testa migration från tom databas och från föregående version innan staging. Använd expand/contract för senare brytande schemaändringar. Kör säkerhetsrådgivaren och RLS-tester efter schemaändringar.

# Aktuell status – 2026-09-27

Fas 1 är tekniskt slutverifierad. `npm run test:habitat-browser` passerade hela flödet mot det befintliga produktionsbygget på port 3001: alla tio arter, listval/kartklick, bevarad kartinstans och zoom, satellit, delad väderhämtning, mobil utan overflow, väderfel/gamla dygn/återförsök, habitatfel/återförsök och metodsida. Inga page errors. Desktop/mobil/satellitbilder granskade. Inga appkorrigeringar behövdes. Tidigare 24 domäntester, lint, bygge och geometrikontroll gäller oförändrad kod.

Användaren har därefter uttryckligen beställt datahämtning för **hela Stockholms län** för alla tio svampar. Det ersätter tidigare stopp inför fas 2. Parker, skötta gräsytor, centrum, stationer och skolor ska filtreras. Extra närhetsbuffertar ska ta hänsyn till tätort/landsbygd. Fältvalidering och ekologisk expertgranskning återstår separat.

Fas 2 pågår: `scripts/fetch-stockholm.py` hämtar SCB RegSO 2025 för länets 26 kommuner, SCB tätorter 2023 samt cachade OSM-uttag med samma tidpunkt. Nationellt NMD2023 v2.1-raster finns redan i `data/landcover/`. Regionala rådata sparas i ignorerade `data/stockholm/`. Regional karta är ännu inte publicerad. Befintlig Botkyrkaproduktion bevaras medan länsunderlaget tas fram.

---

## Föregående överlämning (historik)

# Överlämning vid chattbyte – 2026-09-27

Detta är aktuell status och ersätter äldre uppgifter om nästa steg.

## Uppdrag och avgränsning
Projekt: C:/Users/albin/dev/svampatlas. Läs AGENTS.md, detta dokument och README.md. Användaren vill avsluta fas 1 i Botkyrka innan fas 2 med data för hela Stockholmsregionen. Ingen Stockholmshämtning har påbörjats. Starta inte sådan hämtning utan ny instruktion. Användaren vill pusha fungerande ändringar tidigt före omfattande tester.

## Implementerat och publicerat
- Habitatytor för alla tio arter, baserade på NMD-markklasser och befintligt väder. Karta och lista använder samma experimentella index, inte fyndsannolikhet. Saknat/gammalt väder tar bort kombinerade betyg.
- Platsfilter för kartlagda parker, skolor, skötta grönytor, centrum/handel, bostäder och andra definierade miljöer. OSM-underlag: 3 261 objekt. 390 005 pixlar (39,0005 km²) undantas. Återstående webbdata: 3 791 analysrutor, 25 419 geometrier, cirka 8,7 MB. OSM:s täckning är inte fullständig; filtret bevisar inte faktisk skötsel eller besöksantal.
- Satellitväxling Karta/Satellit och Visa habitatytor. EOxCloudless 2025, Sentinel-2-bilder från 2024–2025, 10 m grundupplösning. CC BY-NC-SA 4.0 för icke-kommersiell pilot; kommersiell drift kräver licens eller byte. Attribution och metod finns i appen.
- Senaste kartfixen väntar på renderade habitattiles. Val av yta ändrar filter utan att ladda om geometrin; artbyte behåller kartinstansen.
- Kodcommit a902e65f5fa4ec520afbb332122e03faeac7df92 är pushad till origin/main och verifierad READY i Vercel. Produktion: https://svampatlas.vercel.app. Användarens tidigare produktionsfixar är bevarade. Ingen ny databas- eller authändring.

## Verifierat och återstående kontroll
Godkänt: 24 domäntester, lint, produktionsbygge inklusive TypeScript samt oberoende Pythonkontroll av alla publicerade geometrier mot platsfiltret. Kontrollens avrundningstolerans är cirka 0,064 m²; observerade rester under 0,01 m². Satellitbilder laddades och granskades visuellt i riktig browser. Användaren har också bekräftat att karta och områden fungerar.

Det samlade browsertestet är INTE bekräftat godkänt. Senaste körningens slutresultat saknas vid chattbytet. Tidigare körningar fastnade eller föll på väntan på MapLibre-rendering och markörposition mitt under zoomanimation. Dessa har fått kod-/testjusteringar, men hela flödet måste slutföras innan fas 1 kallas slutverifierad.

## Nästa steg
1. Läs scripts/verify-habitat-browser.mjs och kör npm run test:habitat-browser mot lokalt produktionsbygge på port 3001. Kontrollera först om server redan körs; port 3000 kan tillhöra annat projekt. Undvik att upprepa fulla byggen utan förändring.
2. Slutför kontroll av kartklick, listval, zoom, satellit, alla tio arter, mobil, väderfel/gammalt dygn/återförsök och habitatfel. Undersök rendering och testets väntan om det stannar. Senaste testet väntar på data-habitat-ready och heltal i markörens transform efter zoom; det senare kan behöva säkrare väntan på avslutad animation.
3. Gör endast nödvändiga korrigeringar, pusha dem tidigt och kontrollera deployment. Uppdatera denna status med verkliga testresultat.
4. Stanna och redovisa fas 1. Fas 2: utöka till Stockholmsregionen först efter användarens nästa instruktion. Fältvalidering och ekologisk expertgranskning återstår separat.

## Viktiga filer och reproducerbarhet
- projektplaner/13-fas1-platsfilter-satellit.md: regler, källor, licenser och fasgräns.
- scripts/fetch-exclusions.py: avgränsad OSM-hämtning; cache i data/landcover, inte Stockholm.
- scripts/build-habitat.py och scripts/verify-habitat-filter.py: export och oberoende geometrikontroll.
- public/data/botkyrka-habitat.json och botkyrka-exclusions.geojson: publicerat underlag.
- habitat-profiles.ts, habitat-domain.ts, use-habitat.ts, use-weather.ts, map.tsx och habitat-panel.tsx: centrala implementationsfiler; hitta deras sökvägar med rg --files.
- /om#habitat och /om#platsfilter: användarsynlig metod, begränsningar och källor.
- Artifacts och lokala raster/cacher är ignorerade. Befintlig .env.local ska bevaras och aldrig skrivas ut.

PowerShell: sätt $OutputEncoding = [System.Text.UTF8Encoding]::new($false) före Python via stdin, så svenska tecken inte blir frågetecken.

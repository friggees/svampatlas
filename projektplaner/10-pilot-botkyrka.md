# Pilot: Botkyrka kommun

Beslut 2026-09-27: användaren föreslog Stockholmsregionen eller en mindre start i Botkyrka kommun. Vi väljer Botkyrka som första pilot för att begränsa datahantering och göra resultaten lättare att utvärdera. Stockholmsregionen är nästa expansionssteg, därefter eventuell nationell täckning.

## Geografisk avgränsning

- Använd officiell kommunpolygon med dokumenterad källa, licens och version. Polygonen är ännu inte hämtad eller verifierad.
- Begränsa publicerade habitatförslag till Botkyrka. Visa ”Utanför pilotområdet” vid sökning utanför täckningen.
- Externa underlag får hämtas med motiverad buffert utanför kommungränsen för att undvika kanteffekter. Det gäller exempelvis väderstationer och habitatkontext. Buffert väljs efter respektive datakälla.
- Klipp inte navigeringsvägar till kommungränsen; en lämplig startpunkt eller väg kan ligga utanför området. Håll täckning och tillgänglighet separata.
- Lagra pilotregion som konfiguration/data, inte hårdkodade koordinater i komponenter. Kommunens exakta bbox och polygon ska inte uppskattas manuellt.

## Arter och validering

Förslag för första tekniska genomskärningen: kantarell, under förutsättning att artprofil och data räcker. Detta är ett implementeringsförslag, inte en ny begränsning av katalogen. Behåll samtliga tidigare planerade arter, inklusive röd flugsvamp och toppslätskivling. Aktivera ranking per art först efter granskning.

Förstudien levererar: verkligt litet datauttag, karta över datatäckning, reproducerbar habitatberäkning, dokumenterade källrättigheter och konkreta exempel på förklaringar. Ingen garanti om förekomst i Botkyrka ges innan underlaget granskats.

Fältpilot jämför olika habitatklasser och kontrollområden med registrerad söktid, även utan fynd. Välj provplatser efter dataanalys och kontroll av åtkomlighet. Bedöm resultat per art och säsong; ett fungerande UI är inte bevis för en fungerande ekologisk modell.

## Expansion till Stockholmsregionen

Utöka när kärnflödet, ägarisoleringen och importerna är verifierade och pilotens modellbegränsningar är förstådda. Fastställ då om ”Stockholmsregionen” ska betyda Stockholms län eller en annan avgränsning. Mät täckning, kostnad och beräkningstid innan större import.

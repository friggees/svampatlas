# Nästa steg för Svampatlas

Datum: 2026-09-28. Status: planerat arbete, inte implementerade funktioner.

## Utgångsläge

Landing page och inloggningsflödet är klara. Kartan, svampguiden och privata sparade platser finns redan. Närmast återstår egen domän och fungerande registreringsmejl via Supabase. Därefter bygger vi vänner, platsdelning och community, följt av ett betalpaket.

## 1. Domän och registreringsmejl

- [ ] Välj och koppla egen domän till Svampatlas.
- [ ] Uppdatera appens publika adress och Supabases tillåtna returadresser till den nya domänen.
- [ ] Välj e-postleverantör, verifiera avsändardomänen och konfigurera egen SMTP för Supabase Auth.
- [ ] Aktivera den förberedda svenska mallen för registreringsbekräftelse.
- [ ] Testa hela flödet med en riktig inkorg: registrering → mejl → bekräftelse → inloggning, även på mobilen och en annan enhet.
- [ ] Kontrollera nytt bekräftelsemejl, förbrukade länkar och lösenordsåterställning.

Enligt senaste överlämningen saknas egen SMTP och verklig inkorgsleverans är ännu inte verifierad. Behåll e-postbekräftelse aktiverad.

## 2. Vänner och delning av svampplatser

Målet är att kunna lägga till andra användare som vänner och välja vilka svampplatser man delar med dem.

- [ ] Enkel profil med visningsnamn, unikt användarnamn och valfri profilbild.
- [ ] Hitta andra via användarnamn och skicka vänförfrågan.
- [ ] Acceptera eller avböja förfrågningar, visa vänlista och ta bort vänner.
- [ ] Dela en sparad plats med en eller flera valda vänner.
- [ ] Visa mottagna platser i kartan och i en lista, med tydlig ägare.
- [ ] Återkalla delning. En borttagen vän ska förlora åtkomst till privat delat innehåll.

### Synlighet för platser

| Synlighet | Vem får se platsen? |
|---|---|
| Privat, standard | Endast ägaren |
| Delad med valda vänner | Ägaren och de vänner som uttryckligen valts |
| Publik | Alla, även besökare utan konto |

- [ ] Gör det möjligt att publicera en plats och senare göra den privat igen.
- [ ] Visa tydligt före publicering att även koordinaterna blir synliga för alla.
- [ ] Lägg till ett kartfilter för egna, delade och publika platser.
- [ ] Låt endast ägaren ändra eller radera originalplatsen.

Befintliga platser förblir privata. Vänskap ska inte automatiskt dela alla platser. Åtkomst ska kontrolleras i databasen och för bilder, inte bara genom dolda knappar. Testa med ägare, vald vän, annan användare och utloggad besökare innan delning anses klar. Redan nedladdad information kan inte tas tillbaka.

## 3. Community med inlägg och bilder

Målet är ett gemensamt flöde där användare kan dela svampfynd, utflykter och bilder.

- [ ] Communityflöde med senaste inläggen först.
- [ ] Skapa inlägg med text och en eller flera bilder.
- [ ] Visa författare, datum och bilder samt låt författaren redigera eller radera sitt inlägg.
- [ ] Gör platskoppling valfri. Ett inlägg får aldrig automatiskt offentliggöra en privat eller vän-delad plats.
- [ ] Begränsa bildstorlek och filtyper samt ta bort GPS-information ur uppladdade bilders metadata.
- [ ] Lägg till rapportering av innehåll, blockering av användare och enkel moderering.
- [ ] Testa uppladdning och flöde på mobil, inklusive misslyckade uppladdningar och tomma tillstånd.

Första versionen fokuserar på inlägg och bilder. Kommentarer, gilla-markeringar och notiser är möjliga fortsättningar när grundflödet fungerar.

## 4. Betalpaket: Svampatlas Plus

**Prisidé att testa: 59 kr per månad inklusive moms.** Detta är en preliminär prishypotes under önskemålet om 100 kr/månad, inte ett fastställt pris eller en marknadsvaliderad bedömning. Börja med ett enda betalpaket och utvärdera betalningsvilja, faktisk användning och driftkostnader innan priset låses.

Den tidigare [abonnemangsplanen](12-abonnemang-och-paywalls.md) beskriver gratis provanvändning med 1 sparad plats och 2 upplåsta områden. Dessa gränser är fortfarande planerade och ska samordnas med de nya sociala funktionerna.

| Funktion | Gratisnivå, förslag | Svampatlas Plus, förslag |
|---|---|---|
| Grundkarta och svampguide | Ingår | Ingår |
| Vänner, community och bildinlägg | Ingår, med gemensamma uppladdningsgränser | Ingår |
| Se delade och publika platser | Ingår | Ingår |
| Egna sparade platser | 1 enligt tidigare plan | Högre gräns, fastställs före lansering |
| Dela egna platser | Ingår inom platskvoten | Ingår inom platskvoten |
| Upplåsta områdesanalyser | 2 enligt tidigare plan | Fler områden, omfattning fastställs |

Tanken är att låta communityn växa genom gratis deltagande och ta betalt för utökad användning av kart- och platsfunktionerna. Att se en väns plats eller läsa ett inlägg ska inte förbruka områdeskvoten. Funktioner som ännu saknas ska inte marknadsföras som inkluderade.

- [ ] Bestäm slutligt pris, kvoter och exakt vad en områdesanalys innebär i dagens länskarta.
- [ ] Räkna på kostnader för kartor, databas, bildlagring, e-post och betalningar.
- [ ] Lös satellitlagrets kommersiella användning före betalstart: projektets överlämning anger att nuvarande lager används för en icke-kommersiell pilot och kräver licens eller byte.
- [ ] Implementera betalning, abonnemangsstatus, uppsägning och rättigheter enligt abonnemangsplanen.
- [ ] Behåll läsning och radering av egna befintliga platser även efter avslutat abonnemang. Definiera vad som händer med delningar vid nedgradering.
- [ ] Verifiera köp, misslyckad betalning, uppsägning och kvoter innan betalpaketet lanseras.

Årspris och eventuellt säsongspaket kan utvärderas senare eftersom användningen kan vara säsongsbetonad.

## Arbetsordning och öppna beslut

1. Färdigställ domän och verklig mejlleverans.
2. Bygg profiler, vänförfrågningar och privat delning mellan vänner.
3. Lägg till uttrycklig publicering av platser och kartfilter.
4. Bygg communityflöde, bildinlägg och grundläggande moderering.
5. Fastställ och lansera Plus när funktioner, kostnader och kommersiella kartvillkor är klara.

Öppna beslut: domännamn, e-postleverantör, slutliga Plus-kvoter och pris. 59 kr/månad är ett diskussionsunderlag. Denna plan beställer ingen domän, aktiverar ingen betaltjänst och ändrar inga befintliga åtkomsträttigheter.

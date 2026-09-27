# Användarflöden och design

## Navigation

Mobil: bottennavigation med Utforska, Sparat, Arter och Profil. Desktop: samma destinationer i sidomeny, med resultatlista bredvid kartan. Kartan är huvudvy men alla centrala uppgifter ska kunna utföras via lista och formulär.

Utforska har artsökning överst, platsval och datum, kompakt filterknapp och växling Karta/Lista. GPS begärs först när användaren väljer ”Min position”. Nekad åtkomst leder till ortsökning eller manuell kartposition.

## Huvudflöde

1. Välj art med svenskt och vetenskapligt namn samt bild.
2. Välj ort, kartutsnitt eller aktuell position och sökdatum.
3. Tryck ”Sök i området”. Kartpanorering startar inte obegränsade automatiska anrop.
4. Visa områdespolygoner och en rankad lista. Kortet visar habitatklass, datakvalitet, avstånd fågelvägen och uppdateringstid.
5. Öppna detaljpanelen: ”Varför här?”, datakällor, säsongsunderlag och historiska observationer som separat lager.
6. Spara området. Om inloggning krävs bevaras det valda området under inloggningsflödet.
7. Välj en startpunkt och öppna vägbeskrivning i extern kartapp. Destinationen bekräftas tydligt i gränssnittet.
8. Efter turen registreras ett privat besök, även om inga fynd gjordes.

## Visuell riktning

shadcn/ui med neutral stenfärgad bas, skogsgrön accent, tydliga linjer och generös läsbarhet. Ljust läge är startförslag för utomhusbruk; mörkt läge finns som alternativ. Testa båda i dagsljus. Färg kompletteras alltid med text eller mönster.

Använd Button, Card, Badge, Command, Popover, Sheet, Tabs, Input, Skeleton, Alert och AlertDialog. Mobil detaljpanel får tydliga stäng- och expandera-knappar; draggest är aldrig enda sättet. Destruktiva handlingar använder AlertDialog. Åtgärder placeras konsekvent: ”Spara område” och ”Vägbeskrivning”.

Sikta på WCAG 2.2 AA, synlig tangentbordsfokus, minst 44 × 44 CSS-pixlar som produktmål för tryckytor, reducerad rörelse och korrekt fokusåterställning. Kartans popup får inte vara den enda vägen till innehåll. Kontrollera kontraster över den faktiska baskartan.

## Text och tillstånd

Exempel på modelltext: ”Lovande habitat. Bedömningen bygger på tillgänglig marktäckedata och artens säsongsprofil. Aktuellt väder saknas.” Aldrig ”87 % chans” utan kalibrerad och validerad sannolikhetsmodell.

Designa följande explicit: laddning, inga träffar, ingen datatäckning, gammalt väderunderlag, extern API-störning, utloggad session, nekad GPS, misslyckat sparande och offline. Sparandet ska visa fel och tillåta försök igen utan att förlora inmatning. Offline i MVP ger tydlig status; appen lovar inte offlinekartor.

”Hittade inget” skiljs från ”besökte inte”. Datum utanför väderprognosens tillgänglighet visar bara säsongs-/habitatunderlag. En områdesmittpunkt framställs aldrig som en farbar entré.

## Skärmar att prototypa

Utforska, artväljare, områdesdetalj, spara/redigera område, sparade områden, besökslogg, artdetalj, inloggning och profil. Testa 360 px mobilbredd och desktop samt långa svenska artnamn. Lägg artbilder och ikoner i ett konsekvent bildformat med alternativtext och källangivelse.

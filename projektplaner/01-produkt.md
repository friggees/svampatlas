# Produkt och omfattning

## Mål

Hjälpa svampintresserade och naturfotografer att välja lovande områden, planera besök och återvända till egna platser. Kärnan är ett geografiskt beslutsstöd med synligt dataunderlag, inte automatisk artbestämning.

Primära användare: matsvampsplockare som vill planera en tur och fotografer som söker en specifik art. Samma sökflöde används för båda; katalogen begränsas inte till matsvampar.

## Första arturval

Föreslagen katalog: kantarell, trattkantarell, svart trumpetsvamp, stensopp/karljohan, blek taggsvamp, rödgul trumpetsvamp, smörsopp och fårticka samt röd flugsvamp och toppslätskivling. Namn, taxon-ID och eventuella artkomplex måste verifieras mot SLU:s taxonomi före import. Det här är ett föreslaget urval, inte en verifierad popularitetslista.

”Flugsvamp” är inte ett entydigt artval. Gränssnittet visar namngivna arter, med röd flugsvamp som första förslag och möjlighet att senare lägga till fler. Toppslätskivling behandlas som observations- och fotomotiv. Ingen doserings-, berednings- eller konsumtionsfunktion ingår. Artinformation och eventuella juridiska texter granskas före publicering.

Katalogen ska kunna växa utan kodändringar. Förekomst i katalogen betyder inte att arten har en godkänd habitatmodell eller att appen rekommenderar den som mat.

## MVP

- Utforska utan konto: artval, plats eller manuell kartposition, datum, radie, karta och motsvarande lista.
- Rangordnade områden med klassning, datakvalitet, uppdateringstid och faktorer bakom bedömningen.
- Tydlig åtskillnad mellan habitatförslag, historiska observationer och användarens egna fynd.
- Konto via Supabase Auth för att spara områden privat.
- Spara punkt med radie eller föreslagen områdesgeometri, namn, anteckning och relevanta arter.
- Redigera och radera områden. Registrera ett besök med datum, sökt art, söktid och fynd/inga fynd/osäker observation.
- Öppna extern vägbeskrivning till användarvald startpunkt, exempelvis entré eller parkering.
- Artkort med källor, bildlicens och redaktionellt granskad information.
- Kontoinställningar, dataexport och radering.

## Efter MVP

Privata foton och projektmappar för fotografer, manuellt ritade polygoner, kontrollerad delning, offlinepaket, bevakningar och utvärderad statistisk modell. Fotouppladdning kan tidigareläggas om pilotfotografer bedömer det som avgörande. Native-app, socialt flöde, AI-artbestämning och egen navigeringsmotor ingår inte i första leveransen.

## Mätbar nytta

Pilotmål: minst 80 % av testpersonerna klarar välja art → hitta område → spara → öppna vägbeskrivning utan hjälp. Mät även tid till första sparade område, återbesök och om förklaringen till rankningen förstås. Modellens kvalitet utvärderas separat från användarnas klick och sparningar.

Logga inte exakta privata platser i produktanalys. Framgångsmått och modelltrösklar är föreslagna mål, inte uppmätta resultat.

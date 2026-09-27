import type { SpeciesId } from '../species/catalog';

export type HabitatProfile = { codes: number[]; ecology: string; gaps: string; source: string; limited?: boolean };
const forest = [111,112,113,114,115,116,117];
const guide = (slug: string) => `https://svampguiden.com/sv/art/${slug}`;
// Binary class matching avoids invented ecological weights. Selection of NMD classes
// remains an unvalidated proxy, even when the underlying ecological description is sourced.
export const habitatProfiles: Record<SpeciesId, HabitatProfile> = {
  kantarell: { codes: forest, ecology: 'Barr- och lövskog.', gaps: 'Värdträd, markkemi och lokal fuktighet är inte verifierade.', source: guide('3213-kantarell') },
  trattkantarell: { codes: [111,112,113,114,116,121,122,123,124], ecology: 'Mossig barrskog; även bokskog i södra Sverige.', gaps: 'Mosskikt och bok är inte verifierade. Ädellövskog används som grov proxy för bokskog.', source: guide('3217-trattkantarell') },
  'svart-trumpetsvamp': { codes: [116,117], ecology: 'Ofta med ek och hassel, även örtrik barrskog.', gaps: 'Ek, hassel och örtrikedom saknas i underlaget. Barrskog tas därför inte med i denna försiktiga profil.', source: guide('3772-svart-trumpetsvamp'), limited: true },
  stensopp: { codes: forest, ecology: 'Både barr- och lövskog.', gaps: 'Värdträd, markkemi och skogens ålder är inte verifierade.', source: guide('245630-karljohan') },
  'blek-taggsvamp': { codes: forest, ecology: 'Mossig barrskog och lövskog med bland annat bok.', gaps: 'Mosskikt och enskilda värdträd saknas. Källans artbegrepp omfattar flera närstående arter.', source: guide('4370-blek-taggsvamp') },
  'rodgul-trumpetsvamp': { codes: [122,123,124,125], ecology: 'Fuktiga skogar med gran eller björk, ofta kalkrik mark.', gaps: 'Kalkhalt, mosskikt och björk är inte verifierade. Våtmarksskog är endast en proxy och missar fuktiga stråk på fastmark.', source: guide('3215-rodgul-trumpetsvamp'), limited: true },
  smorsopp: { codes: [111,113], ecology: 'Knuten till tall, ofta sandiga miljöer.', gaps: 'Sandig jord och tall i barrblandskog är inte verifierade. Vägar är undantagna.', source: guide('6088-smorsopp') },
  farticka: { codes: [112,113,114], ecology: 'Grananknuten svamp i mossig barrskog.', gaps: 'Mosskikt och gran i blandskog är inte verifierade.', source: guide('2959-farticka') },
  'rod-flugsvamp': { codes: [114,115,117,124,125,127], ecology: 'Björkanknuten i skog och hagmark enligt artkällan.', gaps: 'Triviallöv och lövinslag är en proxy, inte bevis för björk. Hagmarker med enstaka träd missas.', source: guide('2976-rod-flugsvamp'), limited: true },
  toppslatskivling: { codes: [4231,4232,4233], ecology: 'Gräsmarker, bland annat betesmark utan konstgödsling.', gaps: 'Beteshävd, gödsling och grässvål är okända. Gräsmark ensam räcker inte för en stark habitatbedömning. Avser observation och fotografi.', source: 'https://www.first-nature.com/fungi/psilocybe-semilanceata.php', limited: true },
};

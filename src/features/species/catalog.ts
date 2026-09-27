export const species = [
  { id: 'kantarell', name: 'Kantarell', latin: 'Cantharellus cibarius', group: 'Matsvampar', color: '#c79635' },
  { id: 'trattkantarell', name: 'Trattkantarell', latin: 'Craterellus tubaeformis', group: 'Matsvampar', color: '#927748' },
  { id: 'svart-trumpetsvamp', name: 'Svart trumpetsvamp', latin: 'Craterellus cornucopioides', group: 'Matsvampar', color: '#66675e' },
  { id: 'stensopp', name: 'Stensopp', latin: 'Boletus edulis', group: 'Matsvampar', color: '#a17b56' },
  { id: 'blek-taggsvamp', name: 'Blek taggsvamp', latin: 'Hydnum repandum', group: 'Matsvampar', color: '#bcad82' },
  { id: 'rodgul-trumpetsvamp', name: 'Rödgul trumpetsvamp', latin: 'Craterellus lutescens', group: 'Matsvampar', color: '#b98237' },
  { id: 'smorsopp', name: 'Smörsopp', latin: 'Suillus luteus', group: 'Matsvampar', color: '#9c7640' },
  { id: 'farticka', name: 'Fårticka', latin: 'Albatrellus ovinus', group: 'Matsvampar', color: '#aaa386' },
  { id: 'rod-flugsvamp', name: 'Röd flugsvamp', latin: 'Amanita muscaria', group: 'Fotomotiv', color: '#b86550' },
  { id: 'toppslatskivling', name: 'Toppslätskivling', latin: 'Psilocybe semilanceata', group: 'Fotomotiv', color: '#988361' },
] as const;
export type SpeciesId = typeof species[number]['id'];
export function findSpecies(id: string) { return species.find(s => s.id === id); }

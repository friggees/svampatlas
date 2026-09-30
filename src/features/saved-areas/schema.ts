import { z } from 'zod';
import { findSpecies } from '../species/catalog';
export const savedAreaSchema = z.object({
  name: z.string().trim().min(2, 'Ange minst två tecken.').max(100),
  species_id: z.string().refine(id => !!findSpecies(id), 'Välj en art i katalogen.'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  notes: z.string().trim().max(2000).default(''),
});
export type SavedAreaInput = z.infer<typeof savedAreaSchema>;
export type SavedArea = SavedAreaInput & { id: string; user_id: string; created_at: string; visibility: 'private'|'friends'|'public' };

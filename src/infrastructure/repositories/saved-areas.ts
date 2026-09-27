import 'server-only';
import { createClient } from '../supabase/server';
import type { SavedArea } from '@/features/saved-areas/schema';
export async function getSavedAreas() {
  const client = await createClient();
  const {data:{user}} = await client.auth.getUser();
  if (!user) return { areas: [] as SavedArea[], signedIn: false, error: false };
  const { data, error } = await client.from('saved_areas').select('id,user_id,name,species_id,latitude,longitude,notes,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
  return { areas: (data ?? []) as SavedArea[], signedIn: true, error: !!error };
}

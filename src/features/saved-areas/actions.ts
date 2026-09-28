'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/infrastructure/supabase/server';
import { savedAreaSchema } from './schema';
import { isInPilot } from '../exploration/domain';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
export async function saveArea(input: unknown) {
  const parsed = savedAreaSchema.safeParse(input);
  if (!parsed.success) return { error:'Kontrollera namn, art och koordinater.' };
  const boundary = JSON.parse(await readFile(path.join(process.cwd(),'public/data/stockholm/boundary.geojson'),'utf8'));
  if (!isInPilot(parsed.data, boundary)) return { error:'Välj en plats inom Stockholms län.' };
  const client = await createClient();
  const {data:{user}} = await client.auth.getUser();
  if (!user) return { error:'Logga in för att spara din plats.' };
  const {error} = await client.from('saved_areas').insert({...parsed.data,user_id:user.id});
  if (error) return {error:'Platsen kunde inte sparas. Försök igen.'};
  revalidatePath('/sparat');
  return {success:true};
}
export async function deleteArea(id: string) {
  const client = await createClient();
  const {data:{user}} = await client.auth.getUser();
  if (!user) return {error:'Logga in igen.'};
  const {data,error} = await client.from('saved_areas').delete().eq('id',id).eq('user_id',user.id).select('id');
  if (error || !data?.length) return {error:'Platsen kunde inte tas bort.'};
  revalidatePath('/sparat');
  return {success:true};
}

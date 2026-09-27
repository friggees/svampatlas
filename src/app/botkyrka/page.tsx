import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {AppShell} from '@/components/app-shell';
import {Explorer} from '@/features/exploration/explorer';
import {createClient} from '@/infrastructure/supabase/server';
export default async function Botkyrka() {
  const client=await createClient();
  const [{data:{user}},boundary,metadata]=await Promise.all([client.auth.getUser(),readFile(path.join(process.cwd(),'public/data/botkyrka-regso.geojson'),'utf8'),readFile(path.join(process.cwd(),'public/data/pilot-metadata.json'),'utf8')]);
  return <AppShell><Explorer boundary={JSON.parse(boundary)} bbox={JSON.parse(metadata).bbox} signedIn={!!user}/></AppShell>;
}

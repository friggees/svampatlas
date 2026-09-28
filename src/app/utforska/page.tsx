import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {AppShell} from '@/components/app-shell';
import {Explorer} from '@/features/exploration/explorer';
import {createClient} from '@/infrastructure/supabase/server';
export default async function Page() {
  const client=await createClient();
  const [{data:{user}},boundary,metadata,municipalities]=await Promise.all([client.auth.getUser(),readFile(path.join(process.cwd(),'public/data/stockholm/boundary.geojson'),'utf8'),readFile(path.join(process.cwd(),'public/data/stockholm/metadata.json'),'utf8'),readFile(path.join(process.cwd(),'public/data/stockholm/municipalities.json'),'utf8')]);
  const county=JSON.parse(metadata);
  return <AppShell><Explorer boundary={JSON.parse(boundary)} bbox={county.bbox} county={county} municipalities={JSON.parse(municipalities)} signedIn={!!user}/></AppShell>;
}

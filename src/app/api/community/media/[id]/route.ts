import {z} from 'zod';
import {createClient} from '@/infrastructure/supabase/server';
import {createMediaAdmin} from '@/infrastructure/supabase/media-admin';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const headers={'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff'};
 if(!z.uuid().safeParse(id).success)return new Response(null,{status:404,headers});
 const client=await createClient();
 const avatar=new URL(request.url).searchParams.get('kind')==='avatar';
 const result=avatar?await client.from('profiles').select('avatar_path').eq('id',id).maybeSingle():await client.from('community_images').select('path').eq('id',id).maybeSingle();
 const path=result.data&&('avatar_path' in result.data?result.data.avatar_path:result.data.path);
 if(result.error||!path)return new Response(null,{status:404,headers});
 try{
  const {data,error}=await createMediaAdmin().storage.from('community').download(path);
  if(error||!data)return new Response(null,{status:404,headers});
  return new Response(data,{headers:{...headers,'Content-Type':'image/jpeg'}});
 }catch{return new Response(null,{status:503,headers});}
}

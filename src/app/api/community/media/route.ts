import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {createClient} from '@/infrastructure/supabase/server';
import {createMediaAdmin} from '@/infrastructure/supabase/media-admin';
import {IMAGE_LIMIT,IMAGE_TYPES} from '@/features/community/schema';
export const runtime='nodejs';
const fail=(error:string,status=400)=>Response.json({error},{status});
export async function POST(request:Request){
 // Next may normalize request.url to an internal hostname. Match the public Host,
 // as Server Actions do, while retaining the protocol check and rejecting no Origin.
 const origin=request.headers.get('origin');
 const host=request.headers.get('x-forwarded-host')??request.headers.get('host');
 const protocol=request.headers.get('x-forwarded-proto')??new URL(request.url).protocol.slice(0,-1);
 try{const source=new URL(origin??'');if(source.host!==host||source.protocol!==`${protocol}:`)return fail('Ogiltigt ursprung.',403);}
 catch{return fail('Ogiltigt ursprung.',403);}
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return fail('Logga in först.',401);
 try{
  const reader=request.body?.getReader();if(!reader)return fail('Välj en bild.');
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>IMAGE_LIMIT+65536){await reader.cancel();return fail('Bilden får vara högst 3 MB.',413);}chunks.push(value);}
  const form=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':request.headers.get('content-type')??''}}).formData();
  const file=form.get('file'),kind=form.get('kind');
  if(!(file instanceof File)||!IMAGE_TYPES.includes(file.type)||file.size>IMAGE_LIMIT||!file.size)return fail('Välj JPG, PNG eller WebP, högst 3 MB.');
  const postId=String(form.get('postId')??''),slot=Number(form.get('slot'));
  let oldAvatar:string|null=null;
  if(kind==='avatar'){
   const {data}=await client.from('profiles').select('avatar_path').eq('id',user.id).maybeSingle();
   if(!data)return fail('Spara din profil först.');oldAvatar=data.avatar_path;
  }else if(kind==='post'){
   if(!z.uuid().safeParse(postId).success||!Number.isInteger(slot)||slot<0||slot>3)return fail('Ogiltigt inlägg.');
   const {data}=await client.from('community_posts').select('id').eq('id',postId).eq('author_id',user.id).eq('status','draft').maybeSingle();
   if(!data)return fail('Bilder kan bara läggas till i ditt eget utkast.',403);
  }else return fail('Ogiltig bildtyp.');
  const input=Buffer.from(await file.arrayBuffer());
  const processor=sharp(input,{limitInputPixels:40000000,animated:false,failOn:'warning'});
  const metadata=await processor.metadata();
  if(!['jpeg','png','webp'].includes(metadata.format??''))return fail('Bildformatet stöds inte.');
  // Sharp removes EXIF/GPS by default. Only the new JPEG is stored.
  const encoded=await processor.rotate().resize({width:kind==='avatar'?320:1600,height:kind==='avatar'?320:1600,fit:'inside',withoutEnlargement:true}).jpeg({quality:82}).toBuffer();
  const admin=createMediaAdmin(),path=`${user.id}/${randomUUID()}.jpg`;
  const upload=await admin.storage.from('community').upload(path,encoded,{contentType:'image/jpeg',upsert:false});
  if(upload.error)return fail('Bilden kunde inte laddas upp. Försök igen.',503);
  const result=kind==='avatar'?await admin.from('profiles').update({avatar_path:path}).eq('id',user.id).select('id').single():await admin.from('community_images').insert({post_id:postId,slot,path}).select('id').single();
  if(result.error){await admin.storage.from('community').remove([path]);return fail('Bilden kunde inte kopplas till inlägget. Platsen kan redan vara upptagen.',409);}
  if(kind==='avatar'&&oldAvatar)await admin.storage.from('community').remove([oldAvatar]);
  revalidatePath('/community');revalidatePath('/profil');revalidatePath('/vanner');
  return Response.json({id:result.data.id});
 }catch{return fail('Bilden kunde inte bearbetas. Välj en annan bild eller försök igen.',400);}
}

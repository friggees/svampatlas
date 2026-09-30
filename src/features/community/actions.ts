'use server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {createClient} from '@/infrastructure/supabase/server';
import {createMediaAdmin} from '@/infrastructure/supabase/media-admin';
import {profileSchema,postSchema,sharingSchema} from './schema';
import type {ActionResult} from './types';

function refresh(){for(const path of ['/community','/vanner','/profil','/sparat','/platser','/moderering'])revalidatePath(path);}
async function session(){const client=await createClient();const {data:{user}}=await client.auth.getUser();return {client,user};}
export async function saveProfile(input:unknown):Promise<ActionResult>{
 const parsed=profileSchema.safeParse(input);if(!parsed.success)return {error:'Använd 3–24 små bokstäver, siffror eller understreck i användarnamnet och 2–60 tecken i namnet.'};
 const {client,user}=await session();if(!user)return {error:'Logga in först.'};
 const {data:existing}=await client.from('profiles').select('id').eq('id',user.id).maybeSingle();
 const result=existing?await client.from('profiles').update(parsed.data).eq('id',user.id):await client.from('profiles').insert({id:user.id,...parsed.data});
 if(result.error)return {error:result.error.code==='23505'?'Användarnamnet är upptaget. Välj ett annat.':'Profilen kunde inte sparas.'};
 refresh();return {success:true};
}
export async function friendshipAction(kind:'request'|'accept'|'remove',id:string):Promise<ActionResult>{
 if(!z.uuid().safeParse(id).success)return {error:'Ogiltigt val.'};
 const {client,user}=await session();if(!user)return {error:'Logga in först.'};
 const result=kind==='request'?await client.from('friendships').insert({requester_id:user.id,recipient_id:id}).select('id'):
 kind==='accept'?await client.from('friendships').update({status:'accepted'}).eq('id',id).eq('recipient_id',user.id).select('id'):
 kind==='remove'?await client.from('friendships').delete().eq('id',id).select('id'):null;
 if(!result||result.error||!result.data?.length)return {error:'Kunde inte ändra vänförfrågan. Den kan redan vara hanterad, eller så behöver båda en profil.'};
 refresh();return {success:true};
}
export async function blockUser(id:string,blocked:boolean):Promise<ActionResult>{
 if(!z.uuid().safeParse(id).success||typeof blocked!=='boolean')return {error:'Ogiltigt val.'};
 const {client,user}=await session();if(!user)return {error:'Logga in först.'};
 const result=blocked?await client.from('user_blocks').insert({user_id:user.id,blocked_id:id}):await client.from('user_blocks').delete().eq('user_id',user.id).eq('blocked_id',id);
 if(result.error)return {error:'Blockeringen kunde inte ändras.'};refresh();return {success:true};
}
export async function sharePlace(input:unknown):Promise<ActionResult>{
 const parsed=sharingSchema.safeParse(input);if(!parsed.success)return {error:'Välj synlighet och minst en vän vid vändelning.'};
 const {client,user}=await session();if(!user)return {error:'Logga in först.'};
 const {error}=await client.rpc('set_place_sharing',{place_id:parsed.data.id,new_visibility:parsed.data.visibility,friend_ids:[...new Set(parsed.data.friends)]});
 if(error)return {error:'Delningen kunde inte sparas. Kontrollera att personerna fortfarande är dina vänner.'};
 refresh();return {success:true};
}
export async function savePost(input:unknown):Promise<ActionResult>{
 const parsed=postSchema.safeParse(input);if(!parsed.success)return {error:'Skriv 1–3 000 tecken och välj en giltig plats.'};
 const {client,user}=await session();if(!user)return {error:'Logga in först.'};
 const {id,...fields}=parsed.data;
 const result=id?await client.from('community_posts').update(fields).eq('id',id).eq('author_id',user.id).select('id').maybeSingle():await client.from('community_posts').insert({...fields,author_id:user.id}).select('id').single();
 if(result.error||!result.data)return {error:'Inlägget kunde inte sparas. Skapa en profil först och kontrollera att eventuell plats är publik.'};
 refresh();return {id:result.data.id,success:true};
}
export async function publishPost(id:string):Promise<ActionResult>{
 if(!z.uuid().safeParse(id).success)return {error:'Ogiltigt inlägg.'};
 const {client,user}=await session();if(!user)return {error:'Logga in först.'};
 const {data,error}=await client.from('community_posts').update({status:'published'}).eq('id',id).eq('author_id',user.id).select('id');
 if(error||!data?.length)return {error:'Inlägget kunde inte publiceras.'};refresh();return {success:true};
}
export async function deletePost(id:string):Promise<ActionResult>{
 if(!z.uuid().safeParse(id).success)return {error:'Ogiltigt inlägg.'};
 const {client,user}=await session();if(!user)return {error:'Logga in först.'};
 const {data:owned,error:readError}=await client.from('community_posts').select('id,community_images(path)').eq('id',id).eq('author_id',user.id).maybeSingle();
 if(readError||!owned)return {error:'Inlägget kunde inte hittas.'};
 const {data,error}=await client.from('community_posts').delete().eq('id',id).eq('author_id',user.id).select('id');
 if(error||!data?.length)return {error:'Inlägget kunde inte raderas.'};
 // Database removal immediately revokes reads; leftover files are inaccessible even if cleanup fails.
 if(owned.community_images.length){try{await createMediaAdmin().storage.from('community').remove(owned.community_images.map(image=>image.path));}catch{console.error('Community media cleanup needs retry');}}
 refresh();return {success:true};
}
export async function reportPost(id:string,reason:string):Promise<ActionResult>{
 if(!z.uuid().safeParse(id).success||!z.string().trim().min(5).max(500).safeParse(reason).success)return {error:'Beskriv anledningen med 5–500 tecken.'};
 const {client,user}=await session();if(!user)return {error:'Logga in först.'};
 const {error}=await client.from('community_reports').insert({reporter_id:user.id,post_id:id,reason:reason.trim()});
 if(error)return {error:error.code==='23505'?'Du har redan rapporterat inlägget.':'Rapporten kunde inte skickas.'};return {success:true};
}
export async function moderatePost(postId:string,reportId:string,hide:boolean):Promise<ActionResult>{
 if(!z.uuid().safeParse(postId).success||!z.uuid().safeParse(reportId).success||typeof hide!=='boolean')return {error:'Ogiltigt val.'};
 const {client,user}=await session();if(user?.app_metadata?.moderator!==true)return {error:'Moderatorbehörighet krävs.'};
 if(hide){const {error}=await client.from('community_posts').update({status:'hidden'}).eq('id',postId);if(error)return {error:'Inlägget kunde inte döljas.'};}
 const {error}=await client.from('community_reports').update({resolved:true}).eq('id',reportId).eq('post_id',postId);
 if(error)return {error:'Rapporten kunde inte avslutas.'};refresh();return {success:true};
}

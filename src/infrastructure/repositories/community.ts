import 'server-only';
import {createClient} from '../supabase/server';
import type {Profile,Friendship,Post,SharedPlace} from '@/features/community/types';
export async function getSocialContext(){
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return {user:null,profile:null,friends:[] as Profile[],edges:[] as Friendship[],people:[] as Profile[],blocked:[] as string[],error:false};
 const [profile,edges,blocks]=await Promise.all([
  client.from('profiles').select('*').eq('id',user.id).maybeSingle(),
  client.from('friendships').select('*').or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).order('created_at',{ascending:false}),
  client.from('user_blocks').select('blocked_id').eq('user_id',user.id),
 ]);
 const friendships=(edges.data??[]) as Friendship[];
 const blocked=(blocks.data??[]).map(b=>b.blocked_id as string);
 const ids=[...new Set([...friendships.flatMap(e=>[e.requester_id,e.recipient_id]),...blocked])].filter(id=>id!==user.id);
 const people=ids.length?await client.from('profiles').select('*').in('id',ids):{data:[],error:null};
 const profiles=(people.data??[]) as Profile[];
 return {user:{id:user.id,moderator:user.app_metadata?.moderator===true},profile:profile.data as Profile|null,edges:friendships,people:profiles,blocked,
  friends:profiles.filter(p=>friendships.some(e=>e.status==='accepted'&&(e.requester_id===p.id||e.recipient_id===p.id))),
  error:!!(profile.error||edges.error||blocks.error||people.error)};
}
export async function searchPeople(query:string){
 if(!/^[a-z0-9_]{2,24}$/.test(query))return {people:[] as Profile[],error:false};
 const client=await createClient();
 const {data,error}=await client.from('profiles').select('*').like('username',`${query.replaceAll('_','\\_')}%`).order('username').limit(20);
 return {people:(data??[]) as Profile[],error:!!error};
}
const postFields='id,author_id,body,status,area_id,created_at,profiles(*),community_images(id,slot),saved_areas(id,user_id,name,species_id,latitude,longitude,notes,created_at,visibility)';
export async function getCommunity(page:number,userId?:string){
 const client=await createClient();
 const [feed,drafts,places]=await Promise.all([
  client.from('community_posts').select(postFields).eq('status','published').order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*20,page*20+20),
  userId?client.from('community_posts').select(postFields).eq('author_id',userId).eq('status','draft').order('created_at',{ascending:false}).limit(20):Promise.resolve({data:[],error:null}),
  userId?client.from('saved_areas').select('id,name').eq('user_id',userId).eq('visibility','public').order('name').limit(100):Promise.resolve({data:[],error:null}),
 ]);
 return {posts:(feed.data??[]).slice(0,20) as unknown as Post[],hasMore:(feed.data?.length??0)>20,drafts:(drafts.data??[]) as unknown as Post[],places:(places.data??[]) as {id:string;name:string}[],error:!!(feed.error||drafts.error||places.error)};
}
export async function getPlaces(filter:string,userId?:string,focus?:string){
 const client=await createClient();
 let query=client.from('saved_areas').select('id,user_id,name,species_id,latitude,longitude,notes,created_at,visibility').order('created_at',{ascending:false}).limit(100);
 if(filter==='mine'&&userId)query=query.eq('user_id',userId);
 else if(filter==='friends'&&userId)query=query.eq('visibility','friends').neq('user_id',userId);
 else query=query.eq('visibility','public');
 const {data,error}=await query;
 const rows=(data??[]) as SharedPlace[];
 // A linked older place remains addressable; RLS still controls access.
 if(focus&&/^[0-9a-f-]{36}$/i.test(focus)&&!rows.some(row=>row.id===focus)){
  const {data:focused}=await client.from('saved_areas').select('id,user_id,name,species_id,latitude,longitude,notes,created_at,visibility').eq('id',focus).maybeSingle();
  if(focused&&((filter==='mine'&&focused.user_id===userId)||(filter==='friends'&&focused.visibility==='friends'&&focused.user_id!==userId)||(filter==='public'&&focused.visibility==='public')))rows.unshift(focused as SharedPlace);
 }
 const ids=[...new Set(rows.map(row=>row.user_id))];
 const profiles=ids.length?await client.from('profiles').select('*').in('id',ids):{data:[],error:null};
 const owners=new Map((profiles.data as Profile[]??[]).map(p=>[p.id,p]));
 return {places:rows.map(row=>({...row,owner:owners.get(row.user_id)})),error:!!(error||profiles.error)};
}

export async function getOwnShares(userId?:string){
 if(!userId)return {shares:[] as {area_id:string;friend_id:string}[],error:false};
 const client=await createClient();
 const {data,error}=await client.from('place_shares').select('area_id,friend_id').eq('owner_id',userId);
 return {shares:(data??[]) as {area_id:string;friend_id:string}[],error:!!error};
}

export async function getPublicProfile(username:string){
 const client=await createClient();
 const {data:profile,error}=await client.from('profiles').select('*').eq('username',username).maybeSingle();
 if(!profile||error)return {profile:null,posts:[] as Post[],error:!!error};
 const posts=await client.from('community_posts').select(postFields).eq('author_id',profile.id).eq('status','published').order('created_at',{ascending:false}).limit(20);
 return {profile:profile as Profile,posts:(posts.data??[]) as unknown as Post[],error:!!posts.error};
}

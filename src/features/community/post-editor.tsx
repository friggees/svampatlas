'use client';
import {useState,useTransition,useRef} from 'react';
import {useRouter} from 'next/navigation';
import {ImagePlus,Send} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {savePost,publishPost} from './actions';
import {IMAGE_COUNT,IMAGE_LIMIT,IMAGE_TYPES} from './schema';
import type {Post} from './types';
export function PostEditor({post,places,onDone}:{post?:Post;places:{id:string;name:string}[];onDone?:()=>void}){
 const [message,setMessage]=useState(''),[pending,startTransition]=useTransition();const [draftId,setDraftId]=useState(post?.id);
 const uploadedSlots=useRef(new Set(post?.community_images.map(i=>i.slot)??[]));
 const successfulFiles=useRef(new Set<string>());
 const formRef=useRef<HTMLFormElement>(null);const router=useRouter();
 function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);const files=form.getAll('images').filter((v):v is File=>v instanceof File&&v.size>0);
  const fileKey=(file:File)=>`${file.name}:${file.size}:${file.lastModified}`;
  const remaining=files.filter(file=>!successfulFiles.current.has(fileKey(file)));
  if(remaining.length+uploadedSlots.current.size>IMAGE_COUNT){setMessage('Du kan ha högst fyra bilder per inlägg.');return;}
  if(files.some(f=>f.size>IMAGE_LIMIT||!IMAGE_TYPES.includes(f.type))){setMessage('Välj JPG, PNG eller WebP, högst 3 MB per bild.');return;}
  startTransition(async()=>{try{
   setMessage('Sparar inlägget…');const saved=await savePost({id:draftId,body:form.get('body'),area_id:form.get('area_id')||null});
   if(saved.error||!saved.id){setMessage(saved.error??'Kunde inte spara.');return;}setDraftId(saved.id);
   for(const file of remaining){const slot=[0,1,2,3].find(i=>!uploadedSlots.current.has(i))!;setMessage(`Laddar upp bild ${uploadedSlots.current.size+1}…`);const upload=new FormData();upload.set('kind','post');upload.set('postId',saved.id);upload.set('slot',String(slot));upload.set('file',file);const response=await fetch('/api/community/media',{method:'POST',body:upload});const result=await response.json();if(!response.ok){setMessage(`${result.error} Texten är sparad som utkast. Du kan försöka igen.`);router.refresh();return;}uploadedSlots.current.add(slot);successfulFiles.current.add(fileKey(file));}
   const result=await publishPost(saved.id);if(result.error){setMessage(result.error);return;}
   setMessage(post?'Inlägget är uppdaterat.':'Ditt inlägg är publicerat.');if(!post){formRef.current?.reset();setDraftId(undefined);uploadedSlots.current.clear();successfulFiles.current.clear();}router.refresh();onDone?.();
  }catch{setMessage('Kunde inte slutföra. Texten finns kvar; försök igen.');}});
 }
 const canUpload=!post||post.status==='draft';
 return <form ref={formRef} onSubmit={submit} className="social-form post-editor"><Label htmlFor={`body-${post?.id??'new'}`}>{post?'Din berättelse':'Vad hittade du i skogen?'}</Label><textarea id={`body-${post?.id??'new'}`} name="body" placeholder="En korg kantareller, en ny stig eller bara en fin stund…" rows={4} maxLength={3000} required defaultValue={post?.body??''}/><Label htmlFor={`place-${post?.id??'new'}`}>Koppla en publik plats, valfritt</Label><select id={`place-${post?.id??'new'}`} name="area_id" defaultValue={post?.saved_areas?.visibility==='public'?post.area_id??'':''}><option value="">Ingen plats – behåll ditt svampställe för dig själv</option>{places.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>{canUpload&&<><Label htmlFor={`images-${post?.id??'new'}`}><ImagePlus size={17}/> Lägg till bilder</Label><Input id={`images-${post?.id??'new'}`} type="file" name="images" multiple accept="image/jpeg,image/png,image/webp"/><p className="small-note">Högst fyra bilder, 3 MB per bild. {post?.community_images.length?`${post.community_images.length} bilder finns redan i utkastet. `:''}GPS-information tas bort.</p></>}<div className="composer-bottom"><p className="small-note">Inlägget blir synligt för alla. En privat plats delas aldrig automatiskt.</p><Button disabled={pending}><Send size={15}/>{pending?'Sparar…':post?'Spara och publicera':'Publicera inlägg'}</Button></div><p role="status">{message}</p></form>;
}

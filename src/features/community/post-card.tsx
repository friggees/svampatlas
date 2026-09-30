'use client';
import {useState,useTransition} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {MapPin,Flag} from 'lucide-react';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Avatar,ActionButton} from './primitives';
import {PostEditor} from './post-editor';
import {deletePost,reportPost,blockUser} from './actions';
import type {Post} from './types';
export function PostCard({post,userId,canParticipate,places,canEdit=true}:{post:Post;userId?:string;canParticipate:boolean;places:{id:string;name:string}[];canEdit?:boolean}){
 const [editing,setEditing]=useState(false),[reporting,setReporting]=useState(false),[message,setMessage]=useState('');const [pending,startTransition]=useTransition();
 const own=userId===post.author_id;
 return <Card className="post-card"><header className="post-header"><Link className="person-identity" href={`/profil/${post.profiles.username}`}><Avatar profile={post.profiles}/><span><strong>{post.profiles.display_name}</strong><small>@{post.profiles.username} · <time dateTime={post.created_at}>{new Intl.DateTimeFormat('sv-SE',{dateStyle:'medium',timeZone:'Europe/Stockholm'}).format(new Date(post.created_at))}</time></small></span></Link>{post.status==='draft'&&<span className="social-chip">Utkast · bara du</span>}</header>
 {editing?<PostEditor post={post} places={places} onDone={()=>setEditing(false)}/>:<p className="post-body">{post.body}</p>}
 {!!post.community_images.length&&<div className={`post-images images-${post.community_images.length}`}>{[...post.community_images].sort((a,b)=>a.slot-b.slot).map((image,index)=><a key={image.id} href={`/api/community/media/${image.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Öppna bild ${index+1} från ${post.profiles.display_name}`}><Image src={`/api/community/media/${image.id}`} alt={`Bild ${index+1} till ${post.profiles.display_name}s inlägg`} width={800} height={600} unoptimized/></a>)}</div>}
 {post.saved_areas?.visibility==='public'&&<Link className="post-place" href={`/platser?focus=${post.saved_areas.id}`}><MapPin size={16}/>{post.saved_areas.name}<span>Visa på kartan →</span></Link>}
 <footer className="post-actions">{own?<>{canEdit?<Button variant="ghost" onClick={()=>setEditing(!editing)}>{editing?'Stäng redigering':post.status==='draft'?'Fortsätt med utkast':'Redigera'}</Button>:<Link href="/community" className="social-link">Hantera inlägget i flödet</Link>}<ActionButton variant="ghost" action={()=>deletePost(post.id)} confirm="Ta bort inlägget?" description="Texten och bilderna tas bort från communityn.">Ta bort</ActionButton></>:canParticipate?<><Button variant="ghost" onClick={()=>setReporting(!reporting)}><Flag size={14}/>Rapportera</Button><ActionButton variant="ghost" action={()=>blockUser(post.author_id,true)} confirm={`Blockera ${post.profiles.display_name}?`} description="Vänskap och privata delningar återkallas. Era inlägg döljs för varandra när ni är inloggade. Publikt innehåll kan fortfarande ses utloggat.">Blockera</ActionButton></>:null}</footer>
 {reporting&&<form className="social-form" onSubmit={event=>{event.preventDefault();const reason=String(new FormData(event.currentTarget).get('reason')??'');startTransition(async()=>{try{const result=await reportPost(post.id,reason);setMessage(result.error??'Tack. Rapporten har skickats till moderering.');if(!result.error)setReporting(false);}catch{setMessage('Rapporten kunde inte skickas.');}});}}><Label htmlFor={`report-${post.id}`}>Varför vill du rapportera inlägget?</Label><textarea id={`report-${post.id}`} name="reason" required minLength={5} maxLength={500} rows={3}/><Button disabled={pending}>Skicka rapport</Button></form>}{message&&<p role="status">{message}</p>}</Card>;
}

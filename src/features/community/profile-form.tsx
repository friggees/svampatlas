'use client';
import {useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Button} from '@/components/ui/button';
import {saveProfile} from './actions';
import {Avatar} from './primitives';
import type {Profile} from './types';
export function ProfileForm({profile}:{profile:Profile|null}){
 const [message,setMessage]=useState(''),[pending,startTransition]=useTransition();const router=useRouter();
 function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);startTransition(async()=>{
  try{const result=await saveProfile({username:form.get('username'),display_name:form.get('display_name'),bio:form.get('bio')});if(result.error){setMessage(result.error);return;}
   const file=form.get('avatar');if(file instanceof File&&file.size){const upload=new FormData();upload.set('kind','avatar');upload.set('file',file);const response=await fetch('/api/community/media',{method:'POST',body:upload});const data=await response.json();if(!response.ok){setMessage(`Profilen är sparad. ${data.error}`);router.refresh();return;}}
   setMessage('Din profil är sparad. Nu kan du lägga till vänner och dela inlägg.');router.refresh();
  }catch{setMessage('Kunde inte spara. Din inmatning finns kvar.');}
 });}
 return <form onSubmit={submit} className="social-form">{profile&&<Avatar profile={profile}/>}<Label htmlFor="display-name">Visningsnamn</Label><Input id="display-name" name="display_name" defaultValue={profile?.display_name??''} minLength={2} maxLength={60} required autoComplete="nickname"/><Label htmlFor="username">Användarnamn</Label><Input id="username" name="username" defaultValue={profile?.username??''} pattern="[a-z0-9_]{3,24}" minLength={3} maxLength={24} required aria-describedby="username-hint"/><p id="username-hint" className="small-note">3–24 små bokstäver, siffror eller understreck. Vänner hittar dig med detta namn.</p><Label htmlFor="bio">Några ord om dig</Label><textarea id="bio" name="bio" maxLength={300} rows={3} defaultValue={profile?.bio??''}/><Label htmlFor="avatar">Profilbild, valfritt</Label><Input type="file" id="avatar" name="avatar" accept="image/jpeg,image/png,image/webp"/><p className="small-note">JPG, PNG eller WebP, högst 3 MB. Din profil är publik. E-postadressen visas aldrig här.</p><Button disabled={pending}>{pending?'Sparar…':'Spara profil'}</Button><p role="status">{message}</p>{profile&&<Link className="social-link" href="/vanner">Hitta dina vänner →</Link>}</form>;
}

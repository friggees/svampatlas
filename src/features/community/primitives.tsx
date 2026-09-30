'use client';
import Image from 'next/image';
import {useState,useTransition} from 'react';
import {Button} from '@/components/ui/button';
import {AlertDialog,AlertDialogTrigger,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import type {ActionResult,Profile} from './types';
export function Avatar({profile}:{profile:Profile}){
 return <span className="social-avatar">{profile.avatar_path?<Image src={`/api/community/media/${profile.id}?kind=avatar&v=${encodeURIComponent(profile.avatar_path)}`} alt="" width={44} height={44} unoptimized/>:profile.display_name.slice(0,2).toUpperCase()}</span>;
}
export function ActionButton({children,action,confirm,description,variant='outline'}:{children:React.ReactNode;action:()=>Promise<ActionResult>;confirm?:string;description?:string;variant?:'outline'|'default'|'ghost'|'destructive'}){
 const [message,setMessage]=useState('');const [pending,startTransition]=useTransition();
 const run=()=>startTransition(async()=>{setMessage('');try{const result=await action();setMessage(result.error??'Klart.');}catch{setMessage('Något gick fel. Försök igen.');}});
 const button=<Button type="button" variant={variant} disabled={pending} onClick={confirm?undefined:run}>{pending?'Vänta…':children}</Button>;
 return <span className="social-action">{confirm?<AlertDialog><AlertDialogTrigger asChild>{button}</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirm}</AlertDialogTitle><AlertDialogDescription>{description??'Åtgärden gäller ditt konto och det valda innehållet.'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Avbryt</AlertDialogCancel><AlertDialogAction onClick={run}>Bekräfta</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>:button}{message&&<small role="status">{message}</small>}</span>;
}

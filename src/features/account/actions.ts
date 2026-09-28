'use server';
import { createClient } from '@/infrastructure/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authRedirectUrl } from './site-url';
const credentials = z.object({ email:z.email(), password:z.string().min(8).max(128), mode:z.enum(['login','signup']) });
export async function authenticate(_: {error?:string; message?:string}, form: FormData): Promise<{error?:string;message?:string}> {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success) return {error:'Ange en giltig e-postadress och ett lösenord med minst 8 tecken.'};
  const client = await createClient();
  const {email,password,mode} = parsed.data;
  if (mode === 'signup') {
    const {data,error} = await client.auth.signUp({email,password,options:{emailRedirectTo:authRedirectUrl()}});
    if (error) return {error:error.status===429?'För många försök. Vänta en stund innan du försöker igen.':'Kontot kunde inte skapas just nu. Försök igen senare.'};
    if (data.session) redirect('/utforska');
    return {message:'Kontrollera din inkorg och skräppost. Följ länken i mejlet för att bekräfta din e-postadress och komma igång. Har du redan ett konto kan du logga in.'};
  }
  const {error} = await client.auth.signInWithPassword({email,password});
  if (error) return {error:'Inloggningen misslyckades. Kontrollera uppgifterna och att e-postadressen är bekräftad.'};
  redirect('/utforska');
}
export async function resendConfirmation(_: {error?:string; message?:string}, form: FormData): Promise<{error?:string;message?:string}> {
  const email = z.email().safeParse(form.get('email'));
  if (!email.success) return {error:'Ange en giltig e-postadress.'};
  const client = await createClient();
  const {error} = await client.auth.resend({type:'signup',email:email.data,options:{emailRedirectTo:authRedirectUrl()}});
  return error ? {error:'Mejlet kunde inte skickas. Vänta en stund och försök igen.'} : {message:'Om adressen har ett konto som väntar på bekräftelse får du ett nytt mejl. Kontrollera även skräpposten.'};
}
export async function signOut() { const client=await createClient(); await client.auth.signOut(); redirect('/'); }

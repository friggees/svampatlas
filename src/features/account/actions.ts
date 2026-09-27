'use server';
import { createClient } from '@/infrastructure/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
const credentials = z.object({ email:z.email(), password:z.string().min(8).max(128), mode:z.enum(['login','signup']) });
export async function authenticate(_: {error?:string; message?:string}, form: FormData): Promise<{error?:string;message?:string}> {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success) return {error:'Ange en giltig e-postadress och ett lösenord med minst 8 tecken.'};
  const client = await createClient();
  const {email,password,mode} = parsed.data;
  if (mode === 'signup') {
    const {error} = await client.auth.signUp({email,password});
    return error ? {error:'Kontot kunde inte skapas just nu. Försök igen senare.'} : {message:'Kontrollera din e-post för att bekräfta kontot. Logga sedan in här.'};
  }
  const {error} = await client.auth.signInWithPassword({email,password});
  if (error) return {error:'Inloggningen misslyckades. Kontrollera uppgifterna och att e-postadressen är bekräftad.'};
  redirect('/');
}
export async function signOut() { const client=await createClient(); await client.auth.signOut(); redirect('/'); }

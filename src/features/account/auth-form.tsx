'use client';
import {useActionState,useState} from 'react';
import {authenticate} from './actions';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card} from '@/components/ui/card';
export function AuthForm(){
  const [mode,setMode]=useState<'login'|'signup'>('login');
  const [state,action,pending]=useActionState(authenticate,{});
  return <Card className="auth-card"><h2>{mode==='login'?'Välkommen tillbaka':'Din skogsdagbok börjar här'}</h2><p>Spara dina platser privat och hitta tillbaka nästa gång.</p><form action={action}><input type="hidden" name="mode" value={mode}/><Label htmlFor="email">E-postadress</Label><Input id="email" name="email" type="email" autoComplete="email" required/><Label htmlFor="password">Lösenord</Label><Input id="password" name="password" type="password" minLength={8} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'} required/><Button disabled={pending} type="submit">{pending?'Vänta…':mode==='login'?'Logga in':'Skapa konto'}</Button><p role="status" className={state.error?'form-error':'form-status'}>{state.error||state.message}</p></form><Button variant="ghost" onClick={()=>setMode(mode==='login'?'signup':'login')}>{mode==='login'?'Ny här? Skapa konto':'Har du redan ett konto? Logga in'}</Button></Card>;
}

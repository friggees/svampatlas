'use client';
import Link from 'next/link';
import {useActionState} from 'react';
import {Mail, ShieldCheck} from 'lucide-react';
import {authenticate,resendConfirmation} from './actions';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card} from '@/components/ui/card';

export function AuthForm({mode='login',confirmationError=false}:{mode?:'login'|'signup';confirmationError?:boolean}) {
  const [state,action,pending]=useActionState(authenticate,{});
  const [resendState,resend,resending]=useActionState(resendConfirmation,{});
  return <Card className="auth-card">
    <span className="auth-symbol"><ShieldCheck size={24}/></span>
    <h2>{mode==='login'?'Välkommen tillbaka':'Din nästa upptäckt börjar här'}</h2>
    <p>{mode==='login'?'Logga in och hitta tillbaka till dina egna svampställen.':'Skapa ett konto och samla dina favoritplatser i en privat skogsdagbok.'}</p>
    {confirmationError?<p role="alert" className="form-error">Bekräftelselänken är ogiltig eller har gått ut. Om du redan har bekräftat adressen kan du logga in. Annars kan du begära ett nytt mejl nedan.</p>:null}
    <form action={action}>
      <input type="hidden" name="mode" value={mode}/>
      <Label htmlFor="email">E-postadress</Label><Input id="email" name="email" type="email" autoComplete="email" required/>
      <Label htmlFor="password">Lösenord</Label><Input id="password" name="password" type="password" minLength={8} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'} aria-describedby="password-help" required/>
      <span id="password-help" className="auth-help">Minst 8 tecken.</span>
      <Button disabled={pending} type="submit">{pending?'Vänta…':mode==='login'?'Logga in':'Registrera dig'}</Button>
      <p role="status" className={state.error?'form-error':'form-status'}>{state.error||state.message}</p>
    </form>
    <p className="auth-switch">{mode==='login'?'Inget konto ännu? ':'Har du redan ett konto? '}<Link href={mode==='login'?'/konto?mode=signup':'/konto'}>{mode==='login'?'Registrera dig':'Logga in'}</Link></p>
    <details className="auth-resend" open={confirmationError||undefined}>
      <summary><Mail size={16}/> Saknar du bekräftelsemejlet?</summary>
      <form action={resend}>
        <Label htmlFor="resend-email">Kontots e-postadress</Label><Input id="resend-email" name="email" type="email" autoComplete="email" required/>
        <Button type="submit" variant="outline" disabled={resending}>{resending?'Skickar…':'Skicka ny bekräftelselänk'}</Button>
        <p role="status" className={resendState.error?'form-error':'form-status'}>{resendState.error||resendState.message}</p>
      </form>
    </details>
  </Card>;
}

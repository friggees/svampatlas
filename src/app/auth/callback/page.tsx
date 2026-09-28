'use client';
import {useEffect,useRef} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '@supabase/ssr';
import {supabaseUrl,supabasePublishableKey} from '@/infrastructure/supabase/config';

// Standard Supabase emails may return a browser-only URL fragment. Exchange
// those tokens for the same SSR cookies before opening any private page.
export default function EmailCallback() {
  const started=useRef(false);
  useEffect(()=>{
    if(started.current)return;
    started.current=true;
    const params=new URLSearchParams(window.location.hash.slice(1));
    const access_token=params.get('access_token');
    const refresh_token=params.get('refresh_token');
    window.history.replaceState(null,'','/auth/callback');
    async function confirm() {
      if(params.has('error') || !access_token || !refresh_token) {
        window.location.replace('/konto?error=confirmation');
        return;
      }
      try {
        const client=createBrowserClient(supabaseUrl,supabasePublishableKey,{auth:{detectSessionInUrl:false}});
        const {error}=await client.auth.setSession({access_token,refresh_token});
        window.location.replace(error?'/konto?error=confirmation':'/konto?confirmed=1');
      } catch {
        window.location.replace('/konto?error=confirmation');
      }
    }
    void confirm();
  },[]);
  return <main id="main-content" className="content-page"><h1>Bekräftar ditt konto…</h1><p role="status">Vi tar hand om din bekräftelselänk. Du skickas snart vidare.</p><p><Link href="/konto">Till inloggningen</Link></p></main>;
}

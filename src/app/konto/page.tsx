import Link from 'next/link';
import {Trees, ArrowLeft, Check} from 'lucide-react';
import {AuthForm} from '@/features/account/auth-form';
import {createClient} from '@/infrastructure/supabase/server';
import {signOut} from '@/features/account/actions';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';

export default async function Account({searchParams}:{searchParams:Promise<{mode?:string;error?:string;confirmed?:string}>}) {
  const params=await searchParams;
  const client=await createClient();
  const {data:{user}}=await client.auth.getUser();
  const mode=params.mode==='signup'?'signup':'login';
  return <div className="account-page"><header className="landing-header"><Link className="brand" href="/"><span className="brand-symbol"><Trees size={25}/></span>svampatlas</Link><Link className="text-link" href="/utforska"><ArrowLeft size={15}/> Till kartan</Link></header>
    <main id="main-content" className="account-layout"><section className="account-intro"><div className="eyebrow">DIN EGEN SKOGSDAGBOK</div><h1>Vissa ställen vill man<br/><em>hitta tillbaka till.</em></h1><p>En glänta vid stigen. En backe full av kantareller. Samla dina upptäckter på ett och samma ställe.</p><ul><li><Check size={18}/> Spara platser med egna anteckningar</li><li><Check size={18}/> Hitta tillbaka med vägbeskrivning</li><li><Check size={18}/> Dina platser är privata</li></ul><Link className="text-link" href="/arter">Lär känna svamparna i vår bildguide →</Link></section>
      {user?<Card className="auth-card"><h2>{params.confirmed==='1'?'Din e-postadress är bekräftad':'Du är inloggad'}</h2><p>{user.email}</p><p>Nu kan du spara dina egna platser.</p><Button asChild><Link href="/utforska">Börja utforska</Link></Button><Button asChild variant="outline"><Link href="/sparat">Mina platser</Link></Button><form action={signOut}><Button variant="ghost">Logga ut</Button></form></Card>:<AuthForm key={mode} mode={mode} confirmationError={!!params.error}/>}
    </main></div>;
}

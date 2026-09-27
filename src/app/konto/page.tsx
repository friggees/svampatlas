import {AppShell} from '@/components/app-shell';
import {AuthForm} from '@/features/account/auth-form';
import {createClient} from '@/infrastructure/supabase/server';
import {signOut} from '@/features/account/actions';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
export default async function Account(){const client=await createClient();const {data:{user}}=await client.auth.getUser();return <AppShell active="account"><div className="content-page"><div className="eyebrow">BARA FÖR DIG</div><h1>Mitt konto</h1>{user?<Card className="auth-card"><h2>Du är inloggad</h2><p>{user.email}</p><p>Dina sparade platser är privata.</p><form action={signOut}><Button variant="outline">Logga ut</Button></form></Card>:<AuthForm/>}</div></AppShell>;}

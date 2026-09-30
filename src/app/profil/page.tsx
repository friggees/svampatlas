import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {SocialNav} from '@/features/community/social-nav';
import {ProfileForm} from '@/features/community/profile-form';
import {getSocialContext} from '@/infrastructure/repositories/community';
export default async function ProfilePage(){const {user,profile,error}=await getSocialContext();return <AppShell active="community"><div className="content-page social-page"><div className="eyebrow">DITT ANSIKTE I COMMUNITYN</div><h1>Min profil</h1><p className="page-intro">Ett namn att känna igen. En skogsvän att hitta tillbaka till.</p><SocialNav active="profile"/><Card className="profile-card">{error?<p role="alert">Profilen kunde inte hämtas. Försök igen.</p>:user?<ProfileForm profile={profile}/>:<><h2>Logga in för att skapa din profil</h2><Button asChild><Link href="/konto">Logga in</Link></Button></>}</Card></div></AppShell>;}

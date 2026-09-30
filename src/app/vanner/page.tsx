import Link from 'next/link';
import {Search} from 'lucide-react';
import {AppShell} from '@/components/app-shell';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {SocialNav} from '@/features/community/social-nav';
import {FriendsPanel} from '@/features/community/friends-panel';
import {getSocialContext,searchPeople} from '@/infrastructure/repositories/community';
export default async function FriendsPage({searchParams}:{searchParams:Promise<{q?:string}>}){
 const params=await searchParams,query=(params.q??'').trim().toLowerCase();
 const [social,search]=await Promise.all([getSocialContext(),searchPeople(query)]);
 return <AppShell active="community"><div className="content-page social-page"><div className="eyebrow">EN SKOGSTUR BLIR FINARE TILLSAMMANS</div><h1>Dina skogsvänner.</h1><p className="page-intro">Hitta varandra och dela de platser ni vill återvända till.</p><SocialNav active="friends"/>{social.error||search.error?<Card className="social-empty" role="alert">Vännerna kunde inte hämtas. Försök igen.</Card>:!social.profile?<Card className="social-empty"><h2>{social.user?'Skapa en profil först':'Hitta dina vänner i skogen'}</h2><p>Med ett användarnamn kan andra hitta dig och skicka en vänförfrågan.</p><Button asChild><Link href={social.user?'/profil':'/konto'}>{social.user?'Skapa profil':'Logga in'}</Link></Button></Card>:<><form action="/vanner" className="friend-search"><label htmlFor="friend-query">Sök efter användarnamn</label><div><Input id="friend-query" name="q" placeholder="Till exempel skogsvan" defaultValue={query} minLength={2} maxLength={24} required pattern="[a-z0-9_]{2,24}"/><Button><Search size={17}/>Sök</Button></div><p className="small-note">Skriv minst två tecken. Upp till 20 matchningar visas.</p></form>{query&&!search.people.filter(p=>p.id!==social.user!.id).length&&<p role="status">Ingen annan användare hittades. Prova ett annat användarnamn.</p>}<FriendsPanel userId={social.user!.id} edges={social.edges} people={social.people} results={search.people} blocked={social.blocked}/></>}</div></AppShell>;
}

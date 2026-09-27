import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {getSavedAreas} from '@/infrastructure/repositories/saved-areas';
import {SavedList} from '@/features/saved-areas/saved-list';
export default async function Saved(){const {areas,signedIn,error}=await getSavedAreas();return <AppShell active="saved"><div className="content-page"><div className="eyebrow">DIN PRIVATA SAMLING</div><h1>Mina platser</h1><p className="page-intro">De små gläntorna. De välbekanta stigarna. Dina egna upptäckter.</p>{error?<Card className="empty-card"><h2>Platserna kunde inte hämtas</h2><p>Försök ladda om sidan om en stund.</p></Card>:areas.length?<SavedList areas={areas}/>:<Card className="empty-card"><h2>{signedIn?'Din nästa favoritplats väntar':'Behåll dina fyndplatser för dig själv'}</h2><p>{signedIn?'Välj en punkt på kartan och spara ditt första ställe.':'Logga in för att spara och hitta tillbaka till dina egna platser.'}</p><Button asChild><Link href={signedIn?'/':'/konto'}>{signedIn?'Utforska Botkyrka':'Logga in'}</Link></Button></Card>}</div></AppShell>;}

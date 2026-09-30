import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {Card} from '@/components/ui/card';
import {SocialNav} from '@/features/community/social-nav';
import {PlacesExplorer} from '@/features/community/places-explorer';
import {getSocialContext, getPlaces} from '@/infrastructure/repositories/community';

export default async function PlacesPage({searchParams}: {searchParams: Promise<{filter?: string; focus?: string}>}) {
  const params = await searchParams;
  const filter = ['mine', 'friends'].includes(params.filter ?? '') ? params.filter! : 'public';
  const social = await getSocialContext();
  const result = await getPlaces(filter, social.user?.id, params.focus);
  return <AppShell active="community"><div className="content-page social-page"><div className="eyebrow">HITTA TILLBAKA. UPPTÄCK TILLSAMMANS.</div>
    <h1>Platser att dela.</h1><p className="page-intro">Dina egna favoriter, en väns tips eller en plats som någon valt att öppna för alla.</p>
    <SocialNav active="places"/><nav className="place-filters" aria-label="Filtrera platser">{[{id: 'public', label: 'Publika platser'}, {id: 'friends', label: 'Delade med mig'}, {id: 'mine', label: 'Mina platser'}].map(item => <Link key={item.id} href={`/platser?filter=${item.id}`} aria-current={filter === item.id ? 'page' : undefined}>{item.label}</Link>)}</nav>
    {!social.user && filter !== 'public' ? <Card className="social-empty"><h2>Logga in för att se dina platser</h2><Link href="/konto" className="social-link">Logga in →</Link></Card> : result.error ? <Card className="social-empty" role="alert">Platserna kunde inte hämtas. Försök igen.</Card> : result.places.length ? <><p className="small-note places-count">Visar de {result.places.length} senast sparade platserna i detta urval, högst 100. Kontrollera att punkten är en lämplig startpunkt.</p><PlacesExplorer key={`${filter}-${params.focus ?? ''}`} places={result.places} focus={params.focus} userId={social.user?.id}/></> : <Card className="social-empty"><h2>{filter === 'friends' ? 'Inga delade platser ännu.' : filter === 'mine' ? 'Din nästa favoritplats väntar.' : 'Här börjar nästa upptäckt.'}</h2><p>{filter === 'friends' ? 'När en vän delar en plats med dig visas den här.' : 'Platser är privata tills ägaren själv väljer att dela dem.'}</p><Link className="social-link" href={filter === 'friends' ? '/vanner' : '/utforska'}>{filter === 'friends' ? 'Hitta vänner →' : 'Utforska kartan →'}</Link></Card>}
  </div></AppShell>;
}

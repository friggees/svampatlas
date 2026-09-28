import Image from 'next/image';
import Link from 'next/link';
import {ArrowRight, ArrowUpRight, Bookmark, Compass, MapPin, ShieldCheck, Sprout, Trees} from 'lucide-react';
import {Button} from '@/components/ui/button';
import photos from '@/features/species/photos.json';

export default function Home() {
  const photo=photos.kantarell[0];
  return <div className="landing">
    <header className="landing-header">
      <Link className="brand" href="/" aria-label="Svampatlas hem"><span className="brand-symbol"><Trees size={25}/></span>svampatlas</Link>
      <nav aria-label="Huvudnavigation"><Link className="landing-nav-link" href="#sa-fungerar-det">Så fungerar det</Link><Link className="landing-nav-link" href="/arter">Svampguiden</Link><Link href="/konto">Logga in</Link><Button asChild><Link href="/konto?mode=signup">Registrera dig <ArrowUpRight size={16}/></Link></Button></nav>
    </header>
    <main id="main-content">
      <section className="landing-hero">
        <div className="hero-copy"><div className="landing-kicker"><span className="status-dot"/> DIN NÄSTA SKOGSTUR BÖRJAR HÄR</div>
          <h1>Ut i skogen.<br/>Närmare <em>dina<br className="desktop-break"/> svampställen.</em></h1>
          <p>Hitta nya områden att utforska, lär känna svamparna och spara platserna du vill återvända till. Svampatlas är din följeslagare i Stockholms skogar.</p>
          <div className="hero-actions"><Button asChild><Link href="/konto?mode=signup">Registrera dig <ArrowRight size={18}/></Link></Button><Link className="text-link" href="/utforska">Utforska kartan <ArrowUpRight size={17}/></Link></div>
          <span className="hero-note"><ShieldCheck size={16}/> Dina svampställen stannar hos dig.</span>
        </div>
        <div className="hero-visual"><figure className="hero-photo"><Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 760px) 100vw, 50vw" priority/><div className="photo-label"><Sprout size={16}/> SKOGENS SMÅ UPPTÄCKTER</div><figcaption>Foto: <a href={photo.source}>{photo.author}</a> · <a href={photo.licenseUrl}>{photo.license}</a> · beskuren visning</figcaption></figure>
          <div className="hero-field-note"><span className="field-note-icon"><Bookmark size={21}/></span><div><span>EN PLATS ATT ÅTERVÄNDA TILL</span><strong>Din egen hemliga glänta</strong><small>Spara platsen. Behåll känslan.</small></div><ShieldCheck size={17}/></div>
          <span className="hero-coordinate"><MapPin size={14}/> Med Stockholms län som utgångspunkt</span>
        </div>
      </section>
      <div className="landing-facts"><span><strong>26</strong> kommuner att utforska</span><span><strong>10</strong> arter i bildguiden</span><span><ShieldCheck size={21}/><strong>Bara dina</strong> sparade platser</span></div>
      <section id="sa-fungerar-det" className="landing-features"><div className="section-heading"><div><div className="eyebrow">FRÅN NYFIKENHET TILL SKOGSTUR</div><h2>Lite mer koll.<br/><em>Mycket mer upptäckarlust.</em></h2></div><p>Planera hemma, utforska på plats och hitta tillbaka nästa säsong.</p></div>
        <div className="feature-grid">
          <article><span className="feature-icon"><Compass size={25}/></span><span className="feature-number">01 / UTFORSKA</span><h3>Hitta en ny väg ut.</h3><p>Välj art och kommun. Utforska markunderlag och satellitbilder för att få idéer till nästa tur.</p><Link href="/utforska">Öppna kartan <ArrowUpRight size={16}/></Link></article>
          <article><span className="feature-icon"><Sprout size={25}/></span><span className="feature-number">02 / LÄR KÄNNA</span><h3>Se de små skillnaderna.</h3><p>Bekanta dig med tio arter genom fotografier, kännetecken och källor i vår svampguide.</p><Link href="/arter">Bläddra i guiden <ArrowUpRight size={16}/></Link></article>
          <article><span className="feature-icon"><Bookmark size={25}/></span><span className="feature-number">03 / SPARA</span><h3>Glöm aldrig den där gläntan.</h3><p>Spara koordinater, ge platsen ett namn och skriv en anteckning. Dina platser syns bara för dig.</p><Link href="/konto?mode=signup">Skapa din skogsdagbok <ArrowUpRight size={16}/></Link></article>
        </div>
        <p className="landing-method">Kartan visar experimentellt markstöd, inte var svamp säkert finns. Bildguiden ersätter inte säker artbestämning. <Link href="/om">Läs om underlaget och våra källor <ArrowUpRight size={13}/></Link></p>
      </section>
      <section className="landing-cta"><Trees size={38}/><div className="eyebrow">DET BÖRJAR MED EN LITEN OMVÄG</div><h2>Nästa favoritställe<br/>väntar där ute.</h2><p>Gör plats för fler upptäckter. Och spara dem för nästa gång.</p><Button asChild><Link href="/konto?mode=signup">Registrera dig <ArrowRight size={18}/></Link></Button><Link href="/utforska">Ta en titt på kartan först →</Link></section>
    </main>
    <footer className="landing-footer"><Link className="brand" href="/"><Trees size={24}/> svampatlas</Link><span>Små upptäckter. Stora skogsupplevelser.</span><Link href="/om">Om Svampatlas & våra källor <ArrowUpRight size={14}/></Link></footer>
  </div>;
}

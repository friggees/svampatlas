import {AppShell} from '@/components/app-shell';
import {Card} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {species} from '@/features/species/catalog';
import {speciesGuide} from '@/features/species/guide';
import photos from '@/features/species/photos.json';
import {SpeciesGallery} from '@/features/species/gallery';

export default function Species() {
  return <AppShell active="species"><div className="content-page species-guide">
    <div className="eyebrow">TITTA NÄRMARE PÅ SKOGEN</div>
    <h1>Svampguiden</h1>
    <p className="page-intro">Tio arter, tre bilder av varje och detaljer att lägga märke till på nästa tur.</p>
    <p className="guide-notice">Bilder och korta kännetecken räcker inte för säker artbestämning. Ät aldrig ett fynd utifrån appen. Närstående arter kan vara mycket lika; ta hjälp av en kunnig svampkännare.</p>
    <nav className="species-index" aria-label="Hoppa till en svamp">{species.map(s=><a key={s.id} href={`#${s.id}`}>{s.name}</a>)}</nav>
    <div className="guide-grid">{species.map(s=>{
      const guide=speciesGuide[s.id];
      return <Card key={s.id} className="guide-card" id={s.id}>
        <SpeciesGallery name={s.name} photos={photos[s.id]}/>
        <div className="guide-card-content">
          <Badge variant="secondary">{s.group}</Badge>
          <h2>{s.name}</h2><p className="latin-name">{s.latin}</p>
          <h3>Tre kännetecken</h3>
          <ul className="species-traits">{guide.traits.map(trait=><li key={trait}>{trait}</li>)}</ul>
          <p className="species-comparison">{guide.note}</p>
          <a className="species-source" href={guide.source} target="_blank" rel="noreferrer">Läs artbeskrivningen hos {guide.sourceName} ↗</a>
        </div>
      </Card>;
    })}</div>
    <p className="guide-footer">Fotografier från Wikimedia Commons. Fotograf, originalkälla och licens visas under varje vald bild. Bilderna är storleksanpassade för webben; öppna bilden för att se hela motivet.</p>
  </div></AppShell>;
}

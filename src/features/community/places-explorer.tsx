'use client';

import {useState} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {MapPin, Navigation} from 'lucide-react';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {directionsUrl} from '../exploration/domain';
import {findSpecies} from '../species/catalog';
import {visibilityLabels} from './place-sharing';
import type {SharedPlace} from './types';

const PlacesMap = dynamic(() => import('./places-map'), {ssr: false, loading: () => <div className="shared-map map-placeholder">Laddar kartan…</div>});

export function PlacesExplorer({places, focus, userId}: {places: SharedPlace[]; focus?: string; userId?: string}) {
  const [selected, setSelected] = useState(focus);
  return <div className="places-explorer"><PlacesMap places={places} selectedId={selected} onSelect={id => {
    setSelected(id);
    document.getElementById(`place-${id}`)?.scrollIntoView({behavior: 'instant', block: 'nearest'});
  }}/><div className="shared-place-list">{places.map(place => <Card key={place.id} id={`place-${place.id}`} className={`shared-place-card ${selected === place.id ? 'selected' : ''}`}>
    <div className="place-card-heading"><span className="eyebrow">{findSpecies(place.species_id)?.name ?? place.species_id}</span><span className="social-chip">{visibilityLabels[place.visibility]}</span></div>
    <h2>{place.name}</h2><p className="place-owner">{place.owner ? <Link href={`/profil/${place.owner.username}`}>Av {place.owner.display_name} · @{place.owner.username}</Link> : 'Av en Svampatlas-användare'}</p>
    <p className="post-body">{place.notes || 'En plats att återvända till.'}</p>
    <p className="coordinates">{place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}</p>
    <div className="social-buttons"><Button variant="outline" aria-pressed={selected === place.id} onClick={() => setSelected(place.id)}><MapPin size={16}/>Visa på kartan</Button>
      <Button variant="outline" asChild><a href={directionsUrl(place)} target="_blank" rel="noopener noreferrer"><Navigation size={16}/>Vägbeskrivning</a></Button>
      {place.user_id === userId && <Link href="/sparat" className="social-link">Hantera delning</Link>}
    </div>
  </Card>)}</div></div>;
}

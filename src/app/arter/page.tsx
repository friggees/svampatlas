import {AppShell} from '@/components/app-shell';
import {Card} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Sprout} from 'lucide-react';
import {species} from '@/features/species/catalog';
export default function Species(){return <AppShell active="species"><div className="content-page"><div className="eyebrow">MÅNGA SKÄL ATT GÅ UT</div><h1>Svampguiden</h1><p className="page-intro">Tio arter att utforska i piloten, för svampintresserade och fotografer.</p><p className="guide-notice">Katalogen är ännu inte en artbestämningsguide. Artprofiler och habitatbedömningar granskas innan de publiceras. Kategorierna är inte ett besked om att ett eget fynd är ätligt.</p><div className="species-grid">{species.map(s=><Card key={s.id} className="species-card"><div className="species-art" style={{color:s.color}}><Sprout size={55} strokeWidth={1}/></div><Badge variant="secondary">{s.group}</Badge><h2>{s.name}</h2><p className="latin-name">{s.latin}</p><span className="small-note">Habitatprofil under arbete</span></Card>)}</div></div></AppShell>;}

'use client';
import {Card} from '@/components/ui/card';
import {ActionButton} from './primitives';
import {moderatePost} from './actions';
import {PostCard} from './post-card';
import type {Post} from './types';
export type Report={id:string;post_id:string;reason:string;created_at:string;community_posts:Post};
export function ModerationPanel({reports}: {reports:Report[]}){
  return <div className="moderation-list">{reports.map(report=><section key={report.id}>
    <Card className="moderation-report"><h2>Rapporterat innehåll</h2><p className="post-body">{report.reason}</p><p className="small-note">{new Intl.DateTimeFormat('sv-SE',{dateStyle:'medium',timeZone:'Europe/Stockholm'}).format(new Date(report.created_at))}</p>
      <div className="social-buttons"><ActionButton variant="destructive" confirm="Dölj inlägget?" description="Inlägget och bilderna försvinner från det publika flödet. Författaren kan inte publicera det igen." action={()=>moderatePost(report.post_id,report.id,true)}>Dölj inlägg</ActionButton><ActionButton action={()=>moderatePost(report.post_id,report.id,false)}>Avsluta utan åtgärd</ActionButton></div>
    </Card>{report.community_posts&&<PostCard post={report.community_posts} canParticipate={false} places={[]}/>}</section>)}</div>;
}

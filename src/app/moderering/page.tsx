import {notFound} from 'next/navigation';
import {AppShell} from '@/components/app-shell';
import {Card} from '@/components/ui/card';
import {getSocialContext} from '@/infrastructure/repositories/community';
import {createClient} from '@/infrastructure/supabase/server';
import {ModerationPanel,type Report} from '@/features/community/moderation-panel';
export default async function ModerationPage(){
  const social=await getSocialContext();
  if(!social.user?.moderator)notFound();
  const client=await createClient();
  const {data,error}=await client.from('community_reports').select('id,post_id,reason,created_at,community_posts(id,author_id,body,status,area_id,created_at,profiles(*),community_images(id,slot))').eq('resolved',false).order('created_at').limit(100);
  return <AppShell active="community"><div className="content-page social-page"><div className="eyebrow">COMMUNITY</div><h1>Moderering</h1><p className="page-intro">Granska rapporter och dölj olämpliga inlägg. Upp till 100 öppna rapporter visas åt gången.</p>
    {error?<Card className="social-empty" role="alert">Rapporterna kunde inte hämtas.</Card>:data?.length?<ModerationPanel reports={data as unknown as Report[]}/>:<Card className="social-empty"><h2>Inga öppna rapporter.</h2><p>Allt är granskat för tillfället.</p></Card>}
  </div></AppShell>;
}

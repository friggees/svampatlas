import Link from 'next/link';
import {notFound} from 'next/navigation';
import {AppShell} from '@/components/app-shell';
import {Card} from '@/components/ui/card';
import {SocialNav} from '@/features/community/social-nav';
import {Avatar} from '@/features/community/primitives';
import {PostCard} from '@/features/community/post-card';
import {getPublicProfile,getSocialContext} from '@/infrastructure/repositories/community';

export default async function PublicProfile({params}: {params:Promise<{username:string}>}){
  const {username}=await params;
  if(!/^[a-z0-9_]{3,24}$/.test(username))notFound();
  const [result,social]=await Promise.all([getPublicProfile(username),getSocialContext()]);
  if(!result.profile&&!result.error)notFound();
  return <AppShell active="community"><div className="content-page social-page"><SocialNav active="profile"/>
    {result.error?<Card className="social-empty" role="alert">Profilen kunde inte hämtas. Försök igen.</Card>:result.profile&&<>
      <Card className="public-profile"><Avatar profile={result.profile}/><div><div className="eyebrow">@{result.profile.username}</div><h1>{result.profile.display_name}</h1><p className="post-body">{result.profile.bio||'En skogsvän på Svampatlas.'}</p></div>
        <Link className="social-link" href={social.user?.id===result.profile.id?'/profil':`/vanner?q=${result.profile.username}`}>{social.user?.id===result.profile.id?'Redigera profil':'Visa vänstatus →'}</Link>
      </Card><div className="feed-heading"><h2>Senaste publika inlägg</h2></div>
      {result.posts.length?result.posts.map(post=><PostCard key={post.id} post={post} userId={social.user?.id} canParticipate={!!social.profile} places={[]} canEdit={false}/>):<Card className="social-empty"><p>Inga publika inlägg att visa.</p></Card>}
    </>}
  </div></AppShell>;
}

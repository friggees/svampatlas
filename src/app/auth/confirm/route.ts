import {NextResponse, type NextRequest} from 'next/server';
import {createClient} from '@/infrastructure/supabase/server';

export async function GET(request:NextRequest) {
  const params=request.nextUrl.searchParams;
  const tokenHash=params.get('token_hash');
  const code=params.get('code');
  const client=await createClient();
  // Token hashes work across devices; code exchange supports PKCE email links.
  const result=tokenHash && params.get('type')==='email'
    ? await client.auth.verifyOtp({token_hash:tokenHash,type:'email'})
    : code ? await client.auth.exchangeCodeForSession(code) : null;
  const destination=result && !result.error?'/konto?confirmed=1':'/konto?error=confirmation';
  // A relative Location preserves the browser's public host behind a proxy,
  // including 127.0.0.1 in local tests, so the new session cookie stays valid.
  const response=new NextResponse(null,{status:303,headers:{Location:destination}});
  response.headers.set('Cache-Control','private, no-store');
  response.headers.set('Referrer-Policy','no-referrer');
  return response;
}

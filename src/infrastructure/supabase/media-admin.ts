import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {supabaseUrl} from './config';
// Only for processed media. All caller identity and row access checks use the session client first.
export function createMediaAdmin(){
 const key=process.env.SUPABASE_SECRET_KEY;
 if(!key)throw new Error('Media service is not configured');
 return createClient(supabaseUrl,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const users=[];
try {
  const clients=[];
  for(let i=0;i<2;i++){
    const email=`svampatlas-test-${randomUUID()}@example.com`,password=`Test-${randomUUID()}!`;
    const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});
    if(error) throw new Error(`Test user creation failed: ${error.code??error.status}`);
    users.push(data.user.id);
    const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const signed=await client.auth.signInWithPassword({email,password});assert.equal(signed.error,null);clients.push(client);
  }
  const [a,b]=clients;
  const input={user_id:users[0],name:'Automatiskt isoleringstest',species_id:'kantarell',latitude:59.198,longitude:17.834,notes:'Synthetic test, removed after verification'};
  const inserted=await a.from('saved_areas').insert(input).select('id').single();assert.equal(inserted.error,null);const id=inserted.data.id;
  const own=await a.from('saved_areas').select('id').eq('id',id);assert.equal(own.data.length,1);
  const other=await b.from('saved_areas').select('id').eq('id',id);assert.deepEqual(other.data,[]);
  const overwrite=await b.from('saved_areas').update({name:'Forbidden'}).eq('id',id).select();assert.deepEqual(overwrite.data,[]);
  const steal=await a.from('saved_areas').update({user_id:users[1]}).eq('id',id);assert.ok(steal.error);
  const forged=await b.from('saved_areas').insert(input);assert.ok(forged.error);
  const deleteOther=await b.from('saved_areas').delete().eq('id',id).select();assert.deepEqual(deleteOther.data,[]);
  const anon=createClient(url,key,{auth:{persistSession:false}});const anonRead=await anon.from('saved_areas').select('id').eq('id',id);assert.equal(anonRead.error,null);assert.deepEqual(anonRead.data,[]);
  const removed=await a.from('saved_areas').delete().eq('id',id).select();assert.equal(removed.data.length,1);
  console.log('PASS: auth, create/read/delete, anonymous denial, cross-user isolation, forged owner and owner reassignment.');
} finally {
  for(const id of users){const {error}=await admin.auth.admin.deleteUser(id);if(error) throw new Error('Test user cleanup failed');}
  console.log('Synthetic test accounts cleaned up.');
}

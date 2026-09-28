import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

// Run after /auth/confirm is deployed. Only these four fields are managed here.
const token=process.env.SUPABASE_ACCESS_TOKEN;
if(!token)throw new Error('Set SUPABASE_ACCESS_TOKEN securely before running this script.');
const endpoint='https://api.supabase.com/v1/projects/cyyozcmhlewapesojvot/config/auth';
const desired={
  site_url:'https://svampatlas.vercel.app',
  uri_allow_list:'https://svampatlas.vercel.app/auth/confirm,http://localhost:3001/auth/confirm,http://127.0.0.1:3001/auth/confirm',
  mailer_subjects_confirmation:'Bekräfta din e-postadress – Svampatlas',
  mailer_templates_confirmation_content:await readFile(new URL('../supabase/templates/confirmation.html',import.meta.url),'utf8'),
};
const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
const read=await fetch(endpoint,{headers});
if(!read.ok)throw new Error(`Auth config read failed: ${read.status}`);
const before=await read.json();
if(process.argv.includes('--apply')) {
  const result=await fetch(endpoint,{method:'PATCH',headers,body:JSON.stringify(desired)});
  if(!result.ok)throw new Error(`Auth config update failed: ${result.status}`);
  const verify=await fetch(endpoint,{headers});
  if(!verify.ok)throw new Error(`Auth config verification failed: ${verify.status}`);
  const actual=await verify.json();
  for(const [key,value] of Object.entries(desired))assert.equal(actual[key],value,`${key} must match`);
  assert.equal(actual.mailer_autoconfirm,before.mailer_autoconfirm,'Preserve email confirmation requirement');
  console.log('PASS: production Site URL, exact redirects and Swedish confirmation template verified.');
} else {
  console.log('Fields to update:',Object.keys(desired).filter(key=>before[key]!==desired[key]));
  console.log('Use --apply after deploying the confirmation route.');
}

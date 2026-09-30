import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {parseArgs} from 'node:util';

// Run after /auth/confirm is deployed. Template changes require custom SMTP.
const {values}=parseArgs({options:{
  'site-url':{type:'string',default:'https://svampatlas.vercel.app'},
  'preview':{type:'boolean',default:false},
  'apply':{type:'boolean',default:false},
  'with-template':{type:'boolean',default:false},
}});
assert.ok(!(values.preview&&values.apply),'--preview cannot be combined with --apply');
const site=new URL(values['site-url']);
assert.ok(site.protocol==='https:'&&!site.username&&!site.password&&site.pathname==='/'&&!site.search&&!site.hash,
  '--site-url must be an HTTPS origin without credentials, path, query or fragment');
const token=process.env.SUPABASE_ACCESS_TOKEN;
const endpoint='https://api.supabase.com/v1/projects/cyyozcmhlewapesojvot/config/auth';
const desired={
  site_url:site.origin,
  uri_allow_list:[...new Set([
    `${site.origin}/auth/confirm`,
    'https://svampatlas.vercel.app/auth/confirm',
    'http://localhost:3001/auth/confirm',
    'http://127.0.0.1:3001/auth/confirm',
  ])].join(','),
};
if(values['with-template']) {
  desired.mailer_subjects_confirmation='Bekräfta din e-postadress – Svampatlas';
  desired.mailer_templates_confirmation_content=await readFile(new URL('../supabase/templates/confirmation.html',import.meta.url),'utf8');
}
const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
if(values.preview) {
  console.log(JSON.stringify({project:'cyyozcmhlewapesojvot',desired},null,2));
  process.exit(0);
}
if(!token)throw new Error('Set SUPABASE_ACCESS_TOKEN securely before running this script, or use --preview offline.');
const read=await fetch(endpoint,{headers});
if(!read.ok)throw new Error(`Auth config read failed: ${read.status}`);
const before=await read.json();
console.log(JSON.stringify({siteUrl:before.site_url,customSmtpConfigured:!!before.smtp_host,emailConfirmationRequired:before.mailer_autoconfirm===false}));
if(values.apply) {
  if(values['with-template'])assert.ok(before.smtp_host,'Configure custom SMTP before applying the email template.');
  const result=await fetch(endpoint,{method:'PATCH',headers,body:JSON.stringify(desired)});
  if(!result.ok) {
    const detail=await result.json().catch(()=>({message:'No error detail'}));
    throw new Error(`Auth config update failed: ${result.status}; ${String(detail.message??'Validation failed').slice(0,1000)}`);
  }
  const verify=await fetch(endpoint,{headers});
  if(!verify.ok)throw new Error(`Auth config verification failed: ${verify.status}`);
  const actual=await verify.json();
  for(const [key,value] of Object.entries(desired))assert.equal(actual[key],value,`${key} must match`);
  assert.equal(actual.mailer_autoconfirm,before.mailer_autoconfirm,'Preserve email confirmation requirement');
  console.log(`PASS: ${Object.keys(desired).join(', ')} verified; email confirmation requirement preserved.`);
} else {
  console.log('Fields to update:',Object.keys(desired).filter(key=>before[key]!==desired[key]));
  console.log('Use --apply after deploying the confirmation route.');
}

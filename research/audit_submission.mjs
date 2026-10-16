import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {assess} from '../review/assessment.mjs';

// Local inspection only: no model call, production packaging or approval.
const run='runs/2026-10-16T04-24-58-255Z-ee63f048';
const expected='4696f6228ecb7306980ef87f890f920a62e2400b596b383d2c339e60b18dee24';
const git=args=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,maxBuffer:30000000});
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const result=assess(run);
if(!result.passed||result.review_id!==expected)throw new Error('The frozen review content changed or failed assessment');
const approval=fs.existsSync(run+'/approval.json')?JSON.parse(fs.readFileSync(run+'/approval.json','utf8')):null;
const approved=approval?.decision==='approve'&&approval.review_id===result.review_id;
const packaged=fs.existsSync(run+'/package/manifest.json');
if(approval&&!approved)throw new Error('Approval is stale or invalid');
if(packaged&&(!approved||JSON.parse(fs.readFileSync(run+'/package/manifest.json','utf8')).review_id!==result.review_id))throw new Error('Package is stale or lacks matching approval');
git(['diff','--exit-code','--','README.md','ARCHITECTURE.md']);
git(['check-ignore','.env']);
if(fs.existsSync('.env'))process.loadEnvFile('.env');
const key=process.env.PARLEY_API_KEY?.trim();
if(!key||key.length<8)throw new Error('The configured credential is unavailable for the private exact-match scan');
const files=git(['ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(Boolean);
if(files.some(p=>p==='.env'||p.startsWith('.env.')&&p!=='.env.example'))throw new Error('A private environment file is eligible for submission');
let scanned=0;
for(const file of files){
 // The index remains owned by the store component; inspect its exported records below.
 if(file==='data/evidence/index.json'||!fs.statSync(file).isFile())continue;
 if(fs.readFileSync(file).includes(Buffer.from(key)))throw new Error('Configured credential detected in a submission candidate; value suppressed');
 scanned++;
}
const bash=process.env.BASH_EXE||(process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'bash');
const exported=execFileSync(bash,['data/store.sh','list'],{encoding:'utf8',windowsHide:true,maxBuffer:30000000});
if(exported.includes(key))throw new Error('Configured credential detected in exported store records; value suppressed');
const docs=['SUBMISSION.md',...fs.readdirSync('docs').filter(x=>x.endsWith('.md')).map(x=>'docs/'+x)];
const broken=[];
for(const doc of docs){
 const content=fs.readFileSync(doc,'utf8');
 for(const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
  const target=match[1].split('#')[0];
  if(!target||/^[a-z]+:/i.test(target))continue;
  if(!fs.existsSync(path.resolve(path.dirname(doc),decodeURIComponent(target))))broken.push({doc,target});
 }
}
if(broken.length)throw new Error('Broken documentation links: '+JSON.stringify(broken));
const artifacts=['briefs.jsonl','decisions.jsonl','eligible.jsonl','articles/01.md','articles/02.md','articles/03.md','video_scripts/01.md','video_scripts/02.md','video_scripts/03.md'].map(p=>({path:run+'/'+p,sha256:digest(run+'/'+p)}));
const audit={checked_at:new Date().toISOString(),review_passed:true,review_id:result.review_id,student_approval:approved,production_package:packaged,course_instructions_unchanged:true,documentation_links:'passed',configured_key_scan:{candidate_files_scanned:scanned,matches:0,index_access:'Store list interface only; historical index structure was not directly scanned',scope:'Exact configured Parley key; not a general secret detector'},artifacts};
fs.writeFileSync('docs/AUDIT_RESULT.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({review_id:audit.review_id,review_unchanged:true,documentation_links:'passed',configured_key_matches:0,files_scanned:scanned,approval:approved,package:packaged}));

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

// Offline replay of actual retained evidence, not a new live collection or AI run.
const root=process.cwd();
const baseline='runs/2026-10-16T04-24-58-255Z-ee63f048';
const read=p=>fs.readFileSync(p,'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const items=read(baseline+'/eligible.jsonl');
const withheld=items.find(x=>x.url==='https://blog.cloudflare.com/deno-joins-cloudflare/');
assert.ok(withheld);
const stamp=new Date().toISOString();
const run='runs/withheld-replay-'+stamp.replace(/[:.]/g,'-');
fs.mkdirSync(run,{recursive:true});
fs.mkdirSync('test-output',{recursive:true});
const isolated=fs.mkdtempSync(path.join(root,'test-output','withheld-'));
for(const name of ['lib','processing'])fs.cpSync(name,path.join(isolated,name),{recursive:true});
fs.mkdirSync(path.join(isolated,'data'),{recursive:true});
for(const name of ['store.sh','store.mjs'])fs.copyFileSync('data/'+name,path.join(isolated,'data',name));
fs.copyFileSync('package.json',path.join(isolated,'package.json'));
for(const row of items)for(const asset of [row.text_path,row.segments_path].filter(Boolean)){
  const dest=path.join(isolated,asset);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(asset,dest);
}
const meta={run_id:path.basename(run),started_at:stamp,as_of_date:'2026-10-16',mode:'replay',previous_run_id:path.basename(baseline),note:'Historical evidence-date replay; execution time is actual. Deno withheld only from isolated baseline. No new AI decisions or publication generated.'};
fs.mkdirSync(path.join(isolated,run),{recursive:true});
fs.writeFileSync(path.join(isolated,run,'run.json'),JSON.stringify(meta,null,2));
const bash=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'bash';
const stream=rows=>rows.map(x=>JSON.stringify(x)+'\n').join('');
function call(script,args=[],input=''){
  const r=spawnSync(bash,[script,...args],{cwd:isolated,input,encoding:'utf8',windowsHide:true,env:{...process.env,PIPELINE_RUN_DIR:run},maxBuffer:20e6});
  if(r.status!==0)throw new Error(r.stderr||String(r.error));
  return r.stdout;
}
call('data/store.sh',['init']);
const initial=items.filter(x=>x.item_id!==withheld.item_id);
fs.writeFileSync(run+'/baseline-items.jsonl',stream(initial));
fs.writeFileSync(run+'/withheld-item.jsonl',stream([withheld]));
fs.writeFileSync(run+'/baseline-changes.jsonl',call('data/store.sh',['upsert',run],stream(initial)));
fs.writeFileSync(run+'/before.jsonl',call('data/store.sh',['list']));
const update=call('data/store.sh',['upsert',run],stream(items));
fs.writeFileSync(run+'/introduced-changes.jsonl',update);
const replay=call('data/store.sh',['upsert',run],stream(items));
fs.writeFileSync(run+'/duplicate-changes.jsonl',replay);
const corpus=call('data/store.sh',['list']);
fs.writeFileSync(run+'/after.jsonl',corpus);
fs.writeFileSync(run+'/eligible.jsonl',call('processing/filter_items.sh',[run],corpus));
const count=s=>s.trim().split('\n').map(JSON.parse).reduce((a,x)=>(a[x.change]=(a[x.change]||0)+1,a),{});
assert.deepEqual(count(update),{unchanged:56,new:1});
assert.deepEqual(count(replay),{unchanged:57});
assert.equal(read(run+'/eligible.jsonl').length,57);
const decision=read(baseline+'/decisions.jsonl').find(x=>x.item_id===withheld.item_id);
const claims=read(baseline+'/briefs.jsonl').flatMap(b=>b.claims.filter(c=>c.evidence.some(e=>e.item_id===withheld.item_id)).map(c=>({piece_id:b.piece_id,claim_id:c.claim_id,statement:c.statement})));
fs.writeFileSync(run+'/editorial-impact.json',JSON.stringify({attribution:'Assistant analysis of retained decisions; no new student judgment or model execution',prior_decision:decision,claims_supported_after_introduction:claims,before:'These claims lack the withheld evidence in the isolated baseline and must not be supported from it.',after:'Introducing the eligible Deno source restores their evidence. Historical acceptance remains subject to the student policy: distinguish roadmap from shipped capabilities.'},null,2));
fs.cpSync(path.join(isolated,run),run,{recursive:true});
const result={...meta,finished_at:new Date().toISOString(),baseline_count:56,introduction:count(update),duplicate_replay:count(replay),eligible_after:57,ai_calls:0,incremental_model_cost_usd:0,production_store_modified:false};
fs.writeFileSync(run+'/result.json',JSON.stringify(result,null,2)+'\n');
fs.writeFileSync('docs/WITHHELD_REPLAY.md',`# Previously withheld evidence replay\n\nThis is an offline, historical-date replay of retained real sources, not a third live run. Executed ${stamp}.\n\nAn isolated store starts with 56 items, withholding the Deno announcement. Introducing the full corpus yields **1 new and 56 unchanged** items; repeating it yields **57 unchanged**. All 57 pass the historical October 16 freshness window. The production store and approved drafts were not modified. No AI calls were made.\n\n[Results](../${run}/result.json) · [Introduced changes](../${run}/introduced-changes.jsonl) · [Duplicate replay](../${run}/duplicate-changes.jsonl) · [Editorial impact](../${run}/editorial-impact.json)\n\nWithout the withheld source, the Deno claims in piece 03 cannot use that evidence. Adding it restores the source support; the archived acceptance and the student's roadmap qualification explain its editorial use. This mapping reuses actual decisions; it is not a fresh model selection.\n\nReproduce from the repository root: \`node research/demonstrate_withheld.mjs\`. Each execution creates a separate replay directory and uses the real Bash store/filter interfaces.\n`);
console.log(JSON.stringify({run,...result}));

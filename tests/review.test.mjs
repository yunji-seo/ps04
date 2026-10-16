import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd();
function put(dir,p,value){const target=path.join(dir,p);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,typeof value==='string'?value:JSON.stringify(value));}
const jsonl=rows=>rows.map(JSON.stringify).join('\n')+'\n';
function fixture(){
 fs.mkdirSync('test-output',{recursive:true});const dir=fs.mkdtempSync(path.join(root,'test-output','review-'));
 for(const folder of ['lib','review','publishing','processing'])fs.cpSync(folder,path.join(dir,folder),{recursive:true});
 const run='runs/fictional-review-test';
 put(dir,`${run}/run.json`,{run_id:'fictional-review-test',started_at:'2026-10-08T12:00:00Z',as_of_date:'2026-10-08',mode:'example',previous_run_id:null});
 const items=Array.from({length:12},(_,i)=>({item_id:`fictional-${i}`,version_id:`fictional-v${i}`,source_id:`fictional-${i}`,publisher_id:`fictional-publisher-${i}`,kind:['feed','youtube','podcast'][i%3],title:`Fictional test item ${i}`,url:`https://example.test/${i}`,published_at:'2026-10-07T12:00:00Z',retrieved_at:'2026-10-08T12:00:00Z',media_url:null,text_path:`data/assets/fictional-${i}.txt`,segments_path:i%3?`data/assets/fictional-${i}.json`:null}));
 for(const item of items){put(dir,item.text_path,'Fictional measurement supports this test only.');if(item.segments_path)put(dir,item.segments_path,[{segment_id:'s1',start_seconds:1,end_seconds:2,text:'Fictional measurement supports this test only.'}]);}
 put(dir,`${run}/eligible.jsonl`,jsonl(items));
 put(dir,`${run}/decisions.jsonl`,jsonl(items.map(item=>({item_id:item.item_id,version_id:item.version_id,decision:'accept',reason:'Fictional fixture only',piece_ids:['01','02','03']}))));
 const briefs=['01','02','03'].map(piece_id=>({piece_id,title:`Fictional piece ${piece_id}`,question:'Fixture question',argument:`Distinct fixture argument ${piece_id}`,synthesis:'Synthetic relationship for testing only',limitations:'Not actual evidence',claims:[{claim_id:`${piece_id}-c1`,statement:'Fictional synthesis',type:'inference',evidence:items.slice(0,3).map(item=>({item_id:item.item_id,version_id:item.version_id,locator:item.kind==='feed'?{type:'text',quote:'Fictional measurement'}:{type:'segment',segment_id:'s1'}}))}]}));
 put(dir,`${run}/briefs.jsonl`,jsonl(briefs));
 for(const kind of ['articles','video_scripts']){
  const entries=briefs.map(b=>({piece_id:b.piece_id,path:`${run}/${kind}/${b.piece_id}.md`,claim_ids:[`${b.piece_id}-c1`]}));
  put(dir,`${run}/${kind}.jsonl`,jsonl(entries));
  for(const entry of entries)put(dir,entry.path,`# Fictional test\nAs of 2026-10-08. Fictional synthesis [${entry.claim_ids[0]}].\n`);
 }
 return {dir,run};
}
function invoke(f,script){return spawnSync(process.execPath,[script,f.run],{cwd:f.dir,encoding:'utf8'});}
function check(f){const result=invoke(f,'review/check_content.mjs');assert.equal(result.status,0,result.stderr);const value=JSON.parse(result.stdout);put(f.dir,`${f.run}/review.json`,value);return value;}
function approveFixture(f,review){put(f.dir,`${f.run}/approval.json`,{review_id:review.review_id,decision:'approve',reviewer:'Fictional test reviewer — example data only',reviewed_at:'2026-10-08T14:00:00Z',notes:'Automated test fixture, not student approval or publication evidence'});}
test('completed negative assessment exits zero and reports broken evidence',()=>{
 const f=fixture();const item=JSON.parse(fs.readFileSync(path.join(f.dir,f.run,'eligible.jsonl'),'utf8').split('\n')[0]);
 put(f.dir,item.text_path,'The quoted passage was removed.');const review=check(f);assert.equal(review.passed,false);assert.ok(review.issues.some(x=>x.message.includes('quote does not resolve')));
});
test('packaging requires approval and rejects changed reviewed inputs even when called directly',()=>{
 const f=fixture(),review=check(f);assert.equal(review.passed,true,JSON.stringify(review.issues));
 const denied=invoke(f,'publishing/prepare_package.mjs');assert.equal(denied.status,1);assert.match(denied.stderr,/approval is missing/);
 approveFixture(f,review);assert.equal(invoke(f,'publishing/prepare_package.mjs').status,0);
 fs.appendFileSync(path.join(f.dir,f.run,'articles/01.md'),'Changed after review.');
 const stale=invoke(f,'publishing/prepare_package.mjs');assert.equal(stale.status,1);assert.match(stale.stderr,/stale/);
 const next=check(f);assert.notEqual(next.review_id,review.review_id);
});
test('packaging preserves reviewed drafts and existing publication link entries',()=>{
 const f=fixture(),review=check(f);approveFixture(f,review);
 const draftPath=path.join(f.dir,f.run,'articles/01.md'),before=fs.readFileSync(draftPath,'utf8');
 assert.equal(invoke(f,'publishing/prepare_package.mjs').status,0);
 const linksPath=`${f.run}/package/publication_links.json`;
 const links=JSON.parse(fs.readFileSync(path.join(f.dir,linksPath),'utf8'));links[0].substack_url='https://example.test/fictional-link';put(f.dir,linksPath,links);
 assert.equal(invoke(f,'publishing/prepare_package.mjs').status,0);
 assert.equal(fs.readFileSync(draftPath,'utf8'),before);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.dir,linksPath),'utf8')),links);
 const packaged=fs.readFileSync(path.join(f.dir,f.run,'package/articles/01.md'),'utf8');assert.ok(!packaged.includes('[01-c1]'));assert.ok(packaged.includes('[Source 1]'));
});
test('changes to referenced assets invalidate the review fingerprint',()=>{
 const f=fixture(),before=check(f);fs.appendFileSync(path.join(f.dir,'data/assets/fictional-0.txt'),' Additional context.');const after=check(f);assert.notEqual(before.review_id,after.review_id);
});
test('summary preserves entrypoint failure while recognizing a current recovery, and rejects stale review',()=>{
 const f=fixture();fs.cpSync('reporting',path.join(f.dir,'reporting'),{recursive:true});check(f);
 const log=(stage,start,finish,exit_code)=>({stage,started_at:start,finished_at:finish,exit_code,status:exit_code?'failed':'completed',errors:exit_code?['Deliberate fictional failure']:[],tools:['node'],models:[],cost_usd:0});
 put(f.dir,`${f.run}/logs/fictional-entrypoint.json`,log('run','2026-10-08T12:00:00Z','2026-10-08T12:01:00Z',1));
 put(f.dir,`${f.run}/logs/fictional-recovery.json`,log('workflows/create_series','2026-10-08T13:00:00Z','2026-10-08T13:01:00Z',0));
 const first=invoke(f,'reporting/summarize_run.mjs');assert.equal(first.status,0,first.stderr);
 const report=JSON.parse(first.stdout);assert.equal(report.status,'awaiting_review_after_recovery');assert.equal(report.recovery.original_entrypoint_status,'failed');assert.ok(report.failure_history.some(x=>x.stage==='run'));
 fs.appendFileSync(path.join(f.dir,f.run,'articles/01.md'),'Changed after automated check.');
 const stale=JSON.parse(invoke(f,'reporting/summarize_run.mjs').stdout);assert.equal(stale.status,'failed');assert.equal(stale.review_current,false);assert.equal(stale.recovery,null);
});

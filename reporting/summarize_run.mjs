import fs from 'node:fs';
import {InputError,requiredRun,readJson,readLines,safePath,emit,stage} from '../lib/common.mjs';
import {assess} from '../review/assessment.mjs';
const [runDir,...extra]=process.argv.slice(2);
await stage('reporting/summarize_run',runDir||'runs/invalid-invocations',async receipt=>{
 if(extra.length)throw new InputError('Usage: summarize_run.sh RUN_DIR');
 const meta=requiredRun(runDir);
 const load=p=>fs.existsSync(safePath(`${runDir}/${p}`))?readLines(`${runDir}/${p}`):null;
 const streams=Object.fromEntries(['candidates','items','changes','eligible','exclusions','decisions','articles','video_scripts'].map(k=>[k,load(`${k}.jsonl`)]));
 const count=k=>streams[k]?.length??null;
 const subset=(k,field,value)=>streams[k]?.filter(x=>x[field]===value).length??null;
 const logs=fs.existsSync(safePath(`${runDir}/logs`))?fs.readdirSync(safePath(`${runDir}/logs`)).filter(x=>x.endsWith('.json')).map(x=>readJson(`${runDir}/logs/${x}`)):[];
 const last={};for(const log of logs.sort((a,b)=>a.started_at.localeCompare(b.started_at)))last[log.stage]=log;
 // Shell redirection creates an empty file even when an AI stage fails before producing records.
 // That is an unknown result, not a measured zero accepted items or completed drafts.
 for(const [stream,owner]of [['decisions','editorial/select_items'],['articles','content/write_articles'],['video_scripts','content/write_video_scripts']]){
  if(streams[stream]?.length===0&&last[owner]?.exit_code!==0)streams[stream]=null;
 }
 const failures=Object.values(last).filter(x=>x.exit_code!==0&&x.outcome!=='not_found').map(x=>({stage:x.stage,status:x.status,errors:x.errors}));
 const checked=fs.existsSync(safePath(`${runDir}/review.json`))?readJson(`${runDir}/review.json`):null;
 const fresh=checked?.passed?assess(runDir):null;
 const reviewCurrent=!!fresh?.passed&&fresh.review_id===checked.review_id;
 const ready=fs.existsSync(safePath(`${runDir}/package/manifest.json`))&&reviewCurrent;
 const uniqueItems=new Map((streams.eligible||[]).map(x=>[x.item_id,x]));
 const items=[...uniqueItems.values()];
 const kinds=Object.fromEntries(['feed','youtube','podcast'].map(k=>[k,items.filter(x=>x.kind===k).length]));
 const publishers=[...new Set(items.map(x=>x.publisher_id))];
 const gaps=[];
 if(items.length<12)gaps.push('Fewer than 12 eligible underlying items');
 if(publishers.length<6)gaps.push('Fewer than six independent publisher identities');
 for(const [kind,n]of Object.entries(kinds))if(n<2)gaps.push(`Fewer than two ${kind} items`);
 const generated=count('articles')===3&&count('video_scripts')===3;
 const recovered=failures.length===1&&failures[0].stage==='run'&&last['workflows/create_series']?.exit_code===0&&Date.parse(last['workflows/create_series'].finished_at)>Date.parse(last.run.finished_at)&&generated&&reviewCurrent&&!gaps.length;
 const status=(failures.length&&!recovered)||gaps.length||!generated||!reviewCurrent?'failed':ready?'ready_for_production':recovered?'awaiting_review_after_recovery':'awaiting_review';
 const ends=logs.map(x=>Date.parse(x.finished_at)).filter(Number.isFinite);
 const report={run_id:meta.run_id,as_of_date:meta.as_of_date,mode:meta.mode,status,review_current:reviewCurrent,
  counts:{discovered:count('candidates'),extracted:count('items'),new:subset('changes','change','new'),changed:subset('changes','change','changed'),unchanged:subset('changes','change','unchanged'),eligible:count('eligible'),excluded:count('exclusions'),accepted:subset('decisions','decision','accept'),rejected:subset('decisions','decision','reject'),deferred:subset('decisions','decision','defer'),articles:count('articles'),video_scripts:count('video_scripts')},
  coverage:{distinct_eligible_items:streams.eligible?items.length:null,by_kind:streams.eligible?kinds:null,independent_publishers:streams.eligible?publishers:null,limitations:gaps,independence_status:'Publisher identities require human confirmation; shared upstream claims are not corroboration'},
  duplicate_observations:streams.candidates?streams.candidates.length-new Set(streams.candidates.map(x=>x.item_id)).size:null,
  failed_or_incomplete_stages:failures,recovery:recovered?{automated_outputs_recovered:true,original_entrypoint_status:last.run.status,recovered_at:last['workflows/create_series'].finished_at,note:'Original entrypoint failure is preserved; subsequent stage recovery produced drafts, scripts, and passing checks. This is not an uninterrupted successful entrypoint execution.'}:null,
  failure_history:logs.filter(x=>x.exit_code!==0&&x.outcome!=='not_found').map(x=>({stage:x.stage,started_at:x.started_at,errors:x.errors})),
  store_lookup_misses:logs.filter(x=>x.outcome==='not_found').length,
  elapsed_seconds:ends.length?(Math.max(...ends)-Date.parse(meta.started_at))/1000:null,
  tools:[...new Set(logs.flatMap(x=>x.tools||[]))],models:[...new Set(logs.flatMap(x=>x.models||[]))],
  known_or_estimated_cost_usd:logs.reduce((s,x)=>s+(typeof x.cost_usd==='number'?x.cost_usd:0),0),
  has_estimated_cost:logs.some(x=>x.cost_is_estimate),unknown_cost_stages:logs.filter(x=>x.cost_usd===null).map(x=>x.stage),
  student_selection_review:fs.existsSync(safePath('docs/STUDENT_EDITORIAL_REVIEW.md'))?'docs/STUDENT_EDITORIAL_REVIEW.md':null,
  remaining_manual_actions:[...(fs.existsSync(safePath('docs/STUDENT_EDITORIAL_REVIEW.md'))?[]:['Review six editorial decisions and revise the policy']),...(ready?[]:['Supply actual student approval of reviewed content']),'Inspect the two different-day run records and their recovery history','Produce videos in Google Vids or HeyGen','Publish and cross-link three article/video pairs','Record technical demonstration','Complete personal reflection and verify submitted links']};
 emit(report);receipt.input_count=logs.length;receipt.output_count=1;
});

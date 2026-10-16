import fs from 'node:fs';
import {readJson,readLines,readText,safePath,hash,canonical,validTimestamp} from '../lib/common.mjs';
import {validateSegments} from '../processing/transcripts.mjs';

export function assess(runDir) {
 const issues=[],fingerprint={};
 const add=(artifact,message,severity='error')=>issues.push({artifact,severity,message});
 function load(relative,jsonl=false){
  try{const raw=readText(relative);fingerprint[relative]=hash(raw);return jsonl?readLines(relative):JSON.parse(raw);}
  catch(e){fingerprint[relative]='missing-or-invalid';add(relative,e.message);return jsonl?[]:null;}
 }
 const meta=load(`${runDir}/run.json`);
 // Run metadata is reduced to the facts that define the evidence window.
 fingerprint[`${runDir}/run.json`]=canonical({as_of_date:meta?.as_of_date,mode:meta?.mode});
 const eligible=load(`${runDir}/eligible.jsonl`,true),decisions=load(`${runDir}/decisions.jsonl`,true),briefs=load(`${runDir}/briefs.jsonl`,true);
 const articles=load(`${runDir}/articles.jsonl`,true),scripts=load(`${runDir}/video_scripts.jsonl`,true);
 const items=new Map(eligible.map(x=>[`${x.item_id}@${x.version_id}`,x]));
 const chosen=new Map(decisions.map(x=>[`${x.item_id}@${x.version_id}`,x]));
 const unique=new Map(eligible.map(x=>[x.item_id,x]));
 if(unique.size<12)add('eligible.jsonl','At least 12 distinct eligible items are required');
 if(new Set([...unique.values()].map(x=>x.publisher_id)).size<6)add('eligible.jsonl','At least six independent publisher identities are required');
 for(const kind of ['feed','youtube','podcast'])if([...unique.values()].filter(x=>x.kind===kind).length<2)add('eligible.jsonl',`At least two ${kind} items are required`);
 for(const [name,rows]of [['briefs',briefs],['articles',articles],['video_scripts',scripts]]){
  if(rows.length!==3||rows.map(x=>x.piece_id).sort().join(',')!=='01,02,03')add(name,'Exactly three records with IDs 01, 02, 03 are required');
 }
 if(chosen.size!==items.size||decisions.length!==items.size)add('decisions.jsonl','Exactly one decision is required for every eligible item/version');
 for(const [key,d]of chosen){
  if(!items.has(key)||!['accept','reject','defer'].includes(d.decision)||!d.reason?.trim()||!Array.isArray(d.piece_ids))add('decisions.jsonl','Invalid or unsupported editorial decision');
  else if(d.decision!=='accept'&&d.piece_ids.length)add('decisions.jsonl','Rejected/deferred items cannot be assigned to pieces');
 }
 const end=meta?.as_of_date?Date.parse(meta.as_of_date+'T00:00:00Z'):NaN,start=end-29*86400000;
 const usedKinds=new Set(),claimedIds=new Set();
 const assets=new Map();
 function asset(relative){
  if(assets.has(relative))return assets.get(relative);
  try{const raw=readText(relative);fingerprint[relative]=hash(raw);assets.set(relative,raw);return raw;}
  catch(e){fingerprint[String(relative)]='missing';add(String(relative),'Missing or invalid evidence asset');return null;}
 }
 for(const brief of briefs){
  const piece=brief.piece_id,publishers=new Set();
  for(const field of ['title','question','argument','synthesis','limitations'])if(typeof brief[field]!=='string'||!brief[field].trim())add(piece,`Missing ${field}`);
  if(!Array.isArray(brief.claims)||!brief.claims.length){add(piece,'Claims are required');continue;}
  let multiSourceInference=false;
  for(const claim of brief.claims){
   if(!claim.claim_id?.startsWith(`${piece}-`)||claimedIds.has(claim.claim_id))add(piece,'Claim IDs must be unique and scoped to the piece');
   claimedIds.add(claim.claim_id);
   if(!claim.statement?.trim()||!['reported_fact','source_claim','inference'].includes(claim.type))add(piece,'Claim statement/type is invalid');
   const refs=Array.isArray(claim.evidence)?claim.evidence:[];
   if(!refs.length)add(piece,`Claim ${claim.claim_id} has no evidence`);
   const claimPublishers=new Set();
   for(const ref of refs){
    const key=`${ref.item_id}@${ref.version_id}`,item=items.get(key),decision=chosen.get(key);
    if(!item){add(piece,`Unresolvable item/version for ${claim.claim_id}`);continue;}
    if(decision?.decision!=='accept'||!decision.piece_ids?.includes(piece))add(piece,'Claim uses an item not accepted for this piece');
    const day=validTimestamp(item.published_at)?Date.parse(new Date(item.published_at).toISOString().slice(0,10)+'T00:00:00Z'):NaN;
    if(!Number.isFinite(day)||!Number.isFinite(end)||day<start||day>end)add(piece,'Referenced evidence falls outside the valid publication window');
    publishers.add(item.publisher_id);claimPublishers.add(item.publisher_id);usedKinds.add(item.kind);
    const text=asset(item.text_path),loc=ref.locator;
    if(item.kind==='feed'){
     if(loc?.type!=='text'||typeof loc.quote!=='string'||!loc.quote.trim()||!text?.includes(loc.quote))add(piece,`Exact evidence quote does not resolve for ${claim.claim_id}`);
    }else{
     const raw=asset(item.segments_path);let segments=[];
     try{segments=validateSegments(JSON.parse(raw));}catch{add(piece,'Invalid or missing timestamped transcript');}
     if(loc?.type!=='segment'||!segments.some(x=>x.segment_id===loc.segment_id))add(piece,`Evidence segment does not resolve for ${claim.claim_id}`);
     if(!item.media_path||!fs.existsSync(safePath(item.media_path)))add(piece,'Original media is absent locally; verify documented retrieval', 'warning');
    }
   }
   if(claim.type==='inference'&&claimPublishers.size>=2)multiSourceInference=true;
  }
  if(publishers.size<3)add(piece,'At least three independent publishers must support each piece');
  if(!multiSourceInference)add(piece,'At least one explicit inference connecting multiple publishers is required');
  const ids=brief.claims.map(x=>x.claim_id).sort();
  for(const [kind,manifest]of [['articles',articles],['video_scripts',scripts]]){
   const entry=manifest.find(x=>x.piece_id===piece);
   if(!entry)continue;
   if(entry.path!==`${runDir}/${kind}/${piece}.md`)add(piece,`Unexpected ${kind} path`);
   if(!Array.isArray(entry.claim_ids)||canonical([...entry.claim_ids].sort())!==canonical(ids))add(piece,`${kind} must reference the same brief claims`);
   const body=asset(entry.path);if(body===null)continue;
   for(const id of ids)if(!body.includes(`[${id}]`))add(piece,`${kind} is missing claim marker ${id}`);
   if(!body.includes(meta?.as_of_date))add(piece,`${kind} must state the as-of date`);
   const words=body.split(/^##\s+(?:Sources|References)\b/im)[0].split(/\s+/).filter(Boolean).length;
   if(kind==='articles'&&(words<600||words>900))add(piece,`Article is approximately ${words} words; target is 600–900 excluding references`,'warning');
   if(kind==='video_scripts')add(piece,'Time the narration to confirm 3–5 minutes; visual directions are not spoken words','warning');
  }
 }
 for(const kind of ['feed','youtube','podcast'])if(!usedKinds.has(kind))add('series',`The series does not use ${kind} evidence`);
 if(new Set(briefs.map(x=>x.argument)).size<3)add('briefs.jsonl','Central arguments must be distinct');
 add('series','Human review must assess source independence, cross-platform duplicates, claim support, distinct synthesis, limitations, and article/video consistency','warning');
 return {review_id:hash(canonical(fingerprint)),passed:!issues.some(x=>x.severity==='error'),issues};
}

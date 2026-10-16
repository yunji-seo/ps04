import fs from 'node:fs';
import {stage,requiredRun,stdinLines,readLines,readJson,readText,emit,writeJson,safePath,hash,canonical} from '../lib/common.mjs';
import {complete,parseModelJson} from '../lib/parley.mjs';
import {evidencePacket,validateDecisions,assertCoverage,validateBriefs,itemKey} from './contracts.mjs';

function passages(text){
 const result=[];
 // Preserve all source characters in addressable passages; the model need not copy quotations.
 for(let offset=0;offset<text.length;){
  let end=Math.min(offset+900,text.length);
  if(end<text.length){const boundary=text.lastIndexOf(' ',end);if(boundary>offset+400)end=boundary;}
  result.push({passage_id:`p-${String(result.length+1).padStart(4,'0')}`,text:text.slice(offset,end)});offset=end;
 }
 return result;
}
const [runDir]=process.argv.slice(2);
await stage('editorial/create_briefs',runDir,async receipt=>{
 const meta=requiredRun(runDir),decisions=stdinLines(),items=readLines(`${runDir}/eligible.jsonl`);
 receipt.input_count=decisions.length;validateDecisions(decisions,items);assertCoverage(items,decisions);
 const accepted=new Set(decisions.filter(x=>x.decision==='accept').map(itemKey));
 const evidence=items.filter(x=>accepted.has(itemKey(x))).map((x,i)=>({...x,source_ref:`source-${i+1}`}));
 const project=readJson(`${runDir}/config/project.json`),policy=readText(`${runDir}/config/editorial_policy.md`),config=readJson(`${runDir}/config/ai.json`);
 const instructions=readText(`${runDir}/prompts/create_briefs.md`);
 const catalog=evidence.map(x=>({source_ref:x.source_ref,title:x.title,publisher_id:x.publisher_id,kind:x.kind,decision:decisions.find(d=>itemKey(d)===itemKey(x))}));
 const planSystem='Plan three distinct evidence-based articles, not their prose. Return ONLY a JSON array of three objects with piece_id, question, argument, source_refs. source_refs MUST be an array of STRINGS such as ["source-1","source-4","source-9"], never objects. Piece 01 covers what changed; 02 scrutinizes evidence; 03 explains practical implications. Choose 3–5 sources per piece, from at least three publisher IDs. Choose ONLY references listed in eligible_refs_by_piece for that piece. Across the three plans include feed, youtube AND podcast. Publisher diversity is not independent corroboration of the same claim. Keep arguments short, tentative, and free of numerical assertions: catalog reasons are candidate assessments, not verified source facts. Full evidence will be read in the next stage.';
 const eligible_refs_by_piece=Object.fromEntries(['01','02','03'].map(id=>[id,catalog.filter(x=>x.decision.piece_ids.includes(id)).map(x=>x.source_ref)]));
 const mediaAssignments={'01':[],'02':[],'03':[]};
 for(const [kind,preferred]of [['podcast','01'],['youtube','02']]){
  const available=['01','02','03'].filter(id=>catalog.some(x=>x.kind===kind&&x.decision.piece_ids.includes(id)));
  if(!available.length)throw new Error(`No accepted ${kind} assignment is available`);
  mediaAssignments[available.includes(preferred)?preferred:available[0]].push(kind);
 }
 const planKey=hash(canonical({catalog,project,policy,instructions,config,planSystem,eligible_refs_by_piece,planner_version:4}));
 const planPath=`${runDir}/ai/brief-plan-${planKey}.json`;
 let plans;
 if(fs.existsSync(safePath(planPath)))plans=readJson(planPath).plans;
 else {
  plans=[];
  for(const piece_id of ['01','02','03']){
   const candidates=catalog.filter(x=>x.decision.piece_ids.includes(piece_id)).map(({decision,...x})=>x);
   const required_kinds=mediaAssignments[piece_id];
   const candidates_by_publisher=Object.fromEntries([...new Set(candidates.map(x=>x.publisher_id))].map(p=>[p,candidates.filter(x=>x.publisher_id===p).map(x=>x.source_ref)]));
   const payload={project,policy,piece_id,required_kinds,candidates,candidates_by_publisher,previous_plans:plans};
   const system='Return ONLY ONE JSON object with piece_id, question, argument, source_refs. source_refs must contain exactly 3 or 4 distinct STRING references from candidates, representing at least three distinct publisher_id values and including EVERY kind in required_kinds (which may be empty). Example shape: {"piece_id":"01","question":"...","argument":"...","source_refs":["source-1","source-4","source-9"]}. Plan the editorial question only: 01 = what changed; 02 = strength of evidence; 03 = practical implications. Argument must be at most two tentative sentences, with no numbers or alleged facts inferred from titles. The next stage reads the full evidence. Never use a source absent from candidates. Do not add commentary or Markdown fences.';
   let plan,lastError;
   for(let attempt=0;attempt<3;attempt++){
    plan=parseModelJson(await complete(runDir,`editorial/plan_${piece_id}`,receipt,system,{...payload,...(lastError?{previous_invalid_plan:plan,validation_error:lastError}: {})},1500));
    const refs=plan?.source_refs,selected=Array.isArray(refs)?refs.map(ref=>candidates.find(x=>x.source_ref===ref)):[];
    if(plan?.piece_id!==piece_id)lastError='Return the requested piece_id';
    else if(!Array.isArray(refs)||refs.length<3||refs.length>4||new Set(refs).size!==refs.length)lastError='source_refs must be exactly 3 or 4 distinct strings';
    else if(selected.some(x=>!x))lastError='Use only the source_ref strings in candidates';
    else if(new Set(selected.map(x=>x.publisher_id)).size<3)lastError=`Your sources represent only these publishers: ${[...new Set(selected.map(x=>x.publisher_id))].join(', ')}. Replace a repeated publisher with a source from another candidates_by_publisher group so there are at least THREE different publisher IDs. Multiple sources from GitHub still count as only ONE publisher.`;
    else if(required_kinds.some(kind=>!selected.some(x=>x.kind===kind)))lastError=`Include ALL these media kinds: ${required_kinds.join(', ')}. Required available references: ${JSON.stringify(candidates.filter(x=>required_kinds.includes(x.kind)))}`;
    else {lastError=null;break;}
   }
   if(lastError)throw new Error(`Plan ${piece_id}: ${lastError}`);
   plans.push(plan);
  }
 }
 if(!Array.isArray(plans)||plans.map(x=>x.piece_id).sort().join(',')!=='01,02,03')throw new Error('Invalid three-piece editorial plan');
 const selectedKinds=new Set();
 for(const plan of plans){
  if(!Array.isArray(plan.source_refs)||plan.source_refs.length<3||plan.source_refs.length>5||new Set(plan.source_refs).size!==plan.source_refs.length)throw new Error('Plan must select 3–5 distinct sources');
  const chosen=plan.source_refs.map(ref=>evidence.find(x=>x.source_ref===ref));
  if(chosen.some(x=>!x||!decisions.find(d=>itemKey(d)===itemKey(x))?.piece_ids.includes(plan.piece_id)))throw new Error(`Plan ${plan.piece_id} uses an unknown source or a source not accepted for this piece`);
  if(new Set(chosen.map(x=>x.publisher_id)).size<3)throw new Error('Plan lacks three publisher identities');
  chosen.forEach(x=>selectedKinds.add(x.kind));
 }
 if(selectedKinds.size!==3)throw new Error('Editorial plan must include all three media kinds');
 writeJson(planPath,{fingerprint:planKey,plans});
 const briefs=[];
 for(const plan of plans){
  process.stderr.write(`Building evidence brief ${plan.piece_id}\n`);
  const packet=plan.source_refs.map(ref=>{
   const item=evidence.find(x=>x.source_ref===ref),full=evidencePacket(item);
   return {...full,...(item.kind==='feed'?{text:undefined,passages:passages(full.text)}:{})};
  });
  const system=instructions+'\nFOR THIS CALL: Return ONLY one brief object for piece '+plan.piece_id+'. The three-piece requirement is coordinated across calls. Use 4–6 claims. At least one claim must be an explicit inference supported by two different publisher IDs. Cite every selected source at least once. For written evidence return {source_ref,locator:{type:"text",passage_id:"p-0001"}}; for media use {source_ref,locator:{type:"segment",segment_id:"existing ID"}}. Never copy item/version hashes or invent quotations. The program resolves passage IDs to exact source text. Do not put substantive assertions in synthesis that are absent from claims. Attribute vendor metrics as source_claim, not independently measured facts. Do not conflate details across sources or treat multiple vendor reports as proof of causality. Distinguish a dataset’s builders from auditors not involved in its construction. Narrow the argument to what these sources actually support.';
  const payload={as_of_date:meta.as_of_date,project,policy,plan,series_plan:plans,evidence:packet};
  const key=hash(canonical({payload,system,config})),checkpoint=`${runDir}/ai/validated-brief-${plan.piece_id}-${key}.json`;
  let brief;
  if(fs.existsSync(safePath(checkpoint))){brief=readJson(checkpoint);receipt.reused_brief_count=(receipt.reused_brief_count||0)+1;}
  else{
   let raw;
   for(const file of fs.readdirSync(safePath(`${runDir}/ai`)).filter(x=>x.startsWith(`editorial-brief_${plan.piece_id}-`)&&x.endsWith('-request.json')).sort().reverse()){
    try{
     const req=readJson(`${runDir}/ai/${file}`),saved=readJson(`${runDir}/ai/${file.replace('-request.json','-response.json')}`);
     if(req.model===config.model&&req.messages?.[0]?.content===system&&req.messages?.[1]?.content===JSON.stringify(payload)&&saved.finish_reason==='stop'){
      raw=saved.content;receipt.reused_response_count=(receipt.reused_response_count||0)+1;break;
     }
    }catch{/* Missing or nonmatching archive is not reusable. */}
   }
   raw=raw??await complete(runDir,`editorial/brief_${plan.piece_id}`,receipt,system,payload,6500);
   for(let attempt=0;attempt<3;attempt++){
    try{
   brief=parseModelJson(raw);
   // A singleton array and a list of limitation strings are lossless transport variations.
   if(Array.isArray(brief)&&brief.length===1)brief=brief[0];
   if(Array.isArray(brief?.limitations)&&brief.limitations.every(x=>typeof x==='string'))brief.limitations=brief.limitations.join('\n\n');
   if(brief.piece_id!==plan.piece_id)throw new Error('Generated brief has the wrong piece ID');
   for(const claim of brief.claims||[])if(Array.isArray(claim.evidence))claim.evidence=claim.evidence.map(ref=>{
    const item=packet.find(x=>x.source_ref===ref.source_ref);
    if(!item)throw new Error('Brief references an unknown source');
    let locator=ref.locator;
    if(item.kind==='feed'){
     const passage=item.passages.find(p=>p.passage_id===locator?.passage_id);
     if(!passage)throw new Error('Brief references an unknown passage');
     locator={type:'text',quote:passage.text};
    }
    return {item_id:item.item_id,version_id:item.version_id,locator};
   });
   validateBriefs([brief],items,decisions,{partial:true});
   const used=new Set(brief.claims.flatMap(c=>c.evidence.map(itemKey)));
   if(packet.some(x=>!used.has(itemKey(x))))throw new Error('Brief omitted a source required by its plan');
    break;
    }catch(error){
     if(attempt===2)throw error;
     process.stderr.write(`Repairing brief ${plan.piece_id}: ${error.message}\n`);
     raw=await complete(runDir,`editorial/repair_brief_${plan.piece_id}`,receipt,system,{...payload,previous_invalid_response:raw,validation_error:error.message},6500);
    }
   }
   writeJson(checkpoint,brief);
  }
  validateBriefs([brief],items,decisions,{partial:true});briefs.push(brief);
 }
 validateBriefs(briefs,items,decisions);briefs.forEach(emit);receipt.output_count=briefs.length;
});

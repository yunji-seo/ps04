import fs from 'node:fs';
import {readJson,readLines,safePath,stage,writeJson,writeLines} from '../lib/common.mjs';
import {parseModelJson} from '../lib/parley.mjs';
import {resolveBriefReferences} from '../editorial/locators.mjs';
import {validateBriefs} from '../editorial/contracts.mjs';
const dir=process.argv[2];
await stage('editorial/create_briefs',dir,async receipt=>{
 const file=fs.readdirSync(safePath(`${dir}/ai`)).filter(x=>x.startsWith('editorial-create_briefs-')&&x.endsWith('-response.json')).sort().at(-1);
 if(!file)throw new Error('No archived brief response');
 const response=readJson(`${dir}/ai/${file}`), request=readJson(`${dir}/ai/${file.replace('-response.json','-request.json')}`);
 if(response.finish_reason!=='stop')throw new Error('Archived response is incomplete');
 const payload=JSON.parse(request.messages[1].content),briefs=parseModelJson(response.content);
 const items=readLines(`${dir}/eligible.jsonl`),decisions=readLines(`${dir}/decisions.jsonl`);
 receipt.input_count=decisions.length;receipt.models=[request.model];receipt.reused_response_paths=[`${dir}/ai/${file}`];
 const correctionPath=`${dir}/editorial_corrections.json`;
 if(fs.existsSync(safePath(correctionPath))){
  const changes=readJson(correctionPath);
  const applied=[];
  for(const change of changes){
   const claim=briefs.flatMap(b=>b.claims||[]).find(c=>c.claim_id===change.claim_id);
   if(!claim)throw new Error('Correction targets an unknown claim');
   const before=structuredClone(claim);
   if(change.statement)claim.statement=change.statement;
   if(change.type)claim.type=change.type;
   if(change.evidence)claim.evidence=change.evidence;
   applied.push({author:'assistant; not student approval',reason:change.reason,before,after:structuredClone(claim)});
  }
  writeJson(`${dir}/ai/editorial-corrections-applied-${Date.now()}.json`,applied);
 }
 const corrections=resolveBriefReferences(briefs,payload.evidence);
 validateBriefs(briefs,items,decisions);
 writeJson(`${dir}/ai/locator-resolution-${Date.now()}.json`,corrections);
 writeLines(`${dir}/briefs.jsonl`,briefs);receipt.output_count=briefs.length;
});

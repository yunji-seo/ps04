import fs from 'node:fs';
import {stage,requiredRun,stdinLines,readLines,readJson,readText,atomicWrite,emit,safePath,writeJson,hash,canonical} from '../lib/common.mjs';
import {complete} from '../lib/parley.mjs';
import {validateBriefs,evidencePacket,itemKey} from '../editorial/contracts.mjs';

// Shared rendering mechanics for the two content generators; no orchestration or selection here.
export async function draft(kind, runDir) {
  const name=kind==='articles'?'write_articles':'write_video_scripts';
  await stage(`content/${name}`,runDir,async receipt=>{
    const meta=requiredRun(runDir), briefs=stdinLines(),items=readLines(`${runDir}/eligible.jsonl`),decisions=readLines(`${runDir}/decisions.jsonl`);
    receipt.input_count=briefs.length;validateBriefs(briefs,items,decisions);
    const rows=[];
    for(const brief of briefs){
      const keys=new Set(brief.claims.flatMap(c=>c.evidence.map(itemKey)));
      const payload={as_of_date:meta.as_of_date,project:readJson(`${runDir}/config/project.json`),policy:readText(`${runDir}/config/editorial_policy.md`),brief,
        evidence:items.filter(x=>keys.has(itemKey(x))).map(item=>{
          const refs=brief.claims.flatMap(c=>c.evidence).filter(ref=>itemKey(ref)===itemKey(item));
          return {...item,...(item.kind==='feed'?{passages:[...new Set(refs.map(ref=>ref.locator.quote))]}:{segments:readJson(item.segments_path).filter(s=>refs.some(ref=>ref.locator.segment_id===s.segment_id))})};
        })};
      if(kind==='video_scripts')payload.article=readText(`${runDir}/articles/${brief.piece_id}.md`);
      const system=readText(`${runDir}/prompts/${name}.md`)+(kind==='articles'?'\nSTRICT OUTPUT: Aim for 720 words; 600–900 total words before a final ## Sources section. Use only the reviewed brief claims and supplied exact supporting excerpts. Keep the source limitations concise. Do not add numerical, temporal, causal, or product assertions beyond the brief.':'\nSTRICT OUTPUT: Use exactly one ## Narration section with 450–650 spoken words, followed by ## Visual plan and ## Description sections. Narration must contain all claim markers. Aim for 520 spoken words. All directions and source cues belong outside Narration. Use only the reviewed claims. Keep the entire output under 1100 words.'),config=readJson(`${runDir}/config/ai.json`);
      const key=hash(canonical({payload,system,config})),checkpoint=`${runDir}/ai/validated-draft-${kind}-${brief.piece_id}-${key}.json`;
      let body;
      if(fs.existsSync(safePath(checkpoint))){body=readJson(checkpoint).body;receipt.reused_draft_count=(receipt.reused_draft_count||0)+1;}
      for(const file of body?[]:fs.readdirSync(safePath(`${runDir}/ai`)).filter(x=>x.startsWith(`content-${name}-`)&&x.endsWith('-request.json')).sort().reverse()){
        try{
          const req=readJson(`${runDir}/ai/${file}`),saved=readJson(`${runDir}/ai/${file.replace('-request.json','-response.json')}`);
          if(req.model===config.model&&req.messages?.[0]?.content===system&&req.messages?.[1]?.content===JSON.stringify(payload)&&saved.finish_reason==='stop'&&typeof saved.content==='string'){
            body=saved.content;receipt.reused_response_count=(receipt.reused_response_count||0)+1;break;
          }
        }catch{/* Missing or mismatched archives do not qualify. */}
      }
      body=body??await complete(runDir,`content/${name}`,receipt,system,payload,kind==='articles'?2200:3000);
      for(let attempt=0;attempt<3;attempt++){
        const section=kind==='articles'?body.split(/^##\s+(?:Sources|References)\b/im)[0]:body.match(/^## Narration\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1];
        const words=section?.replace(/\[\d{2}-c\d+\]/g,'').split(/\s+/).filter(Boolean).length??0;
        const [minimum,maximum]=kind==='articles'?[600,900]:[450,650];
        const missing=brief.claims.filter(c=>!section?.includes(`[${c.claim_id}]`)).map(c=>c.claim_id);
        if(words>=minimum&&words<=maximum&&!missing.length)break;
        if(attempt===2)throw new Error(`Draft ${brief.piece_id} has ${words} words or missing claim markers; inspection required`);
        body=await complete(runDir,`content/repair_${name}`,receipt,system,{...payload,previous_draft:body,correction:`The required ${kind==='articles'?'article':'## Narration section'} has ${words} words. Return ${minimum}–${maximum} words in that section. Missing markers: ${missing.join(', ')||'none'}. Keep all claims and their limitations; remove repetition and directions from narration.`},kind==='articles'?2200:3000);
      }
      for(const c of brief.claims)if(!body.includes(`[${c.claim_id}]`))throw new Error(`Draft ${brief.piece_id} is missing claim marker ${c.claim_id}`);
      // The exact run date is deterministic metadata, independent of model date formatting.
      if(!body.includes(meta.as_of_date))body=`As of ${meta.as_of_date}.\n\n`+body;
      writeJson(checkpoint,{body});
      const path=`${runDir}/${kind}/${brief.piece_id}.md`;
      atomicWrite(path,body.trim()+'\n');rows.push({piece_id:brief.piece_id,path,claim_ids:brief.claims.map(c=>c.claim_id)});
    }
    rows.forEach(emit);receipt.output_count=rows.length;
  });
}

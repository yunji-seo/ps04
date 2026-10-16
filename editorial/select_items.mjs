import fs from 'node:fs';
import {stage, requiredRun, stdinLines, readJson, readText, writeJson, emit, InputError, safePath} from '../lib/common.mjs';
import {complete, parseModelJson} from '../lib/parley.mjs';
import {evidencePacket, validateDecisions} from './contracts.mjs';
const [runDir]=process.argv.slice(2);
await stage('editorial/select_items', runDir, async receipt=>{
  const meta=requiredRun(runDir), items=stdinLines();receipt.input_count=items.length;
  const config=readJson(`${runDir}/config/ai.json`), size=config.selection_batch_size;
  if (!Number.isInteger(size)||size<1||size>8) throw new InputError('Selection batch size must be 1–8');
  const system=readText(`${runDir}/prompts/select_items.md`);
  const shared={project:readJson(`${runDir}/config/project.json`), policy:readText(`${runDir}/config/editorial_policy.md`), as_of_date:meta.as_of_date,
    series_angles:{'01':'What changed and why it matters','02':'Scrutinize claims and tensions','03':'Implications and what to watch next'}};
  const rows=[];
  for(let i=0;i<items.length;i+=size){
    const batch=items.slice(i,i+size);
    process.stderr.write(`Assessing evidence ${i+1}–${i+batch.length} of ${items.length}\n`);
    const payload={...shared,evidence:batch.map(evidencePacket)};
    const format='\nTransport format: Each input has a source_ref. Return source_ref, decision, reason and piece_ids. Do not copy long item_id/version_id hashes; the program resolves source_ref to that exact input version. Return ONLY the JSON array.';
    const aliased={...payload,evidence:payload.evidence.map((x,j)=>({...x,source_ref:`source-${j+1}`}))};
    function normalize(value){
      if(!Array.isArray(value))throw new InputError('Decision array is required');
      return value.map(d=>{
        if(!d.source_ref)return d;
        const source=aliased.evidence.find(x=>x.source_ref===d.source_ref);
        if(!source)throw new InputError('Unknown model source_ref');
        return {item_id:source.item_id,version_id:source.version_id,decision:d.decision,reason:d.reason,piece_ids:d.piece_ids};
      });
    }
    let result;
    // Reuse only validated responses for byte-identical prompts, evidence, policy and model.
    // This permits failure recovery without charging again for completed batches.
    const aiDir=safePath(`${runDir}/ai`);
    if(fs.existsSync(aiDir))for(const file of fs.readdirSync(aiDir).filter(x=>x.endsWith('-request.json'))){
      try{
        const req=readJson(`${runDir}/ai/${file}`);
        const sameLegacy=req.messages?.[0]?.content===system&&req.messages?.[1]?.content===JSON.stringify(payload);
        const sameAlias=req.messages?.[0]?.content===system+format&&req.messages?.[1]?.content===JSON.stringify(aliased);
        if(req.model!==config.model||(!sameLegacy&&!sameAlias))continue;
        const saved=readJson(`${runDir}/ai/${file.replace('-request.json','-response.json')}`);
        if(saved.finish_reason!=='stop')continue;
        const candidate=normalize(parseModelJson(saved.content));validateDecisions(candidate,batch);
        result=candidate;receipt.reused_response_count=(receipt.reused_response_count||0)+1;
        receipt.reused_response_paths||=[];receipt.reused_response_paths.push(`${runDir}/ai/${file.replace('-request.json','-response.json')}`);
        break;
      }catch{/* Invalid or mismatched prior responses are never reused. */}
    }
    if(!result)result=normalize(parseModelJson(await complete(runDir,'editorial/select_items',receipt,system+format,aliased,6000)));
    validateDecisions(result,batch);rows.push(...result);
    writeJson(`${runDir}/ai/selection-progress-${receipt.started_at.replace(/[:.]/g,'-')}.json`, {complete:false,decisions:rows});
  }
  validateDecisions(rows,items);rows.forEach(emit);receipt.output_count=rows.length;
});

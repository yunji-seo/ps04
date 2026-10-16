import {readLines,readJson,atomicWrite} from '../lib/common.mjs';
import {itemKey} from '../editorial/contracts.mjs';
const [runDir]=process.argv.slice(2);
const items=new Map(readLines(`${runDir}/eligible.jsonl`).map(x=>[itemKey(x),x]));
let text='# Claim and evidence review packet\n\nThis is an inspection aid, not student approval or a publication package.\n\n';
for(const b of readLines(`${runDir}/briefs.jsonl`)){
 text+=`## ${b.piece_id}: ${b.title}\n\nArgument: ${b.argument}\n\nLimitations: ${b.limitations}\n\n`;
 for(const c of b.claims){
  text+=`### ${c.claim_id} (${c.type})\n\n${c.statement}\n\n`;
  for(const ref of c.evidence){
   const item=items.get(itemKey(ref));let quote=ref.locator.quote,location='written passage';
   if(ref.locator.type==='segment'){
    const s=readJson(item.segments_path).find(x=>x.segment_id===ref.locator.segment_id);
    quote=s.text;location=`${s.start_seconds}–${s.end_seconds} seconds (${s.segment_id})`;
   }
   text+=`**${item.publisher_id}: [${item.title}](${item.url})**, ${location}.\n\n> ${quote.replaceAll('\n','\n> ')}\n\n`;
  }
 }
}
atomicWrite(`${runDir}/CLAIM_REVIEW.md`,text);
console.log(`${runDir}/CLAIM_REVIEW.md`);

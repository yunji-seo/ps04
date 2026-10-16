// Resolve formatting-only differences back to exact source characters. Never fuzzy-match wording.
function mapped(text){
 let normalized='',starts=[],ends=[];
 for(let i=0;i<text.length;i++){
  let c=text[i];
  if(/\s/.test(c)){
   if(normalized.endsWith(' ')){ends[ends.length-1]=i+1;continue;}
   c=' ';
  }else c=c.replace(/[‘’]/g,"'").replace(/[“”]/g,'"');
  normalized+=c;starts.push(i);ends.push(i+1);
 }
 return {normalized,starts,ends};
}
export function exactPassages(text,quote){
 if(typeof quote!=='string'||!quote.trim())throw new Error('Missing source quotation');
 if(text.includes(quote))return [quote];
 const source=mapped(text);
 const locate=part=>{
  const n=mapped(part.trim()).normalized.trim();
  if(n.length<12)throw new Error('Omitted quotation fragment is too short to resolve safely');
  const at=source.normalized.indexOf(n);
  if(at<0)throw new Error(`Quotation fragment is not in retained evidence: ${part.slice(0,180)}`);
  return text.slice(source.starts[at],source.ends[at+n.length-1]);
 };
 try{return [locate(quote)];}catch(error){
  const parts=quote.split(/\.{3}|…/).map(x=>x.trim()).filter(Boolean);
  if(parts.length<2)throw error;
  return parts.map(locate);
 }
}
export function resolveBriefReferences(briefs,evidence){
 const corrections=[];
 if(!Array.isArray(briefs))throw new Error('Model did not return briefs');
 for(const brief of briefs)for(const claim of brief.claims||[]){
  if(!Array.isArray(claim.evidence))continue;
  claim.evidence=claim.evidence.flatMap(ref=>{
   const item=evidence.find(x=>ref.source_ref?x.source_ref===ref.source_ref:x.item_id===ref.item_id&&x.version_id===ref.version_id);
   if(!item)throw new Error('Brief references an unknown source');
   const base={item_id:item.item_id,version_id:item.version_id};
   if(ref.locator?.type!=='text')return [{...base,locator:ref.locator}];
   const passages=exactPassages(item.text,ref.locator.quote);
   if(passages.length!==1||passages[0]!==ref.locator.quote)corrections.push({claim_id:claim.claim_id,...base,model_quote:ref.locator.quote,exact_quotes:passages,method:'Exact wording match after whitespace/smart-quote normalization; ellipses split into separate exact references'});
   return passages.map(quote=>({...base,locator:{type:'text',quote}}));
  });
 }
 return corrections;
}

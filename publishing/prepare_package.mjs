import fs from 'node:fs';
import {InputError,requiredRun,stage,emit,readJson,readLines,readText,safePath,atomicWrite,writeJson,validTimestamp} from '../lib/common.mjs';
import {assess} from '../review/assessment.mjs';
const [runDir,...extra]=process.argv.slice(2);
await stage('publishing/prepare_package',runDir||'runs/invalid-invocations',async receipt=>{
 if(extra.length)throw new InputError('Usage: prepare_package.sh RUN_DIR');
 const meta=requiredRun(runDir);
 const result=assess(runDir);
 if(!result.passed)throw new Error('Current content check has blocking issues');
 if(!fs.existsSync(safePath(`${runDir}/approval.json`)))throw new Error('Student approval is missing');
 const approval=readJson(`${runDir}/approval.json`);
 if(approval.decision!=='approve'||approval.review_id!==result.review_id||!approval.reviewer?.trim()||!validTimestamp(approval.reviewed_at)||typeof approval.notes!=='string')throw new Error('Student approval is missing, invalid or stale');
 const saved=readJson(`${runDir}/review.json`);
 if(!saved.passed||saved.review_id!==result.review_id)throw new Error('Saved review is stale; rerun the check');
 const items=new Map(readLines(`${runDir}/eligible.jsonl`).map(x=>[`${x.item_id}@${x.version_id}`,x]));
 const briefs=readLines(`${runDir}/briefs.jsonl`),assets=[];
 for(const brief of briefs){
  const refs=new Map(),markers=new Map();let counter=0;
  for(const claim of brief.claims){
   const links=[];
   for(const ref of claim.evidence){
    const item=items.get(`${ref.item_id}@${ref.version_id}`);
    let url=item.url,location='';
    if(ref.locator.type==='segment'){
     const segment=readJson(item.segments_path).find(x=>x.segment_id===ref.locator.segment_id);
     const sec=Math.floor(segment.start_seconds);location=` at ${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
     const link=new URL(item.url);if(item.kind==='youtube')link.searchParams.set('t',String(sec));else link.hash=`t=${sec}`;url=link.href;
    }
    const key=`${ref.item_id}@${ref.version_id}:${JSON.stringify(ref.locator)}`;
    if(!refs.has(key))refs.set(key,{n:++counter,text:`[${item.title}${location}](${url}) — published ${item.published_at}; evidence version ${item.version_id}`,url});
    links.push(`[Source ${refs.get(key).n}](${url})`);
   }
   markers.set(`[${claim.claim_id}]`,links.join('; '));
  }
  for(const kind of ['articles','video_scripts']){
   let body=readText(`${runDir}/${kind}/${brief.piece_id}.md`);
   for(const [marker,replacement]of markers)body=body.replaceAll(marker,replacement);
   const path=`${runDir}/package/${kind}/${brief.piece_id}.md`;atomicWrite(path,body);assets.push({piece_id:brief.piece_id,kind,path});
  }
  const notes=`# Sources for piece ${brief.piece_id}\n\nAs of ${meta.as_of_date}.\n\n`+[...refs.values()].map(x=>`${x.n}. ${x.text}`).join('\n');
  const path=`${runDir}/package/sources/${brief.piece_id}.md`;atomicWrite(path,notes+'\n');assets.push({piece_id:brief.piece_id,kind:'source_notes',path});
 }
 const linkPath=`${runDir}/package/publication_links.json`;
 if(!fs.existsSync(safePath(linkPath)))writeJson(linkPath,['01','02','03'].map(piece_id=>({piece_id,substack_url:null,youtube_url:null})));
 const manifest={run_id:meta.run_id,mode:meta.mode,review_id:result.review_id,assets,publication_links_path:linkPath,
  remaining_manual_actions:['Produce each video using Google Vids or HeyGen','Review rendered videos for factual and timing consistency','Publish three accessible Substack articles and three public or unlisted YouTube videos','Add reciprocal links and source references','Disclose AI-generated presentation','Verify each submitted URL and update publication_links.json']};
 writeJson(`${runDir}/package/manifest.json`,manifest);emit(manifest);receipt.input_count=3;receipt.output_count=assets.length;
});

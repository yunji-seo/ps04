import {readLines,readJson,readText,writeJson,atomicWrite} from '../lib/common.mjs';
import {itemKey} from '../editorial/contracts.mjs';
import {assess} from '../review/assessment.mjs';
const [runDir]=process.argv.slice(2),meta=readJson(`${runDir}/run.json`),review=assess(runDir);
if(!review.passed)throw new Error('Resolve blocking content issues before creating the student review preview');
const items=new Map(readLines(`${runDir}/eligible.jsonl`).map(x=>[itemKey(x),x])),briefs=readLines(`${runDir}/briefs.jsonl`),stats=[];
const stamp=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
for(const brief of briefs){
 const replacements=new Map();
 for(const claim of brief.claims){
  const grouped=new Map();for(const ref of claim.evidence){const key=itemKey(ref);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(ref);}
  const links=[];
  for(const [key,refs]of grouped){
   const item=items.get(key);
   if(item.kind==='feed')links.push(`[${item.publisher_id}](${item.url})`);
   else{
    const selected=readJson(item.segments_path).filter(s=>refs.some(r=>r.locator.segment_id===s.segment_id)).sort((a,b)=>a.start_seconds-b.start_seconds);
    let previousEnd=-Infinity;
    for(const segment of selected){
     if(segment.start_seconds>previousEnd+5){const url=new URL(item.url);if(item.kind==='youtube')url.searchParams.set('t',String(Math.floor(segment.start_seconds)));else url.hash=`t=${Math.floor(segment.start_seconds)}`;links.push(`[${item.publisher_id}, ${stamp(segment.start_seconds)}](${url.href})`);}
     previousEnd=segment.end_seconds;
    }
   }
  }
  replacements.set(`[${claim.claim_id}]`,links.join('; '));
 }
 const rawArticle=readText(`${runDir}/articles/${brief.piece_id}.md`),rawVideo=readText(`${runDir}/video_scripts/${brief.piece_id}.md`);
 const count=t=>t.replace(/\[\d\d-c\d+\]/g,'').split(/\s+/).filter(Boolean).length;
 const words=count(rawArticle.split(/^##\s+(?:Sources|References)\b/im)[0]);
 const narration=rawVideo.match(/^## Narration\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1];
 if(!narration)throw new Error('A distinct narration section is required');
 const spoken=count(narration);
 if(words<600||words>900||spoken<450||spoken>650)throw new Error(`Piece ${brief.piece_id} length is outside the target: article ${words}, narration ${spoken}`);
 stats.push({piece_id:brief.piece_id,title:brief.title,article_words:words,narration_words:spoken,estimated_minutes_at_140_wpm:Number((spoken/140).toFixed(2)),publishers:[...new Set(brief.claims.flatMap(c=>c.evidence.map(r=>items.get(itemKey(r)).publisher_id)))]});
 for(const [kind,raw]of [['articles',rawArticle],['video_scripts',rawVideo]]){
  let body=raw;for(const [marker,links]of replacements)body=body.replaceAll(marker,links);
  atomicWrite(`${runDir}/review_preview/${kind}/${brief.piece_id}.md`,'> DRAFT FOR STUDENT REVIEW — not approved, produced, or published.\n\n'+body);
 }
 atomicWrite(`${runDir}/review_preview/narration-${brief.piece_id}.txt`,narration.replace(/\[\d\d-c\d+\]/g,'').replace(/\*\*/g,'').replace(/^---\s*$/gm,'').trim()+'\n');
}
writeJson(`${runDir}/review-preview-manifest.json`,{review_id:review.review_id,run_id:meta.run_id,as_of_date:meta.as_of_date,student_approval:false,statistics:stats});
const intro=`# Student review: Agent Engineering Brief\n\n**English drafts are ready for your review. They are not yet approved, rendered as videos, or published.** Evidence date: ${meta.as_of_date}.\n\nAutomated reference checks pass. The estimate below assumes 140 spoken words per minute; actual Google Vids/HeyGen timing still needs verification. Word counts exclude references and internal claim labels.\n\n| Piece | Article | Narration | Estimated duration | Review files |\n| --- | ---: | ---: | ---: | --- |\n`;
const table=stats.map(x=>`| ${x.piece_id} | ${x.article_words} words | ${x.narration_words} words | ${x.estimated_minutes_at_140_wpm} min | [Article](review_preview/articles/${x.piece_id}.md) · [Video script](review_preview/video_scripts/${x.piece_id}.md) |`).join('\n');
const body=intro+table+'\n\n'+briefs.map(b=>`## ${b.piece_id}. ${b.title}\n\n${b.argument}\n`).join('\n')+`\n## What to check\n\nRead all three article/script pairs. Confirm that the arguments reflect your judgment, uncertainty is clear, and the article and narration agree. Spot-check the linked passages and timestamps in [the claim packet](CLAIM_REVIEW.md). The Korean automatic transcript was collected but is not used in these publications.\n\nYour six-item review is already recorded; you do not need to repeat it. The [policy comparison](../../docs/POLICY_COMPARISON.md) shows Deno changed to accept, while [interpretation notes](../../docs/POLICY_INTERPRETATION.md) explain remaining model disagreements. Deno’s future self-hosting plan appears in piece 03.\n\nThe assistant corrected unsupported universal statements, a misattribution between companies, incomplete caption citations, and an overstatement of costs. See [correction audit](editorial-corrections.json) and [final wording edits](final-polish-audit.json). These are assistant edits, not invented student corrections.\n\nIf you approve these specific drafts, say that you approve the three article and video-script pairs for packaging, or list changes by piece. This approval does not assert that rendered videos or live publication links already exist.\n\nReview fingerprint: \`${review.review_id}\`. Any subsequent content or referenced-evidence change invalidates this approval target.\n`;
atomicWrite(`${runDir}/REVIEW_READY.md`,body);
atomicWrite('REVIEW_NEXT.md',`# Next review\n\nOpen the [current three-pair review](./${runDir}/REVIEW_READY.md).\n\nThe six-item student selection review is complete. Final draft approval, video production, publishing, demonstration recording, and personal reflection remain.\n`);
console.log(JSON.stringify({review_id:review.review_id,statistics:stats},null,2));

import fs from 'node:fs';
const base='runs/2026-10-16T04-24-58-255Z-ee63f048/package';
const titles=['AI Coding Agents: What Providers Are Rebuilding and What You Still Need to Check','AI Agent Verification: What a Success Signal Actually Proves','Adopting AI Coding Agents: A Practical Plan for Small Teams'];
const summaries=['Provider infrastructure is changing as agent workloads grow. This video distinguishes provider-reported scale, available review workflows, planned infrastructure, and the oversight still required from a small team.','A completion signal does not establish that a task produced the intended result. This video compares external result checks, decision notes, code-review benchmarks and monitoring, including the limits of the available evidence.','A small team can start with one bounded task, identify who checks the result, and match controls to risk. This video considers technical judgment, security costs and the distinction between deployment roadmaps and shipped capabilities.'];
const cuts=[[0,25,64,96,126,168,209,242.1],[0,18,83,106,142,189,213,232.41],[0,15,77,121,159,185,204,224.70]];
const stamp=s=>{const ms=Math.round(s*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
fs.mkdirSync('production/captions',{recursive:true});fs.mkdirSync('production/descriptions',{recursive:true});
for(let i=0;i<3;i++){
 const id=String(i+1).padStart(2,'0');
 const article=fs.readFileSync(`${base}/articles/${id}.md`,'utf8');
 const urls=[...new Set([...article.matchAll(/https?:\/\/[^\s)\]]+/g)].map(m=>m[0]))].filter(u=>!/[#?&]t=/.test(u));
 const description=`${summaries[i]}\n\nAgent Engineering Brief | Yunji Seo\nAssessment as of October 16, 2026.\n\nSources:\n${urls.join('\n')}\n\nLimitations: The evidence relies heavily on provider accounts and practitioner perspectives. It does not establish measured benefits or adoption costs for student teams. Announced plans are distinguished from verified capabilities.\n\nDisclosure: Research and drafting were assisted by AI. Yunji Seo supplied editorial judgments and approved the article/script drafts. Google Vids generated the synthetic narration and presentation; final scene timing was adjusted locally. The abstract background is AI-generated.\n`;
 fs.writeFileSync(`production/descriptions/${id}.json`,JSON.stringify({title:titles[i],description,article_url:null,youtube_url:null,visibility:'unlisted',made_for_kids:false},null,2)+'\n');
 const scenes=JSON.parse(fs.readFileSync(`production/scenes/${id}/narration.json`,'utf8'));let cues=[],count=1;
 for(let n=0;n<scenes.length;n++){
  const words=scenes[n].narration.trim().split(/\s+/);const span=cuts[i][n+1]-cuts[i][n];
  for(let w=0;w<words.length;w+=12){const end=Math.min(w+12,words.length);cues.push(`${count++}\n${stamp(cuts[i][n]+span*w/words.length)} --> ${stamp(cuts[i][n]+span*end/words.length)}\n${words.slice(w,end).join(' ')}\n`);}
 }
 fs.writeFileSync(`production/captions/${id}.srt`,cues.join('\n'));
}
console.log('Prepared three descriptions and script-derived caption files; caption timings are approximate within observed scene boundaries.');

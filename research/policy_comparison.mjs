import {readJson,readText,readLines,writeJson,atomicWrite} from '../lib/common.mjs';
const [mode,baseline,runDir]=process.argv.slice(2);
if(!baseline||!runDir)throw new Error('Baseline and comparison run paths are required');
if(mode==='prepare'){
 const old=readJson(`${baseline}/run.json`),meta=readJson(`${runDir}/run.json`);
 writeJson(`${runDir}/run.json`,{...meta,mode:'replay',as_of_date:old.as_of_date,baseline_run:baseline,purpose:'Controlled policy comparison on the same retained evidence, date window, order, model, batch size and selection prompt. Actual replay timestamp is started_at. This is not a new collection or publication run.'});
 atomicWrite(`${runDir}/eligible.jsonl`,readText(`${baseline}/eligible.jsonl`));
 for(const relative of ['config/ai.json','config/project.json','prompts/select_items.md'])atomicWrite(`${runDir}/${relative}`,readText(`${baseline}/${relative}`));
}else if(mode==='report'){
 const before=readLines(`${baseline}/decisions.jsonl`),after=readLines(`${runDir}/decisions.jsonl`),items=readLines(`${baseline}/eligible.jsonl`);
 const key=x=>x.item_id+'@'+x.version_id;
 const prior=new Map(before.map(x=>[key(x),x]));
 const changes=after.filter(x=>prior.get(key(x))?.decision!==x.decision).map(x=>({title:items.find(i=>key(i)===key(x)).title,before:prior.get(key(x)),after:x}));
 const counts=rows=>Object.fromEntries(['accept','reject','defer'].map(s=>[s,rows.filter(x=>x.decision===s).length]));
 const result={baseline,run:runDir,before:counts(before),after:counts(after),changed_decisions:changes};
 writeJson(`${runDir}/policy_comparison.json`,result);
 const deno=after.find(x=>x.item_id==='feed:cloudflare:a289db51a1e2a244d95269bd');
 const content=`# Policy v1 to v2: controlled replay\n\nBaseline: ${baseline}. Replay: ${runDir}.\n\nThe same ${before.length} evidence versions, order, as-of window, selection prompt, batch size, and model were used. Only the editorial policy changed. The provider is stochastic, so not every changed decision can be causally attributed to that revision. This selection-only replay is not one of the two live collection runs.\n\n| Policy | Accept | Reject | Defer |\n| --- | ---: | ---: | ---: |\n| v1 | ${result.before.accept} | ${result.before.reject} | ${result.before.defer} |\n| v2 | ${result.after.accept} | ${result.after.reject} | ${result.after.defer} |\n\n## Deno and the student's requested correction\n\nStudent decision: accept. Original model decision: defer. Revised model decision: **${deno?.decision??'missing'}**.\n\n${deno?.reason??'No decision was produced.'}\n\nNo student override was inserted into the model output. The student's separate review is in docs/STUDENT_EDITORIAL_REVIEW.md.\n\n## Changed model decisions\n\n`+changes.map(x=>`### ${x.title}\n\n${x.before.decision} → ${x.after.decision}\n\nBefore: ${x.before.reason}\n\nAfter: ${x.after.reason}\n`).join('\n');
 atomicWrite(`${runDir}/POLICY_COMPARISON.md`,content);
 atomicWrite('docs/POLICY_COMPARISON.md',content);
 console.log(JSON.stringify({run:runDir,before:result.before,after:result.after,changed:changes.length,deno:deno?.decision}));
}else throw new Error('Expected prepare or report');

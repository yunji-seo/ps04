import fs from 'node:fs';
import crypto from 'node:crypto';
import {now,readJson,readText,writeJson,atomicWrite,strings,safePath} from './common.mjs';
const [mode,arg]=process.argv.slice(2);
if(mode==='init'){
 const started=now(),id=started.replace(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8),dir=`runs/${id}`;
 fs.mkdirSync(safePath(`${dir}/logs`),{recursive:true});
 const prior=fs.readdirSync(safePath('runs')).filter(x=>x!==id&&fs.existsSync(safePath(`runs/${x}/run.json`))).sort().at(-1)||null;
 writeJson(`${dir}/run.json`,{run_id:id,started_at:started,as_of_date:started.slice(0,10),mode:'live',previous_run_id:prior});
 for(const folder of ['config','prompts'])for(const filename of fs.readdirSync(safePath(folder)))atomicWrite(`${dir}/${folder}/${filename}`,readText(`${folder}/${filename}`));
 process.stdout.write(dir+'\n');
}else if(mode==='validate'){
 try{
  const project=readJson(`${arg}/config/project.json`);strings(project,['publication_name','topic','audience','central_question']);
  const sources=readJson(`${arg}/config/sources.json`);
  if(!Array.isArray(sources)||!sources.length)throw new Error('At least one configured source is required');
  for(const s of sources){strings(s,['source_id','publisher_id','kind','url']);if(!['feed','youtube','podcast'].includes(s.kind))throw new Error('Invalid source kind');}
  if(!readText(`${arg}/config/editorial_policy.md`).trim())throw new Error('Editorial policy is empty');
 }catch(e){process.stderr.write(e.message+'\n');process.exitCode=2;}
}else{process.stderr.write('Usage: run_context.mjs init | validate RUN_DIR\n');process.exitCode=2;}

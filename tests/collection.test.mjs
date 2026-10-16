import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
test('simulated collection failure retains healthy results and distinguishes a successful empty feed',async t=>{
 const server=http.createServer((req,res)=>{
  if(req.url==='/broken'){res.writeHead(503);res.end('Deliberate fixture failure');return;}
  res.setHeader('content-type','application/rss+xml');
  res.end(req.url==='/empty'?'<rss><channel></channel></rss>':'<rss><channel><item><title>Fictional local fixture</title><link>https://example.test/fixture</link><pubDate>Wed, 07 Oct 2026 12:00:00 GMT</pubDate></item></channel></rss>');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close());
 const base=`http://127.0.0.1:${server.address().port}`;
 fs.mkdirSync('test-output',{recursive:true});const dir=fs.mkdtempSync(path.join(process.cwd(),'test-output','collection-'));
 for(const folder of ['lib','collectors','processing'])fs.cpSync(folder,path.join(dir,folder),{recursive:true});
 const run='runs/simulated-failure';fs.mkdirSync(path.join(dir,run,'config'),{recursive:true});
 fs.writeFileSync(path.join(dir,run,'run.json'),JSON.stringify({run_id:'simulated-failure',started_at:'2026-10-08T12:00:00Z',as_of_date:'2026-10-08',mode:'example'}));
 fs.writeFileSync(path.join(dir,run,'config/sources.json'),JSON.stringify(['healthy','broken','empty'].map(name=>({source_id:name,publisher_id:'fictional-'+name,kind:'feed',url:base+'/'+name}))));
 const result=await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['collectors/feeds.mjs',run],{cwd:dir,windowsHide:true});let stdout='',stderr='';
  child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);child.on('error',reject);child.on('close',status=>resolve({status,stdout,stderr}));
 });
 assert.equal(result.status,1,result.stderr);assert.equal(JSON.parse(result.stdout).source_id,'healthy');
 const log=JSON.parse(fs.readFileSync(path.join(dir,run,'logs',fs.readdirSync(path.join(dir,run,'logs'))[0]),'utf8'));
 assert.equal(log.status,'incomplete');assert.equal(log.output_count,1);
 assert.deepEqual(log.source_results.map(x=>[x.source_id,x.status,x.count??null]),[['healthy','completed',1],['broken','failed',null],['empty','completed',0]]);
});

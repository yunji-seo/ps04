import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

test('provider archives no credentials, records unknown costs and rejects HTTP failures and truncated output',()=>{
  const dir=path.resolve('test-output/provider-'+crypto.randomUUID());
  fs.mkdirSync(path.join(dir,'lib'),{recursive:true});
  fs.mkdirSync(path.join(dir,'run/config'),{recursive:true});
  for(const name of ['common.mjs','parley.mjs'])fs.copyFileSync(path.resolve('lib',name),path.join(dir,'lib',name));
  fs.writeFileSync(path.join(dir,'run/config/ai.json'),JSON.stringify({base_url:'https://parley.api.mit.edu/v1',model:'fixture-model'}));
  const sentinel='fictional-test-secret-do-not-log';
  const script=`
    import assert from 'node:assert/strict';
    import {complete} from './lib/parley.mjs';
    const receipt={models:[],cost_usd:0};
    let calls=0;
    globalThis.fetch=async(url,options)=>{
      calls++;
      assert.equal(url,'https://parley.api.mit.edu/v1/chat/completions');
      assert.equal(options.redirect,'error');
      assert.equal(options.headers.Authorization,'Bearer '+process.env.PARLEY_API_KEY);
      if(calls===1)return {ok:false,status:401,json:()=>{throw new Error('Must not read error body');}};
      return {ok:true,json:async()=>({choices:[{finish_reason:'length',message:{content:'truncated'}}],usage:{prompt_tokens:4,completion_tokens:5,total_tokens:9}})};
    };
    await assert.rejects(()=>complete('run','fixture',receipt,'system',{fixture:true}),/HTTP 401/);
    await assert.rejects(()=>complete('run','fixture',receipt,'system',{fixture:true}),/truncated/);
    assert.equal(receipt.cost_usd,null);
    assert.equal(receipt.model_calls,2);
    assert.equal(receipt.token_usage.total_tokens,9);
  `;
  const p=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:dir,encoding:'utf8',env:{...process.env,PARLEY_API_KEY:sentinel}});
  assert.equal(p.status,0,p.stderr);
  for(const name of fs.readdirSync(path.join(dir,'run/ai'))){
    const text=fs.readFileSync(path.join(dir,'run/ai',name),'utf8');
    assert.ok(!text.includes(sentinel));assert.ok(!text.includes('Authorization'));
  }
});

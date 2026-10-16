import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
function workspace(t) {
  fs.mkdirSync('test-output',{recursive:true});
  const dir=fs.mkdtempSync(path.join(root,'test-output','core-'));
  for(const name of ['lib','data','processing','examples']) fs.cpSync(path.join(root,name),path.join(dir,name),{recursive:true,filter:p=>!p.includes(path.join('data','evidence'))});
  fs.mkdirSync(path.join(dir,'runs','example'),{recursive:true});
  fs.copyFileSync(path.join(root,'examples','run.json'),path.join(dir,'runs','example','run.json'));
  return dir;
}
function call(dir,script,args=[],input='') {
  return spawnSync(process.execPath,[script,...args],{cwd:dir,input,encoding:'utf8'});
}
const lines = s => s.trim() ? s.trim().split(/\r?\n/).map(JSON.parse) : [];
test('store: initial ingestion, duplicate replay, changed version and historical retrieval',t=>{
  const dir=workspace(t);
  assert.equal(call(dir,'data/store.mjs',['init']).status,0);
  const first=call(dir,'data/store.mjs',['upsert','runs/example'],fs.readFileSync('examples/items.jsonl','utf8'));
  assert.equal(first.status,0,first.stderr);
  assert.deepEqual(lines(first.stdout),lines(fs.readFileSync('examples/initial_changes_expected.jsonl','utf8')));
  const replay=call(dir,'data/store.mjs',['upsert','runs/example'],fs.readFileSync('examples/replay_items.jsonl','utf8'));
  assert.equal(replay.status,0,replay.stderr);
  assert.deepEqual(lines(replay.stdout),lines(fs.readFileSync('examples/replay_changes_expected.jsonl','utf8')));
  const latest=call(dir,'data/store.mjs',['list']);
  assert.equal(lines(latest.stdout).length,3);
  const old=lines(fs.readFileSync('examples/items.jsonl','utf8'))[2];
  const found=call(dir,'data/store.mjs',['get',old.item_id,old.version_id]);
  assert.deepEqual(JSON.parse(found.stdout),old);
  assert.equal(call(dir,'data/store.mjs',['get','missing']).status,1);
  const again=call(dir,'data/store.mjs',['init']);
  assert.equal(again.status,0);
  assert.equal(lines(call(dir,'data/store.mjs',['list']).stdout).length,3);
});
test('store: invalid stream is rejected before any ingestion',t=>{
  const dir=workspace(t);
  call(dir,'data/store.mjs',['init']);
  const result=call(dir,'data/store.mjs',['upsert','runs/example'],fs.readFileSync('examples/items.jsonl','utf8')+'{"bad":true}\n');
  assert.equal(result.status,2);
  assert.equal(call(dir,'data/store.mjs',['list']).stdout,'');
});
test('filter: supplied inclusive boundary, missing, invalid, old and future dates',t=>{
  const dir=workspace(t);
  const result=call(dir,'processing/filter_items.mjs',['runs/example'],fs.readFileSync('examples/filter_input.jsonl','utf8'));
  assert.equal(result.status,0,result.stderr);
  const expected=JSON.parse(fs.readFileSync('examples/filter_expected.json','utf8'));
  assert.deepEqual(lines(result.stdout).map(x=>x.item_id).sort(),expected.eligible_item_ids.sort());
  const excluded=lines(fs.readFileSync(path.join(dir,'runs/example/exclusions.jsonl'),'utf8'));
  assert.deepEqual(excluded.map(({item_id,reason})=>({item_id,reason})),expected.exclusions);
});
test('filter: normalizes offsets to UTC and rejects impossible dates',t=>{
  const dir=workspace(t);
  const row=lines(fs.readFileSync('examples/items.jsonl','utf8'))[0];
  const records=[{...row,item_id:'inside',published_at:'2026-10-09T00:30:00+02:00'},
    {...row,item_id:'outside',published_at:'2026-09-09T00:30:00+02:00'},
    {...row,item_id:'impossible',published_at:'2026-02-30T00:00:00Z'}];
  const result=call(dir,'processing/filter_items.mjs',['runs/example'],records.map(JSON.stringify).join('\n'));
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual(lines(result.stdout).map(x=>x.item_id),['inside']);
  assert.equal(lines(fs.readFileSync(path.join(dir,'runs/example/exclusions.jsonl'),'utf8'))[1].reason,'invalid_date');
});
test('receipts remain distinct when a stage is replayed',t=>{
  const dir=workspace(t), input=fs.readFileSync('examples/items.jsonl','utf8');
  for(let i=0;i<2;i++) assert.equal(call(dir,'processing/filter_items.mjs',['runs/example'],input).status,0);
  const files=fs.readdirSync(path.join(dir,'runs/example/logs'));
  assert.equal(files.length,2);
  for(const name of files) {
    const receipt=JSON.parse(fs.readFileSync(path.join(dir,'runs/example/logs',name),'utf8'));
    assert.equal(receipt.input_count,3); assert.equal(receipt.output_count,3); assert.equal(receipt.exit_code,0);
  }
});

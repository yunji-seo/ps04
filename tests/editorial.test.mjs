import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDecisions,assertCoverage,validateBriefs} from '../editorial/contracts.mjs';
import {parseModelJson} from '../lib/parley.mjs';
import {browserTranscript} from '../processing/transcripts.mjs';
import {exactPassages} from '../editorial/locators.mjs';
const item={item_id:'fixture',version_id:'v1',publisher_id:'p1',kind:'feed'};
const decision={...item,decision:'accept',reason:'Relevant fictional evidence',piece_ids:['01']};

test('decision validation rejects fabricated versions, duplicates and inconsistent assignments',()=>{
  assert.equal(validateDecisions([decision],[item]).length,1);
  assert.throws(()=>validateDecisions([{...decision,version_id:'invented'}],[item]));
  assert.throws(()=>validateDecisions([decision,decision],[item,{...item,item_id:'other'}]));
  assert.throws(()=>validateDecisions([{...decision,decision:'reject'}],[item]));
  assert.throws(()=>validateDecisions([{...decision,piece_ids:[]}],[item]));
});
test('coverage gate stops an otherwise large corpus missing a second video',()=>{
  const items=Array.from({length:12},(_,i)=>({...item,item_id:'fixture-'+i,publisher_id:'p'+i,kind:i===0?'youtube':i<3?'podcast':'feed'}));
  const ds=items.map(x=>({...decision,...x,piece_ids:['01','02','03']}));
  assert.throws(()=>assertCoverage(items,ds),/two youtube/);
  items[3].kind='youtube';assert.doesNotThrow(()=>assertCoverage(items,ds));
});
test('malformed or error-shaped model output cannot become briefs',()=>{
  assert.deepEqual(parseModelJson('```json\n[]\n```'),[]);
  assert.deepEqual(parseModelJson('Commentary\n```json\n[]\n```\nEnd'),[]);
  assert.throws(()=>parseModelJson('```json\n[]\n```\n```json\n[]\n```'));
  assert.throws(()=>parseModelJson('Here is my analysis, not JSON'));
  assert.throws(()=>validateBriefs({error:'insufficient evidence'},[],[]));
});
test('planning stops when collected media exists but no video is editorially accepted',()=>{
 const items=Array.from({length:12},(_,i)=>({...item,item_id:'fixture-'+i,publisher_id:'p'+i,kind:['feed','youtube','podcast'][i%3]}));
 const ds=items.map(x=>({...decision,...x,decision:x.kind==='youtube'?'reject':'accept',piece_ids:x.kind==='youtube'?[]:['01','02','03']}));
 assert.throws(()=>assertCoverage(items,ds),/No accepted youtube/);
});
test('imported transcript verifies video identity and derives only bounded timing intervals',()=>{
  const raw='YouTube transcript\nVideo ID: fictional\nLanguage: en\n\n[0:03] First sentence.\n[0:08] Second sentence.\n';
  assert.deepEqual(browserTranscript(raw,'fictional',12).map(s=>[s.start_seconds,s.end_seconds]),[[3,8],[8,12]]);
  assert.throws(()=>browserTranscript(raw,'different-video',12),/identity/);
  assert.throws(()=>browserTranscript(raw,'fictional',7),/Invalid transcript/);
});
test('quotation recovery preserves exact source characters and refuses changed wording',()=>{
 const text='The system reported “success”.\n\nThe output file was missing.\nUnrelated text.\nA second check caught the failure.';
 assert.deepEqual(exactPassages(text,'The system reported "success". The output file was missing.'),['The system reported “success”.\n\nThe output file was missing.']);
 assert.deepEqual(exactPassages(text,'The output file was missing... A second check caught the failure.'),['The output file was missing','A second check caught the failure.']);
 assert.throws(()=>exactPassages(text,'The output file was present.'),/not in retained/);
});

// Explicit, source-inspected corrections for this run; not an automatic fuzzy citation repair.
import {readJson,readText,writeJson} from '../lib/common.mjs';
import fs from 'node:fs';
const dir=process.argv[2];
const requestFile=fs.readdirSync(`${dir}/ai`).find(x=>x.startsWith('editorial-create_briefs-')&&x.endsWith('-request.json'));
const evidence=JSON.parse(readJson(`${dir}/ai/${requestFile}`).messages[1].content).evidence;
function text(ref){const item=evidence.find(x=>x.source_ref===ref);if(!item)throw new Error('Missing source');return readText(item.text_path);}
function paragraph(ref,start){const raw=text(ref),at=raw.indexOf(start);if(at<0)throw new Error(`Inspected passage missing: ${start}`);const tail=raw.slice(at);return tail.split(/\n\s*\n/)[0];}
function ref(source_ref,quote){if(!text(source_ref).includes(quote))throw new Error('Correction is not verbatim');return {source_ref,locator:{type:'text',quote}};}
const changes=[
 {claim_id:'02-c4',type:'source_claim',reason:'Replace a paraphrase mislabeled as a quotation; correct the implication that dataset builders also performed the independent re-labeling. The source explicitly distinguishes the senior engineer auditors from dataset builders.',
  statement:'GitHub reports that ReviewBench contains 219 pull requests from 187 repositories across 19 languages and uses Claude Sonnet 5 as its grader. It says senior engineers who had not built the dataset independently re-labeled its ground-truth findings with 96.6% agreement, and describes an online A/B test that moved in the direction predicted offline. This is a transparent vendor-run validation account, not evidence of external independent replication or guaranteed performance on every small team’s codebase.',
  evidence:[ref('source-6',paragraph('source-6','We analyzed 103.9 million')),ref('source-6',paragraph('source-6','Validate findings under a shared rubric.')),ref('source-6',paragraph('source-6','Before release, we asked senior engineers')),ref('source-6',paragraph('source-6','The online A/B test moved'))]},
 {claim_id:'03-c1',type:'source_claim',reason:'Use the exact recommendation and surrounding context; qualify it as the author’s proposed practice rather than a measured universal property of all agent systems.',
  statement:'A Stack Overflow Blog contributor recommends checking the work product rather than an agent’s success report: confirm the row, file, queued message or pushed branch in state the agent did not author. The same article recommends alerting when a scheduled job that normally changes something reports success without changing it. These are proposed verification practices, not a controlled estimate of how often all agents fail silently.',
  evidence:[ref('source-20',paragraph('source-20','Assert on the work product.')),ref('source-20',paragraph('source-20','Alert on the absence of change.'))]},
 {claim_id:'03-c5',type:'source_claim',reason:'Remove unsupported “uncredited” characterization and a fabricated code quotation. Preserve the source’s narrow outcome-update exception and its distinction between application-role protection and operator-level tamper resistance.',
  statement:'A Stack Overflow Blog governance guide proposes fail-closed guardrails and tenant checks at every memory read and write. Its audit-ledger example revokes application-role mutation, then grants a narrow update permission for the outcome column; it explicitly warns that this does not constrain a database owner. These are concrete design proposals, not independent measurements that the proposed controls eliminate failures.',
  evidence:[ref('source-19',paragraph('source-19','Two rules: fail closed')),ref('source-19',paragraph('source-19','Tenant scoping is non-negotiable:')),ref('source-19',text('source-19').slice(text('source-19').indexOf('-- App role gets INSERT + SELECT only.'),text('source-19').indexOf('Three design choices do the heavy lifting.')).trim())]},
];
writeJson(`${dir}/editorial_corrections.json`,changes);

import {readLines,atomicWrite} from '../lib/common.mjs';
const dir=process.argv[2];
const items=new Map(readLines(`${dir}/eligible.jsonl`).map(x=>[x.item_id,x]));
const decisions=readLines(`${dir}/decisions.jsonl`);
const selected=[...decisions.filter(x=>x.decision==='accept').slice(0,3),
  ...decisions.filter(x=>x.decision==='reject').slice(0,2),
  ...decisions.filter(x=>x.decision==='defer').slice(0,1)];
let text='# Student editorial decision review\n\nStatus: awaiting the student’s own review. These are model decisions, not verified conclusions or student approval. Read the linked evidence and supply your judgment.\n\n';
text+='Review focus: the model sometimes treats missing corroboration within its batch as a reason to defer an item. The corpus has multiple publishers; batch composition alone should not decide relevance. Assess whether this changed a decision unfairly. Do not accept vendor claims as established facts merely because a detailed rationale sounds persuasive.\n\n';
for(const [i,d] of selected.entries()){
  const item=items.get(d.item_id);
  text+=`## ${i+1}. ${item.title}\n\nModel decision: **${d.decision}**. Intended pieces: ${d.piece_ids.join(', ')||'None'}.\n\n[Original source](${item.url}) · [Retained evidence](../../${item.text_path})\n\n${d.reason}\n\nItem: \`${d.item_id}\`\n\nVersion: \`${d.version_id}\`\n\nStudent judgment (agree / change to accept, reject, or defer): **Not supplied**\n\nStudent explanation or correction: **Not supplied**\n\n`;
}
text+='## Policy revision\n\nStudent-directed change: **Not supplied**\n\nAfter the student supplies a revision, preserve this run and compare decisions under the revised policy in a separate run. Do not treat this worksheet as approval of publication content.\n';
atomicWrite(`${dir}/STUDENT_REVIEW.md`,text);

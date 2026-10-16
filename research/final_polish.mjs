import {readText,readLines,atomicWrite,writeJson,hash,now} from '../lib/common.mjs';
const [runDir]=process.argv.slice(2),briefs=readLines(`${runDir}/briefs.jsonl`),audit=[];
const fixes={
 'articles/01.md':[
  ['The evidence in this set comes entirely from providers describing their own systems and workloads.','The evidence relies heavily on provider accounts, including some relayed through independent commentary.'],
  ['That question does not yet have a publicly evidenced answer.','These sources do not establish how much review your own project needs.']
 ],
 'articles/02.md':[
  ['According to several recent practitioner sources, often very little.','The sources examined here identify workflows in which a success signal can arrive without a separate result check.'],
  ['reading state the agent did not author [02-c1]','reading state the agent did not author [02-c3]'],
  ['answer different questions and are most useful in combination','answer different questions, so our recommendation is to use them as complementary signals'],
  ['That audit was conducted by engineers at GitHub and Microsoft—not by unaffiliated parties—so it establishes a documented process rather than independently verified accuracy.','The post describes an internal audit of a benchmark built by GitHub and Microsoft, so it documents a review process rather than an unaffiliated external evaluation.']
 ],
 'articles/03.md':[
  ['Four recent sources—','Several recent sources—'],
  ['GitHub\'s skills post frames agent use as a high-skill coordination role: "Increasingly, great execution means defining the problem clearly, providing the right context, evaluating AI-generated code, and deciding what\'s ready to ship."','GitHub’s skills post frames agent use as an active coordination role: define the problem, provide context, evaluate generated code, and decide what is ready to ship.'],
  ['the agent reduces implementation effort; it does not remove the need for someone to own the result.','delegating implementation does not remove the need for someone to own the result.'],
  ['the classifier has not yet shipped to general availability','the announcement does not establish general availability of the classifier'],
  ['the practical recommendation from the brief','our practical recommendation'],
  ['The field guide, the GitHub posts, and the Anthropic interview all come from parties with commercial interests in the tools being discussed, and none of them accounts for novice maintainers, accessibility needs, or teams that cannot afford enterprise plans.','The vendor sources have commercial interests, while the field guide offers prescriptive advice rather than measured student outcomes. Novice maintainers, accessibility needs, and teams without enterprise budgets remain underrepresented.'],
  ['The guidance exists; the evidence of its effect on people like you does not yet.','This evidence set offers guidance, but does not establish its effect on student teams.']
 ],
 'video_scripts/01.md':[
  ['Every source here comes from a provider.','The evidence relies heavily on provider accounts, some relayed through independent commentary.'],
  ['That question does not yet have a publicly evidenced answer.','These sources do not establish how much review your own project needs.']
 ],
 'video_scripts/02.md':[
  ['According to several recent practitioner sources, often very little.','The sources here describe workflows where success can be reported without a separate result check.'],
  ['When an agent loop exits zero, the orchestrator stopped looping because the model produced a token meaning "done." Nothing between that claim and the exit code checked anything.','A Stack Overflow contributor describes an agent loop that turns the model’s completion signal into exit zero without checking the result. In that design, nothing independently verifies the work. Other workflows can add those checks.'],
  ['The practical fix is to instrument the artifact, not the run. [02-c1]','The contributor recommends checking the work product rather than relying on the run status. [02-c3]'],
  ['Many failures occur not because the model lacked the knowledge, but because it considered the correct approach and moved past it.','In the interviewee’s account of evaluations he examined, some failures involved considering the correct approach and moving past it.'],
  ['That audit was conducted by GitHub and Microsoft engineers—not unaffiliated parties—so it documents a process rather than establishing independent accuracy.','The post describes an internal audit of a GitHub and Microsoft benchmark. It documents a process, not an unaffiliated external evaluation.'],
  ['Why a green exit code from an agent loop is a self-assessment, not an observation','Why an unverified agent completion signal may not establish success'],
  ['This is not investment advice.','']
 ],
 'video_scripts/03.md':[
  ['Four recent sources raise','Several recent sources raise'],
  ['the agent reduces how much you implement, not how much you own.','delegating implementation does not remove responsibility for the result.'],
  ['a six-level maturity model','a staged maturity model'],
  ['All sources have commercial interests in the tools discussed, and none accounts for novice maintainers, accessibility needs, or teams without enterprise budgets.','The vendor sources have commercial interests, and the field guide offers advice rather than measured student outcomes. Novice maintainers, accessibility needs, and teams without enterprise budgets remain underrepresented.']
 ]
};
for(const [relative,replacements]of Object.entries(fixes)){
 const path=`${runDir}/${relative}`,old=readText(path);let body=old;const applied=[];
 for(const [from,to]of replacements){if(!body.includes(from))throw new Error(`Expected passage absent in ${relative}: ${from.slice(0,65)}`);body=body.replaceAll(from,to);applied.push({before:from,after:to});}
 const id=relative.match(/(\d\d)\.md$/)[1],title=briefs.find(x=>x.piece_id===id).title;
 // Normalize front matter while leaving narration and its source cues intact.
 body=body.replace(/^As of 2026-10-16\.\s*/,'').replace(/^#{1,2} (?!Narration\b)[^\n]+\n+/,'').replace(/^\*(?:Assessment as of|As of|Evidence assessed as of|Agent Engineering Brief — Evidence assessed as of)[^\n]*\*\s*/,'');
 body=`# ${title}\n\nAs of 2026-10-16.\n\n`+body.replace(/^(?:---\s*)+/,'');
 atomicWrite(`${runDir}/before-final-polish/${relative}`,old);atomicWrite(path,body);
 audit.push({path,before_hash:hash(old),after_hash:hash(body),edits:applied});
}
writeJson(`${runDir}/final-polish-audit.json`,{editor:'AI assistant',recorded_at:now(),student_approval:false,reason:'Keep interpretation bounded, correct attribution, align article and narration, and remove unsupported universal wording.',artifacts:audit});
console.log('Final source-bounded wording edits saved, with before/after audit.');

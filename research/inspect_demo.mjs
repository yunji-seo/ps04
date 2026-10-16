import fs from 'node:fs';
const run='runs/2026-10-16T04-24-58-255Z-ee63f048';
const lines=p=>fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const items=lines(run+'/eligible.jsonl');
const item=items.find(x=>x.url==='https://blog.cloudflare.com/deno-joins-cloudflare/');
const decision=lines(run+'/decisions.jsonl').find(x=>x.item_id===item.item_id);
const brief=lines(run+'/briefs.jsonl').find(x=>x.piece_id==='03');
const claim=brief.claims.find(x=>x.claim_id==='03-c5');
console.log(JSON.stringify({item,decision,claim},null,2));

import {fetchText} from '../lib/network.mjs';
import {parseFeed} from '../collectors/feed_parser.mjs';
import {writeJson,now} from '../lib/common.mjs';
const sources=[
 {source_id:'simon',publisher_id:'simon-willison',kind:'feed',url:'https://simonwillison.net/atom/everything/'},
 {source_id:'github',publisher_id:'github',kind:'feed',url:'https://github.blog/feed/'},
 {source_id:'cloudflare',publisher_id:'cloudflare',kind:'feed',url:'https://blog.cloudflare.com/rss/'},
 {source_id:'fowler',publisher_id:'martin-fowler',kind:'feed',url:'https://martinfowler.com/feed.atom'},
 {source_id:'stackoverflow',publisher_id:'stackoverflow',kind:'feed',url:'https://stackoverflow.blog/feed/'},
 {source_id:'latent',publisher_id:'latent-space',kind:'podcast',url:'https://www.latent.space/feed'},
 {source_id:'changelog',publisher_id:'changelog',kind:'podcast',url:'https://changelog.com/podcast/feed'},
 {source_id:'practicalai',publisher_id:'practical-ai',kind:'podcast',url:'https://feeds.transistor.fm/practical-ai'}
];
const results=await Promise.all(sources.map(async source=>{
 try {
  const response=await fetchText(source.url);
  const rows=parseFeed(response.text,source,source.kind);
  return {source,status:'retrieved',count:rows.length,items:rows.filter(x=>/agent|coding|code|software|developer/i.test(x.title)).slice(0,12)};
 }catch(e){return {source,status:'failed',error:e.message};}
}));
writeJson('research/source-probe.json',{checked_at:now(),purpose:'Source discovery only; not a complete pipeline run or eligibility assessment',results});
for(const r of results) console.log(JSON.stringify(r));

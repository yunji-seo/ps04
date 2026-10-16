import {fetchText} from '../lib/network.mjs';
import {parseHTML} from 'linkedom';
import {writeJson,now} from '../lib/common.mjs';
const urls=['https://www.latent.space/p/thariq','https://www.latent.space/p/devday-2026','https://github.blog/','https://simonwillison.net/','https://martinfowler.com/rachels-ramblings/code-review.html'];
const results=await Promise.all(urls.map(async url=>{
 try {
  const {text}=await fetchText(url);const {document}=parseHTML(text);
  const links=[...document.querySelectorAll('a[href],link[href]')].map(x=>({text:x.textContent.trim().slice(0,100),href:x.getAttribute('href'),type:x.getAttribute('type')})).filter(x=>/youtu|feed|rss/i.test(x.href)||/rss|feed/i.test(x.type||''));
  const audio=[...document.querySelectorAll('audio,source,meta[property="og:audio"],meta[property="og:audio:url"]')].map(x=>x.getAttribute('src')||x.getAttribute('content')).filter(Boolean);
  const dates=[...document.querySelectorAll('time,meta[property="article:published_time"],.date')].map(x=>x.getAttribute('datetime')||x.getAttribute('content')||x.textContent.trim());
  return {url,links,audio,dates};
 }catch(e){return {url,error:e.message};}
}));
writeJson('research/page-discovery.json',{checked_at:now(),results});
for(const r of results)console.log(JSON.stringify(r));

import fs from 'node:fs';
const pairs=JSON.parse(fs.readFileSync('runs/2026-10-16T04-24-58-255Z-ee63f048/package/publication_links.json','utf8'));
const urls=['https://github.com/yunji-seo/ps04',...pairs.flatMap(x=>[x.substack_url,x.youtube_url])];
const results=await Promise.all(urls.map(async url=>{try{const r=await fetch(url,{signal:AbortSignal.timeout(25000)});const html=await r.text();return {url,final_url:r.url,status:r.status,title:html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||null,contains_expected_youtube_id:url.includes('youtu.be/')?html.includes(url.split('/').pop()):null,bytes:html.length};}catch(e){return {url,error:e.message}}}));
fs.writeFileSync('docs/PUBLIC_ACCESS.json',JSON.stringify({checked_at:new Date().toISOString(),method:'Unauthenticated HTTP requests, no cookies or credentials. HTML availability is not a full playback or paywall test.',results},null,2));console.log(JSON.stringify(results));

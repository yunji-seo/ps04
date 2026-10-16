import {parseHTML} from 'linkedom';
import {Readability} from '@mozilla/readability';
export const EXTRACTOR_VERSION='article-body-v2';
export function conditionalPageHeaders(prior) {
 if(prior?.extraction_version!==EXTRACTOR_VERSION)return {};
 const headers={};
 if(prior.http_etag)headers['If-None-Match']=prior.http_etag;
 if(prior.http_last_modified)headers['If-Modified-Since']=prior.http_last_modified;
 return headers;
}
export function pageContent(html,url) {
 const {document}=parseHTML(html);
 const nodes=[];
 function walk(value){if(!value||typeof value!=='object')return;nodes.push(value);for(const v of Object.values(value))if(typeof v==='object')Array.isArray(v)?v.forEach(walk):walk(v);}
 for(const script of document.querySelectorAll('script[type="application/ld+json"]')){try{walk(JSON.parse(script.textContent));}catch{}}
 const article=nodes.find(x=>x.datePublished && /Article|Posting|Episode/i.test(String(x['@type'])));
 const date=article?.datePublished || document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') || null;
 const audio=document.querySelector('audio[src],audio source[src]')?.getAttribute('src') || document.querySelector('meta[property="og:audio"],meta[property="og:audio:url"]')?.getAttribute('content') || null;
 const title=document.querySelector('h1')?.textContent?.trim() || document.title;
 const readable=new Readability(document.cloneNode(true)).parse();
 // Select the article body before broad layout containers. A selector list would
 // select the first element in document order, often the surrounding main element.
 const hostname=new URL(url).hostname;
 const publisherSelector=hostname==='github.blog'?'.post__content':hostname==='blog.cloudflare.com'?'.article-content':hostname==='simonwillison.net'?'.entry.entryPage':null;
 const selectors=[publisherSelector,'.body.markup','.post-content','article','main'].filter(Boolean);
 const main=selectors.map(selector=>document.querySelector(selector)).find(Boolean);
 // Readability supplies prose; preserve paragraph boundaries for timestamped source transcripts.
 const blockText=main?[...main.querySelectorAll('h1,h2,h3,p,li,pre')].map(x=>x.textContent.trim()).filter(Boolean).join('\n\n'):null;
 const text=(blockText||readable?.textContent||'').replace(/\r/g,'').trim();
 return {text,title,published_at:date,media_url:audio?new URL(audio,url).href:null};
}

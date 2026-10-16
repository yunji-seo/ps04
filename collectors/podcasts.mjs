import {InputError,readJson,requiredRun,stage,emit,hash,now,validateSources} from '../lib/common.mjs';
import {fetchText} from '../lib/network.mjs';
import {parseFeed} from './feed_parser.mjs';
import {pageContent} from '../processing/html.mjs';
const [runDir,...extra]=process.argv.slice(2);
await stage('collectors/fetch_podcasts',runDir||'runs/invalid-invocations',async receipt=>{
  if(extra.length)throw new InputError('Usage: fetch_podcasts.sh RUN_DIR');
  requiredRun(runDir);
  const sources=validateSources(readJson(`${runDir}/config/sources.json`));
  receipt.source_results=[];
  for(const source of sources.filter(x=>x.kind==='podcast')) {
    receipt.input_count++;
    try {
      const {text}=await fetchText(source.url);
      let rows=parseFeed(text,source,'podcast');
      // Configured episode pages supplement truncated feeds; metadata still comes from the source.
      for(const url of source.episode_urls||[]) {
        if(rows.some(x=>x.url===url))continue;
        const page=pageContent((await fetchText(url)).text,url);
        if(!page.media_url)throw new Error(`No source audio found at ${url}`);
        const timestamp=page.published_at && Date.parse(page.published_at);
        rows.push({item_id:`podcast:${source.publisher_id}:${hash(url).slice(0,24)}`,source_id:source.source_id,publisher_id:source.publisher_id,
          kind:'podcast',title:page.title,url,published_at:Number.isFinite(timestamp)?new Date(timestamp).toISOString():null,retrieved_at:now(),media_url:page.media_url,
          native_id:url,date_evidence:{source:url,field:'datePublished or article:published_time',value:page.published_at},discovery_route:'configured episode page supplementing feed'});
      }
      if(source.include_urls?.length) rows=rows.filter(x=>source.include_urls.includes(x.url));
      rows=rows.slice(0,source.max_items||8);
      rows.forEach(emit);receipt.output_count+=rows.length;
      receipt.source_results.push({source_id:source.source_id,status:'completed',count:rows.length});
    }catch(e){receipt.status='incomplete';receipt.errors.push(`${source.source_id}: ${e.message}`);receipt.source_results.push({source_id:source.source_id,status:'failed'});}
  }
});

import {InputError,readJson,requiredRun,stage,emit,validateSources} from '../lib/common.mjs';
import {fetchText} from '../lib/network.mjs';
import {parseFeed} from './feed_parser.mjs';
const [runDir,...extra]=process.argv.slice(2);
await stage('collectors/fetch_feeds',runDir||'runs/invalid-invocations',async receipt=>{
  if(extra.length)throw new InputError('Usage: fetch_feeds.sh RUN_DIR');
  requiredRun(runDir);
  const sources=validateSources(readJson(`${runDir}/config/sources.json`));
  receipt.source_results=[];
  for(const source of sources.filter(x=>x.kind==='feed')) {
    receipt.input_count++;
    try {
      const {text}=await fetchText(source.url);
      const rows=parseFeed(text,source,'feed').slice(0,source.max_items||30);
      rows.forEach(emit);receipt.output_count+=rows.length;
      receipt.source_results.push({source_id:source.source_id,status:'completed',count:rows.length});
    }catch(e){receipt.status='incomplete';receipt.errors.push(`${source.source_id}: ${e.message}`);receipt.source_results.push({source_id:source.source_id,status:'failed'});}
  }
});

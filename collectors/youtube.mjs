import {InputError,readJson,requiredRun,stage,emit,now,validateSources} from '../lib/common.mjs';
import {command} from '../lib/process.mjs';
import {httpUrl} from '../lib/network.mjs';
const [runDir,...extra]=process.argv.slice(2);
await stage('collectors/fetch_youtube',runDir||'runs/invalid-invocations',async receipt=>{
 if(extra.length)throw new InputError('Usage: fetch_youtube.sh RUN_DIR');
 requiredRun(runDir);receipt.tools.push('yt-dlp');
 const sources=validateSources(readJson(`${runDir}/config/sources.json`));
 for(const source of sources.filter(x=>x.kind==='youtube')) {
  receipt.input_count++;
  try {
   httpUrl(source.url);
   const listing=JSON.parse(command('yt-dlp',['--flat-playlist','--playlist-end',String(source.max_items||4),'--dump-single-json','--skip-download','--no-warnings',source.url]));
   for(const entry of listing.entries||[listing]) {
    if(source.exclude_video_ids?.includes(entry.id))continue;
    try {
     const videoUrl=`https://www.youtube.com/watch?v=${entry.id}`;
     const info=JSON.parse(command('yt-dlp',['--dump-single-json','--skip-download','--no-playlist','--no-warnings',videoUrl]));
     let published_at=null;
     if(info.release_timestamp||info.timestamp) published_at=new Date((info.release_timestamp||info.timestamp)*1000).toISOString();
     else if(/^\d{8}$/.test(info.upload_date||'')) published_at=`${info.upload_date.slice(0,4)}-${info.upload_date.slice(4,6)}-${info.upload_date.slice(6,8)}T00:00:00Z`;
     emit({item_id:source.item_identity_overrides?.[videoUrl]||`youtube:${info.id}`,source_id:source.source_id,publisher_id:source.publisher_id,
      kind:'youtube',title:info.title,url:videoUrl,published_at,retrieved_at:now(),media_url:videoUrl,
      native_id:info.id,duration_seconds:info.duration??null,
      ...(source.retained_transcripts?.[info.id]?{retained_transcript:source.retained_transcripts[info.id]}:{}),
      reuse_retained_transcript:source.reuse_retained_transcript===true,
      date_evidence:{source:videoUrl,field:info.release_timestamp?'release_timestamp':info.timestamp?'timestamp':'upload_date',value:info.release_timestamp||info.timestamp||info.upload_date||null,precision:info.timestamp||info.release_timestamp?'second':'day'}});
     receipt.output_count++;
    }catch(e){receipt.status='incomplete';receipt.errors.push(`${source.source_id}/${entry.id}: ${e.message}`);}
   }
  }catch(e){receipt.status='incomplete';receipt.errors.push(`${source.source_id}: ${e.message}`);}
 }
});

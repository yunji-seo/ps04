import fs from 'node:fs';
import {InputError,stdinLines,readJson,readText,requiredRun,stage,emit,safePath,hash,canonical,atomicWrite,writeJson,now} from '../lib/common.mjs';
import {fetchText,download} from '../lib/network.mjs';
import {command,storeGet} from '../lib/process.mjs';
import {pageContent,EXTRACTOR_VERSION,conditionalPageHeaders} from './html.mjs';
import {vttSegments,proseSegments,validateSegments,browserTranscript} from './transcripts.mjs';

const [runDir,...extra]=process.argv.slice(2);
function immutable(p,content){if(fs.existsSync(safePath(p))){if(readText(p)!==content)throw new Error('Refusing to overwrite retained evidence');}else atomicWrite(p,content);}
await stage('processing/extract_content',runDir||'runs/invalid-invocations',async receipt=>{
 if(extra.length)throw new InputError('Usage: extract_content.sh RUN_DIR');
 requiredRun(runDir);const rows=stdinLines();receipt.input_count=rows.length;receipt.reused_count=0;receipt.item_results=[];
 for(const row of rows){
  try{
   if(!row.item_id||!row.url||!['feed','youtube','podcast'].includes(row.kind))throw new InputError('Invalid candidate');
   let prior=null;
   try{prior=storeGet(row.item_id);}catch(e){if(!e.message.includes('not found'))throw e;}
   let text,segments=null,metadata={...row},media=null;
   if(row.kind==='feed'){
    const headers=conditionalPageHeaders(prior);
    const page=await fetchText(row.url,{headers});
    if(page.status===304 && prior){text=readText(prior.text_path);metadata.published_at=row.published_at||prior.published_at;receipt.reused_count++;}
    else{
     const content=pageContent(page.text,page.url);text=content.text;
     if(!metadata.published_at&&content.published_at&&Number.isFinite(Date.parse(content.published_at))){metadata.published_at=new Date(content.published_at).toISOString();metadata.date_evidence={source:page.url,field:'datePublished or article:published_time',value:content.published_at};}
    }
    metadata.http_etag=page.headers.etag||prior?.http_etag||null;
    metadata.http_last_modified=page.headers['last-modified']||prior?.http_last_modified||null;
    metadata.extraction_version=EXTRACTOR_VERSION;
    if(prior&&prior.extraction_version!==EXTRACTOR_VERSION)metadata.extraction_migration={from:prior.extraction_version||'legacy',to:EXTRACTOR_VERSION,note:'Parser migration may change retained text without a source editorial update'};
    metadata.extracted_word_count=text.split(/\s+/).filter(Boolean).length;
    metadata.short_text=metadata.extracted_word_count<120;
    if(metadata.extracted_word_count<10)throw new Error('No substantive page text extracted; inspect access or parsing');
   }else{
    receipt.tools.push(...['yt-dlp','ffprobe'].filter(x=>!receipt.tools.includes(x)));
    const itemDir=`data/media/${hash(row.item_id).slice(0,24)}`;
    fs.mkdirSync(safePath(itemDir),{recursive:true});
    if(row.kind==='youtube'){
     const base=`${itemDir}/${hash(runDir).slice(0,16)}`;
     const savedMedia=prior?.media_path&&fs.existsSync(safePath(prior.media_path));
     if(savedMedia&&row.reuse_retained_transcript&&prior.segments_path){
      segments=validateSegments(readJson(prior.segments_path));
      media={media_path:prior.media_path,source_url:row.url};
      metadata.transcript_origin={...prior.transcript_origin,reused_from_version:prior.version_id,refresh_policy:'Explicit configured reuse of retained transcript; no new caption fetch claimed'};
      receipt.reused_count++;
     }else{
     // Captions are refreshed on every run; an unchanged media file need not be downloaded again.
     const imported=row.retained_transcript;
     const captionArgs=imported?[]:['--write-subs','--write-auto-subs','--sub-langs','en,en-orig','--sub-format','vtt'];
     const args=['--no-playlist','--no-warnings',...captionArgs,'--no-overwrites','-f','bestaudio[language^=en]/bestaudio/best','-o',`${base}.%(ext)s`];
     if(savedMedia)args.push('--skip-download');
     command('yt-dlp',[...args,row.url],{timeout:240000});
     const files=fs.readdirSync(safePath(itemDir));
     const currentCaptions=files.filter(x=>x.startsWith(hash(runDir).slice(0,16))&&x.endsWith('.vtt'));
     const caption=currentCaptions.sort().find(x=>x.includes('.en.'))||currentCaptions[0];
     if(!caption&&!imported)throw new Error('No English captions retrieved; a transcription provider is required');
     const file=savedMedia?prior.media_path:files.filter(x=>/\.(webm|m4a|mp4|mp3|ogg)$/.test(x)).map(x=>`${itemDir}/${x}`)[0];
     if(!file)throw new Error('Video audio download is missing');
     if(imported){
      const raw=readText(imported.path);
      const duration=Number(command('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file]));
      segments=browserTranscript(raw,row.native_id,duration);
      metadata.transcript_origin={kind:'browser_export',...imported,source_url:row.url,end_boundary_method:'Next provided timestamp; measured media duration for final segment'};
     }else segments=validateSegments(vttSegments(readText(`${itemDir}/${caption}`)));
     media={media_path:file,source_url:row.url};
     if(savedMedia)receipt.reused_count++;
     if(!imported)metadata.transcript_origin={kind:'youtube_caption',path:`${itemDir}/${caption}`,automated:'unknown; inspect source caption track'};
     }
    }else{
     if(!row.media_url)throw new Error('Podcast audio URL missing');
     const file=`${itemDir}/${hash(row.media_url).slice(0,16)}.audio`;
     if(!fs.existsSync(safePath(file)))await download(row.media_url,file);else receipt.reused_count++;
     media={media_path:file,source_url:row.media_url};
     const duration=Number(command('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file]));
     if(row.transcript_url){
      const transcript=await fetchText(row.transcript_url);
      if(/\.json(?:\?|$)/.test(row.transcript_url)){const data=JSON.parse(transcript.text);segments=data.segments||data;}
      else segments=vttSegments(transcript.text);
      metadata.transcript_origin={kind:'publisher_transcript',url:row.transcript_url};
     }else{
      const page=await fetchText(row.url);
      segments=proseSegments(pageContent(page.text,row.url).text,duration);
      metadata.transcript_origin={kind:'publisher_timestamped_page',url:row.url,end_boundary_method:'Next published speaker start, or measured audio duration for final turn'};
     }
     validateSegments(segments);
    }
    text=segments.map(x=>x.text).join('\n');
   }
   const version_id=hash(canonical({title:metadata.title,url:metadata.url,published_at:metadata.published_at,text,segments}));
   const base=`data/assets/${hash(row.item_id).slice(0,24)}/${version_id}`;
   immutable(`${base}.txt`,text);
   if(segments)immutable(`${base}.segments.json`,JSON.stringify(segments,null,2)+'\n');
   const item={...metadata,version_id,text_path:`${base}.txt`,segments_path:segments?`${base}.segments.json`:null,...media,extracted_at:now()};
   emit(item);receipt.output_count++;
   receipt.item_results.push({item_id:row.item_id,status:'completed',version_id});
  }catch(e){receipt.status='incomplete';receipt.errors.push(`${row.item_id}: ${e.message}`);receipt.item_results.push({item_id:row.item_id,status:'failed',error:e.message});}
 }
});

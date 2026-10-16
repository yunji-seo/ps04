import {InputError} from '../lib/common.mjs';
const seconds=value=>value.replace(',','.').split(':').reduce((n,x)=>n*60+Number(x),0);
export function vttSegments(text) {
 const segments=[];
 const lines=text.replace(/\r/g,'').split('\n');
 for(let i=0;i<lines.length;i++) {
  const match=lines[i].match(/((?:\d+:)?\d{2}:\d{2}[.,]\d+)\s+-->\s+((?:\d+:)?\d{2}:\d{2}[.,]\d+)/);
  if(!match)continue;
  const words=[];while(lines[++i]?.trim())words.push(lines[i]);
  const clean=words.join(' ').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
  if(clean)segments.push({segment_id:`s-${String(segments.length+1).padStart(5,'0')}`,start_seconds:seconds(match[1]),end_seconds:seconds(match[2]),text:clean});
 }
 return segments;
}
export function proseSegments(text,duration) {
 // The source prints speaker turns with start timestamps. End each turn at the next source timestamp.
 const matches=[...text.matchAll(/(?:^|\n)([^\n]{0,100}?)\[(\d{1,2}:\d{2}:\d{2})\]:?\s*/g)];
 const segments=[];
 for(let i=0;i<matches.length;i++) {
  const start=seconds(matches[i][2]), end=i+1<matches.length?seconds(matches[i+1][2]):duration;
  const body=text.slice(matches[i].index+matches[i][0].length,i+1<matches.length?matches[i+1].index:undefined).trim();
  if(body && Number.isFinite(end) && end>start)segments.push({segment_id:`s-${String(segments.length+1).padStart(5,'0')}`,start_seconds:start,end_seconds:end,text:body});
 }
 return segments;
}
export function validateSegments(segments) {
 if(!Array.isArray(segments)||!segments.length)throw new Error('No usable timestamped transcript; transcription is still required');
 const seen=new Set();let prior=-1;
 for(const s of segments){
  if(typeof s.segment_id!=='string'||seen.has(s.segment_id)||typeof s.text!=='string'||!s.text.trim()||!Number.isFinite(s.start_seconds)||!Number.isFinite(s.end_seconds)||s.start_seconds<0||s.end_seconds<=s.start_seconds||s.start_seconds<prior)throw new InputError('Invalid transcript segment');
  seen.add(s.segment_id);prior=s.start_seconds;
 }
 return segments;
}
export function browserTranscript(text, videoId, duration) {
 if(!text.includes(`Video ID: ${videoId}\n`) && !text.includes(`Video ID: ${videoId}\r\n`))throw new InputError('Imported transcript video identity does not match');
 const matches=[...text.matchAll(/^\[((?:\d+:)?\d{1,2}:\d{2})\]\s+(.+)$/gm)];
 const segments=matches.map((m,i)=>({segment_id:`s-${String(i+1).padStart(5,'0')}`,start_seconds:seconds(m[1]),end_seconds:i+1<matches.length?seconds(matches[i+1][1]):duration,text:m[2].trim()}));
 return validateSegments(segments);
}

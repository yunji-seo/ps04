import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

// Keep Google Vids audio; replace its delayed object entrances with readable scene images.
// Boundaries below are the observed Google Vids narration clip starts, rounded to seconds.
const starts = { '01':[0,25,64,96,126,168,209], '02':[0,18,83,106,142,189,213], '03':[0,15,77,121,159,185,204] };
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const results=[];
for(const [id,cuts] of Object.entries(starts)){
  const input=path.join(root,'videos',id+'.mp4');
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',input],{encoding:'utf8',windowsHide:true}));
  const duration=Number(probe.format.duration);
  const lines=['ffconcat version 1.0'];
  for(let i=0;i<cuts.length;i++){
    const image=path.join(root,'scenes',id,'scene-'+String(i+1).padStart(2,'0')+'.png').replaceAll('\\','/');
    lines.push("file '"+image.replaceAll("'","'\\''")+"'",'duration '+((cuts[i+1]??duration)-cuts[i]));
  }
  lines.push(lines[lines.length-2]);
  const list=path.join(root,'videos',id+'-frames.ffconcat');fs.writeFileSync(list,lines.join('\n')+'\n');
  const output=path.join(root,'videos',id+'-final.mp4');
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',list,'-i',input,'-map','0:v:0','-map','1:a:0','-vf','scale=1920:1080','-r','30','-c:v','libx264','-preset','fast','-crf','20','-c:a','copy','-t',String(duration),'-movflags','+faststart',output],{stdio:'inherit',windowsHide:true});
  const final=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',output],{encoding:'utf8',windowsHide:true}));
  const result={piece:id,path:'production/videos/'+id+'-final.mp4',duration_seconds:Number(final.format.duration),width:final.streams[0].width,height:final.streams[0].height,audio_preserved_without_reencoding:true,scene_starts_seconds:cuts};
  results.push(result);console.log(JSON.stringify(result));
}
fs.writeFileSync(path.join(root,'video-manifest.json'),JSON.stringify(results,null,2)+'\n');

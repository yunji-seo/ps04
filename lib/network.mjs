import fs from 'node:fs';
import path from 'node:path';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import crypto from 'node:crypto';
import {safePath, InputError} from './common.mjs';

export function httpUrl(value, base) {
  let url;
  try { url = new URL(value, base); } catch { throw new InputError('Invalid source URL'); }
  if (!['https:','http:'].includes(url.protocol) || url.username || url.password) throw new InputError('Expected HTTP(S) URL without credentials');
  return url.href;
}
export async function response(url, {headers={}, timeout=45000}={}) {
  const res=await fetch(httpUrl(url),{headers:{'User-Agent':'PS04-academic-research/0.1',...headers},signal:AbortSignal.timeout(timeout)});
  if (!res.ok && res.status!==304) throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
  return res;
}
export async function fetchText(url, options={}) {
  const res=await response(url,options);
  const limit=options.limit || 20000000;
  if (Number(res.headers.get('content-length'))>limit) throw new Error('Source document exceeds configured size limit');
  let size=0; const chunks=[];
  for await(const chunk of res.body || []) { size+=chunk.length; if(size>limit) throw new Error('Source document exceeds configured size limit'); chunks.push(chunk); }
  return {text:Buffer.concat(chunks).toString('utf8'),url:res.url,headers:Object.fromEntries(res.headers),status:res.status};
}
export async function download(url, relative, maxBytes=500000000) {
  const res=await response(url,{timeout:240000});
  const target=safePath(relative); fs.mkdirSync(path.dirname(target),{recursive:true});
  const temp=target+'.'+crypto.randomUUID()+'.tmp'; let bytes=0;
  try {
    await pipeline(Readable.fromWeb(res.body),new Transform({transform(chunk,enc,cb){bytes+=chunk.length; cb(bytes>maxBytes ? new Error('Media exceeds configured size limit') : null,chunk);}}),fs.createWriteStream(temp,{flags:'wx'}));
    fs.renameSync(temp,target);
    return {bytes,content_type:res.headers.get('content-type'),source_url:url};
  } finally {if(fs.existsSync(temp))fs.unlinkSync(temp);}
}

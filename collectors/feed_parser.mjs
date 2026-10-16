import {XMLParser, XMLValidator} from 'fast-xml-parser';
import {hash, now, InputError} from '../lib/common.mjs';
import {httpUrl} from '../lib/network.mjs';

const array=value=>value==null?[]:Array.isArray(value)?value:[value];
const string=value=>typeof value==='object' ? String(value?.['#text'] || '') : String(value ?? '');
export function parseFeed(xml, source, kind) {
  if (/<!DOCTYPE/i.test(xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g,''))) throw new InputError('DOCTYPE declarations are not accepted in source feeds');
  const valid=XMLValidator.validate(xml);
  if(valid!==true) throw new InputError('Invalid XML feed');
  const doc=new XMLParser({ignoreAttributes:false,parseTagValue:false,processEntities:true}).parse(xml);
  const entries=doc.rss?.channel?.item ?? doc.feed?.entry;
  if(!(doc.rss && Object.hasOwn(doc.rss,'channel')) && !Object.hasOwn(doc,'feed')) throw new InputError('Response is not an RSS or Atom feed');
  const rows=[];
  for(const entry of array(entries)) {
    const links=array(entry.link);
    const link=links.find(x=>typeof x==='string') || links.find(x=>!x['@_rel']||x['@_rel']==='alternate');
    const url=httpUrl(typeof link==='string'?link:link?.['@_href'] || string(entry.guid),source.url);
    const audio=x=>/^audio\//i.test(x['@_type']||'') || /\.(mp3|m4a|wav|ogg)(\?|$)/i.test(x['@_url']||x['@_href']||'');
    const enclosure=array(entry.enclosure).find(x=>x['@_url'] && audio(x)) || links.find(x=>x['@_rel']==='enclosure' && audio(x));
    if(kind==='podcast' && !enclosure) continue;
    const originalDate=string(entry.pubDate || entry.published || entry['dc:date']) || null;
    const parsed=originalDate && Date.parse(originalDate);
    const published_at=parsed && Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
    const native=string(entry.guid || entry.id) || url;
    const transcript=array(entry['podcast:transcript']).find(x=>/json|vtt|srt/i.test(x['@_type']||''));
    const row={item_id:`${kind}:${source.publisher_id}:${hash(native).slice(0,24)}`,source_id:source.source_id,
      publisher_id:source.publisher_id,kind,title:string(entry.title).trim()||'(Untitled)',url,published_at,retrieved_at:now(),
      media_url:kind==='podcast'?httpUrl(enclosure['@_url']||enclosure['@_href'],source.url):null,
      date_evidence:{source:source.url,field:entry.pubDate?'pubDate':entry.published?'published':'dc:date',value:originalDate},
      native_id:native};
    if(transcript) row.transcript_url=httpUrl(transcript['@_url'],source.url);
    if(source.item_identity_overrides?.[url]) row.item_id=source.item_identity_overrides[url];
    rows.push(row);
  }
  return rows;
}

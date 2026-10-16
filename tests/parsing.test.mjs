import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFeed} from '../collectors/feed_parser.mjs';
import {vttSegments,proseSegments,validateSegments} from '../processing/transcripts.mjs';
import {pageContent,EXTRACTOR_VERSION,conditionalPageHeaders} from '../processing/html.mjs';
const source={source_id:'test',publisher_id:'test',url:'https://test.example/feed'};
test('podcast collector accepts audio enclosures and excludes image enclosures',()=>{
 const xml='<rss><channel><item><title>Image</title><link>https://test.example/image</link><enclosure url="https://test.example/a.jpg" type="image/jpeg"/></item><item><title>Audio</title><link>https://test.example/audio</link><pubDate>Wed, 14 Oct 2026 12:00:00 GMT</pubDate><enclosure url="https://test.example/a.mp3" type="audio/mpeg"/></item></channel></rss>';
 const rows=parseFeed(xml,source,'podcast');assert.equal(rows.length,1);assert.equal(rows[0].title,'Audio');assert.equal(rows[0].published_at,'2026-10-14T12:00:00.000Z');
});
test('HTML examples inside CDATA are not XML DOCTYPE declarations',()=>{
 const xml='<rss><channel><item><title>Test</title><link>https://test.example/a</link><description><![CDATA[<!DOCTYPE html>Example]]></description></item></channel></rss>';
 assert.equal(parseFeed(xml,source,'feed').length,1);
 assert.throws(()=>parseFeed('<!DOCTYPE rss><rss><channel/></rss>',source,'feed'));
});
test('an updated-only Atom date is not silently treated as original publication',()=>{
 const xml='<feed><entry><title>Example</title><id>stable</id><link href="https://test.example/a"/><updated>2026-10-14T12:00:00Z</updated></entry></feed>';
 assert.equal(parseFeed(xml,source,'feed')[0].published_at,null);
});
test('transcripts preserve provided timing and fail on invalid intervals',()=>{
 const cues=vttSegments('WEBVTT\n\n00:00:01.500 --> 00:00:03.000\nHello <b>world</b>\n');
 assert.equal(cues[0].start_seconds,1.5);assert.equal(cues[0].end_seconds,3);assert.equal(cues[0].text,'Hello world');
 assert.equal(validateSegments(cues).length,1);
 assert.throws(()=>validateSegments([{...cues[0],end_seconds:0}]));
 const prose=proseSegments('Pat [00:00:01]: One.\n\nAlex [00:00:04]: Two.',8);
 assert.deepEqual(prose.map(x=>[x.start_seconds,x.end_seconds]),[[1,4],[4,8]]);
});
test('article extraction retains paragraphs and reads explicit publication metadata',()=>{
 const html='<html><head><meta property="article:published_time" content="2026-10-14T12:00:00Z"></head><body><article><h1>Title</h1><p>First paragraph.</p><p>Second paragraph.</p></article></body></html>';
 const value=pageContent(html,'https://test.example/a');assert.match(value.text,/First paragraph\.\n\nSecond paragraph\./);assert.equal(value.published_at,'2026-10-14T12:00:00Z');
});

test('article bodies exclude changing recommendations and tag counters without hiding body edits',()=>{
 for(const [host,element] of [['github.blog','section class="post__content"'],['blog.cloudflare.com','div class="article-content"'],['simonwillison.net','div class="entry entryPage"'],['example.test','div class="body markup"']]){
  const tag=element.split(' ')[0];
  const html=(body,noise)=>`<html><body><main><h1>Site</h1><${element}><p>${body}</p><p>Pat [00:01:02]: Timestamped source passage.</p></${tag}><aside><p>Related posts ${noise}</p><li>Tag count ${noise}</li></aside></main></body></html>`;
  const original=pageContent(html('Actual article body.',1),`https://${host}/post`).text;
  assert.equal(pageContent(html('Actual article body.',2),`https://${host}/post`).text,original,host);
  assert.notEqual(pageContent(html('Changed article body.',2),`https://${host}/post`).text,original,host);
  assert.match(original,/00:01:02/);assert.doesNotMatch(original,/Related posts|Tag count/);
 }
});

test('parser upgrades force a fresh response instead of reusing an older extraction through HTTP 304',()=>{
 const prior={http_etag:'"fixture"',http_last_modified:'Wed, 14 Oct 2026 12:00:00 GMT'};
 assert.deepEqual(conditionalPageHeaders(prior),{});
 assert.deepEqual(conditionalPageHeaders({...prior,extraction_version:'old'}),{});
 assert.deepEqual(conditionalPageHeaders({...prior,extraction_version:EXTRACTOR_VERSION}),{'If-None-Match':'"fixture"','If-Modified-Since':'Wed, 14 Oct 2026 12:00:00 GMT'});
});

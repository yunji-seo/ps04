import {fetchText} from '../lib/network.mjs';
for(const url of ['https://www.latent.space/p/thariq','https://github.blog/feed/']) {
 const {text,url:finalUrl,headers}=await fetchText(url);
 console.log(JSON.stringify({url,finalUrl,contentType:headers['content-type'],snippets:text.match(/.{0,70}(podcast_feed_url|podcast\/\d+\.rss|podcast_rss|rss_url).{0,150}/g)?.slice(0,8),prefix:text.slice(0,160)}));
}

import {readText, readJson, validateItem, strings, InputError} from '../lib/common.mjs';
export const pieceIds = ['01','02','03'];
export const itemKey = item => `${item.item_id}@${item.version_id}`;
export function evidencePacket(item) {
  validateItem(item);
  // Media segments already contain the full transcript; do not send a duplicate copy as text.
  return {...item, text:item.kind==='feed'?readText(item.text_path):undefined, segments:item.segments_path?readJson(item.segments_path):null};
}
export function validateDecisions(rows, items) {
  if (!Array.isArray(rows) || rows.length !== items.length) throw new InputError('Exactly one decision per eligible item is required');
  const keys = new Set(items.map(itemKey)), seen = new Set();
  for (const d of rows) {
    strings(d,['item_id','version_id','reason']);
    const k=itemKey(d);
    if (!keys.has(k) || seen.has(k)) throw new InputError('Decision references an unknown or duplicate item/version');
    seen.add(k);
    if (!['accept','reject','defer'].includes(d.decision) || !Array.isArray(d.piece_ids) || d.piece_ids.some(p=>!pieceIds.includes(p)) || new Set(d.piece_ids).size!==d.piece_ids.length) throw new InputError('Invalid editorial decision');
    if ((d.decision==='accept') !== (d.piece_ids.length>0)) throw new InputError('Only accepted evidence must have piece assignments');
  }
  return rows;
}
export function assertCoverage(items, decisions) {
  const unique = new Map(items.map(x=>[x.item_id,x]));
  if (unique.size < 12 || new Set([...unique.values()].map(x=>x.publisher_id)).size < 6) throw new Error('Coverage insufficient: need 12 distinct items and six publisher identities');
  for (const kind of ['feed','youtube','podcast']) if ([...unique.values()].filter(x=>x.kind===kind).length < 2) throw new Error(`Coverage insufficient: need two ${kind} items; do not fabricate the missing evidence`);
  const acceptedKeys=new Set(decisions.filter(d=>d.decision==='accept').map(itemKey));
  for(const kind of ['feed','youtube','podcast'])if(!items.some(x=>x.kind===kind&&acceptedKeys.has(itemKey(x))))throw new Error(`No accepted ${kind} evidence is available for synthesis; review the editorial gap before planning`);
  for (const piece of pieceIds) {
    const assigned = new Set(decisions.filter(d=>d.decision==='accept'&&d.piece_ids.includes(piece)).map(itemKey));
    if (new Set(items.filter(x=>assigned.has(itemKey(x))).map(x=>x.publisher_id)).size < 3) throw new Error(`Piece ${piece} lacks accepted evidence from three publishers`);
  }
}
export function validateBriefs(briefs, items, decisions, {partial=false}={}) {
  if (!Array.isArray(briefs) || (partial ? briefs.length!==1||!pieceIds.includes(briefs[0]?.piece_id) : briefs.length!==3||briefs.map(x=>x.piece_id).sort().join(',')!=='01,02,03')) throw new InputError('Expected brief piece IDs are missing or duplicated');
  const evidence = new Map(items.map(x=>[itemKey(x),x])), choices = new Map(decisions.map(x=>[itemKey(x),x]));
  const kinds = new Set(), ids = new Set();
  for (const b of briefs) {
    strings(b,['title','question','argument','synthesis','limitations']);
    if (!Array.isArray(b.claims) || !b.claims.length) throw new InputError('Brief claims are missing');
    const publishers = new Set();let synthesis=false;
    for (const c of b.claims) {
      strings(c,['claim_id','statement']);
      if (!new RegExp(`^${b.piece_id}-c[0-9]+$`).test(c.claim_id) || ids.has(c.claim_id)) throw new InputError('Invalid or duplicate claim ID');
      ids.add(c.claim_id);
      if (!['reported_fact','source_claim','inference'].includes(c.type) || !Array.isArray(c.evidence) || !c.evidence.length) throw new InputError('Invalid claim type or missing evidence');
      const claimPublishers=new Set();
      for (const ref of c.evidence) {
        const item=evidence.get(itemKey(ref)), d=choices.get(itemKey(ref));
        if (!item || d?.decision!=='accept' || !d.piece_ids.includes(b.piece_id)) throw new InputError('Claim uses evidence not accepted for this piece');
        if (item.kind==='feed') {
          if (ref.locator?.type!=='text' || typeof ref.locator.quote!=='string' || !ref.locator.quote.trim() || !readText(item.text_path).includes(ref.locator.quote)) throw new InputError('Evidence quote does not exactly match retained text');
        } else if (ref.locator?.type!=='segment' || !readJson(item.segments_path).some(x=>x.segment_id===ref.locator.segment_id)) throw new InputError('Media segment reference does not resolve');
        kinds.add(item.kind);publishers.add(item.publisher_id);claimPublishers.add(item.publisher_id);
      }
      if (c.type==='inference' && claimPublishers.size>=2) synthesis=true;
    }
    if (publishers.size<3) throw new InputError(`Brief ${b.piece_id} cites only ${publishers.size} publishers; cite at least three selected publisher IDs`);
    if (!synthesis) throw new InputError(`Brief ${b.piece_id} needs an inference claim with evidence from TWO DIFFERENT publisher_id values. Two articles from the same publisher do not qualify. Connect what the sources support; do not invent corroboration.`);
  }
  if (!partial&&(new Set(briefs.map(x=>x.argument)).size!==3 || kinds.size!==3)) throw new InputError('Briefs need distinct arguments and series-wide coverage of all three media kinds');
  return briefs;
}

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const ROOT = process.cwd();
export class InputError extends Error {}
export const now = () => new Date().toISOString();
export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
export function safePath(relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative)) throw new InputError('Expected a repository-relative path');
  const target = path.resolve(ROOT, relative);
  const inside = p => p === ROOT || p.startsWith(ROOT + path.sep);
  if (!inside(target)) throw new InputError('Path escapes repository');
  let existing = target;
  while (!fs.existsSync(existing)) existing = path.dirname(existing);
  if (!inside(fs.realpathSync(existing))) throw new InputError('Symlink escapes repository');
  return target;
}
export const readText = p => fs.readFileSync(safePath(p), 'utf8').replace(/^\uFEFF/, '');
export function readJson(p) {
  try { return JSON.parse(readText(p)); } catch (e) { throw new InputError(`Cannot read JSON ${p}: ${e.message}`); }
}
export function parseLines(text) {
  return text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(x => x.trim()).map((line, i) => {
    let row;
    try { row = JSON.parse(line); } catch { throw new InputError(`Malformed JSON on record ${i + 1}`); }
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new InputError(`Record ${i + 1} must be an object`);
    return row;
  });
}
export const readLines = p => parseLines(readText(p));
export const stdinLines = () => parseLines(fs.readFileSync(0, 'utf8'));
export const emit = value => process.stdout.write(JSON.stringify(value) + '\n');
export function atomicWrite(p, text) {
  const target = safePath(p);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = target + '.' + crypto.randomUUID() + '.tmp';
  try { fs.writeFileSync(tmp, text, { encoding: 'utf8', flag: 'wx' }); fs.renameSync(tmp, target); }
  finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
}
export const writeJson = (p, value) => atomicWrite(p, JSON.stringify(value, null, 2) + '\n');
export const writeLines = (p, rows) => atomicWrite(p, rows.map(x => JSON.stringify(x) + '\n').join(''));
export function strings(row, fields) {
  for (const k of fields) if (typeof row[k] !== 'string' || !row[k].trim()) throw new InputError(`Missing or invalid ${k}`);
}
export function validateItem(row) {
  strings(row, ['item_id','version_id','source_id','publisher_id','kind','title','url','retrieved_at','text_path']);
  if (!['feed','youtube','podcast'].includes(row.kind)) throw new InputError('Invalid item kind');
  for (const k of ['published_at','media_url','segments_path']) {
    if (!(row[k] === null || typeof row[k] === 'string')) throw new InputError(`Invalid ${k}`);
  }
  if (row.kind !== 'feed' && !row.segments_path) throw new InputError('Media requires timestamped segments');
  if (row.kind === 'feed' && row.segments_path !== null) throw new InputError('Written items must have null segments_path');
  safePath(row.text_path);
  if (row.segments_path) safePath(row.segments_path);
}
export function validateSources(sources) {
  if (!Array.isArray(sources)) throw new InputError('sources.json must be an array');
  const seen = new Set();
  for (const source of sources) {
    strings(source, ['source_id','publisher_id','kind','url']);
    if (!['feed','youtube','podcast'].includes(source.kind) || seen.has(source.source_id)) throw new InputError('Invalid source kind or duplicate source ID');
    let url; try { url = new URL(source.url); } catch { throw new InputError('Invalid configured source URL'); }
    if (!['http:','https:'].includes(url.protocol) || url.username || url.password) throw new InputError('Source URLs must be HTTP(S), without credentials');
    seen.add(source.source_id);
  }
  return sources;
}
export function validTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  const datePart = value.slice(0, 10);
  const day = new Date(datePart + 'T00:00:00Z');
  return Number.isFinite(day.valueOf()) && day.toISOString().slice(0, 10) === datePart && Number.isFinite(Date.parse(value));
}
export async function stage(name, runDir, fn) {
  const started = now();
  const receipt = {stage:name, status:'completed', input_count:0, output_count:0, started_at:started,
    tools:['node ' + process.version], models:[], cost_usd:0, cost_is_estimate:false, errors:[]};
  let code = 0;
  try { await fn(receipt); }
  catch (e) {
    code = e instanceof InputError ? 2 : 1;
    receipt.status = 'failed';
    receipt.errors.push(e.message);
    process.stderr.write(`${name}: ${e.message}\n`);
  }
  receipt.finished_at = now();
  receipt.exit_code = code || (receipt.status === 'incomplete' ? 1 : 0);
  try { writeJson(`${runDir}/logs/${name.replaceAll('/','-')}-${Date.now()}-${crypto.randomUUID()}.json`, receipt); }
  catch (e) { process.stderr.write(`Cannot write stage receipt: ${e.message}\n`); receipt.exit_code = 2; }
  process.exitCode = receipt.exit_code;
}
export function requiredRun(arg) {
  if (!arg) throw new InputError('RUN_DIR is required');
  const meta = readJson(`${arg}/run.json`);
  strings(meta, ['run_id','started_at','as_of_date','mode']);
  return meta;
}

import fs from 'node:fs';
import crypto from 'node:crypto';
import {readJson, safePath, writeJson, InputError} from './common.mjs';

export function parseModelJson(text) {
  const clean = text.trim();
  try { return JSON.parse(clean); } catch { /* Some models surround a single JSON block with commentary. */ }
  const blocks = [...clean.matchAll(/```(?:json)?\s*\n([\s\S]*?)\n```/gi)];
  if (blocks.length === 1) {
    try { return JSON.parse(blocks[0][1]); } catch { /* Preserve the raw response for inspection. */ }
  }
  throw new Error('Model response does not contain one unambiguous JSON value; inspect the saved response');
}

// Provider transport only. Editorial decisions and content validation belong to callers.
export async function complete(runDir, stageName, receipt, system, payload, maxTokens = 12000) {
  if (fs.existsSync(safePath('.env'))) process.loadEnvFile(safePath('.env'));
  const config = readJson(`${runDir}/config/ai.json`);
  if (config.base_url !== 'https://parley.api.mit.edu/v1') throw new InputError('AI endpoint must be the verified MIT Parley URL');
  if (typeof config.model !== 'string' || !/^[a-z0-9./_-]+$/i.test(config.model)) throw new InputError('Invalid AI model');
  const key = process.env.PARLEY_API_KEY?.trim();
  if (!key) throw new InputError('Configure PARLEY_API_KEY in the private .env file');
  const content = JSON.stringify(payload);
  if (content.length > 600000) throw new InputError('Evidence exceeds this adapter request limit; narrow the evidence explicitly');
  const id = `${stageName.replaceAll('/', '-')}-${Date.now()}-${crypto.randomUUID()}`;
  const base = `${runDir}/ai/${id}`;
  const request = {model: config.model, messages: [{role:'system', content:system}, {role:'user', content}], max_tokens:maxTokens, stream:false};
  // Only the request payload is archived; credentials and headers are never saved.
  writeJson(base + '-request.json', request);
  receipt.models = [...new Set([...receipt.models, config.model])];
  receipt.cost_usd = null;
  receipt.model_calls = (receipt.model_calls || 0) + 1;
  let response;
  try {
    response = await fetch(config.base_url + '/chat/completions', {
      method:'POST', redirect:'error',
      headers:{Authorization:`Bearer ${key}`, 'Content-Type':'application/json'},
      body:JSON.stringify(request), signal:AbortSignal.timeout(180000),
    });
  } catch {
    writeJson(base + '-response.json', {error:'Network failure or timeout; charge status unknown'});
    throw new Error('Parley network failure or timeout; no automatic retry was made');
  }
  if (!response.ok) {
    writeJson(base + '-response.json', {http_status:response.status});
    throw new Error(`Parley returned HTTP ${response.status}; response body omitted to protect credentials`);
  }
  let body;
  try { body = await response.json(); } catch { throw new Error('Parley returned invalid JSON'); }
  const text = body.choices?.[0]?.message?.content;
  const finish = body.choices?.[0]?.finish_reason;
  const usage = Object.fromEntries(['prompt_tokens','completion_tokens','total_tokens']
    .filter(k => Number.isFinite(body.usage?.[k])).map(k=>[k,body.usage[k]]));
  writeJson(base + '-response.json', {model:config.model, finish_reason:finish ?? null, usage, content:typeof text==='string'?text:null});
  receipt.token_usage ||= {prompt_tokens:0,completion_tokens:0,total_tokens:0};
  for (const [k,v] of Object.entries(usage)) receipt.token_usage[k] += v;
  if (finish === 'length') throw new Error('Parley output was truncated; inspect response before rerunning');
  if (finish === 'content_filter' || typeof text !== 'string' || !text.trim()) throw new Error('Parley did not return a usable text response');
  return text;
}

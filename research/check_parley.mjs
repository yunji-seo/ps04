import fs from 'node:fs';

// Run from the project directory with: node --env-file=.env research/check_parley.mjs
// Never print credentials, raw error bodies, headers, or environment contents.
const result = { checked_at: new Date().toISOString(), provider: 'mit-parley',
  key_configured: false, model_list_verified: false, generation_verified: false,
  model: null, usage: null, cost_usd: null };
try {
  const key = process.env.PARLEY_API_KEY?.trim();
  if (!key || key.includes('your-key') || key.includes('YOUR_API_KEY')) throw new Error('No usable key is configured in .env');
  result.key_configured = true;
  const base = (process.env.PARLEY_BASE_URL || 'https://parley.api.mit.edu/v1').replace(/\/$/, '');
  if (base !== 'https://parley.api.mit.edu/v1') throw new Error('Only the verified MIT API endpoint is allowed for this check');
  const model = process.env.PARLEY_MODEL || 'claude-sonnet-4-6';
  if (!/^[a-zA-Z0-9./_-]{1,100}$/.test(model)) throw new Error('Invalid model name');
  result.model = model;
  const request = async (endpoint, body) => {
    let response;
    try {
      response = await fetch(base + endpoint, {
        method: body ? 'POST' : 'GET', redirect: 'error',
        headers: { Authorization: `Bearer ${key}`, ...(body ? {'Content-Type': 'application/json'} : {}) },
        ...(body ? {body: JSON.stringify(body)} : {}),
        signal: AbortSignal.timeout(60000),
      });
    } catch { throw new Error('MIT API network connection failed or timed out'); }
    if (!response.ok) throw new Error(`MIT API ${endpoint} returned HTTP ${response.status}`);
    try { return await response.json(); } catch { throw new Error('MIT API returned invalid JSON'); }
  };
  const catalog = await request('/models');
  if (!Array.isArray(catalog.data)) throw new Error('Unexpected model catalog format');
  result.available_model_count = catalog.data.length;
  const bare = model.split('/').at(-1);
  result.selected_model_listed = catalog.data.some(m => m.id === model || m.id === bare);
  result.model_list_verified = true;
  if (!result.selected_model_listed) throw new Error('Configured model was not present in the authenticated catalog');
  const completion = await request('/chat/completions', {
    model, messages: [{role: 'user', content: 'Reply with exactly PARLEY_CONNECTION_OK and nothing else.'}],
    max_tokens: 32, temperature: 0, stream: false,
  });
  const reply = completion.choices?.[0]?.message?.content;
  result.generation_verified = typeof reply === 'string' && reply.trim() === 'PARLEY_CONNECTION_OK';
  result.finish_reason = completion.choices?.[0]?.finish_reason ?? null;
  const usage = completion.usage;
  if (usage && typeof usage === 'object') result.usage = Object.fromEntries(
    ['prompt_tokens','completion_tokens','total_tokens'].filter(k => Number.isFinite(usage[k])).map(k => [k, usage[k]])
  );
  if (!result.generation_verified) throw new Error('Model responded but did not return the expected check text');
} catch (error) {
  result.error = error.message;
  process.exitCode = 1;
}
fs.mkdirSync('test-output', {recursive:true});
fs.writeFileSync('test-output/parley-connection.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));

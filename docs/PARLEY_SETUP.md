# MIT Parley API setup findings

Checked October 15, 2026. The student saved the existing key directly in the ignored local `.env` file. Authenticated model discovery returned 40 models, including `claude-sonnet-4-6`. A bounded Chat Completions request returned the expected check text and reported 21 prompt tokens and 10 completion tokens. The key was not displayed in chat or tool output. Subsequent editorial requests are recorded in their run artifacts; dollar costs remain unknown until reconciled with the provider account.

## Authenticated documentation update

The [official introduction](https://parley-docs.mit.edu/) confirms `https://parley.api.mit.edu/v1` as the base URL. The portal's cURL example uses `POST /v1/chat/completions` with a Bearer key and model `claude-haiku-4-5`. The [official model documentation](https://parley-docs.mit.edu/models) lists `claude-sonnet-4-6`, `claude-sonnet-5`, and `claude-sonnet-5-5`, among others. It recommends bare canonical IDs for Claude; use `claude-sonnet-4-6` in the project example below instead of the community package's prefixed form.

The earlier package findings below are retained as research provenance. Official documentation supersedes them where they differ. The model list in documentation is not a successful authenticated API request.

## Connection settings

| Setting | Value | Verification |
| --- | --- | --- |
| API origin | `https://parley.api.mit.edu` | Public integration package source |
| OpenAI-compatible base URL | `https://parley.api.mit.edu/v1` | `dist/keys.js`, package version 0.6.2 |
| Authentication | `Authorization: Bearer <key>` | `dist/catalog.js` and `dist/stream.js` |
| Model discovery | `GET /v1/models` | `dist/catalog.js` |
| Chat completions | `POST /v1/chat/completions` | `dist/stream.js` |
| Responses | `POST /v1/responses` | `dist/stream.js`; model-specific compatibility still needs validation |
| Example model ID | `bedrock/claude-sonnet-4-6` | Bundled catalog in `dist/models.js`; account availability unverified |

Other bundled example IDs include `bedrock/claude-sonnet-5`, `openai/gpt-5-mini`, and `openai/gpt-5.5`. These are catalog entries, not proof that a particular account can use them today. Use the authenticated model list before choosing the production model. The `MIT-parley/` prefix used by Pi is its provider label and is not part of these API model IDs.

The package was downloaded and inspected as text, without installation or execution. It is a community integration, not an MIT service guarantee. Sources:

- [Published package](https://www.npmjs.com/package/mit-parley-pi-extension)
- [Version 0.6.2 archive](https://registry.npmjs.org/mit-parley-pi-extension/-/mit-parley-pi-extension-0.6.2.tgz)
- [MIT API documentation](https://parley-docs.mit.edu/) (authentication required in the observed session)

## Key-free configuration example

```dotenv
PARLEY_BASE_URL=https://parley.api.mit.edu/v1
PARLEY_MODEL=claude-sonnet-4-6
PARLEY_API_KEY=
```

The empty key is intentional. Supply an existing key through a private local environment variable, never a committed file or chat message. The implemented adapter reads the private key from `.env` or the environment, while the snapshotted `config/ai.json` controls endpoint and model.

After a key is securely available, this Node.js example lists account-visible models without requesting generation. It never prints the key or response headers:

```javascript
const key = process.env.PARLEY_API_KEY;
if (!key) throw new Error('PARLEY_API_KEY is not configured');
const response = await fetch('https://parley.api.mit.edu/v1/models', {
  headers: { Authorization: `Bearer ${key}` },
  signal: AbortSignal.timeout(30000),
  redirect: 'error',
});
if (!response.ok) throw new Error(`Model discovery returned HTTP ${response.status}`);
const body = await response.json();
if (!Array.isArray(body.data)) throw new Error('Unexpected model-list response');
console.log(body.data.map(model => model.id).join('\n'));
```

## Credits and verified connection

MIT's July 8, 2026 announcement states that the API is available to faculty, staff, postdocs, graduate students and undergraduate students. It specifies $30 in complimentary monthly API credits for faculty, staff, postdocs and graduate students. It does not establish the undergraduate allowance or this student's remaining balance. API credits are separate from chat credits.

Source: [MIT announcement](https://orgchart.mit.edu/letters/parley-api-now-available-mit-community).

The student has now signed in. The API account page shows available credit and no billing method. Current account figures were reported privately in the chat; do not infer a recurring allowance from this balance. The newer documentation describes affiliation-dependent initial credits, so the older announcement alone does not establish this account's renewal policy.

The student saved the existing key directly in the ignored local `.env` file. No further key setup or new key creation is needed. Do not paste it into chat.

Connection setup is complete. Run `node --env-file=.env research/check_parley.mjs` only when another connection check is justified; it makes a real, small generation request. All four AI stages have executed against real evidence. The current 57-item run produced three briefs and article/script pairs after recorded recovery. The student approved the article/script drafts and publication. [Approximate list-price costs](COST_ESTIMATE.md) are available; actual account charges are not independently reconciled. No additional credit purchase is authorized by this setup note.

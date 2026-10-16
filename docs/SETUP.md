# Local setup and execution

All sixteen component entry points have implementations, including MIT Parley selection, briefs, articles and video scripts. Live collection runs started on October 15 and 16, 2026; failed editorial stages were subsequently recovered. The current corpus contains 57 eligible items, including two YouTube videos and two podcasts. Article approval, video production and publication remain separate human handoffs; see STATUS.md for the current deliverables.

## Dependencies

- Git Bash (tested: 5.2.37 on Windows).
- Node.js 22 or later (tested: 22.14.0).
- npm; install pinned dependencies with `npm ci`.
- yt-dlp (tested: 2026.08.19).
- ffmpeg and ffprobe on PATH.
- MIT Parley API access, a supported model and credits. Set `PARLEY_API_KEY` in a private `.env` file or environment variable. The student configured and tested access on October 15; see [Parley setup](PARLEY_SETUP.md).

Run commands from the repository root in Git Bash:

```bash
npm ci
npm test
bash run.sh
```

On this Windows machine Git Bash is at `C:/Program Files/Git/bin/bash.exe`. The Codex sandbox prevents it from starting directly; the runtime has been verified with permitted execution outside that restriction. This is an execution-environment issue, not a Bash dependency failure.

Normal runs capture the actual UTC date and save their exact configuration and prompt files. They stop for student editorial review after content checks. Insufficient evidence stops brief generation rather than producing unsupported articles. `bash research/run_editorial.sh` performs an explicitly partial recovery using retained evidence; it does not satisfy the full-run requirement.

After the student has reviewed and approved the actual content, packaging uses:

```bash
bash review/check_content.sh runs/RUN_ID > runs/RUN_ID/review.json
# The student supplies approval.json matching this review_id.
bash run.sh --package runs/RUN_ID
```

Do not run a blank starter script as proof of success. Do not copy fictional test approval into a real run. Tests create labeled example runs in ignored disposable copies under test-output; those artifacts are never live assignment evidence.

## Configuration

`config/project.json` defines the chosen audience and question. `config/sources.json` lists feed and video endpoints and publisher identities. Two configured podcast episode pages supplement the show's truncated RSS feed; their audio and date metadata are retrieved from those actual source pages.

Topic-independent retrieval does not establish editorial relevance. The candidate feeds deliberately include unrelated items for AI selection to evaluate. Written pages under 120 words are flagged as short, rather than discarded automatically; fewer than ten extracted words still fails as likely extraction/access failure. The original 120-word rejection threshold was too broad because a complete source can be a short post. This is an extraction repair, not a student-directed editorial policy revision.

`config/editorial_policy.md` is policy v2, revised from the student's actual six-item review. The original policy survives in October 15 snapshots. The four files in `prompts/` are snapshotted for each run; later edits do not alter an old run's prompt files. `config/ai.json` pins the model and endpoint. The shared provider helper handles transport only; each component owns its decisions or content. Exact request payloads and selected response fields are retained under `RUN_DIR/ai`, including any component-added format instructions, without credentials or request headers. Selection evaluates full content in batches of four. Brief planning uses candidate metadata; brief generation then reads all selected content, with written passages assigned exact IDs. Writing receives the reviewed claims and their cited passages/segments. A 600,000-character request cap fails explicitly instead of silently truncating evidence.

Recovery commands preserve earlier failures and reuse exact matching validated responses:

```bash
bash research/resume_series.sh runs/RUN_ID
# If briefs are complete or source-checked corrections have been applied:
bash research/resume_content.sh runs/RUN_ID
# Controlled selection-only policy comparison on unchanged historical evidence:
bash research/compare_policy.sh runs/BASELINE_RUN_ID
```

Do not run resume_series on manually corrected briefs: it regenerates briefs from model planning. Use resume_content after inspecting the preserved correction audit. Controlled policy replay retains the baseline evidence date and is explicitly marked replay; its actual execution timestamp is separately recorded.

## Persistent evidence format

Only `data/store.sh` and its component-owned helper access `data/evidence/index.json`. The JSON object has schema_version and items; each item holds latest, versions, first_seen_at and last_seen_at. A version contains its immutable normalized record, associated runs and first-seen time. Writes acquire an exclusive lock and atomically replace the file. Ingestion validates the stream before mutation.

Store commands are init, upsert RUN_DIR, list, and get ITEM_ID [VERSION_ID]. Unknown get returns exit 1. During a run, PIPELINE_RUN_DIR connects read/init receipts to that run. Standalone calls without it save receipts under runs/store-operations/logs; that directory is not a live run.

Item IDs use native IDs where available. Version IDs hash sorted compact JSON with title, URL, publication date, extracted text and transcript segments. Retrieval time is excluded. Retained content is written under an item hash and version hash; referenced text and segment files are never overwritten.

## Media and transcripts

Original downloaded media stays in ignored data/media. Versioned text and transcript segments stay in data/assets and must be retained for inspection. Every media evidence record includes its source URL and local media path. Rerun collection and extraction from the saved source configuration to retrieve omitted media. Download availability can change; failures remain explicit.

YouTube extraction retrieves original audio and English caption tracks by default. A source can explicitly configure `reuse_retained_transcript` to reuse an existing immutable transcript and original media without claiming a fresh caption download. A `retained_transcripts` mapping supports timestamped browser exports, verifies the embedded video ID, and records language and automation status. The GitHub video uses an exported Korean automatic caption/dub transcript; it must not be quoted as exact original English speech. Its raw export is retained under `data/assets/transcript_imports/`. Podcast extraction downloads audio and uses the publisher's timestamped transcript when available. For start-only transcripts, segment ends are the next published start or measured audio duration. Caption accuracy and segment boundaries still require spot checks.

The current extractor has no speech-to-text fallback. Missing captions/transcripts are reported as failures. It reuses an already downloaded podcast URL; detecting a silently replaced audio file at an identical URL is a remaining limitation. Written sources use HTTP validators where supplied, and retained transcript text is versioned.

The later article-body-v2 extractor selects known article containers before broad page layouts. It records extraction_version and skips old HTTP validators after a parser upgrade, preventing a 304 response from preserving an obsolete extraction indefinitely. The first migration may change retained text without a publisher edit; extraction_migration labels that cause. Existing reviewed versions remain immutable. See RUN_COMPARISON.md for five observed changes caused by the original extractor's inclusion of widgets.

## Secrets and costs

The student saved an existing Parley credential directly in the Git-ignored `.env` file. A live model-list request and a 31-token connection test succeeded. Editorial requests use the existing API credit; no additional credit or service purchase was made. Never include `.env` in submission archives, configuration snapshots or logs. Network failures are not automatically retried. Planning, brief validation and writing constraints permit at most two corrective model calls after the first response; all calls and feedback are archived. Exact matching completed outputs can be reused. Token usage is retained as reported by the provider; per-run USD cost remains null until reconciled against provider billing. An account-level balance observation is not a per-run cost estimate.

Recorded zero cost on completed local stages means no paid model/API call occurred in that stage; it is not an estimate of electricity, internet or subscription costs. Unknown provider costs must be recorded as null, not zero.

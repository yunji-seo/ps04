# Requirement and evidence checklist

Authoritative specifications: [README](../README.md), [ARCHITECTURE](../ARCHITECTURE.md), and [submission template](../SUBMISSION.md). Starter revision: `5028d58f738c05951c23a930ed64540edb2a4037`. A planned artifact is not evidence of completed work.

This matrix describes requirements and verification methods. See [FINAL_AUDIT.md](FINAL_AUDIT.md) for actual completion status, including the qualified different-day run evidence and pending approval/publication work. The two-day schedule below is the original target, not the achieved timeline.

## Mandatory requirements

| Requirement | Responsible component | Verification | Submission evidence | Student action |
| --- | --- | --- | --- | --- |
| One topic, audience, recurring question, scope, voice | config/project.json | Inspect nonempty fields and coherent scope | Topic brief and SUBMISSION.md | Choose topic; refine voice |
| Preserve all 16 named Bash responsibilities | Entry point, workflows, component scripts | Invoke stages independently; inspect boundaries | Implemented source and architecture diagram | Explain one tradeoff |
| Entry point coordinates and writes final summary on failures | run.sh | Exercise successful and failed stages | run.json, logs, summary.json | Demonstrate command |
| Workflows coordinate; include a real data pipe | workflows/*.sh | Inspect and execute pipeline | Workflow source and receipts | Explain input/output flow |
| RSS discovery resolves substantive written items | collectors/fetch_feeds.sh | Fetch actual configured feeds and linked articles | candidates/feeds.jsonl, retained text | Review source relevance |
| YouTube discovery and original media | collectors/fetch_youtube.sh; processing/extract_content.sh | Verify identities, downloads, transcript timestamps | candidates/youtube.jsonl, media retrieval instructions, segments | Spot-check passages |
| Podcast discovery and original audio | collectors/fetch_podcasts.sh; processing/extract_content.sh | Verify enclosures, downloads, transcript timestamps | candidates/podcasts.jsonl, audio metadata, segments | Spot-check passages |
| At least 12 distinct items, six independent publishers, two per kind | Collection, deduplication, review | Count eligible underlying items, not observations or platform copies | Coverage report and identity reconciliation | Confirm independence judgments |
| Varied perspectives, with missing voices stated | Editorial policy and briefs | Compare research, vendor and practitioner evidence | Decisions and limitations | Review omissions |
| Publication dates separate from retrieval dates | Collectors and extraction | Inspect source date evidence | Normalized item records | Resolve disputed dates |
| Actual UTC as-of date, inclusive D-29 through D | run.sh; processing/filter_items.sh | Boundary, unknown, invalid and future date checks | run.json, eligible.jsonl, exclusions.jsonl | Execute on real dates |
| New upload or refreshed timestamp does not make old material new | Extraction and editorial review | Compare source history and underlying events | Date verification notes | Confirm ambiguous cases |
| Stable item identities and substantive versions | data/store.sh and extraction | Initial ingestion, replay, update, historic get | changes.jsonl and stored versions | Explain identity/version difference |
| Only store owns data/evidence index | data/store.sh | Source review and stage API checks | Store implementation and documentation | Explain boundary |
| Preserve assets referenced by prior runs | Extraction and store | Verify old versions still resolve after updates | data/assets and versioned records | None |
| Required JSONL fields, paths, timestamps, stdout/stderr separation | All components | Contract and malformed-input tests | Stage artifacts and test results | None |
| Exit codes 0/1/2 and honest partial results | All components and workflows | Collection failure and bad input tests | Receipts and failure demonstration | Explain failure behavior |
| Unique receipts with counts, times, tools, costs and errors | All invocations with run context | Inspect repeated invocations | runs/*/logs | Acknowledge unknown costs |
| Immutable run snapshots of config and prompts | run.sh | Compare runtime inputs to saved snapshots | runs/*/config and prompts | None |
| Actual AI selection and synthesis | editorial/*.sh | Inspect requests, responses, decisions and briefs | Prompts, decisions.jsonl, briefs.jsonl | Inspect AI judgment |
| Each eligible item accepted, rejected or deferred, with reasons | editorial/select_items.sh | Decision coverage and vocabulary checks | decisions.jsonl | Compare with own judgment |
| Claim-level credibility and treatment of conflicts and incentives | Policy, selection, synthesis | Review claims against original supporting passages | Policy, briefs, review notes | Assess reasoning |
| Exactly three connected but distinct arguments | editorial/create_briefs.sh | Verify piece IDs and human assessment | briefs.jsonl | Approve distinct intellectual contributions |
| Three independent sources per piece and all input kinds in series | Editorial briefs and review | Resolve unique publishers and kinds per claim/piece | Evidence coverage by piece | Verify independence |
| Multi-source insight, limitations, facts/claims/inferences distinguished | Briefs and generators | Human assessment; schema checks | Claims, synthesis and limitations | Review interpretation |
| Every claim traces to exact version and passage/segment | Briefs, store, review | Resolve quote/segment and asset path | Claim trace in submission | Spot-check one trace per kind |
| Three articles, roughly 600–900 words excluding references | content/write_articles.sh | Word count warnings; editorial review | articles/01.md through 03.md | Edit and approve |
| Three videos, roughly 3–5 minutes; same reviewed brief | content/write_video_scripts.sh | Claim consistency; timed narration check | Scripts and rendered videos | Produce in Google Vids or HeyGen |
| Check assessment success differs from content passing | review/check_content.sh | Exit 0 with passed:false for completed failed assessment | review.json | Review warnings |
| Approval only from student, tied to current review fingerprint | review and publishing | Missing/stale/changed approval tests | approval.json and correction notes | Personally approve actual material |
| Packaging reruns checks without recollection/regeneration | run.sh --package; prepare_package.sh | Compare hashes and source snapshots | package manifest and tests | Request package after approval |
| Direct packaging also rejects stale approval; preserves entered links | publishing/prepare_package.sh | Direct invocation and repeated package tests | Package tests and publication_links.json | Supply real links |
| Human review of at least three accepted and three rejected/deferred items | Review worksheet | Six actual comparisons, not invented opinions | Student review record | Supply judgments |
| At least one policy revision and affected-stage rerun | Policy and editorial stages | Compare preserved versions and decisions | Policy revision comparison | Direct revision; explain change |
| Two live runs on different days during assignment week | run.sh and reporting | Compare actual run metadata and logs | Both complete run directories | Run on separate days |
| Show new/changed evidence, deduplication, freshness, failure/recovery | Store, filter, collectors, reporting | Live and explicitly labeled replay tests | Changes, exclusions and receipts | Narrate demonstration |
| Honest status, counts, costs and remaining work for incomplete runs | reporting/summarize_run.sh | Missing-stage vs zero-result checks | summary.json | Confirm remaining manual steps |
| Three free-access Substack posts and public/unlisted YouTube videos | Manual publishing | Open every submitted link; verify cross-links | Six real URLs and source descriptions | Publish after reviewing |
| Attribution and disclosure of AI-generated presentation | Content and manual production | Final editorial checklist | Articles, descriptions and credits | Approve disclosures |
| Separate narrated technical demo, 4–6 minutes | Demonstration guide | Time recording; inspect readable evidence | Demo link in SUBMISSION.md | Record narration |
| Setup, architecture, manual handoffs, both runs and reflection | SUBMISSION.md | Final completion audit | Submission entry point | Write personal reflection |
| Credentials excluded; media retrieval documented | Ignore rules and setup guide | Inspect staged files; validate asset paths | .gitignore and retrieval notes | Keep keys private |

## Optional improvements

No dashboard, hosted service, platform publishing API, avatar, or scheduled automation is required. Add them only after mandatory evidence, repeatability, and publication are complete. Source quantity beyond the minimum is useful only when it improves the argument or provides needed rejection examples.

## Two-day execution target

The user has two days. Aim for the first complete live run on October 15, 2026 and the second on October 16, 2026, in the user's America/New_York calendar. The pipeline records its actual UTC execution date; do not override it to fit this target. Ensure the actual UTC dates differ too. Exact deadline time and assignment-week boundaries remain unconfirmed.

Day 1: confirm Parley API access and credits, verify source coverage, implement and test contracts, perform the first complete live run, and obtain the student's sample review.

Day 2: revise policy from student feedback, run the affected stages with preserved comparison artifacts, complete the second live run, review and package, produce and publish videos/articles, record the technical demonstration, and audit links and submission.

This is a compressed target, not a claim that all work is complete or guaranteed feasible. If today’s live run cannot complete, explicitly report the remaining requirement rather than manufacturing a run.

# Technical demonstration: narration and shot list

This is an AI-prepared script describing actual records, not a recorded demonstration or a personal reflection. Read and adapt it to your understanding. Target: 4–6 minutes including short pauses. Time the actual recording.

**Recording prerequisite:** approve and publish the series first, then show the real article URL for the claim trace. Until then, rehearsal must label it a draft. Do not imply publication already happened. Never display the private environment file or API account key.

## Shot list

| Time | On screen | Action |
| --- | --- | --- |
| 0:00–0:35 | SUBMISSION.md topic; DESIGN.md diagram | Introduce audience and information flow |
| 0:35–1:15 | run.sh; workflows/collect_sources.sh | Point to orchestration, pipe and component boundaries |
| 1:15–2:15 | Published piece 03, then CLAIM_TRACE.md | Follow Deno claim through brief, selection, version and passage |
| 2:15–3:05 | RUN_COMPARISON.md and both run.json files | Show actual dates, new/changed/unchanged counts and noise caveat |
| 3:05–3:45 | Current summary.json failure_history; review.json | Explain failure and later recovery without hiding failed receipts |
| 3:45–4:30 | STUDENT_EDITORIAL_REVIEW.md; POLICY_COMPARISON.md | Explain the real Deno correction and remaining overbroad selections |
| 4:30–5:15 | DESIGN.md; FINAL_AUDIT.md | Explain storage tradeoff, approval boundary and honest completion state |

Useful read-only rehearsal command, from the repository root:

```bash
node research/inspect_demo.mjs
```

It prints the retained Deno item, actual selection and claim 03-c5 without accessing credentials. To show execution, explain `bash run.sh` and display the retained logs of the two real runs. Do not use a fresh run to impersonate a historical run.

## Narration

Agent Engineering Brief serves student developers and small software teams. Its recurring question is which changes in AI coding agents are useful enough to adopt, and what developers still need to verify themselves. The three pieces examine infrastructure changes, the limits of verification, and a practical adoption process. The goal is a source-grounded argument that readers can inspect.

The pipeline keeps the starter's sixteen Bash responsibilities. The entry point creates a real run date and snapshots the configuration and prompts. Three collectors discover written articles, YouTube material and podcasts. Extraction retrieves substantive text or original audio with timestamped transcripts. The collection workflow passes normalized records through a real pipe to the store. A deterministic filter applies the inclusive thirty-day window before the AI makes editorial decisions.

Each substantive component has its own Node helper. Only the store component accesses the persistent index. Stable item IDs identify a source across runs; version IDs identify the retained title, date and content. Old versions stay available so a later update cannot silently change the evidence behind an earlier article.

Here is the Deno claim in piece three. It says that Cloudflare and Deno announced a plan to improve self-hosting by combining ideas and code, while the merged supported experience remains future work. Claim 03-c5 in the brief identifies the source item and exact version. The decision record accepts the item but warns that the roadmap is a vendor announcement. The retained source passage says more announcements will follow in coming months and separately describes what can already be self-hosted. That distinction prevents an announced plan from becoming a claim that a new capability has shipped.

The two live collection runs began on October fifteenth and sixteenth in both UTC and New York time. The retained corpus grew from fifty-four to fifty-seven eligible items. Both contain two videos, two podcasts and six publisher identities. The later collection found three new items, six changed versions and forty-two unchanged observations. Those numbers need interpretation: five changed versions only reflected related links or tag counters. One article gained a description, but it was outside the editorial focus. The report does not turn those changes into six new developments. A later parser improvement excludes those layout elements while preserving the original evidence.

Repeatability also includes failure. Earlier YouTube caption requests returned HTTP 429. Brief validation subsequently caught quotations that did not match retained text and plans that lacked accepted video evidence. The system preserved those failures. Both original entry-point attempts failed, and later stage recovery produced the drafts and passing checks. The first run's recovery finished on October sixteenth. These records demonstrate different-day starts and recovery, not two uninterrupted successful completions.

The student reviewed three accepted and three rejected or deferred items. The key change was accepting the Deno announcement despite missing independent corroboration, because its infrastructure implications could matter if the uncertainty stayed explicit. The revised policy says that lack of corroboration alone is insufficient reason to defer. A controlled replay of the same forty-four items changed nine decisions, including Deno. But it also accepted a profiling article the student rejected. That is evidence of scope drift, so the replay is not presented as an unqualified improvement.

One architectural tradeoff is the inspectable JSON index. It is easy to run locally and examine, and atomic replacement with a single-writer lock protects small serialized updates. Rewriting the index becomes inefficient at larger scale; a database would then be more appropriate. Another deliberate boundary is between automated checking and human approval. Exact citations and content fingerprints can be checked mechanically, but those checks cannot establish that an interpretation is persuasive or a vendor's claim is independently proven.

Finally, the production step requires approval matching the current content fingerprint. Scripts and local previews are separate from rendered videos and accessible publications. The final audit records what actually exists. The system is designed to preserve evidence, expose failures and make editorial decisions explainable.

## Before recording

- Replace the draft article view with the real published piece and verify the source links.
- If production is complete, show the six final URLs and actual video durations. If not, retain the pending labels.
- Ensure text is readable at the recording resolution and rehearse to 4–6 minutes.
- Use your own explanation where the script does not match your understanding. Add the recording URL to SUBMISSION.md only after verifying access.

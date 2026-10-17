# Problem Set 4 Student Submission

**Status: three Substack articles published; three YouTube uploads submitted with unlisted visibility.** The personal reflection is complete. A separate technical demonstration recording remains pending. The repository is public. The [requirement audit](docs/FINAL_AUDIT.md) preserves execution-date and media-review qualifications. A [withheld-item replay](docs/WITHHELD_REPLAY.md), [cost estimate](docs/COST_ESTIMATE.md), and [anonymous access check](docs/PUBLIC_ACCESS.json) are now provided. See [publication results](production/publication-results.json).

**Student:** Yunji Seo (GitHub: yunji-seo)  
**GitHub repository:** https://github.com/yunji-seo/ps04-agent-engineering-brief (public; accessible without a collaborator invitation)  
**Separate 4–6 minute technical demonstration:** Recording URL pending; to be added by Yunji Seo.

## Topic and audience

**Agent Engineering Brief** examines practical adoption and verification of AI coding agents for student developers and small software teams with basic programming and Git knowledge.

Its recurring question is: **Which recent advances are useful enough to adopt, and what should developers still verify themselves?** Coverage includes coding workflows, infrastructure, verification, maintainability, permissions and evidence of benefit. It excludes unrelated AI news, unsupported rankings and investment advice. Readers return for specific experiments, evaluation questions and unresolved limitations rather than a list of announcements.

## Series

All three pairs use evidence from the actual October 16, 2026 run. The student approved production and subsequent publication on October 16, 2026. Articles are free to read; videos use unlisted visibility.

| Piece | Title | Substack | YouTube |
| --- | --- | --- | --- |
| 1 | The Infrastructure Underneath Your Agent: What Providers Are Rebuilding and Why It Matters | [Read article](https://yunjiseo1.substack.com/p/the-infrastructure-underneath-your) | [Watch video](https://youtu.be/zVci2_C2zSg) |
| 2 | Green Lights, Empty Boxes: What the Evidence Actually Shows About AI Agent Verification | [Read article](https://yunjiseo1.substack.com/p/green-lights-empty-boxes-what-the) | [Watch video](https://youtu.be/H4e4VRAvDE8) |
| 3 | A Small-Team Adoption Plan: Verify One Task, Budget the Controls, Watch the Roadmap | [Read article](https://yunjiseo1.substack.com/p/a-small-team-adoption-plan-verify) | [Watch video](https://youtu.be/tXzF3HVnM0U) |

[Read all three article/script pairs](runs/2026-10-16T04-24-58-255Z-ee63f048/REVIEW_READY.md). Article lengths are 840, 800 and 808 words excluding references. Narration lengths are 626, 645 and 612 words. Final video durations are 4:02, 3:52 and 3:45 (YouTube may round up). Google Vids audio was retained while slide timing was finished locally.

## Setup and execution

Tested with Git Bash 5.2.37, Node.js 22.14.0, yt-dlp 2026.08.19, ffmpeg and ffprobe on Windows. From the repository root:

```bash
npm ci
npm test
bash run.sh
```

The complete suite passes **25 tests**. See [setup](docs/SETUP.md) and [verification](docs/TEST_RESULTS.md).

MIT Parley supplies the AI stages at `https://parley.api.mit.edu/v1`, with `claude-sonnet-4-6` pinned in config/ai.json. Supply PARLEY_API_KEY in an ignored private environment file or environment variable. Never submit the key. Existing credits were used; no credits were purchased. Requests retain provider-reported token usage; actual Parley charges remain unknown; [list-price estimates and uncertainty](docs/COST_ESTIMATE.md) are provided.

Topic, sources, policy and four prompt files are configured separately and snapshotted into each run. Source text is untrusted evidence. Exact actual model payloads, including component-added constraints, are retained without credentials under each run's ai directory.

## Architecture

```mermaid
flowchart LR
  Sources[RSS / YouTube / podcasts] --> Extract[Text / media / timestamped transcripts]
  Extract --> Store[Versioned evidence store]
  Store --> Filter[UTC 30-day filter]
  Filter --> Select[AI selection]
  Select --> Briefs[Three AI briefs]
  Briefs --> Articles[Article drafts]
  Briefs --> Scripts[Video scripts]
  Articles --> Check[Evidence and content checks]
  Scripts --> Check
  Check --> Human[Student review and approval]
  Human --> Package[Production handoff]
```

All sixteen required Bash components retain their assigned responsibilities. Component-owned Node helpers handle parsing, storage, editorial contracts and generation. The shared Parley helper provides transport, not orchestration. Only data/store.sh and its owned helper access the persistent evidence index.

See [design and tradeoffs](docs/DESIGN.md). The store uses stable item identities, immutable evidence versions, a single-writer lock and atomic index replacement. This is inspectable and convenient at assignment scale; rewriting a JSON index is inefficient at larger scale.

After actual student approval matching the current review fingerprint:

```bash
bash run.sh --package runs/RUN_ID
```

Replace RUN_ID with the approved run. The packaging component reruns checks and rejects missing or stale approval. The student explicitly approved the current drafts on October 16, 2026; the [production package](runs/2026-10-16T04-24-58-255Z-ee63f048/package/README.md) is prepared. Public publishing authorization is separate. Google Vids/HeyGen production, Substack/YouTube publication and the technical recording are documented [human handoffs](docs/HUMAN_HANDOFFS.md).

## Evidence and actual runs

| Run | Start date | Artifacts | Time and cost |
| --- | --- | --- | --- |
| A: live collection, later editorial recovery | October 15, 2026 UTC and New York | [Summary](runs/2026-10-15T19-13-20-785Z-6ccecf24/summary.json) | About 9h25m start-to-recovery wall time; pauses included; dollars unknown |
| B: live collection, later editorial recovery | October 16, 2026 UTC and New York | [Summary](runs/2026-10-16T04-24-58-255Z-ee63f048/summary.json) | About 18m45s start-to-recovery wall time; dollars unknown |

Both original entry-point attempts failed; downstream recovery is separately recorded. Run A completed recovery on October 16. These are different-day starts with recovery, not two uninterrupted full completions on different dates. The student reports the deadline was extended to October 17, 2026 (America/New_York); exact assignment-week start remains unconfirmed.

Run B retains 57 eligible items: 53 written, two YouTube and two podcast items, across six publisher identities. It found three new observations, six changed versions and 42 unchanged observations. Five changed versions were layout/sidebar noise rather than new article content. See [actual comparison and limitations](docs/RUN_COMPARISON.md). An earlier [same-day replay](runs/2026-10-15T13-59-38-909Z-90051c10/changes.jsonl) demonstrates 44 unchanged observations.

No live date exclusion occurred in these corpora. Labeled fixtures demonstrate old, future, invalid and missing date exclusions; they are not presented as live evidence.

Current inspection paths:

- [Normalized eligible evidence](runs/2026-10-16T04-24-58-255Z-ee63f048/eligible.jsonl)
- [Actual editorial decisions](runs/2026-10-16T04-24-58-255Z-ee63f048/decisions.jsonl)
- [Three briefs and evidence locators](runs/2026-10-16T04-24-58-255Z-ee63f048/briefs.jsonl)
- [Claim passages and timestamps](runs/2026-10-16T04-24-58-255Z-ee63f048/CLAIM_REVIEW.md)
- [Automated assessment](runs/2026-10-16T04-24-58-255Z-ee63f048/review.json)
- [One complete Deno claim trace](docs/CLAIM_TRACE.md)

Versioned text and segments are in data/assets. The index is accessed through data/store.sh. Original media is retained locally under ignored data/media; [setup instructions](docs/SETUP.md) explain retrieval from saved URLs and transcript limitations. The collected Korean automatic GitHub transcript is not cited in the final drafts.

## Editorial review and revision

The [actual student review](docs/STUDENT_EDITORIAL_REVIEW.md) covers three accepted and three rejected/deferred items. The student agreed with five decisions and changed Deno Is Joining Cloudflare from defer to accept because potential infrastructure implications matter while plans must remain distinct from verified capabilities.

Compare [policy v1](runs/2026-10-15T14-59-33-161Z-664468fb/config/editorial_policy.md) with [policy v2](config/editorial_policy.md). A [controlled replay](docs/POLICY_COMPARISON.md) used the same 44 retained items and changed nine decisions. It also introduced overbroad acceptances; [interpretation notes](docs/POLICY_INTERPRETATION.md) record those disagreements instead of declaring automatic improvement.

[Assistant corrections](runs/2026-10-16T04-24-58-255Z-ee63f048/editorial-corrections.json) and [wording edits](runs/2026-10-16T04-24-58-255Z-ee63f048/final-polish-audit.json) preserve source-checking changes. They are not attributed to the student. Final student content approval for production was supplied on October 16, 2026 and recorded against the unchanged review fingerprint.

## Personal reflection

The material the AI collected and its editorial judgments often seemed plausible, but plausibility did not always mean that the decisions matched my intentions. It sometimes excluded material that did not need to be excluded, revealing a narrow or biased interpretation of relevance. This made me realize that reviewing the selection criteria is just as important as reviewing the generated articles.

The Deno announcement was a useful example. I decided it should be included because, even without a direct connection to AI coding agents, it could affect the infrastructure developers use. At the same time, the article needed to distinguish announced plans from capabilities that were already available. My correction was therefore not simply to accept more material, but to make the reason for inclusion and the limits of the evidence explicit.

My main takeaway is that the specificity of the creator's input strongly affects how well an AI system reflects the creator's intentions. Broad instructions leave room for the model to apply assumptions that may differ from mine. Next, I would make the editorial policy more concrete by adding examples of material to accept or reject, especially cases with indirect relevance, and explaining the reasoning behind each example. I would then review the resulting decisions to see whether the system better reflects those intentions without accepting unrelated material.

Before submission, finish [the audit](docs/FINAL_AUDIT.md), provide the technical demonstration URL, and verify the submitted demonstration link.

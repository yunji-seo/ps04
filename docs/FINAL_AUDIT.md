# Submission checklist

Reconciled against the course README.md and ARCHITECTURE.md and retained artifacts; submission documentation updated October 17, 2026. This is a requirements review, not a new live pipeline execution. Existing 25-test results were inspected; no paid AI calls were made.

## Confirmed deliverables

| Requirement | Evidence / result |
| --- | --- |
| One topic, audience, recurring question and publication scope | SUBMISSION.md; config/project.json |
| Sixteen Bash components, configuration and four prompts | Required entry points implemented; component boundaries documented in DESIGN.md; prior 25-test suite passed |
| At least 12 items, six sources, two per input type | 57 eligible records: 53 written, 2 YouTube, 2 podcast; six publisher identities |
| Evidence assets and timestamps | All text/segment paths in the eligible corpus resolve; original media retrieval documented in SETUP.md |
| Three distinct briefs and source coverage | Pieces reference 4 / 3 / 4 publisher identities; all three input types contribute across the series. Publisher counts alone do not prove independent corroboration of shared claims |
| Freshness | UTC 30-day filter and boundary tests; publication as-of date 2026-10-16; no live exclusions occurred |
| AI selection, synthesis, prompts and intermediate records | Canonical run retains decisions, briefs, requests/responses, article/script manifests and checks |
| Human sample review and policy revision | Six student judgments; policy v1/v2 and controlled 44-item replay with nine changes retained |
| Three articles, 600–900 words each | 840 / 800 / 808 words excluding references; published free-access Substack pages |
| Three videos, approximately 3–5 minutes each | 4:02 / 3:52 / 3:45; Google Vids production with documented local finishing; unlisted YouTube status observed |
| Cross-links and AI presentation disclosure | Article/video links saved; video descriptions include sources and production disclosure. YouTube external URLs require channel verification to become clickable, but can be copied |
| Reflection | Student-supplied observations edited into English in SUBMISSION.md |
| Repository | [ps04](https://github.com/yunji-seo/ps04) |
| Setup, diagram, commands and claim trace | SUBMISSION.md, SETUP.md, DESIGN.md and CLAIM_TRACE.md |
| Credentials | See AUDIT_RESULT.json for the latest exact configured-key scan count and zero-match result. This is not a general secret detector |

## Technical demonstration and verification scope

1. **Technical demonstration supplied:** [Watch the technical demo](https://youtu.be/ZTmZNClf8_k).
2. **Different-day execution and recovery:** live runs started October 15 and 16. Both completed their downstream stages through recorded recovery on October 16. Original failures and recovery timestamps remain inspectable in RUN_COMPARISON.md and the run receipts.
3. **Meaningful update demonstration supplied:** [Withheld-item replay](WITHHELD_REPLAY.md) uses an isolated store and actual retained Deno evidence: 1 new / 56 unchanged, then 57 unchanged. Archived decisions and claim mapping explain the editorial effect. This is explicitly a historical-date replay, not another live collection or new AI selection.
4. **Approximate costs supplied:** [Cost report](COST_ESTIMATE.md) calculates public list-price scenarios from archived responses and explains unallocated token counts. Actual MIT Parley charges remain unknown; the report is not an invoice.
5. **Deadline:** the student reports an extension to October 17, 2026, America/New_York. Original run timestamps are preserved.
6. **Access verified at HTTP level:** all six publication URLs plus GitHub returned HTTP 200 and expected page titles without cookies or authentication; see [access report](PUBLIC_ACCESS.json). This does not establish complete playback, narration quality or caption synchronization. Subtitle timing is approximate.

## Submission state

The implementation, evidence archive, editorial review, published series, reflection, cost estimates and access checks are present. The technical demonstration is linked above. Verification methods and scope are documented in the linked reports.

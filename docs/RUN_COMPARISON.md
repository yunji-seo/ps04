# Actual runs and change interpretation

Both runs collected live sources, then required recorded recovery. Original failed entry-point receipts remain intact; dates were not backdated.

| Measure | Run A | Run B |
| --- | --- | --- |
| Artifacts | [October 15](../runs/2026-10-15T19-13-20-785Z-6ccecf24/summary.json) | [October 16](../runs/2026-10-16T04-24-58-255Z-ee63f048/summary.json) |
| UTC start | October 15, 19:13:20 | October 16, 04:24:58 |
| New York start | October 15, 15:13 | October 16, 00:24 |
| As-of date | 2026-10-15 | 2026-10-16 |
| Inclusive UTC evidence dates | September 16–October 15 | September 17–October 16 |
| Discovered / extracted | 51 / 51 | 51 / 51 |
| New / changed / unchanged | 9 / 2 / 40 | 3 / 6 / 42 |
| Eligible corpus | 54 | 57 |
| Written / YouTube / podcast | 50 / 2 / 2 | 53 / 2 / 2 |
| Publisher identities | 6 | 6 |
| Accept / reject / defer | 23 / 27 / 4 | 26 / 26 / 5 |
| Recovered article/script pairs | 3 | 3 |
| Recovery completed, UTC | October 16, 04:38:50 | October 16, 04:43:43 |
| Final approval | Superseded; not selected for publication | Approved for production on October 16 |

Counts compare observations with the persistent store, already populated by earlier attempts. The eligible corpus includes retained items, explaining why it exceeds newly retrieved observations.

## What changed

| New item in Run B | Final selection | Effect |
| --- | --- | --- |
| Chirp Pong | Reject | Not used |
| The next developer interface is ambient intelligence | Reject | Not used |
| Staying Evergreen: How we automated secure access and repo hygiene in a shared org | Accept | Available to synthesis, but absent from final briefs |

| Changed item | Observed difference from Run A | Meaning |
| --- | --- | --- |
| Building Git infrastructure for agent-scale development | Related-article recommendation | No article-body update |
| GitHub Copilot app for Beginners: How to teach Copilot about your codebase | Related-article recommendation | No article-body update |
| GitHub availability report: September 2026 | Related-article recommendation | No article-body update |
| From 2,500 requests to 24: Rebuilding star history without the stargazers | Related-article recommendation | No article-body update |
| Quoting Geoffrey Huntley | Sidebar tag counters increased | No quoted-content update |
| Tree Appreciator | Added a descriptive paragraph about the game | Body addition, but editorially rejected |

Five changes were extraction noise. Both versions remain preserved. The later `article-body-v2` parser uses observed article-body containers and forces a fresh fetch on parser upgrades. Migration metadata distinguishes parser changes from publisher updates. It was not applied to the frozen review evidence.

The final synthesis reflects policy revision, model variation and assistant source checks. The new items above do not establish new findings in the final articles. Deno's inclusion in piece 03 is an editorial change using previously retained evidence.

## Duplicates and dates

An [actual same-day replay](../runs/2026-10-15T13-59-38-909Z-90051c10/changes.jsonl) recorded 44 unchanged observations, zero new items and zero changed versions. Run B preserved another 42 unchanged observations.

Neither main run had a date exclusion in its retained corpus. Labeled fixtures demonstrate old, future, missing and invalid dates and inclusive boundaries. Do not present these fixtures as live exclusions. Recent articles discussing old research are contextualized; publication recency does not make the old experiment current.

## Failure and recovery

Earlier caption requests returned HTTP 429. Retained original media and legitimate transcript routes later supplied two distinct videos. The Korean automatic transcript limitation is explicit.

Brief validation rejected non-exact quotations, invalid assignments and missing accepted media. Short source references, exact passage/segment resolution and bounded corrective calls supported recovery. Run B initially rejected every YouTube item; an explicit assistant-requested reconsideration accepted the OpenAI demonstration for piece 01. Prior decisions and the reassessment audit are preserved. This was not a student judgment.

Draft format failures and source overstatements were corrected. Both summaries initially reported `awaiting_review_after_recovery`, preserving original failures. After student approval and packaging, Run B reports `ready_for_production`; its failure_history still retains the earlier failures. Run A's downstream recovery finished October 16: this is evidence of different-day starts with recovery, not two uninterrupted completions on separate days.

## Time, cost and eligibility

Start-to-recovery wall time was approximately 9 hours 25 minutes for A and 18 minutes 45 seconds for B. It includes pauses and overlapping work, not only compute. Summary elapsed time may also include later reporting/checking.

MIT Parley used `claude-sonnet-4-6`; actual token usage is archived. [List-price cost estimates](COST_ESTIMATE.md) are supplied; actual Parley charges remain unknown. Known local-stage costs sum to zero while paid-stage dollar costs are null. No credits were purchased.

The student reports an extended submission deadline of October 17, 2026, America/New_York. The original execution timestamps above are preserved.

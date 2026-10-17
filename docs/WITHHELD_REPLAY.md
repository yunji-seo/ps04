# Previously withheld evidence replay

This is an offline, historical-date replay of retained real sources, not a third live run. Executed 2026-10-17T01:49:34.074Z.

An isolated store starts with 56 items, withholding the Deno announcement. Introducing the full corpus yields **1 new and 56 unchanged** items; repeating it yields **57 unchanged**. All 57 pass the historical October 16 freshness window. The production store and approved drafts were not modified. No AI calls were made.

[Results](../runs/withheld-replay-2026-10-17T01-49-34-074Z/result.json) · [Introduced changes](../runs/withheld-replay-2026-10-17T01-49-34-074Z/introduced-changes.jsonl) · [Duplicate replay](../runs/withheld-replay-2026-10-17T01-49-34-074Z/duplicate-changes.jsonl) · [Editorial impact](../runs/withheld-replay-2026-10-17T01-49-34-074Z/editorial-impact.json)

Without the withheld source, the Deno claims in piece 03 cannot use that evidence. Adding it restores the source support; the archived acceptance and the student's roadmap qualification explain its editorial use. This mapping reuses actual decisions; it is not a fresh model selection.

Reproduce from the repository root: `node research/demonstrate_withheld.mjs`. Each execution creates a separate replay directory and uses the real Bash store/filter interfaces.

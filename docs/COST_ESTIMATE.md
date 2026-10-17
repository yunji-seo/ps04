# Approximate model cost

[Anthropic Sonnet 4.6 list prices](https://platform.claude.com/docs/en/models/sonnet-4-6/overview), checked October 17 UTC: $3 / million input tokens and $15 / million output tokens. These are **list-price equivalents, not verified MIT Parley charges**. [Calculation and response-file inventory](COST_ESTIMATE.json).

| Run | Archived responses | Input / output tokens | Unallocated tokens | Base estimate | Input-allocation scenario | Output-allocation scenario |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026-10-15T19-13-20-785Z-6ccecf24 | 37 | 111 / 52363 | 843002 | $0.786 | $3.315 | $13.431 |
| 2026-10-16T04-24-58-255Z-ee63f048 | 49 | 147 / 62493 | 1062892 | $0.938 | $4.127 | $16.881 |

Some archived total-token counts exceed prompt plus completion counts. Their billing category is unknown; they are not silently dropped. The base uses reported input/output only. The two scenarios assign the remainder to input or output respectively; they are sensitivity calculations, not a proven invoice range. Cache read/write breakdown, account discounts and provider credit conversion cannot be reconstructed. Missing-usage counts are in the JSON. Each response file is counted once; this does not independently establish unique billable provider transactions.

Scope: the two main runs and their archived recovery responses. Earlier exploratory runs, policy replay, unreported failed requests, Codex subscriptions and video/image production are excluded. Actual MIT Parley charges remain unknown. No additional model calls were needed for this calculation or the withheld-item replay.

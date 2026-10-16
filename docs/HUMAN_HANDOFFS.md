# Student review and publication handoffs

Status: the student supplied six selection judgments and the policy revision on October 16, 2026. See [actual student review](STUDENT_EDITORIAL_REVIEW.md). Article/script approval was supplied on October 16 and the production package is prepared. Rendered videos, publication authorization/links and personal reflection remain pending.

## Review sample

After actual AI selection, choose at least three accepted and three rejected/deferred items. For each, record item/version, AI decision and reason, your own decision, the exact evidence you examined, and why you agree or disagree. Do not select examples solely to make the model look good.

Use that comparison to revise the policy once. Preserve both policies, prompts, decisions and changed outputs. Identify which choices changed and whether the synthesis improved. Corrections must reflect your actual judgment; AI must not invent your reflection.

## Final editorial review

- Trace substantive claims to their source passage or timestamp.
- Check publisher independence and duplicate recordings across platforms.
- Distinguish reported facts, vendor claims and editorial inference.
- Confirm three distinct arguments, cross-source insight, meaningful limitations and all input types.
- Read the articles aloud and time video narration.
- Verify dates, as-of labels, source links, and agreement between article and script.
- Record actual approval using the current review_id only after corrections and a new content check.

## Production and publishing

For each pair, hand the reviewed article, script and source notes from package/ to Google Vids or HeyGen. Produce a 3–5 minute audience-facing video. Inspect rendered text, pronunciations, captions and source cues. Disclose AI-generated presentation where used.

Publish the article on Substack without a paid access requirement. Upload its video to YouTube as public or unlisted. Add the video link to the article and the article/source links to the video description. Replace publication_links.json nulls with actual URLs. Verify access without relying on the creator's logged-in account.

## Technical demonstration: target 5 minutes

| Time | Demonstration | Evidence to show |
| --- | --- | --- |
| 0:00–0:40 | Audience, recurring question, and component diagram | project.json and architecture |
| 0:40–1:20 | Entry point, three collectors, source normalization | run command and one item per kind |
| 1:20–2:15 | Trace one published claim backward | Article marker, brief, decision, exact source version and passage |
| 2:15–3:15 | Compare live runs on different dates | Run metadata, changes, duplicate handling, date exclusions |
| 3:15–4:00 | Show an actual failure and recovery, or labeled simulation | Source receipts and recovery result |
| 4:00–4:40 | Explain your policy revision and a factual correction if one occurred | Before/after policy and your review notes |
| 4:40–5:00 | Explain one design tradeoff and next improvement | Storage boundary or transcript/update limitations |

This is an outline, not a completed narrated recording. The [prepared narration and detailed shot list](TECHNICAL_DEMO.md) now use actual run records and the [Deno claim trace](CLAIM_TRACE.md). Before the final recording, replace the draft view with the actual published article. Do not claim a correction occurred if none did.

## Reflection prompts

1. Which insight required connecting sources rather than summarizing them separately?
2. Where did the AI's editorial judgment differ from yours, and why?
3. Which voices or measurements were missing?
4. What architecture tradeoff did you choose, and when would that choice stop working?
5. What single improvement would most improve the next edition?

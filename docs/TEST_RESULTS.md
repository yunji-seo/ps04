# Verification record

Date: October 16, 2026. Runtime: Node.js 22.14.0 on Windows.

The complete suite passed 25 tests, with zero failures, in the latest observed execution (4.29 seconds reported by the test runner). Command:

```text
npm test
```

| Area | Verified behavior |
| --- | --- |
| Store | New ingestion, duplicate replay, substantive update, historical retrieval, and repeat initialization without erasure |
| Store validation | Malformed input rejected before mutation |
| Freshness | Inclusive 30-calendar-date window, missing/invalid/old/future exclusions, UTC offsets and impossible dates |
| Receipts | Distinct records retained on stage rerun |
| RSS | Audio enclosures distinguished from image enclosures; HTML examples inside CDATA accepted; updated-only dates not treated as original publication |
| Transcripts | Source timestamps retained and invalid intervals rejected |
| Extraction | Paragraph boundaries and explicit publication metadata preserved |
| Extraction updates | Changing recommendations/tag counters does not alter article-body text; real body edits still change it; parser upgrades bypass old HTTP validators |
| Accepted media | Planning stops when a corpus contains video items but none were editorially accepted |
| Recovery reporting | Original entry-point failure remains visible after recovery; a stale content fingerprint cannot be reported ready |
| Review | Broken exact quotations fail assessment; completed negative assessment still exits zero |
| Approval | Missing approval and stale approval rejected, including direct packaging invocation |
| Packaging | Reviewed drafts unchanged; user-entered publication link entries preserved; claim markers become audience-readable references |
| Fingerprint | Changes in referenced evidence assets change the review ID |
| Failure behavior | A deliberately failing local feed does not discard a healthy result; successful empty feed is reported as zero results |
| Editorial contracts | Fabricated/duplicate item versions and invalid assignments fail; insufficient video coverage blocks brief generation |
| Model output | One JSON block can be recovered from surrounding commentary; ambiguous blocks and malformed results fail |
| Provider transport | Mock HTTP failures and truncated output fail; archived requests omit credentials and headers; cost remains unknown |
| Browser transcript import | Video identity must match; segment ends use the next supplied timestamp or measured duration |
| Quote recovery | Whitespace and typographic normalization preserves exact source characters; changed wording is rejected |

The local HTTP fixture-server test initially encountered the network sandbox restriction. Outside that restriction it exposed a real parser bug involving an empty RSS channel. The parser was fixed and the entire suite passed afterward. No fixture is live publication evidence, and test approvals are explicitly fictional.

Two early same-day live collection attempts demonstrated unchanged evidence reuse: the second returned 44 unchanged records, zero new records and zero new versions. Later live runs started on October 15 and 16 and reached draft checks through recorded recovery. See RUN_COMPARISON.md for the timing qualification and extraction-noise limitation. Tests do not establish semantic claim accuracy, student approval or publication.

Live MIT Parley validation returned 40 account-visible models and passed a bounded 31-token check. Subsequent real selection evaluated 44 retained items (19 accept, 21 reject, four defer), after preserving and repairing JSON-format and identifier-copy failures. Six validated batches were reused during recovery without new calls. The video recovery at `runs/2026-10-15T19-11-30-140Z-368bc28e` retained one new original audio/transcript item, bringing the corpus to 45 items and removing the mechanical media-coverage gap. The retained transcript is Korean and automatically generated; equivalence to original English speech is not established.

The current reviewed run contains 57 eligible items and three article/script pairs. All automated reference checks pass; final semantic review is pending. The subsequent extractor change was smoke-tested against public GitHub, Cloudflare and Simon Willison pages, returning substantive article text. This read-only check did not ingest new versions or modify the reviewed evidence.

The final local audit confirmed the review fingerprint still matches the frozen student preview, course instructions remain unchanged, and all local links in SUBMISSION.md and docs resolve. An exact-match scan found no configured Parley key in 972 submission-candidate files or the store's exported current records. The private environment file is ignored. This is not a general detector for all possible secrets; the persistent index was accessed only through its store interface. See [audit result](AUDIT_RESULT.json).

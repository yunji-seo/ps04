#!/usr/bin/env bash
set -uo pipefail
if [[ $# -ne 1 ]]; then echo 'Usage: collect_sources.sh RUN_DIR' >&2; exit 2; fi
run_dir="$1"
export PIPELINE_RUN_DIR="$run_dir"
started="$(node -e 'process.stdout.write(new Date().toISOString())')"
status=0
mkdir -p "$run_dir/candidates"
# Continue independent collectors after failures, retaining their streams and receipts.
bash collectors/fetch_feeds.sh "$run_dir" > "$run_dir/candidates/feeds.jsonl" || status=1
bash collectors/fetch_youtube.sh "$run_dir" > "$run_dir/candidates/youtube.jsonl" || status=1
bash collectors/fetch_podcasts.sh "$run_dir" > "$run_dir/candidates/podcasts.jsonl" || status=1
cat "$run_dir/candidates/feeds.jsonl" "$run_dir/candidates/youtube.jsonl" "$run_dir/candidates/podcasts.jsonl" > "$run_dir/candidates.jsonl"
# A real record-stream pipe; pipefail retains reader or extractor errors.
cat "$run_dir/candidates.jsonl" | bash processing/extract_content.sh "$run_dir" > "$run_dir/items.jsonl" || status=1
bash data/store.sh upsert "$run_dir" < "$run_dir/items.jsonl" > "$run_dir/changes.jsonl" || status=1
bash data/store.sh list > "$run_dir/corpus.jsonl" || status=1
bash processing/filter_items.sh "$run_dir" < "$run_dir/corpus.jsonl" > "$run_dir/eligible.jsonl" || status=1
node lib/workflow_receipt.mjs "$run_dir" workflows/collect_sources "$started" "$status"
exit "$status"

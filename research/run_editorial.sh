#!/usr/bin/env bash
set -uo pipefail
# Partial recovery against retained evidence; not a new collection or full live run.
run_dir="$(node lib/run_context.mjs init)" || exit 2
export PIPELINE_RUN_DIR="$run_dir"
node -e 'const fs=require("fs");const p=process.argv[1]+"/run.json";const m=JSON.parse(fs.readFileSync(p));m.purpose="Partial editorial recovery against retained evidence; not a full collection-to-publication run";fs.writeFileSync(p,JSON.stringify(m,null,2)+"\n")' "$run_dir"
echo "Editorial recovery: $run_dir" >&2
bash data/store.sh list > "$run_dir/corpus.jsonl" || exit 1
bash processing/filter_items.sh "$run_dir" < "$run_dir/corpus.jsonl" > "$run_dir/eligible.jsonl" || exit 1
bash workflows/create_series.sh "$run_dir"
result=$?
bash reporting/summarize_run.sh "$run_dir" > "$run_dir/summary.json"
cat "$run_dir/summary.json"
exit "$result"

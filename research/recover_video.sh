#!/usr/bin/env bash
# Targeted live stage recovery, not a complete end-to-end run or a different-day demonstration.
set -uo pipefail
target_id="${1:-RQfg-zo4R-g}"
run_dir="$(node lib/run_context.mjs init)" || exit 2
export PIPELINE_RUN_DIR="$run_dir"
node -e 'const fs=require("fs");const p=process.argv[1]+"/run.json";const r=JSON.parse(fs.readFileSync(p,"utf8"));r.purpose="targeted alternate-video collection; not a complete pipeline run";fs.writeFileSync(p,JSON.stringify(r,null,2)+"\n")' "$run_dir"
mkdir -p "$run_dir/candidates"
status=0
bash collectors/fetch_youtube.sh "$run_dir" > "$run_dir/candidates/youtube.jsonl" || status=1
node -e 'const fs=require("fs");for(const line of fs.readFileSync(process.argv[1],"utf8").split(/\r?\n/)){if(line.trim()){const row=JSON.parse(line);if(row.item_id==="youtube:"+process.argv[2])console.log(JSON.stringify(row));}}' "$run_dir/candidates/youtube.jsonl" "$target_id" > "$run_dir/candidates.jsonl"
cat "$run_dir/candidates.jsonl" | bash processing/extract_content.sh "$run_dir" > "$run_dir/items.jsonl" || status=1
bash data/store.sh upsert "$run_dir" < "$run_dir/items.jsonl" > "$run_dir/changes.jsonl" || status=1
bash data/store.sh list > "$run_dir/corpus.jsonl" || status=1
bash processing/filter_items.sh "$run_dir" < "$run_dir/corpus.jsonl" > "$run_dir/eligible.jsonl" || status=1
bash reporting/summarize_run.sh "$run_dir" > "$run_dir/summary.json"
cat "$run_dir/summary.json"
exit "$status"

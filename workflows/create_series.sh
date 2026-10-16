#!/usr/bin/env bash
set -uo pipefail
if [[ $# -ne 1 ]]; then echo 'Usage: create_series.sh RUN_DIR' >&2; exit 2; fi
run_dir="$1"
export PIPELINE_RUN_DIR="$run_dir"
started="$(node -e 'process.stdout.write(new Date().toISOString())')"
finish() { node lib/workflow_receipt.mjs "$run_dir" workflows/create_series "$started" "$1" "${2:-}"; exit "$1"; }
for component in editorial/select_items.sh editorial/create_briefs.sh content/write_articles.sh content/write_video_scripts.sh review/check_content.sh; do
  if [[ ! -s "$component" ]]; then
    echo "Component is not implemented: $component" >&2
    finish 1 "Component is not implemented: $component"
  fi
done
bash editorial/select_items.sh "$run_dir" < "$run_dir/eligible.jsonl" > "$run_dir/decisions.jsonl" || finish 1 'Selection failed'
bash editorial/create_briefs.sh "$run_dir" < "$run_dir/decisions.jsonl" > "$run_dir/briefs.jsonl" || finish 1 'Brief generation failed'
bash content/write_articles.sh "$run_dir" < "$run_dir/briefs.jsonl" > "$run_dir/articles.jsonl" || finish 1 'Article generation failed'
bash content/write_video_scripts.sh "$run_dir" < "$run_dir/briefs.jsonl" > "$run_dir/video_scripts.jsonl" || finish 1 'Video script generation failed'
bash review/check_content.sh "$run_dir" > "$run_dir/review.json" || finish 1 'Content check could not run'
node -e 'const fs=require("fs");process.exit(JSON.parse(fs.readFileSync(process.argv[1],"utf8")).passed ? 0 : 1)' "$run_dir/review.json" || finish 1 'Content review has blocking issues'
finish 0

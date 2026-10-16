#!/usr/bin/env bash
set -uo pipefail
if [[ $# -ne 1 ]]; then echo 'Usage: resume_series.sh RUN_DIR' >&2; exit 2; fi
run_dir="$1"
export PIPELINE_RUN_DIR="$run_dir"
started="$(node -e 'process.stdout.write(new Date().toISOString())')"
status=0
# Preserve decisions and raw failed outputs; resume only failed and downstream stages.
bash editorial/create_briefs.sh "$run_dir" < "$run_dir/decisions.jsonl" > "$run_dir/briefs.jsonl" || status=1
if [[ "$status" -eq 0 ]]; then bash content/write_articles.sh "$run_dir" < "$run_dir/briefs.jsonl" > "$run_dir/articles.jsonl" || status=1; fi
if [[ "$status" -eq 0 ]]; then bash content/write_video_scripts.sh "$run_dir" < "$run_dir/briefs.jsonl" > "$run_dir/video_scripts.jsonl" || status=1; fi
if [[ "$status" -eq 0 ]]; then
 bash review/check_content.sh "$run_dir" > "$run_dir/review.json" || status=1
 node -e 'const fs=require("fs");process.exit(JSON.parse(fs.readFileSync(process.argv[1],"utf8")).passed?0:1)' "$run_dir/review.json" || status=1
fi
node lib/workflow_receipt.mjs "$run_dir" workflows/create_series "$started" "$status" 'Resumed from preserved decisions; original failures remain in earlier receipts'
# Do not replace the original entry-point failure receipt.
bash reporting/summarize_run.sh "$run_dir" > "$run_dir/summary.json"
cat "$run_dir/summary.json"
exit "$status"

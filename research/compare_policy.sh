#!/usr/bin/env bash
set -uo pipefail
if [[ $# -ne 1 ]]; then echo 'Usage: compare_policy.sh BASELINE_RUN' >&2; exit 2; fi
baseline="$1"
run_dir="$(node lib/run_context.mjs init)" || exit 2
export PIPELINE_RUN_DIR="$run_dir"
node research/policy_comparison.mjs prepare "$baseline" "$run_dir" || exit 2
echo "Controlled policy replay: $run_dir" >&2
bash editorial/select_items.sh "$run_dir" < "$run_dir/eligible.jsonl" > "$run_dir/decisions.jsonl" || exit 1
node research/policy_comparison.mjs report "$baseline" "$run_dir"

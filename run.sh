#!/usr/bin/env bash
set -uo pipefail
started="$(node -e 'process.stdout.write(new Date().toISOString())')"
if [[ $# -eq 2 && "$1" == '--package' ]]; then
  run_dir="$2"
  export PIPELINE_RUN_DIR="$run_dir"
  status=0
  if [[ ! -s review/check_content.sh || ! -s publishing/prepare_package.sh ]]; then
    echo 'Review and packaging components must be implemented before packaging' >&2
    status=1
  else
    bash review/check_content.sh "$run_dir" > "$run_dir/review.json" || status=1
    if [[ "$status" -eq 0 ]]; then bash publishing/prepare_package.sh "$run_dir" > "$run_dir/package-result.json" || status=1; fi
  fi
elif [[ $# -eq 0 ]]; then
  run_dir="$(node lib/run_context.mjs init)" || exit 2
  export PIPELINE_RUN_DIR="$run_dir"
  status=0
  node lib/run_context.mjs validate "$run_dir" || status=2
  if [[ "$status" -eq 0 ]]; then
    bash data/store.sh init || status=1
    if [[ "$status" -eq 0 ]]; then
      bash workflows/collect_sources.sh "$run_dir" || status=1
      bash workflows/create_series.sh "$run_dir" || status=1
    fi
  fi
else
  echo 'Usage: bash run.sh | bash run.sh --package runs/RUN_ID' >&2
  exit 2
fi
node lib/workflow_receipt.mjs "$run_dir" run "$started" "$status"
bash reporting/summarize_run.sh "$run_dir" > "$run_dir/summary.json" || exit 1
cat "$run_dir/summary.json"
exit "$status"

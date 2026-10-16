#!/usr/bin/env bash
set -uo pipefail
exec node reporting/summarize_run.mjs "$@"

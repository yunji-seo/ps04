#!/usr/bin/env bash
set -uo pipefail
if [[ $# -ne 1 ]]; then echo 'Usage: write_articles.sh RUN_DIR' >&2; exit 2; fi
exec node content/write_articles.mjs "$1"

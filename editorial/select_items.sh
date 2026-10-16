#!/usr/bin/env bash
set -uo pipefail
if [[ $# -ne 1 ]]; then echo 'Usage: select_items.sh RUN_DIR' >&2; exit 2; fi
exec node editorial/select_items.mjs "$1"

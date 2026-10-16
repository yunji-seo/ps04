#!/usr/bin/env bash
set -uo pipefail
if [[ $# -ne 1 ]]; then echo 'Usage: create_briefs.sh RUN_DIR' >&2; exit 2; fi
exec node editorial/create_briefs.mjs "$1"

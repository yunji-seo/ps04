#!/usr/bin/env bash
set -uo pipefail
exec node data/store.mjs "$@"

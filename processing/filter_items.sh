#!/usr/bin/env bash
set -uo pipefail
exec node processing/filter_items.mjs "$@"

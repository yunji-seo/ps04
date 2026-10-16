#!/usr/bin/env bash
set -uo pipefail
exec node review/check_content.mjs "$@"

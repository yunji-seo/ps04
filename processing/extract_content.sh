#!/usr/bin/env bash
set -uo pipefail
exec node processing/extract_content.mjs "$@"

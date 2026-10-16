#!/usr/bin/env bash
set -uo pipefail
exec node publishing/prepare_package.mjs "$@"

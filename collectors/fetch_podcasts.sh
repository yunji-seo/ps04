#!/usr/bin/env bash
set -uo pipefail
exec node collectors/podcasts.mjs "$@"

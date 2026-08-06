#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"

export HITL2_MODE=mock
export HITL2_HOST="${HITL2_HOST:-localhost}"
export HITL2_PORT="${HITL2_PORT:-8788}"
export HITL2_DATA_DIR="${HITL2_DATA_DIR:-$project_dir/.hitl2-mock}"

printf '%s\n' 'WARNING: mock mode uses a software key and is not hardware-backed.'
uv sync --locked
exec uv run --no-sync hitl2

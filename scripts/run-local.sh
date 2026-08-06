#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"

export HITL2_MODE=hardware
export HITL2_HOST="${HITL2_HOST:-localhost}"
export HITL2_PORT="${HITL2_PORT:-8788}"

uv sync --locked
exec uv run --no-sync hitl2

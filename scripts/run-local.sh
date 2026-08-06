#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"

if ! command -v uv >/dev/null 2>&1; then
  printf '%s\n' 'Ghost Lap needs uv: https://docs.astral.sh/uv/getting-started/installation/' >&2
  printf '%s\n' 'Run this launcher again; uv installs compatible Python if needed and downloads the locked dependencies.' >&2
  exit 127
fi

setup_pin_mode=0
case "${1:-}" in
  "") ;;
  --setup-pin) setup_pin_mode=1 ;;
  --help)
    printf '%s\n' 'Usage: ./scripts/run-local.sh [--setup-pin]'
    printf '%s\n' '  --setup-pin  Temporarily allow setting the initial FIDO PIN once.'
    exit 0
    ;;
  *)
    printf '%s\n' 'Usage: ./scripts/run-local.sh [--setup-pin]' >&2
    exit 2
    ;;
esac
if [ "$#" -gt 1 ]; then
  printf '%s\n' 'Usage: ./scripts/run-local.sh [--setup-pin]' >&2
  exit 2
fi

export HITL2_MODE=hardware
export HITL2_HOST="${HITL2_HOST:-localhost}"
export HITL2_PORT="${HITL2_PORT:-8788}"
export HITL2_OPEN_BROWSER="${HITL2_OPEN_BROWSER:-1}"
if [ "$setup_pin_mode" -eq 1 ]; then
  export HITL2_ALLOW_INITIAL_PIN=1
  printf '%s\n' 'WARNING: One-time PIN setup can change the sole connected FIDO key.'
  printf '%s\n' 'Leave only the intended key connected. Existing PINs are never changed.'
else
  unset HITL2_ALLOW_INITIAL_PIN
fi

uv sync --locked
exec uv run --no-sync hitl2

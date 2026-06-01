#!/usr/bin/env bash
# SessionStart hook — verifies the engine is healthy at the start of a session.
# Keeps web sessions honest: if the pure logic is broken, surface it immediately.
set -euo pipefail
cd "$(dirname "$0")/../.."

if command -v node >/dev/null 2>&1; then
  echo "[session-start] Running engine tests..."
  node tools/test/run-tests.js || echo "[session-start] WARNING: engine tests failing"
else
  echo "[session-start] node not found; skipping engine tests"
fi

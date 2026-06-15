#!/usr/bin/env bash
#
# Camp Guppy - local dev runner
#
# Starts the full local stack and opens the app:
#   1. Azurite            (storage emulator, used by the Functions API)
#   2. Azure Functions    (the /api/state function, on Node 20, port 7071)
#   3. SWA CLI proxy      (serves the static site + proxies /api, port 4280)
#
# Open http://localhost:4280 once everything is up.
# Press Ctrl+C to stop everything cleanly.

set -euo pipefail

# --- paths ------------------------------------------------------------------
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_DIR="$ROOT_DIR/site"
API_DIR="$SITE_DIR/api"
AZURITE_DATA="${AZURITE_DATA:-$ROOT_DIR/data}"

FUNC_PORT=7071
SWA_PORT=4280

# Functions Core Tools v4 needs Node 18/20 (not 24). Prefer Homebrew node@20.
NODE20_BIN="/opt/homebrew/opt/node@20/bin"
if [ -d "$NODE20_BIN" ]; then
  FUNC_PATH="$NODE20_BIN:$PATH"
else
  FUNC_PATH="$PATH"
fi

# --- helpers ----------------------------------------------------------------
PIDS=()

cleanup() {
  echo ""
  echo "Shutting down local stack..."
  for pid in "${PIDS[@]:-}"; do
    if [ -n "${pid:-}" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  # give children a moment, then hard-kill any stragglers
  sleep 1
  for pid in "${PIDS[@]:-}"; do
    kill -9 "$pid" 2>/dev/null || true
  done
  echo "Done."
}
trap cleanup EXIT INT TERM

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: '$1' is not installed. $2" >&2
    exit 1
  fi
}

# --- preflight --------------------------------------------------------------
need npx "Install Node.js (https://nodejs.org)."

if ! command -v azurite >/dev/null 2>&1; then
  echo "NOTE: 'azurite' not found globally; will run it via 'npx azurite'."
fi

if ! PATH="$FUNC_PATH" command -v func >/dev/null 2>&1; then
  echo "ERROR: Azure Functions Core Tools ('func') not found." >&2
  echo "       Install with: npm i -g azure-functions-core-tools@4 --unsafe-perm true" >&2
  exit 1
fi

# Install API dependencies if missing.
if [ ! -d "$API_DIR/node_modules" ]; then
  echo "Installing API dependencies..."
  ( cd "$API_DIR" && npm install )
fi

# --- 1. Azurite -------------------------------------------------------------
mkdir -p "$AZURITE_DATA"
echo "Starting Azurite (data: $AZURITE_DATA)..."
if command -v azurite >/dev/null 2>&1; then
  azurite --silent --location "$AZURITE_DATA" --debug "$AZURITE_DATA/debug.log" &
else
  npx --yes azurite --silent --location "$AZURITE_DATA" --debug "$AZURITE_DATA/debug.log" &
fi
PIDS+=($!)
sleep 2

# --- 2. Azure Functions API -------------------------------------------------
echo "Starting Azure Functions API on port $FUNC_PORT (Node 20)..."
( cd "$API_DIR" && PATH="$FUNC_PATH" func start --port "$FUNC_PORT" ) &
PIDS+=($!)

# wait for the function host to come up
echo -n "Waiting for API"
for _ in $(seq 1 30); do
  if curl -sf "http://localhost:$FUNC_PORT/api/state" >/dev/null 2>&1; then
    echo " - ready."
    break
  fi
  echo -n "."
  sleep 1
done

# --- 3. SWA proxy -----------------------------------------------------------
echo "Starting SWA proxy on port $SWA_PORT..."
echo ""
echo "  ====================================================="
echo "   Open:  http://localhost:$SWA_PORT"
echo "   Stop:  Ctrl+C"
echo "  ====================================================="
echo ""
( cd "$ROOT_DIR" && npx --yes @azure/static-web-apps-cli start site --api-devserver-url "http://localhost:$FUNC_PORT" ) &
PIDS+=($!)

# wait on all background jobs; cleanup runs on Ctrl+C
wait

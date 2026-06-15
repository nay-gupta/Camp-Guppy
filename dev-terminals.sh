#!/usr/bin/env bash
#
# Camp Guppy - local dev runner (multi-terminal)
#
# Opens THREE separate Terminal.app windows, one per process:
#   1. Azurite          (storage emulator -> ./data)
#   2. Azure Functions  (the /api/state function, Node 20, port 7071)
#   3. SWA proxy        (static site + /api proxy, port 4280)
#
# Open http://localhost:4280 once all three are up.
# Close each window (or Ctrl+C inside it) to stop that process.

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

# --- preflight --------------------------------------------------------------
if ! command -v osascript >/dev/null 2>&1; then
  echo "ERROR: this multi-terminal script requires macOS (osascript)." >&2
  echo "       Use ./dev.sh instead to run everything in one terminal." >&2
  exit 1
fi

# Install API dependencies if missing (do it here so the windows start clean).
if [ ! -d "$API_DIR/node_modules" ]; then
  echo "Installing API dependencies..."
  ( cd "$API_DIR" && npm install )
fi

mkdir -p "$AZURITE_DATA"

# --- build the three commands ----------------------------------------------
AZURITE_CMD="cd $(printf %q "$ROOT_DIR") && echo '== Azurite ==' && azurite --location $(printf %q "$AZURITE_DATA") --debug $(printf %q "$AZURITE_DATA/debug.log")"

FUNC_CMD="cd $(printf %q "$API_DIR") && echo '== Azure Functions API (port $FUNC_PORT) ==' && PATH=$(printf %q "$NODE20_BIN"):\$PATH func start --port $FUNC_PORT"

SWA_CMD="cd $(printf %q "$ROOT_DIR") && echo '== SWA proxy (http://localhost:$SWA_PORT) ==' && npx --yes @azure/static-web-apps-cli start site --api-devserver-url http://localhost:$FUNC_PORT"

# --- open a Terminal.app window per command --------------------------------
open_window() {
  local cmd="$1"
  osascript <<EOF
tell application "Terminal"
  activate
  do script "${cmd//\"/\\\"}"
end tell
EOF
}

echo "Opening Azurite window..."
open_window "$AZURITE_CMD"
sleep 2

echo "Opening Azure Functions window..."
open_window "$FUNC_CMD"
sleep 2

echo "Opening SWA proxy window..."
open_window "$SWA_CMD"

echo ""
echo "  ====================================================="
echo "   Three terminal windows are starting up."
echo "   Open:  http://localhost:$SWA_PORT"
echo "   Stop:  Ctrl+C (or close) each window."
echo "  ====================================================="

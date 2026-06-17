#!/usr/bin/env bash
set -e

INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"
MARKER="# mobile-ai-coder (Coder command)"

echo ""
echo "  *coder — Installer"
echo "  ==================="
echo ""

cd "$INSTALL_DIR"

echo "  [1/2] Installing dependencies..."
echo ""
npm install
echo ""

echo "  [2/2] Configuring ~/.bashrc..."
echo ""

if grep -q "$MARKER" ~/.bashrc 2>/dev/null; then
  echo "  Coder command already configured. Updating path..."
  sed -i "/$MARKER/,/^$/d" ~/.bashrc
fi

cat >> ~/.bashrc <<EOF

$MARKER
coder() {
  node "$INSTALL_DIR/tui.js"
}
EOF

echo "  Done! Reloading ~/.bashrc..."
echo ""
source ~/.bashrc
echo "  Type 'coder' to launch the TUI."
echo ""

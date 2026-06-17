#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/deivid22srk/mobile-ai-coder.git"
INSTALL_DIR="${HOME}/mobile-ai-coder"
MARKER="# mobile-ai-coder (Coder command)"

echo ""
echo "  *coder — Installer"
echo "  ==================="
echo ""

# Clone if not already in the repo
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "  [0/3] Repository already cloned. Updating..."
  cd "$INSTALL_DIR"
  git pull
else
  echo "  [0/3] Cloning repository..."
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi
echo ""

echo "  [1/3] Installing dependencies..."
echo ""
npm install
echo ""

echo "  [2/3] Configuring ~/.bashrc..."
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

echo "  [3/3] Done! Reloading ~/.bashrc..."
echo ""
source ~/.bashrc
echo "  Type 'coder' to launch the TUI."
echo ""

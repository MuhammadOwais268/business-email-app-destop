#!/usr/bin/env bash
set -euo pipefail
# Small helper to run the AppImage or the unpacked binary and show console output.
# Usage: ./scripts/run-locally.sh [path-to-appimage]

APPIMAGE_PATH="${1:-./BusinessEmail-0.1.0.AppImage}"
UNPACKED_PATH="./release/linux-unpacked/business-email-electron"

if [ -f "$APPIMAGE_PATH" ]; then
  echo "Running AppImage: $APPIMAGE_PATH"
  chmod +x "$APPIMAGE_PATH" || true
  exec "$APPIMAGE_PATH"
fi

if [ -x "$UNPACKED_PATH" ]; then
  echo "Running unpacked binary: $UNPACKED_PATH"
  exec "$UNPACKED_PATH"
fi

echo "No runnable AppImage or unpacked binary found."
echo "Build the project or pass the AppImage path as first argument:" 
echo "$0 /path/to/BusinessEmail-0.1.0.AppImage"
exit 2

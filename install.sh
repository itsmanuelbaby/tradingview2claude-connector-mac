#!/bin/bash
set -e

REPO="itsmanuelbaby/tradingview2claude-connector-mac"
APP_NAME="TradingView2Claude Connector"
INSTALL_DIR="/Applications"

ARCH=$(uname -m)
if [[ "$ARCH" == "arm64" ]]; then
  DMG_NAME="TradingView2Claude-arm64.dmg"
else
  DMG_NAME="TradingView2Claude-x64.dmg"
fi

echo ""
echo "  TradingView2Claude Connector — Installer"
echo "  Architettura: $ARCH"
echo ""

DMG_URL="https://github.com/${REPO}/releases/latest/download/${DMG_NAME}"
TMP_DMG="/tmp/${DMG_NAME}"

echo "  Scarico $DMG_NAME..."
curl -L --progress-bar "$DMG_URL" -o "$TMP_DMG"

echo "  Monto il DMG..."
# Usa -plist per parsare correttamente i path con spazi
MOUNT_OUTPUT=$(hdiutil attach "$TMP_DMG" -nobrowse -noautoopen -plist 2>/dev/null)
MOUNT_POINT=$(echo "$MOUNT_OUTPUT" | grep -A1 '<key>mount-point</key>' | grep '<string>' | sed 's/.*<string>\(.*\)<\/string>.*/\1/' | head -1)

if [ -z "$MOUNT_POINT" ] || [ ! -d "$MOUNT_POINT" ]; then
  echo "  ERRORE: Impossibile determinare il punto di mount"
  exit 1
fi

echo "  Mount point: $MOUNT_POINT"

APP_IN_DMG=$(find "$MOUNT_POINT" -name "*.app" -maxdepth 2 | head -1)

if [ -z "$APP_IN_DMG" ]; then
  echo "  ERRORE: App non trovata nel DMG"
  hdiutil detach "$MOUNT_POINT" -quiet 2>/dev/null || true
  exit 1
fi

TARGET="${INSTALL_DIR}/${APP_NAME}.app"

echo "  Installo..."
[ -d "$TARGET" ] && rm -rf "$TARGET"
cp -R "$APP_IN_DMG" "$INSTALL_DIR/" || sudo cp -R "$APP_IN_DMG" "$INSTALL_DIR/"

xattr -cr "$TARGET" 2>/dev/null || sudo xattr -cr "$TARGET" 2>/dev/null || true

hdiutil detach "$MOUNT_POINT" -quiet 2>/dev/null || true
rm -f "$TMP_DMG"

echo ""
echo "  Installazione completata!"
echo ""
sleep 1
open "$TARGET"

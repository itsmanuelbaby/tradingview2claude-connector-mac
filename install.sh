#!/bin/bash
set -e

REPO="itsmanuelbaby/tradingview2claude-connector"

clear
echo ""
echo "  +==========================================+"
echo "  |     TradingView2Claude Connector        |"
echo "  |       Installazione automatica          |"
echo "  +==========================================+"
echo ""

# --- 1. Rileva architettura -------------------------------------------------
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  ARCH_TAG="arm64"
  echo "  -> Rilevato Mac Apple Silicon (M1/M2/M3/M4)"
else
  ARCH_TAG="x64"
  echo "  -> Rilevato Mac Intel"
fi

# --- 2. Trova ultimo release ------------------------------------------------
echo ""
echo "  [1/5] Ricerca ultima versione disponibile..."
LATEST_INFO=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest")
DOWNLOAD_URL=$(echo "$LATEST_INFO" \
  | grep "browser_download_url" \
  | grep "${ARCH_TAG}.dmg" \
  | head -1 \
  | sed -E 's/.*"(https:[^"]+)".*/\1/')

if [ -z "$DOWNLOAD_URL" ]; then
  echo ""
  echo "  X Nessun DMG trovato per architettura ${ARCH_TAG}."
  echo "    Contatta il supporto."
  exit 1
fi

DMG_NAME=$(basename "$DOWNLOAD_URL")
DMG_PATH="$HOME/Downloads/$DMG_NAME"

echo "  -> Versione: $DMG_NAME"

# --- 3. Download ------------------------------------------------------------
echo ""
echo "  [2/5] Download in corso..."
curl -L --progress-bar -o "$DMG_PATH" "$DOWNLOAD_URL"

if [ ! -f "$DMG_PATH" ] || [ "$(wc -c < "$DMG_PATH")" -lt 1000000 ]; then
  echo ""
  echo "  X Download fallito. Verifica la connessione e riprova."
  exit 1
fi

# --- 4. Rimuovi quarantena dal DMG -----------------------------------------
echo ""
echo "  [3/5] Rimozione restrizioni macOS..."
xattr -cr "$DMG_PATH" 2>/dev/null || true

# --- 5. Monta DMG e installa -----------------------------------------------
echo ""
echo "  [4/5] Installazione in /Applications..."

# Mount con cattura del mount point reale
MOUNT_OUTPUT=$(hdiutil attach "$DMG_PATH" -nobrowse -noautoopen -quiet)
MOUNT_POINT=$(echo "$MOUNT_OUTPUT" | grep -E "/Volumes/" | tail -1 | awk '{for(i=3;i<=NF;i++) printf "%s ", $i; print ""}' | sed 's/ *$//')

if [ -z "$MOUNT_POINT" ] || [ ! -d "$MOUNT_POINT" ]; then
  echo "  X Impossibile montare il DMG."
  exit 1
fi

# Trova .app dentro il DMG
APP_IN_DMG=$(find "$MOUNT_POINT" -maxdepth 2 -name "*.app" -type d 2>/dev/null | head -1)

if [ -z "$APP_IN_DMG" ]; then
  echo "  X App non trovata nel DMG."
  hdiutil detach "$MOUNT_POINT" -quiet 2>/dev/null || true
  exit 1
fi

APP_NAME=$(basename "$APP_IN_DMG")
TARGET="/Applications/$APP_NAME"

# Rimuovi installazione precedente
if [ -d "$TARGET" ]; then
  rm -rf "$TARGET" 2>/dev/null || sudo rm -rf "$TARGET"
fi

# Copia in /Applications (con sudo come fallback se serve)
cp -R "$APP_IN_DMG" /Applications/ 2>/dev/null || sudo cp -R "$APP_IN_DMG" /Applications/

# Rimuovi quarantena dall'app installata
xattr -cr "$TARGET" 2>/dev/null || sudo xattr -cr "$TARGET" 2>/dev/null || true

# Smonta DMG usando mount point reale
hdiutil detach "$MOUNT_POINT" -quiet 2>/dev/null || true

# --- 6. Pulizia e avvio -----------------------------------------------------
echo ""
echo "  [5/5] Pulizia..."
rm -f "$DMG_PATH"

echo ""
echo "  +==========================================+"
echo "  |   Installazione completata!              |"
echo "  +==========================================+"
echo ""
echo "  Apertura $APP_NAME..."
sleep 1
open "$TARGET"
echo ""

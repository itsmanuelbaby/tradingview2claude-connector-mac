╔════════════════════════════════════════════════════════════╗
║       TradingView2Claude Connector               ║
║       Guida completa per buildare e distribuire           ║
╚════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — GOOGLE SHEETS (fai questo PRIMA di tutto)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Vai su sheets.google.com
2. Crea un nuovo foglio → chiamalo "Claude TV Licenses"
3. Dal foglio: Estensioni → Apps Script
4. Cancella tutto → incolla il contenuto di license-api/Code.gs
5. Salva (Ctrl+S)
6. Clicca: Distribuisci → Nuova distribuzione
   - Tipo: App Web
   - Esegui come: Me
   - Accesso: Tutti
7. Clicca Distribuisci → COPIA L'URL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — INSERISCI L'URL NEL PROGETTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Apri src/main.js con un editor di testo
2. Trova questa riga (riga 16):
   const LICENSE_API = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
3. Sostituisci tutto l'URL con quello copiato sopra
4. Salva

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — INSTALLA LE DIPENDENZE (solo prima volta)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apri il Terminale (Mac) o Prompt comandi (Windows) e scrivi:

  cd Desktop/tv2claude-connector
  npm install

Aspetta 2-3 minuti (scarica Electron ~200MB).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — BUILD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PER MAC (.dmg) — esegui dal tuo Mac:
  npm run dist-mac
  → output: dist/TradingView2Claude Connector-1.0.0.dmg

PER WINDOWS (.exe) — esegui da un PC Windows:
  npm run dist-win
  → output: dist/TradingView2Claude Connector Setup 1.0.0.exe

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — GENERA LICENZE PER I CLIENTI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Torna su Apps Script (script.google.com)
2. Apri il file Code.gs
3. Modifica la funzione generateLicenses() con i nomi clienti
4. Dal menu a tendina in alto seleziona "generateLicenses"
5. Clicca Esegui ▶
6. Le chiavi CLTV-XXXX-XXXX-XXXX appaiono nel foglio
7. Manda la chiave al cliente via email/WhatsApp

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GESTIONE LICENZE DAL FOGLIO GOOGLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Revocare licenza:    cambia "status" da "active" a "revoked"
Aumentare slot:      modifica il numero in "max_activations"
Vedere attivazioni:  guarda il foglio "Log"
Trasferire licenza:  imposta "machine_ids" su [] e "current_activations" su 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUTTURA FILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

tv2claude-connector/
├── package.json          configurazione build
├── src/
│   ├── main.js           logica principale + installazione
│   └── index.html        interfaccia grafica dark/gold
├── license-api/
│   └── Code.gs           codice per Google Apps Script
├── assets/
│   ├── icon.png          icona app (256x256) ← sostituisci con la tua
│   ├── icon.ico          icona Windows       ← genera da icon.png
│   └── icon.icns         icona Mac           ← genera da icon.png
└── README.txt            questa guida

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ICONE (opzionale ma consigliato)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Per creare icon.ico e icon.icns dalla tua icona PNG:
  brew install imagemagick
  magick icon.png -resize 256x256 assets/icon.ico
  
Oppure usa: https://cloudconvert.com/png-to-ico

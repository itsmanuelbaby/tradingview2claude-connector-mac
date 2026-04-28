// ============================================================
//  CLAUDE x TRADINGVIEW — LICENSE API
//  
//  ISTRUZIONI:
//  1. Vai su script.google.com
//  2. Crea nuovo progetto
//  3. Incolla tutto questo codice
//  4. Distribuisci > Nuova distribuzione > App Web
//     - Esegui come: Me
//     - Accesso: Tutti
//  5. Copia l'URL e incollalo in src/main.js
// ============================================================

const SHEET_NAME = 'Licenze';

// ── ENTRY POINT ──────────────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'validate')   return json(validateLicense(body));
    if (body.action === 'activate')   return json(activateLicense(body));
    if (body.action === 'check')      return json(checkActivation(body));
    if (body.action === 'deactivate') return json(deactivateLicense(body));
    return json({ ok: false, error: 'Azione non riconosciuta' });
  } catch(e) {
    return json({ ok: false, error: e.message });
  }
}

function doGet() {
  return json({ ok: true, message: 'Claude x TradingView License API v1.0' });
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── FOGLIO ───────────────────────────────────────────────────
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['license_key','customer_name','max_activations','current_activations','machine_ids','status','created_at','notes']);
    sheet.getRange(1,1,1,8).setFontWeight('bold').setBackground('#D4A017').setFontColor('#000');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRow(sheet, key) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toUpperCase() === key.toUpperCase()) {
      return { row: i + 1, data: data[i] };
    }
  }
  return null;
}

// ── VALIDATE ─────────────────────────────────────────────────
function validateLicense(body) {
  const key = (body.license_key || '').trim();
  if (!key) return { ok: false, error: 'Chiave mancante' };

  const sheet = getSheet();
  const found = findRow(sheet, key);
  if (!found) return { ok: false, error: 'Chiave non valida' };

  const [k, name, maxAct, currAct, , status] = found.data;
  if (status !== 'active') return { ok: false, error: `Licenza ${status}` };

  return { ok: true, customer_name: name, slots_left: maxAct - currAct };
}

// ── ACTIVATE ─────────────────────────────────────────────────
function activateLicense(body) {
  const key = (body.license_key || '').trim();
  const machineId = body.machine_id || '';
  const machineInfo = body.machine_info || '';
  if (!key || !machineId) return { ok: false, error: 'Dati mancanti' };

  const sheet = getSheet();
  const found = findRow(sheet, key);
  if (!found) return { ok: false, error: 'Chiave non valida' };

  const [k, name, maxAct, currAct, machineIdsRaw, status] = found.data;
  if (status !== 'active') return { ok: false, error: `Licenza ${status}` };

  let machines = [];
  try { machines = machineIdsRaw ? JSON.parse(machineIdsRaw) : []; } catch(e) { machines = []; }

  // Già attivata su questa macchina?
  if (machines.find(m => m.id === machineId)) {
    return { ok: true, message: 'Già attivato', customer_name: name };
  }

  // Slot esauriti?
  if (currAct >= maxAct) {
    return { ok: false, error: `Limite attivazioni raggiunto (${currAct}/${maxAct}). Contatta il supporto.` };
  }

  machines.push({ id: machineId, info: machineInfo, at: new Date().toISOString() });
  sheet.getRange(found.row, 4).setValue(currAct + 1);
  sheet.getRange(found.row, 5).setValue(JSON.stringify(machines));
  logEvent(key, 'ACTIVATE', machineId, machineInfo);

  return {
    ok: true,
    customer_name: name,
    activations_used: currAct + 1,
    max_activations: maxAct,
  };
}

// ── CHECK ────────────────────────────────────────────────────
function checkActivation(body) {
  const key = (body.license_key || '').trim();
  const machineId = body.machine_id || '';
  if (!key || !machineId) return { ok: false, error: 'Dati mancanti' };

  const sheet = getSheet();
  const found = findRow(sheet, key);
  if (!found) return { ok: false, error: 'Chiave non valida' };

  const [, name, , , machineIdsRaw, status] = found.data;
  if (status !== 'active') return { ok: false, error: `Licenza ${status}` };

  let machines = [];
  try { machines = machineIdsRaw ? JSON.parse(machineIdsRaw) : []; } catch(e) {}

  if (!machines.find(m => m.id === machineId)) {
    return { ok: false, error: 'Macchina non attivata' };
  }
  return { ok: true, customer_name: name };
}

// ── DEACTIVATE (admin) ────────────────────────────────────────
function deactivateLicense(body) {
  // CAMBIA QUESTO TOKEN — usalo solo tu per gestire il supporto
  if (body.admin_token !== 'TV2CLAUDE_ADMIN_2026') {
    return { ok: false, error: 'Token admin non valido' };
  }
  const key = (body.license_key || '').trim();
  const machineId = body.machine_id || '';
  if (!key) return { ok: false, error: 'Chiave mancante' };

  const sheet = getSheet();
  const found = findRow(sheet, key);
  if (!found) return { ok: false, error: 'Chiave non trovata' };

  const [, , , , machineIdsRaw] = found.data;
  let machines = [];
  try { machines = machineIdsRaw ? JSON.parse(machineIdsRaw) : []; } catch(e) {}

  // Rimuovi macchina specifica o tutte
  const before = machines.length;
  machines = machineId ? machines.filter(m => m.id !== machineId) : [];
  sheet.getRange(found.row, 4).setValue(machines.length);
  sheet.getRange(found.row, 5).setValue(JSON.stringify(machines));
  logEvent(key, 'DEACTIVATE', machineId, '');

  return { ok: true, removed: before - machines.length, activations_now: machines.length };
}

// ── LOG ───────────────────────────────────────────────────────
function logEvent(key, action, machineId, info) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let log = ss.getSheetByName('Log');
  if (!log) {
    log = ss.insertSheet('Log');
    log.appendRow(['timestamp','license_key','action','machine_id','info']);
    log.getRange(1,1,1,5).setFontWeight('bold').setBackground('#111').setFontColor('#D4A017');
  }
  log.appendRow([new Date().toISOString(), key, action, machineId, info]);
}

// ============================================================
//  GENERA LICENZE — esegui questa funzione manualmente
//  1. Modifica la lista toGenerate qui sotto
//  2. Seleziona "generateLicenses" dal menu a tendina
//  3. Clicca Esegui ▶
//  4. Le chiavi appaiono nel foglio "Licenze"
// ============================================================
function generateLicenses() {
  const toGenerate = [
    { name: 'Cliente 1',  max: 1 },
    { name: 'Cliente 2',  max: 2 },
    { name: 'Cliente 3',  max: 1 },
    // aggiungi altri qui...
  ];

  const sheet = getSheet();
  const created = [];

  toGenerate.forEach(({ name, max }) => {
    const key = makeKey();
    sheet.appendRow([key, name, max, 0, '[]', 'active', new Date().toISOString(), '']);
    created.push(`${key}  →  ${name}  (max ${max} PC)`);
  });

  Logger.log('Licenze generate:\n' + created.join('\n'));
  SpreadsheetApp.getUi().alert('Licenze generate!\n\n' + created.join('\n'));
}

function makeKey() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({length:4}, () => c[Math.floor(Math.random()*c.length)]).join('');
  return `CLTV-${seg()}-${seg()}-${seg()}`;
}

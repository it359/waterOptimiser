const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const XLSX    = require('xlsx');

const app = express();
app.use(cors());
app.use(express.json());

const START_MS = new Date('2022-01-01T00:00:00').getTime();
const STEP_MS  = 30 * 60 * 1000;
const LABELS   = ['N1', 'N2', 'N3', 'P2', 'A2'];

function makeDatetime(rowIndex) {
  const dt  = new Date(START_MS + rowIndex * STEP_MS);
  const pad = n => String(n).padStart(2, '0');
  return `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}-${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function parsePair(val) {
  if (!val) return { pv: null, ov: null };
  if (Array.isArray(val)) return { pv: val[0], ov: val[1] };
  try {
    const arr = JSON.parse(String(val).replace(/'/g, '"'));
    return { pv: arr[0] ?? null, ov: arr[1] ?? null };
  } catch { return { pv: null, ov: null }; }
}

function parseSheet(wb, sheetName, globalOffset) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json(ws, { defval: null });
  let lastReal = raw.length - 1;
  while (lastReal >= 0 && Object.values(raw[lastReal]).every(
    v => v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
  )) { lastReal--; }
  const trimmed = raw.slice(0, lastReal + 1);
  return trimmed.map((row, i) => {
    const curr = Number(row['currentOperatingCost']) || 0;
    const newC = Number(row['newOperatingCost'])     || 0;
    const bore = parsePair(row['Bore']);
    const cwro = parsePair(row['CWRO']);
    const bbd  = parsePair(row['BoilerBD'] ?? row['BoilrBD']);
    const bd   = parsePair(row['BD']);
    const muFlowPV = (bore.pv||0)+(cwro.pv||0)+(bbd.pv||0);
    const muFlowOV = (bore.ov||0)+(cwro.ov||0)+(bbd.ov||0);
    return {
      updatedDateTime: makeDatetime(globalOffset + i),
      currentOperatingCost: curr, newOperatingCost: newC,
      fixedCost:           (curr-newC)/(365*48),
      currentCostPer30min: curr/(365*48),
      newCostPer30min:     newC/(365*48),
      savingPer30min:      (curr-newC)/(365*48),
      bore_pv: bore.pv, bore_ov: bore.ov,
      cwro_pv: cwro.pv, cwro_ov: cwro.ov,
      bbd_pv:  bbd.pv,  bbd_ov:  bbd.ov,
      bd_pv:   bd.pv,   bd_ov:   bd.ov,
      mu_flow: muFlowPV, mu_flow_pv: muFlowPV, mu_flow_ov: muFlowOV,
      mu_saving: muFlowPV - muFlowOV,
      supply_temp:         row['supply_temp']         ?? null,
      return_temp:         row['return_temp']         ?? null,
      ambient_temp:        row['ambient_temp']        ?? null,
      wetBulb_temp:        row['wetBulb_temp']        ?? null,
      approach_temp:       row['approach_temp']       ?? null,
      delta_temp:          row['delta_temp']          ?? null,
      ct_conductivity:     row['ct_conductivity']     ?? null,
      mu_conductivity:     row['mu_conductivity']     ?? null,
      ct_ph:               row['ct_ph']               ?? null,
      mu_ph:               row['mu_ph']               ?? null,
      ct_tds:              row['ct_tds']              ?? null,
      perf_index:          row['perf_index']          ?? null,
      sat_index:           row['sat_index']           ?? null,
      flow_cycle:          row['flow_cycle']          ?? null,
      scheme:              row['scheme']              ?? 0,
      cooling_tower_level: row['cooling_tower_level'] ?? null,
      relative_humidity:   row['relative_humidity']   ?? null,
    };
  });
}

function findExcelFiles() {
  return fs.readdirSync(__dirname)
    .filter(f => /\.(xlsx|xls)$/i.test(f))
    .sort((a, b) => {
      const numA = parseInt((a.match(/\d+/)||['0'])[0], 10);
      const numB = parseInt((b.match(/\d+/)||['0'])[0], 10);
      return numA - numB;
    })
    .map(f => path.join(__dirname, f));
}

// ── LAZY CACHE — ek veli ek sheet memory madhe ────────────────────────────
const cache = {};
const meta  = {};  // { label: { total, firstDt, lastDt } }

function getSheet(label) {
  if (cache[label]) return cache[label];

  console.log(`📂 Loading ${label} on demand...`);
  const excelFiles = findExcelFiles();
  const rows = [];
  let offset = 0;

  for (const filePath of excelFiles) {
    const wb = XLSX.readFile(filePath);
    wb.SheetNames
      .filter(s => s.toUpperCase() === label)
      .forEach(s => {
        const r = parseSheet(wb, s, offset);
        rows.push(...r);
        offset += r.length;
      });
  }

  cache[label] = rows;
  meta[label]  = { total: rows.length };
  console.log(`   ✅ ${label}: ${rows.length} rows cached`);

  // Free other sheets from memory if RAM is tight
  const loaded = Object.keys(cache);
  if (loaded.length > 2) {
    const oldest = loaded[0];
    if (oldest !== label) {
      delete cache[oldest];
      console.log(`   🗑️  ${oldest} evicted from cache`);
    }
  }

  return rows;
}

// Startup: just read metadata (row counts) without loading all data
function loadMeta() {
  console.log('\n🚀 Starting Water Optimiser Backend...');
  const excelFiles = findExcelFiles();
  if (!excelFiles.length) { console.warn('⚠️  No Excel files found'); return; }
  console.log(`📋 Excel files: ${excelFiles.map(f => path.basename(f)).join(', ')}`);

  // Count rows per sheet without storing data
  const offsets = Object.fromEntries(LABELS.map(l => [l, 0]));
  for (const filePath of excelFiles) {
    const wb = XLSX.readFile(filePath, { sheetStubs: true });
    for (const label of LABELS) {
      wb.SheetNames.filter(s => s.toUpperCase() === label).forEach(s => {
        const ws  = wb.Sheets[s];
        const ref = ws['!ref'];
        if (!ref) return;
        const rowCount = XLSX.utils.decode_range(ref).e.r; // approx row count
        offsets[label] += rowCount;
      });
    }
  }

  for (const label of LABELS) {
    meta[label] = { total: offsets[label] };
  }

  const maxTotal = Math.max(...Object.values(offsets));
  console.log(`✅ Metadata ready — ~${maxTotal} rows per sheet`);
  console.log('   Sheets load on first request (lazy)\n');
}

loadMeta();

// ── API Routes ─────────────────────────────────────────────────────────────
app.get('/api/data', (req, res) => {
  // Return only metadata — loading all 5 sheets at once = RAM overflow
  const info = {};
  for (const label of LABELS) info[label] = meta[label] || { total: 0 };
  res.json({ info, note: 'Use /api/data/:nap for actual data' });
});

app.get('/api/data/:nap', (req, res) => {
  const nap = req.params.nap.toUpperCase();
  if (!LABELS.includes(nap)) return res.status(404).json({ error: 'NAP not found.' });
  const data = getSheet(nap);
  res.json({ nap, total: data.length, data });
});

app.get('/api/data/:nap/:index', (req, res) => {
  const nap = req.params.nap.toUpperCase();
  if (!LABELS.includes(nap)) return res.status(404).json({ error: 'NAP not found' });
  const data  = getSheet(nap);
  const total = data.length;
  let idx = parseInt(req.params.index);
  if (isNaN(idx) || idx < 0) idx = 0;
  idx = idx % total;
  res.json({ nap, index: idx, total, entry: data[idx] });
});

app.get('/api/files', (req, res) => {
  const excelFiles = findExcelFiles().map(f => path.basename(f));
  const counts = Object.fromEntries(LABELS.map(l => [l, meta[l]?.total || 0]));
  res.json({ excelFiles, ...counts });
});

app.post('/api/reload', (req, res) => {
  LABELS.forEach(l => { delete cache[l]; });
  res.json({ ok: true, message: 'Cache cleared — sheets reload on next request' });
});

// ── Frontend ───────────────────────────────────────────────────────────────
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(process.env.PORT || 4000, () => {
  console.log('🌐 Server on port', process.env.PORT || 4000);
});

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const XLSX    = require('xlsx');

const app = express();
app.use(cors());
app.use(express.json());

// ── Config ─────────────────────────────────────────────────────────────────
const START_MS = new Date('2022-01-01T00:00:00').getTime();
const STEP_MS  = 30 * 60 * 1000;
const LABELS   = ['N1', 'N2', 'N3', 'P2', 'A2'];

// ── Helpers ────────────────────────────────────────────────────────────────
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
  while (
    lastReal >= 0 &&
    Object.values(raw[lastReal]).every(
      v => v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
    )
  ) { lastReal--; }

  const trimmed = raw.slice(0, lastReal + 1);
  console.log(`     ${sheetName}: ${trimmed.length} rows`);

  return trimmed.map((row, i) => {
    const curr = Number(row['currentOperatingCost']) || 0;
    const newC = Number(row['newOperatingCost'])     || 0;
    const bore = parsePair(row['Bore']);
    const cwro = parsePair(row['CWRO']);
    const bbd  = parsePair(row['BoilerBD'] ?? row['BoilrBD']);
    const bd   = parsePair(row['BD']);
    const muFlowPV = (bore.pv||0) + (cwro.pv||0) + (bbd.pv||0);
    const muFlowOV = (bore.ov||0) + (cwro.ov||0) + (bbd.ov||0);

    return {
      updatedDateTime:      makeDatetime(globalOffset + i),
      currentOperatingCost: curr,
      newOperatingCost:     newC,
      fixedCost:            (curr - newC) / (365 * 48),
      currentCostPer30min:  curr / (365 * 48),
      newCostPer30min:      newC / (365 * 48),
      savingPer30min:       (curr - newC) / (365 * 48),
      bore_pv: bore.pv,  bore_ov: bore.ov,
      cwro_pv: cwro.pv,  cwro_ov: cwro.ov,
      bbd_pv:  bbd.pv,   bbd_ov:  bbd.ov,
      bd_pv:   bd.pv,    bd_ov:   bd.ov,
      mu_flow:    muFlowPV,
      mu_flow_pv: muFlowPV,
      mu_flow_ov: muFlowOV,
      mu_saving:  muFlowPV - muFlowOV,
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
      const numA = parseInt((a.match(/\d+/) || ['0'])[0], 10);
      const numB = parseInt((b.match(/\d+/) || ['0'])[0], 10);
      return numA - numB;
    })
    .map(f => path.join(__dirname, f));
}

// ── Auto-convert Excel → JSON (only if JSON missing or Excel is newer) ─────
function convertIfNeeded() {
  const excelFiles = findExcelFiles();
  if (!excelFiles.length) return false;

  // Check if any JSON is missing
  const anyMissing = LABELS.some(
    label => !fs.existsSync(path.join(__dirname, `data_${label}.json`))
  );

  // Check if any Excel is newer than JSON
  const excelMtime = Math.max(...excelFiles.map(f => fs.statSync(f).mtimeMs));
  const jsonMtime  = LABELS.reduce((min, label) => {
    const p = path.join(__dirname, `data_${label}.json`);
    return fs.existsSync(p) ? Math.min(min, fs.statSync(p).mtimeMs) : 0;
  }, Infinity);

  if (!anyMissing && excelMtime <= jsonMtime) {
    console.log('✅ JSON files are up to date — skipping conversion');
    return true;
  }

  console.log('\n🔄 Converting Excel → JSON (first time setup)...');
  console.log(`   Found ${excelFiles.length} Excel file(s)`);

  const sheets  = Object.fromEntries(LABELS.map(l => [l, []]));
  const offsets = Object.fromEntries(LABELS.map(l => [l, 0]));

  for (const filePath of excelFiles) {
    console.log(`\n   📂 ${path.basename(filePath)}`);
    const wb = XLSX.readFile(filePath);
    for (const label of LABELS) {
      wb.SheetNames
        .filter(s => s.toUpperCase() === label)
        .forEach(s => {
          const rows = parseSheet(wb, s, offsets[label]);
          sheets[label].push(...rows);
          offsets[label] += rows.length;
        });
    }
  }

  for (const label of LABELS) {
    const rows    = sheets[label];
    const outFile = path.join(__dirname, `data_${label}.json`);
    fs.writeFileSync(outFile, JSON.stringify(rows));
    console.log(`   💾 data_${label}.json — ${rows.length} rows`);
  }

  console.log('\n✅ Conversion done!\n');
  return true;
}

// ── Load data from JSON ────────────────────────────────────────────────────
function loadAllJSON() {
  const result = {};
  for (const label of LABELS) {
    const filePath = path.join(__dirname, `data_${label}.json`);
    if (fs.existsSync(filePath)) {
      result[label] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`   ✅ ${label}: ${result[label].length} rows`);
    } else {
      result[label] = [];
      console.warn(`   ⚠️  ${label}: no data`);
    }
  }
  return result;
}

// ── Startup ────────────────────────────────────────────────────────────────
console.log('\n🚀 Starting Water Optimiser Backend...');
convertIfNeeded();

console.log('\n📦 Loading JSON into memory...');
const { N1, N2, N3, P2, A2 } = loadAllJSON();
const maxTotal = Math.max(N1.length, N2.length, N3.length, P2.length, A2.length);
console.log(`\n✅ Ready — max ${maxTotal} entries\n`);

// ── API Routes ─────────────────────────────────────────────────────────────
app.get('/api/data', (req, res) => res.json({ N1, N2, N3, P2, A2 }));

app.get('/api/data/:nap', (req, res) => {
  const nap = req.params.nap.toUpperCase();
  const map = { N1, N2, N3, P2, A2 };
  if (!map[nap]) return res.status(404).json({ error: 'NAP not found.' });
  res.json({ nap, total: map[nap].length, data: map[nap] });
});

app.get('/api/data/:nap/:index', (req, res) => {
  const nap = req.params.nap.toUpperCase();
  const map = { N1, N2, N3, P2, A2 };
  if (!map[nap]) return res.status(404).json({ error: 'NAP not found' });
  const total = map[nap].length;
  let idx = parseInt(req.params.index);
  if (isNaN(idx) || idx < 0) idx = 0;
  idx = idx % total;
  res.json({ nap, index: idx, total, entry: map[nap][idx] });
});

app.get('/api/files', (req, res) => {
  const excelFiles = findExcelFiles().map(f => path.basename(f));
  res.json({
    excelFiles,
    N1: N1.length, N2: N2.length, N3: N3.length, P2: P2.length, A2: A2.length
  });
});

app.post('/api/reload', (req, res) => {
  res.json({ message: 'Redeploy on Render to reload data.', ok: true });
});

// ── Frontend serve ─────────────────────────────────────────────────────────
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// ── Listen ─────────────────────────────────────────────────────────────────
app.listen(process.env.PORT || 4000, () => {
  console.log('🌐 Server on port', process.env.PORT || 4000);
});

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const XLSX    = require('xlsx');

const app = express();
app.use(cors());
app.use(express.json());

// ── Synthetic datetime config ──────────────────────────────────────────────
const START_MS = new Date('2022-01-01T00:00:00').getTime();
const STEP_MS  = 30 * 60 * 1000;

function makeDatetime(rowIndex) {
  const dt  = new Date(START_MS + rowIndex * STEP_MS);
  const pad = n => String(n).padStart(2, '0');
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}-${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
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
  console.log(`     ${sheetName}: ${raw.length} total → ${trimmed.length} rows (rows 2 to ${trimmed.length + 1})`);

  return trimmed.map((row, localIndex) => {
    const curr = Number(row['currentOperatingCost']) || 0;
    const newC = Number(row['newOperatingCost'])     || 0;

    const parsePair = (val) => {
      if (!val) return { pv: null, ov: null };
      if (Array.isArray(val)) return { pv: val[0], ov: val[1] };
      try {
        const arr = JSON.parse(String(val).replace(/'/g, '"'));
        return { pv: arr[0] ?? null, ov: arr[1] ?? null };
      } catch { return { pv: null, ov: null }; }
    };

    const bore = parsePair(row['Bore']);
    const cwro = parsePair(row['CWRO']);
    const bbd  = parsePair(row['BoilerBD'] ?? row['BoilrBD']);
    const bd   = parsePair(row['BD']);

    const muFlowPV = (bore.pv || 0) + (cwro.pv || 0) + (bbd.pv || 0);
    const muFlowOV = (bore.ov || 0) + (cwro.ov || 0) + (bbd.ov || 0);
    const muSaving = muFlowPV - muFlowOV;

    const updatedDateTime = makeDatetime(globalOffset + localIndex);

    return {
      updatedDateTime,
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
      mu_saving:  muSaving,
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
  const dir = __dirname;
  const files = fs.readdirSync(dir)
    .filter(f => /\.(xlsx|xls)$/i.test(f))
    .sort((a, b) => {
      const numA = parseInt((a.match(/\d+/) || ['0'])[0], 10);
      const numB = parseInt((b.match(/\d+/) || ['0'])[0], 10);
      return numA - numB;
    });
  if (!files.length) throw new Error('No Excel file found');
  console.log('📋 File order:', files);
  return files.map(f => path.join(dir, f));
}

let N1 = [], N2 = [], N3 = [], P2 = [], A2 = [];

function loadData() {
  try {
    const excelFiles = findExcelFiles();
    console.log(`📊 Found ${excelFiles.length} Excel file(s)`);
    N1 = []; N2 = []; N3 = []; P2 = []; A2 = [];

    const offsets = { N1: 0, N2: 0, N3: 0, P2: 0, A2: 0 };

    for (const filePath of excelFiles) {
      console.log(`📂 Loading: ${path.basename(filePath)}`);
      const wb         = XLSX.readFile(filePath);
      const sheetNames = wb.SheetNames;
      console.log(`   Sheets: ${sheetNames.join(', ')}`);

      const load = (label, arr) => {
        sheetNames
          .filter(s => s.toUpperCase() === label)
          .forEach(s => {
            const rows = parseSheet(wb, s, offsets[label]);
            arr.push(...rows);
            offsets[label] += rows.length;
          });
      };

      load('N1', N1);
      load('N2', N2);
      load('N3', N3);
      load('P2', P2);
      load('A2', A2);
    }

    const showRange = (label, arr) => {
      if (!arr.length) return;
      console.log(`   ${label}: ${arr.length} rows | ${arr[0].updatedDateTime} → ${arr[arr.length - 1].updatedDateTime}`);
    };

    console.log(`\n✅ Loaded totals:`);
    showRange('N1', N1);
    showRange('N2', N2);
    showRange('N3', N3);
    showRange('P2', P2);
    showRange('A2', A2);
    console.log(`   Dashboard → Entry 1 / ${Math.max(N1.length, N2.length, N3.length, P2.length, A2.length)}`);

  } catch (err) {
    console.error('❌ Excel load error:', err.message);
  }
}

loadData();

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

app.post('/api/reload', (req, res) => {
  loadData();
  res.json({ ok: true, N1: N1.length, N2: N2.length, N3: N3.length, P2: P2.length, A2: A2.length });
});

app.get('/api/files', (req, res) => {
  try {
    const files = findExcelFiles().map(f => path.basename(f));
    res.json({ files, N1: N1.length, N2: N2.length, N3: N3.length, P2: P2.length, A2: A2.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Frontend serve (PWA build) ─────────────────────────────────────────────
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(process.env.PORT || 4000, () => {
  console.log('\n✅ Backend ready → http://localhost:4000');
  console.log('   Datetime: Row 0 = 01/01/2022 00:00 | +30 min per row\n');
});
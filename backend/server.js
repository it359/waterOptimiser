const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app = express();

app.use(cors({
  origin: [
    'https://wateroptimiser.netlify.app',
    'http://localhost:5173',
    'http://localhost:4000',
  ],
  methods: ['GET','POST'],
}));
app.use(express.json());

const LABELS = ['N1', 'N2', 'N3', 'P2', 'A2'];
const cache  = {};

function getSheet(label) {
  if (cache[label]) return cache[label];
  const filePath = path.join(__dirname, `data_${label}.json`);
  if (!fs.existsSync(filePath)) { console.warn(`⚠️  data_${label}.json missing!`); return []; }
  console.log(`📂 Loading ${label}...`);
  cache[label] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`   ✅ ${label}: ${cache[label].length} rows`);
  // Max 1 sheet in memory at a time
  const keys = Object.keys(cache);
  if (keys.length > 1) {
    const evict = keys.find(k => k !== label);
    if (evict) { delete cache[evict]; console.log(`   🗑️  ${evict} evicted`); }
  }
  return cache[label];
}

console.log('\n🚀 Water Optimiser Backend starting...');
const missing = LABELS.filter(l => !fs.existsSync(path.join(__dirname, `data_${l}.json`)));
if (missing.length) console.error(`❌ Missing: ${missing.join(', ')}`);
else console.log('✅ All JSON files found — ready!\n');

// Per-NAP routes only — no bulk /api/data to avoid OOM
app.get('/api/data/:nap', (req, res) => {
  const nap = req.params.nap.toUpperCase();
  if (!LABELS.includes(nap)) return res.status(404).json({ error: 'NAP not found' });
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
  res.json({ source: 'JSON', labels: LABELS });
});

app.post('/api/reload', (req, res) => {
  LABELS.forEach(l => delete cache[l]);
  res.json({ ok: true, message: 'Cache cleared' });
});

const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(process.env.PORT || 4000, () => {
  console.log('🌐 Server on port', process.env.PORT || 4000);
});
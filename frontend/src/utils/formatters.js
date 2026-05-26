export const fmt      = (v, d = 2) => v == null ? "—" : Number(v).toFixed(d);
export const fmtCost  = (v) => "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtWater = (v) => Number(v * 1000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtNum   = (v, d = 2) => Number(v || 0).toFixed(d);

// ── formatDate ────────────────────────────────────────────────────────────────
// Input:  "20220101-003000"  (YYYYMMDD-HHmmss from server)
// Output: "01/01/2022  00:30"  (updates every row during Play)
export const formatDate = (s) => {
  if (!s || s === "0") return "—";

  const raw      = (s || "").split("_")[0];    // "20220101-003000"
  if (raw.length < 8) return "—";

  const datePart = raw.slice(0, 8);            // "20220101"
  const timePart = (raw.slice(9) || "000000"); // "003000"

  const dd   = datePart.slice(6, 8);           // "01"
  const mm   = datePart.slice(4, 6);           // "01"
  const yyyy = datePart.slice(0, 4);           // "2022"
  const hh   = timePart.slice(0, 2);           // "00"
  const min  = timePart.slice(2, 4);           // "30"

  return `${dd}/${mm}/${yyyy}  ${hh}:${min}`;  // "01/01/2022  00:30"
};

// ── parseDateTime ─────────────────────────────────────────────────────────────
// Converts "20220101-003000" → JavaScript Date object
// Used by Topbar date-jump to find nearest entry for a picked date
export const parseDateTime = (s) => {
  if (!s || s === "0") return null;

  const raw = (s || "").split("_")[0];
  if (raw.length < 8) return null;

  const yyyy = raw.slice(0, 4);
  const mm   = raw.slice(4, 6);
  const dd   = raw.slice(6, 8);
  const tp   = raw.slice(9) || "000000";
  const hh   = tp.slice(0, 2);
  const min  = tp.slice(2, 4);
  const sec  = tp.slice(4, 6);

  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}`);
};
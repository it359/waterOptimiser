export const API     = "http://localhost:4000";
export const MIN_VAL = 50000;
export const MAX_VAL = 600000;
export const SAVE_MIN = 0;
export const SAVE_MAX = 25;
export const CAL = "'Inter', 'Segoe UI', Arial, sans-serif";

// ── NAP palette ──────────────────────────────────────────────────────────────
export const NAP_DEFS = [
  { key:"N1", label:"N1", header:"#1d6fa4", bg:"#eaf4fd", border:"#a8d4f0", accent:"#e3f2fd" },
  { key:"N2", label:"N2", header:"#5a5f6b", bg:"#f4f4f6", border:"#c4c6cc", accent:"#ebebee" },
  { key:"N3", label:"N3", header:"#3d4db7", bg:"#eceef9", border:"#b0b8eb", accent:"#e8eaf6" },
  { key:"P2", label:"P2", header:"#0d3d6e", bg:"#ddeaf7", border:"#6a9dc8", accent:"#d0e4f4" },
  { key:"A2", label:"A2", header:"#7b2d8b", bg:"#f5eaf8", border:"#c89ad4", accent:"#f3e5f5" },
];

// ── Shared card styles ────────────────────────────────────────────────────────
export const CARD_STYLE = (border) => ({
  background: "rgba(255,255,255,0.85)",
  border: "1px solid " + border,
  borderRadius: "8px",
  padding: "5px 6px",
  marginBottom: "4px",
  backdropFilter: "blur(4px)",
});
export const CARD_TITLE = (color) => ({
  fontSize: "8.5px", fontWeight: "700",
  fontFamily: CAL, color,
  marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.04em",
});
export const CARD_VAL = {
  fontSize: "11px", fontWeight: "700",
  fontFamily: CAL, color: "#1a1a2e", textAlign: "center",
};
export const CARD_SUB = {
  fontSize: "8px", color: "#8890a4", fontFamily: CAL, letterSpacing: "0.02em",
};

// ── Alert thresholds ──────────────────────────────────────────────────────────
export const THRESHOLDS = [
  { field: "ct_conductivity", label: "CT Cond",   min: null, max: 6000, unit: "µS/cm" },
  { field: "ct_ph",           label: "CT pH",      min: 7.0,  max: 8.0,  unit: ""     },
  { field: "ct_tds",          label: "CT TDS",     min: null, max: 4000, unit: ""     },
  { field: "return_temp",     label: "Ret. Temp",  min: null, max: 40,   unit: "°C"   },
];

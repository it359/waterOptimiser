import { CARD_STYLE, CARD_TITLE, CARD_VAL } from "../constants";

export default function ValCard({ label, value, col, alert }) {
  return (
    <div style={{ ...CARD_STYLE(col.border), ...(alert ? { borderColor:"#ef4444", background:"#fff5f5" } : {}) }}>
      <div style={CARD_TITLE(col.header)}>{label}</div>
      <div style={{ ...CARD_VAL, color: alert ? "#dc2626" : undefined }}>{value ?? "—"}</div>
    </div>
  );
}

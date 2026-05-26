import { CARD_STYLE, CARD_TITLE, CARD_VAL, CARD_SUB } from "../constants";
import { fmt } from "../utils/formatters";

export default function PVOVCard({ label, pv, ov, col }) {
  return (
    <div style={CARD_STYLE(col.border)}>
      <div style={CARD_TITLE(col.header)}>{label}</div>
      <div style={{ display:"flex", gap:"4px" }}>
        <div style={{ flex:1, textAlign:"center" }}>
          <div style={CARD_SUB}>PV</div>
          <div style={CARD_VAL}>{fmt(pv)}</div>
        </div>
        <div style={{ flex:1, textAlign:"center" }}>
          <div style={CARD_SUB}>OV</div>
          <div style={CARD_VAL}>{fmt(ov)}</div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import logo from "../assets/logo-white.png";
import { NAP_DEFS } from "../constants";
import { parseDateTime } from "../utils/formatters";

function exportCSV(allData) {
  const keys = NAP_DEFS.map(n => n.key), max = Math.max(...keys.map(k => allData[k].length));
  const hdr = ["entry", "nap", "updatedDateTime", "currentOperatingCost", "newOperatingCost", "fixedCost",
    "mu_flow_pv", "mu_flow_ov", "mu_saving", "cwro_pv", "cwro_ov", "bore_pv", "bore_ov", "supply_temp", "return_temp", "ct_conductivity", "ct_ph", "ct_tds"];
  const rows = [hdr.join(",")];
  for (let i = 0; i < max; i++) keys.forEach(k => {
    const e = allData[k][i]; if (!e) return;
    rows.push([i + 1, k, e.updatedDateTime, e.currentOperatingCost, e.newOperatingCost, e.fixedCost,
    e.mu_flow_pv, e.mu_flow_ov, e.mu_saving, e.cwro_pv, e.cwro_ov, e.bore_pv, e.bore_ov, e.supply_temp, e.return_temp, e.ct_conductivity, e.ct_ph, e.ct_tds].map(v => v ?? "").join(","));
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
  a.download = `water_opt_${Date.now()}.csv`; a.click();
}

export default function Topbar({ dateStr, idx, total, jumpVal, setJumpVal, doJump, allData, dark, toggleDark, liveMode, setLiveMode, onDateJump }) {
  const [dateInput, setDateInput] = useState("");

  const handleDateJump = () => {
    if (!dateInput) return;
    const target = new Date(dateInput);
    let bi = 0, bd = Infinity;
    allData[NAP_DEFS[0].key].forEach((e, i) => {
      const d = parseDateTime(e.updatedDateTime); if (!d) return;
      const diff = Math.abs(d - target); if (diff < bd) { bd = diff; bi = i; }
    });
    onDateJump(bi);
  };
  const handleGo = () => {
    if (dateInput) {
      handleDateJump();   
    } else {
      doJump();           
    }
  };

  return (
    <header className="topbar">
      {/* Left */}
      <div className="topbar-left">
        <img src={logo} alt="Ariceo" className="topbar-logo" />
        <sup className="topbar-tm">™</sup>
        <div className="topbar-divider" />
        <span className="topbar-title">Water Optimiser Dashboard</span>
        {liveMode && <span className="live-badge">● LIVE</span>}
      </div>

      {/* Right */}
      <div className="topbar-right">
        <span className="topbar-date">{dateStr}</span>
        {/* Combined jump */}
        <div className="entry-jump">
          <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)}
            className="topbar-date-input" title="Jump to date" />
          <span>or Entry <strong>{idx + 1}</strong>/{total || "—"}</span>
          <input type="number" min="1" max={total} value={jumpVal}
            onChange={e => setJumpVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleGo(); }}
            placeholder="Go to…" className="entry-input" />
          <button className="tb-btn blue" onClick={handleGo}>Go</button>
        </div>


        <button className="tb-btn green" onClick={() => exportCSV(allData)} title="Export CSV">⬇ CSV</button>
        {/* Refresh */}
        <button className="tb-btn slate" onClick={() => window.location.reload()} title="Refresh">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <button className={`tb-btn${liveMode ? " red" : " gray"}`} onClick={() => setLiveMode(l => !l)} title="Live refresh">
          {liveMode ? "⏸ Live" : "▶ Live"}
        </button>
        <button className={`tb-btn${dark ? " amber" : " slate"}`} onClick={toggleDark} title="Toggle dark mode">
          {dark ? "☀" : "🌙"}
        </button>
      </div>
    </header>
  );
}

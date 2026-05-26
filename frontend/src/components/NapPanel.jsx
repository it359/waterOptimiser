import { useState } from "react";
import coolingTowerImg from "../assets/cooling-tower.png";
import { THRESHOLDS } from "../constants";
import { fmt } from "../utils/formatters";
import Gauge         from "./Gauge";
import SavingGauge   from "./SavingGauge";
import PVOVCard      from "./PVOVCard";
import ValCard       from "./ValCard";
import MoreInfoModal from "./MoreInfoModal";
import TrendChart    from "./TrendChart";

function getAlerts(entry) {
  return THRESHOLDS.filter(t=>{
    const v=entry[t.field]; if(v==null) return false;
    if(t.max!=null&&Number(v)>t.max) return true;
    if(t.min!=null&&Number(v)<t.min) return true;
    return false;
  });
}

export default function NapPanel({ napName, col, entries, idx, bookmarks, toggleBookmark, setBookmarkNote }) {
  const [showModal,   setShowModal]   = useState(false);
  const [showTrend,   setShowTrend]   = useState(false);
  const [editNote,    setEditNote]    = useState(false);
  const [noteInput,   setNoteInput]   = useState("");

  const entry     = entries[idx]||{};
  const curr      = entry.currentOperatingCost||0;
  const newC      = entry.newOperatingCost||0;
  const fixedCost = entry.fixedCost||0;
  const same      = Math.abs(curr-newC)<0.01;
  const alerts    = getAlerts(entry);
  const isBM      = bookmarks?.[idx]!==undefined;
  const bmNote    = bookmarks?.[idx]||"";

  const condAlert = entry.ct_conductivity>6000;
  const phAlert   = entry.ct_ph!=null&&(entry.ct_ph<7||entry.ct_ph>8);

  return (
    <>
      {/* ── Flex wrapper keeps panel + alert strip as one grid unit ── */}
      <div style={{ display:"flex", flexDirection:"column" }}>

        <div className="nap-panel" style={{"--nap-bg":col.bg,"--nap-border":col.border,"--nap-header":col.header}}>

          {/* Header */}
          <div className="nap-header" style={{background:col.header}}>
            <span className="nap-header-label">{napName}</span>
            {alerts.length>0&&(
              <span className="nap-alert-badge" title={alerts.map(a=>`${a.label} out of range`).join(", ")}>
                ⚠ {alerts.length}
              </span>
            )}
            {isBM&&<span className="nap-bm-dot" title={bmNote||"Bookmarked"} onClick={()=>setEditNote(true)}>🔖</span>}
          </div>

          {/* Gauges */}
          <div className="nap-gauges">
            <Gauge label="Current Cost"   value={curr}      color={same?"green":"red"}  />
            <Gauge label="Optimised Cost" value={newC}      color={same?"green":"black"}/>
            <SavingGauge label="Savings"  value={fixedCost} />
          </div>

          {/* Trend toggle */}
          <div className="trend-toggle-row">
            <button className="trend-toggle-btn" style={{color:col.header,borderColor:col.border}}
              onClick={()=>setShowTrend(s=>!s)}>
              {showTrend?"▲ Hide":"📈 Trend"}
            </button>
          </div>
          {showTrend&&<TrendChart entries={entries} idx={idx} col={col}/>}

          {/* 3-col data */}
          <div className="nap-data-row">
            <div className="nap-col-left">
              <PVOVCard label="Boiler BD (m³/h)" pv={entry.bbd_pv}  ov={entry.bbd_ov}  col={col}/>
              <PVOVCard label="CWRO (m³/h)"      pv={entry.cwro_pv} ov={entry.cwro_ov} col={col}/>
              <PVOVCard label="Bore (m³/h)"      pv={entry.bore_pv} ov={entry.bore_ov} col={col}/>
              <PVOVCard label="Scheme"           pv={entry.scheme_pv??entry.scheme} ov={entry.scheme_ov??entry.scheme} col={col}/>
            </div>
            <div className="nap-col-center">
              <img src={coolingTowerImg} alt="CT" className="ct-img"/>
              <PVOVCard label="MU Flow (m³/h)" pv={entry.mu_flow_pv} ov={entry.mu_flow_ov} col={col}/>
            </div>
            <div className="nap-col-right">
              <ValCard label="Return Temp (°C)" value={fmt(entry.return_temp)} col={col}/>
              <ValCard label="Supply Temp (°C)" value={fmt(entry.supply_temp)} col={col}/>
              <PVOVCard label="BD (m³/h)" pv={entry.bd_pv} ov={entry.bd_ov} col={col}/>
              <ValCard label="CT Cond (µS/cm)" value={fmt(entry.ct_conductivity,1)} col={col} alert={condAlert}/>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="nap-actions">
            <button className="nap-info-btn" style={{background:col.header}} onClick={()=>setShowModal(true)}>
              ℹ More Info
            </button>
            <button className={`nap-bm-btn${isBM?" active":""}`}
              style={isBM?{background:"#f59e0b",color:"#fff",borderColor:"#f59e0b"}:{borderColor:col.border,color:col.header}}
              onClick={()=>{ if(isBM) toggleBookmark(idx); else { setNoteInput(""); setEditNote(true); } }}
              title={isBM?"Remove bookmark":"Bookmark entry"}>
              {isBM?"🔖":"☆"}
            </button>
          </div>

          {/* Bookmark editor */}
          {editNote&&(
            <div className="bm-editor">
              <input value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder="Add a note…" className="bm-input"/>
              <div className="bm-editor-btns">
                <button className="bm-save" onClick={()=>{ toggleBookmark(idx,noteInput); setEditNote(false); }}>Save</button>
                <button className="bm-cancel" onClick={()=>setEditNote(false)}>Cancel</button>
              </div>
            </div>
          )}
          {isBM&&bmNote&&!editNote&&(
            <div className="bm-note">🔖 {bmNote}</div>
          )}

        </div>
        {/* ── nap-panel closes here ── */}

        {/* ── Alert strip sits BELOW the card ── */}
        {alerts.length>0&&(
          <div className="alert-strip-below">
            ⚠ {alerts.map(a=>a.label).join(" · ")}
          </div>
        )}

      </div>
      {/* ── flex wrapper closes here ── */}

      {showModal&&<MoreInfoModal entry={entry} col={col} napName={napName} onClose={()=>setShowModal(false)}/>}
    </>
  );
}
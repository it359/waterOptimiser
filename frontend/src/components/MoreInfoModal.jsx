import { CAL } from "../constants";
import { fmt, fmtCost } from "../utils/formatters";

export default function MoreInfoModal({ entry, col, napName, onClose }) {
  const sections = [
    { title:"💰 Cost", rows:[
      ["Current Cost",    fmtCost(entry.currentOperatingCost)],
      ["Optimised Cost",  fmtCost(entry.newOperatingCost)],
      ["Saving / 30 min", fmtCost(entry.fixedCost)],
    ]},
    { title:"💧 Water Flow (m³/h)", rows:[
      ["Boiler BD PV/OV", `${fmt(entry.bbd_pv)} / ${fmt(entry.bbd_ov)}`],
      ["CWRO PV/OV",      `${fmt(entry.cwro_pv)} / ${fmt(entry.cwro_ov)}`],
      ["Bore PV/OV",      `${fmt(entry.bore_pv)} / ${fmt(entry.bore_ov)}`],
      ["BD PV/OV",        `${fmt(entry.bd_pv)} / ${fmt(entry.bd_ov)}`],
      ["MU Flow PV",      `${fmt(entry.mu_flow_pv)} m³/h`],
      ["MU Flow OV",      `${fmt(entry.mu_flow_ov)} m³/h`],
      ["MU Saving",       `${fmt(entry.mu_saving)} m³/h`],
    ]},
    { title:"🌡 Temperature (°C)", rows:[
      ["Return Temp",  `${fmt(entry.return_temp)} °C`],
      ["Supply Temp",  `${fmt(entry.supply_temp)} °C`],
      ["Ambient Temp", `${fmt(entry.ambient_temp)} °C`],
      ["Wet Bulb",     `${fmt(entry.wetBulb_temp)} °C`],
      ["Approach",     `${fmt(entry.approach_temp)} °C`],
      ["Delta T",      `${fmt(entry.delta_temp)} °C`],
    ]},
    { title:"🔬 Water Quality", rows:[
      ["CT Conductivity", `${fmt(entry.ct_conductivity,1)} µS/cm`],
      ["MU Conductivity", `${fmt(entry.mu_conductivity,1)} µS/cm`],
      ["CT pH",           fmt(entry.ct_ph,1)],
      ["MU pH",           fmt(entry.mu_ph,1)],
      ["CT TDS",          fmt(entry.ct_tds)],
      ["Flow Cycle",      fmt(entry.flow_cycle)],
      ["CT Level",        fmt(entry.cooling_tower_level)],
      ["Humidity",        `${fmt(entry.relative_humidity)} %`],
    ]},
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{borderTop:`4px solid ${col.header}`}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span style={{color:col.header}}>{napName} — Full Details</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-grid">
          {sections.map(sec=>(
            <div key={sec.title} className="modal-section">
              <div className="modal-sec-title" style={{color:col.header}}>{sec.title}</div>
              {sec.rows.map(([l,v])=>(
                <div key={l} className="modal-row">
                  <span className="modal-row-label">{l}</span>
                  <span className="modal-row-val">{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

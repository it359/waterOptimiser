import { NAP_DEFS } from "../constants";
import { fmtCost, fmtWater, fmtNum } from "../utils/formatters";

export default function SummaryTable({ allData, idx }) {
  const keys   = NAP_DEFS.map(n=>n.key);
  const sumAt  = fn => keys.reduce((s,k)=>s+(fn(allData[k][idx]||{})||0),0);
  const sumUpto= fn => keys.reduce((s,k)=>s+allData[k].slice(0,idx+1).reduce((a,e)=>a+(fn(e)||0),0),0);

  const cells = [
    { label:"Cost Saved",    value:fmtCost(sumUpto(e=>e.fixedCost||0)),                  green:true },
    { label:"Water Saved",   value:fmtWater(sumUpto(e=>e.mu_saving!=null?Number(e.mu_saving):0))+" L", green:true },
    { label:"MU Flow PV",    value:fmtNum(sumAt(e=>e.mu_flow_pv!=null?Number(e.mu_flow_pv):0)) },
    { label:"MU Flow OV",    value:fmtNum(sumAt(e=>e.mu_flow_ov!=null?Number(e.mu_flow_ov):0)) },
    { label:"CWRO PV",       value:fmtNum(sumAt(e=>e.cwro_pv!=null?Number(e.cwro_pv):0)) },
    { label:"CWRO OV",       value:fmtNum(sumAt(e=>e.cwro_ov!=null?Number(e.cwro_ov):0)) },
    { label:"Bore PV",       value:fmtNum(sumAt(e=>e.bore_pv!=null?Number(e.bore_pv):0)) },
    { label:"Bore OV",       value:fmtNum(sumAt(e=>e.bore_ov!=null?Number(e.bore_ov):0)) },
    { label:"Scheme PV",     value:fmtNum(sumAt(e=>e.scheme!=null?Number(e.scheme):0)) },
    { label:"BD PV",         value:fmtNum(sumAt(e=>e.bd_pv!=null?Number(e.bd_pv):0)) },
    { label:"BD OV",         value:fmtNum(sumAt(e=>e.bd_ov!=null?Number(e.bd_ov):0)) },
  ];

  return (
    <div className="summary-bar">
      {cells.map(c=>(
        <div key={c.label} className="summary-cell">
          <div className="summary-cell-label">{c.label}</div>
          <div className={`summary-cell-value${c.green?" green":""}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

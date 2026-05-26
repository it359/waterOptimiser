import { useMemo, useState, useRef, useCallback } from "react";
import { fmtCost, fmt } from "../utils/formatters";

const W = 280, H = 90, P = 8;

// ─── All plottable metrics grouped by category ────────────────────────────────
const METRIC_GROUPS = [
  {
    group: "💰 Cost",
    metrics: [
      { key: "currentOperatingCost", label: "Current Cost",    fmt: fmtCost, color: "#ef4444", unit: "$" },
      { key: "newOperatingCost",     label: "Optimised Cost",  fmt: fmtCost, color: "#22c55e", unit: "$" },
      { key: "fixedCost",            label: "Saving / 30 min", fmt: fmtCost, color: "#f59e0b", unit: "$" },
    ],
  },
  {
    group: "💧 Water Flow (m³/h)",
    metrics: [
      { key: "mu_flow_pv",  label: "MU Flow PV",   fmt: v=>fmt(v), color: "#3b82f6", unit: "m³/h" },
      { key: "mu_flow_ov",  label: "MU Flow OV",   fmt: v=>fmt(v), color: "#06b6d4", unit: "m³/h" },
      { key: "mu_saving",   label: "MU Saving",    fmt: v=>fmt(v), color: "#10b981", unit: "m³/h" },
      { key: "cwro_pv",     label: "CWRO PV",      fmt: v=>fmt(v), color: "#8b5cf6", unit: "m³/h" },
      { key: "cwro_ov",     label: "CWRO OV",      fmt: v=>fmt(v), color: "#a78bfa", unit: "m³/h" },
      { key: "bore_pv",     label: "Bore PV",      fmt: v=>fmt(v), color: "#f97316", unit: "m³/h" },
      { key: "bore_ov",     label: "Bore OV",      fmt: v=>fmt(v), color: "#fb923c", unit: "m³/h" },
      { key: "bd_pv",       label: "BD PV",        fmt: v=>fmt(v), color: "#14b8a6", unit: "m³/h" },
      { key: "bd_ov",       label: "BD OV",        fmt: v=>fmt(v), color: "#2dd4bf", unit: "m³/h" },
      { key: "bbd_pv",      label: "Boiler BD PV", fmt: v=>fmt(v), color: "#6366f1", unit: "m³/h" },
      { key: "bbd_ov",      label: "Boiler BD OV", fmt: v=>fmt(v), color: "#818cf8", unit: "m³/h" },
    ],
  },
  {
    group: "🌡 Temperature (°C)",
    metrics: [
      { key: "return_temp",   label: "Return Temp",  fmt: v=>fmt(v,1), color: "#ef4444", unit: "°C" },
      { key: "supply_temp",   label: "Supply Temp",  fmt: v=>fmt(v,1), color: "#3b82f6", unit: "°C" },
      { key: "ambient_temp",  label: "Ambient Temp", fmt: v=>fmt(v,1), color: "#f59e0b", unit: "°C" },
      { key: "wetBulb_temp",  label: "Wet Bulb",     fmt: v=>fmt(v,1), color: "#06b6d4", unit: "°C" },
      { key: "approach_temp", label: "Approach",     fmt: v=>fmt(v,1), color: "#10b981", unit: "°C" },
      { key: "delta_temp",    label: "Delta T",      fmt: v=>fmt(v,1), color: "#8b5cf6", unit: "°C" },
    ],
  },
  {
    group: "🔬 Water Quality",
    metrics: [
      { key: "ct_conductivity", label: "CT Conductivity", fmt: v=>fmt(v,1), color: "#e879f9", unit: "µS/cm" },
      { key: "mu_conductivity", label: "MU Conductivity", fmt: v=>fmt(v,1), color: "#c026d3", unit: "µS/cm" },
      { key: "ct_ph",           label: "CT pH",           fmt: v=>fmt(v,2), color: "#22d3ee", unit: ""       },
      { key: "mu_ph",           label: "MU pH",           fmt: v=>fmt(v,2), color: "#0ea5e9", unit: ""       },
      { key: "ct_tds",          label: "CT TDS",          fmt: v=>fmt(v,0), color: "#f43f5e", unit: ""       },
      { key: "flow_cycle",      label: "Flow Cycle",      fmt: v=>fmt(v,2), color: "#84cc16", unit: ""       },
      { key: "cooling_tower_level", label: "CT Level",    fmt: v=>fmt(v,1), color: "#facc15", unit: ""       },
      { key: "relative_humidity",   label: "Humidity",    fmt: v=>fmt(v,1), color: "#38bdf8", unit: "%"      },
    ],
  },
];

// Flat lookup by key
const METRIC_MAP = Object.fromEntries(
  METRIC_GROUPS.flatMap(g => g.metrics.map(m => [m.key, m]))
);

// Default: show Current Cost vs Optimised Cost (original behaviour)
const DEFAULT_A = "currentOperatingCost";
const DEFAULT_B = "newOperatingCost";

// ─── Dropdown component ───────────────────────────────────────────────────────
function MetricDropdown({ value, onChange, accentColor, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
      <span style={{
        fontSize: 7, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.06em", color: "var(--text-muted)", paddingLeft: 2
      }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%",
          fontSize: 9,
          fontWeight: 600,
          fontFamily: "var(--font)",
          padding: "3px 5px",
          borderRadius: 6,
          border: `1.5px solid ${accentColor}55`,
          background: "var(--surface)",
          color: "var(--text)",
          outline: "none",
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 4px center",
          paddingRight: 16,
        }}
      >
        {METRIC_GROUPS.map(g => (
          <optgroup key={g.group} label={g.group}>
            {g.metrics.map(m => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

// ─── Main TrendChart ──────────────────────────────────────────────────────────
export default function TrendChart({ entries, idx, col }) {
  const [hover,   setHover]   = useState(null);
  const [metricA, setMetricA] = useState(DEFAULT_A);
  const [metricB, setMetricB] = useState(DEFAULT_B);
  const svgRef = useRef(null);
  const N = 200;

  const mA = METRIC_MAP[metricA];
  const mB = METRIC_MAP[metricB];
  const sameMetric = metricA === metricB;

  const data = useMemo(() => {
    const start = Math.max(0, idx - N + 1);
    const sl    = entries.slice(start, idx + 1);
    if (sl.length < 2) return null;

    const av = sl.map(e => Number(e[metricA]) || 0);
    const bv = sl.map(e => Number(e[metricB]) || 0);

    // If same metric, only use one series
    const allVals = sameMetric
      ? [...av].filter(v => v > 0)
      : [...av, ...bv].filter(v => v > 0);

    if (!allVals.length) return null;

    const mn  = Math.min(...allVals);
    const mx  = Math.max(...allVals);
    const rng = mx - mn || 1;
    const n   = sl.length;

    const tx = i => P + (i / (n - 1)) * (W - P * 2);
    const ty = v => H - P - ((v - mn) / rng) * (H - P * 2 - 8);
    const mk = vals => vals
      .map((v, i) => `${i === 0 ? "M" : "L"}${tx(i).toFixed(1)},${ty(v).toFixed(1)}`)
      .join(" ");

    // Shaded area between the two lines (or under single line)
    const area = sameMetric
      ? mk(av) + ` L${tx(n-1).toFixed(1)},${ty(mn).toFixed(1)} L${tx(0).toFixed(1)},${ty(mn).toFixed(1)} Z`
      : mk(av) + [...bv].reverse().map((v, i) =>
          `L${tx(n - 1 - i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ") + " Z";

    return {
      av, bv, area, mn, mx, n, start,
      pathA: mk(av),
      pathB: sameMetric ? null : mk(bv),
      pts: sl.map((_, i) => ({
        x:   tx(i),
        ya:  ty(av[i]),
        yb:  sameMetric ? null : ty(bv[i]),
        va:  av[i],
        vb:  bv[i],
        diff: av[i] - bv[i],
        entry: start + i + 1,
      })),
    };
  }, [entries, idx, metricA, metricB, sameMetric]);

  const onMove = useCallback(e => {
    if (!svgRef.current || !data) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx   = ((e.clientX - rect.left) / rect.width) * W;
    let best = data.pts[0], bd = Infinity;
    data.pts.forEach(p => {
      const dx = Math.abs(p.x - mx);
      if (dx < bd) { bd = dx; best = p; }
    });
    setHover(best);
  }, [data]);

  // Area fill colour — blend of the two metric colours at low opacity
  const areaFill = sameMetric
    ? `${mA.color}18`
    : `${mA.color}12`;

  return (
    <div className="trend-wrap">

      {/* ── Metric selectors ── */}
      <div style={{
        display: "flex", gap: 5, padding: "0 2px 5px",
        alignItems: "flex-end"
      }}>
        <MetricDropdown
          value={metricA}
          onChange={setMetricA}
          accentColor={mA.color}
          label="Line A"
        />
        {!sameMetric && (
          <div style={{
            fontSize: 9, color: "var(--text-muted)", paddingBottom: 5,
            fontWeight: 700, flexShrink: 0
          }}>vs</div>
        )}
        <MetricDropdown
          value={metricB}
          onChange={setMetricB}
          accentColor={mB.color}
          label="Line B"
        />
      </div>

      {/* ── Legend ── */}
      <div className="trend-legend" style={{ marginBottom: 3 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 7 }}>
          Last {Math.min(N, idx + 1)} entries
        </span>
        <span className="trend-legend-right">
          <span style={{ color: mA.color }}>● {mA.label}</span>
          {!sameMetric && (
            <span style={{ color: mB.color }}>● {mB.label}</span>
          )}
        </span>
      </div>

      {/* ── SVG chart ── */}
      {!data ? (
        <div className="trend-empty">Need ≥ 2 entries for trend</div>
      ) : (
        <div style={{ position: "relative" }}>
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            className="trend-svg"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          >
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map(f => (
              <line key={f}
                x1={P} y1={P + f * (H - P * 2)}
                x2={W - P} y2={P + f * (H - P * 2)}
                stroke="var(--grid-line)" strokeWidth="0.5" strokeDasharray="3,3"
              />
            ))}

            {/* Shaded area */}
            <path d={data.area} fill={areaFill} />

            {/* Line A */}
            <path d={data.pathA} fill="none"
              stroke={mA.color} strokeWidth="1.8"
              strokeLinejoin="round" strokeLinecap="round"
            />

            {/* Line B (only when different metric) */}
            {data.pathB && (
              <path d={data.pathB} fill="none"
                stroke={mB.color} strokeWidth="1.8"
                strokeLinejoin="round" strokeLinecap="round"
                strokeDasharray={sameMetric ? "0" : "none"}
              />
            )}

            {/* Hover crosshair + dots */}
            {hover && <>
              <line
                x1={hover.x} y1={P} x2={hover.x} y2={H - P}
                stroke={col.header} strokeWidth="1"
                strokeDasharray="3,2" opacity="0.6"
              />
              <circle cx={hover.x} cy={hover.ya} r="3.5"
                fill={mA.color} stroke="white" strokeWidth="1.5" />
              {hover.yb !== null && (
                <circle cx={hover.x} cy={hover.yb} r="3.5"
                  fill={mB.color} stroke="white" strokeWidth="1.5" />
              )}
            </>}

            {/* Latest-entry dot (when not hovering) */}
            {!hover && data.pts.length > 0 && (
              <circle
                cx={data.pts.at(-1).x} cy={data.pts.at(-1).ya}
                r="3" fill={mA.color}
              />
            )}

            {/* Min / Max labels */}
            <text x={P} y={H - 2} fontSize="6" fill="var(--text-muted)">
              {mA.fmt(data.mn)}{mA.unit && ` ${mA.unit}`}
            </text>
            <text x={P} y={P + 7} fontSize="6" fill="var(--text-muted)">
              {mA.fmt(data.mx)}{mA.unit && ` ${mA.unit}`}
            </text>
          </svg>

          {/* Hover tooltip */}
          {hover && (
            <div
              className="trend-tooltip"
              style={{ left: `${Math.min(Math.max((hover.x / W) * 100, 12), 68)}%` }}
            >
              <div className="trend-tt-entry">Entry #{hover.entry}</div>
              <div style={{ color: mA.color }}>
                {mA.label}: {mA.fmt(hover.va)}{mA.unit && ` ${mA.unit}`}
              </div>
              {!sameMetric && (
                <>
                  <div style={{ color: mB.color }}>
                    {mB.label}: {mB.fmt(hover.vb)}{mB.unit && ` ${mB.unit}`}
                  </div>
                  <div style={{ color: "#fde68a", fontWeight: 700 }}>
                    Diff: {mA.fmt(hover.diff)}{mA.unit && ` ${mA.unit}`}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useRef, useEffect, useCallback } from "react";
import { MIN_VAL, MAX_VAL } from "../constants";
import { fmtCost } from "../utils/formatters";

const SEGS = [
  { s: 0, e: 1 / 6, c: "#2e7d32" }, { s: 1 / 6, e: 2 / 6, c: "#4caf50" },
  { s: 2 / 6, e: 3 / 6, c: "#81c784" }, { s: 3 / 6, e: 4 / 6, c: "#fbb5b5" },
  { s: 4 / 6, e: 5 / 6, c: "#ef9a9a" }, { s: 5 / 6, e: 1, c: "#c62828" },
];
const LBLS = [
  { p: 0, t: "$50k" }, { p: 0.2, t: "$160k" }, { p: 0.4, t: "$270k" },
  { p: 0.6, t: "$380k" }, { p: 0.8, t: "$490k" }, { p: 1, t: "$600k" },
];

export default function Gauge({ label, value, color = "red" }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const curAngleRef = useRef(null);
  const toAngle = v => Math.PI + Math.min(1, Math.max(0, ((v || 0) - MIN_VAL) / (MAX_VAL - MIN_VAL))) * Math.PI;
  const needleColor = color === "green" ? "#2e7d32" : color === "black" ? "#1a1a1a" : "#c62828";

  const draw = useCallback((canvas, angle) => {
    const ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.82, R = W * 0.34, arcW = W * 0.10;
    ctx.beginPath(); ctx.arc(cx, cy, R - arcW / 2, Math.PI, 2 * Math.PI);
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI); ctx.lineWidth = arcW;
    ctx.strokeStyle = "#e8ecf2"; ctx.lineCap = "butt"; ctx.stroke();
    SEGS.forEach(({ s, e, c }) => { ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI + s * Math.PI, Math.PI + e * Math.PI); ctx.lineWidth = arcW; ctx.strokeStyle = c; ctx.lineCap = "butt"; ctx.stroke(); });
    ctx.font = `bold ${W * 0.046}px Inter,Arial`; ctx.fillStyle = "#6b7280";
    LBLS.forEach(({ p, t }) => {
      const a = Math.PI + p * Math.PI, lr = R + W * 0.12;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * lr, cy + Math.sin(a) * lr + 3);
      ctx.rotate(a + Math.PI / 2);
      ctx.textAlign = "center"; ctx.fillText(t, 0, 0);
      ctx.restore();
    });
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + (i / 10) * Math.PI, maj = i % 5 === 0;
      const r0 = R - (maj ? W * 0.13 : W * 0.085), r1 = R - W * 0.042;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineWidth = maj ? 2.5 : 1; ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.stroke();
    }
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(R - W * 0.02, 0); ctx.moveTo(-10, -2); ctx.lineTo(R - W * 0.02, 0);
    ctx.lineWidth = 3; ctx.strokeStyle = needleColor; ctx.lineCap = "round"; ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, W * 0.048, 0, 2 * Math.PI); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "#d1d5db"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, W * 0.026, 0, 2 * Math.PI); ctx.fillStyle = needleColor; ctx.fill();
  }, [needleColor]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const target = toAngle(value);
    if (curAngleRef.current === null) curAngleRef.current = toAngle(MIN_VAL);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const start = curAngleRef.current, diff = target - start, t0 = performance.now();
    function step(now) {
      const prog = Math.min((now - t0) / 700, 1), ease = 1 - Math.pow(1 - prog, 3);
      curAngleRef.current = start + diff * ease; draw(canvas, curAngleRef.current);
      if (prog < 1) animRef.current = requestAnimationFrame(step);
    }
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [value, draw]);

  return (
    <div className="gauge-card">
      <p className="gauge-label">{label}</p>
      <canvas ref={canvasRef} width={300} height={230} style={{ display: "block", width: "100%", height: "auto" }} />
      <p className="gauge-value" style={{ color: needleColor }}>{fmtCost(value)}</p>
    </div>
  );
}

import { useRef } from "react";

export default function Controls({ idx, total, playing, controls, speedIdx, setSpeedIdx, speedOptions, bookmarks }) {
  const { goFirst, goPrev, goNext, goEnd, startPlay, stopPlay, setIdxDirect } = controls;
  const pct = total ? (idx + 1) / total * 100 : 0;
  const trackRef = useRef(null);

  const scrub = e => {
    if (!trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    setIdxDirect(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (total - 1)));
  };
  const dragStart = e => {
    scrub(e);
    const mv = ev => scrub(ev);
    const up = () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up);
  };

  const bmPts = Object.keys(bookmarks || {}).map(i => ({ pct: ((Number(i) + 1) / total) * 100, note: bookmarks[i] }));

  return (
    <div className="controls-wrap">

      {/* Speed pills */}
      <div className="speed-row">
        <span className="speed-label">Speed</span>
        {(speedOptions || []).map((o, i) => (
          <button key={o.label} onClick={() => setSpeedIdx(i)}
            className={`speed-pill${i === speedIdx ? " active" : ""}`}>{o.label}</button>
        ))}
      </div>

      {/* Nav buttons */}
      <div className="ctrl-btns">
        <button className="ctrl-btn blue" onClick={goFirst} disabled={idx === 0}>⏮</button>
        <button className="ctrl-btn blue" onClick={goPrev} disabled={idx === 0}>◀ Prev</button>
        <button className={`ctrl-btn green${playing ? " active" : ""}`} onClick={startPlay} disabled={playing || idx >= total - 1}>▶ Play</button>
        <button className="ctrl-btn red" onClick={stopPlay} disabled={!playing}>■ Stop</button>
        <button className="ctrl-btn blue" onClick={goNext} disabled={idx >= total - 1}>Next ▶</button>
        <button className="ctrl-btn blue" onClick={goEnd} disabled={idx >= total - 1}>⏭</button>
      </div>

      {/* Scrubable progress */}
      <div className="progress-wrap">
        <div className="progress-track" ref={trackRef} onClick={scrub} onMouseDown={dragStart}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
          {bmPts.map(({ pct: p, note }, i) => (
            <div key={i} className="bm-tick" style={{ left: `${p}%` }} title={note || "Bookmark"} />
          ))}
          <div className="progress-thumb" style={{ left: `${pct}%` }} />
        </div>
        <span className="progress-lbl">{pct.toFixed(1)}% — Entry {idx + 1} of {total}</span>
      </div>

      <div className="kbd-hint">⌨ Space=Play/Pause · ←/→=Step · Home/End · 1–9=Jump%</div>
    </div>
  );
}

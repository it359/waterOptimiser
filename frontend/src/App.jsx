// import { useState } from "react";
// import { NAP_DEFS }         from "./constants";
// import { formatDate }       from "./utils/formatters";
// import { useDashboardData } from "./hooks/useDashboardData";

// // ── Your original components (untouched) ──
// import Topbar       from "./components/Topbar";
// import SummaryTable from "./components/SummaryTable";
// import NapPanel     from "./components/NapPanel";
// import Controls     from "./components/Controls";

// // ── New shell components ──
// import Sidebar       from "./components/Sidebar";
// import Navbar        from "./components/Navbar";
// import SectionHeader from "./components/SectionHeader";

// export default function App() {
//   const [activeNav, setActiveNav] = useState("dashboard");

//   // ── Your original hook — completely untouched ──
//   const {
//     allData, idx, jumpVal, setJumpVal,
//     playing, loading, error, total,
//     speedIdx, setSpeedIdx, speedOptions,
//     liveMode, setLiveMode,
//     dark, toggleDark,
//     bookmarks, toggleBookmark, setBookmarkNote,
//     controls,
//   } = useDashboardData();

//   const dateStr = formatDate(
//     NAP_DEFS.map(n => allData[n.key][idx])
//       .find(e => e?.updatedDateTime && e.updatedDateTime !== "0")
//       ?.updatedDateTime || ""
//   );

//   return (
//     <div className="shell">

//       {/* ── SIDEBAR ── */}
//       <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

//       {/* ── MAIN AREA ── */}
//       <div className="shell-main">

//         {/* ── NAVBAR ── */}
//         <Navbar />

//         {/* ── SECTION HEADER BAR ── */}
//         <SectionHeader title="MY DASHBOARD" />

//         {/* ── YOUR ORIGINAL DASHBOARD — nothing changed ── */}
//         <div className="shell-content">
//           <div className="app">

//             <Topbar
//               dateStr={dateStr} idx={idx} total={total}
//               jumpVal={jumpVal} setJumpVal={setJumpVal} doJump={controls.doJump}
//               allData={allData} dark={dark} toggleDark={toggleDark}
//               liveMode={liveMode} setLiveMode={setLiveMode}
//               onDateJump={controls.setIdxDirect}
//             />

//             {loading && <div className="state-msg">Loading data…</div>}
//             {error   && <div className="state-msg err">{error}</div>}

//             {!loading && !error && (
//               <main className="main-wrap">

//                 <SummaryTable allData={allData} idx={idx} />

//                 <div className="nap-grid">
//                   {NAP_DEFS.map(n => (
//                     <NapPanel
//                       key={n.key} napName={n.label} col={n}
//                       entries={allData[n.key]} idx={idx}
//                       bookmarks={bookmarks}
//                       toggleBookmark={toggleBookmark}
//                       setBookmarkNote={setBookmarkNote}
//                     />
//                   ))}
//                 </div>

//                 <Controls
//                   idx={idx} total={total} playing={playing} controls={controls}
//                   speedIdx={speedIdx} setSpeedIdx={setSpeedIdx} speedOptions={speedOptions}
//                   bookmarks={bookmarks}
//                 />

//               </main>
//             )}

//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }


import { NAP_DEFS }         from "./constants";
import { formatDate }       from "./utils/formatters";
import { useDashboardData } from "./hooks/useDashboardData";

import Topbar       from "./components/Topbar";
import SummaryTable from "./components/SummaryTable";
import NapPanel     from "./components/NapPanel";
import Controls     from "./components/Controls";

export default function App() {
  const {
    allData, idx, jumpVal, setJumpVal,
    playing, loading, error, total,
    speedIdx, setSpeedIdx, speedOptions,
    liveMode, setLiveMode,
    dark, toggleDark,
    bookmarks, toggleBookmark, setBookmarkNote,
    controls,
  } = useDashboardData();

  const dateStr = formatDate(
    NAP_DEFS.map(n => allData[n.key][idx])
      .find(e => e?.updatedDateTime && e.updatedDateTime !== "0")
      ?.updatedDateTime || ""
  );

  return (
    <div className="app">

      <Topbar
        dateStr={dateStr} idx={idx} total={total}
        jumpVal={jumpVal} setJumpVal={setJumpVal} doJump={controls.doJump}
        allData={allData} dark={dark} toggleDark={toggleDark}
        liveMode={liveMode} setLiveMode={setLiveMode}
        onDateJump={controls.setIdxDirect}
      />

      {loading && <div className="state-msg">Loading data…</div>}
      {error   && <div className="state-msg err">{error}</div>}

      {!loading && !error && (
        <main className="main-wrap">

          <SummaryTable allData={allData} idx={idx} />

          <div className="nap-grid">
            {NAP_DEFS.map(n => (
              <NapPanel
                key={n.key} napName={n.label} col={n}
                entries={allData[n.key]} idx={idx}
                bookmarks={bookmarks}
                toggleBookmark={toggleBookmark}
                setBookmarkNote={setBookmarkNote}
              />
            ))}
          </div>

          <Controls
            idx={idx} total={total} playing={playing} controls={controls}
            speedIdx={speedIdx} setSpeedIdx={setSpeedIdx} speedOptions={speedOptions}
            bookmarks={bookmarks}
          />

        </main>
      )}

    </div>
  );
}


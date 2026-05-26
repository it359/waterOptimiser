import { useState, useEffect, useRef, useCallback } from "react";
import { API, NAP_DEFS } from "../constants";

const SPEEDS = [
  { label:"0.5×", ms:1800 },
  { label:"1×",   ms:900  },
  { label:"2×",   ms:450  },
  { label:"5×",   ms:180  },
];

const ls = (k,d) => { try { return JSON.parse(localStorage.getItem(k)??JSON.stringify(d)); } catch { return d; } };
const ss = (k,v) => localStorage.setItem(k, JSON.stringify(v));

export function useDashboardData() {
  const [allData,   setAllData]   = useState({ N1:[],N2:[],N3:[],P2:[],A2:[] });
  const [idx,       setIdx]       = useState(0);
  const [jumpVal,   setJumpVal]   = useState("");
  const [playing,   setPlaying]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [speedIdx,  setSpeedIdx]  = useState(1);
  const [liveMode,  setLiveMode]  = useState(false);
  const [dark,      setDark]      = useState(() => ls("wod_dark", false));
  const [bookmarks, setBookmarks] = useState(() => ls("wod_bm", {}));
  const timer = useRef(null);
  const live  = useRef(null);

  /* Dark mode */
  useEffect(() => {
    ss("wod_dark", dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  /* Fetch */
  const fetchData = useCallback(() => {
    fetch(`${API}/api/data`)
      .then(r=>r.json())
      .then(d=>{ setAllData({N1:d.N1||[],N2:d.N2||[],N3:d.N3||[],P2:d.P2||[],A2:d.A2||[]}); setLoading(false); })
      .catch(()=>{ setError("Backend not connecting — run: cd backend && node server.js"); setLoading(false); });
  }, []);

  useEffect(()=>{ fetchData(); }, [fetchData]);

  const total = Math.max(...NAP_DEFS.map(n=>allData[n.key]?.length||0), 1);

  /* Live mode */
  useEffect(() => {
    if (liveMode) live.current = setInterval(()=>fetch(`${API}/api/reload`,{method:"POST"}).then(()=>fetchData()).catch(()=>{}), 30000);
    else clearInterval(live.current);
    return ()=>clearInterval(live.current);
  }, [liveMode, fetchData]);

  /* Navigation */
  const goFirst      = useCallback(()=>setIdx(0), []);
  const goPrev       = useCallback(()=>setIdx(i=>Math.max(i-1,0)), []);
  const goNext       = useCallback(()=>setIdx(i=>Math.min(i+1,total-1)), [total]);
  const goEnd        = useCallback(()=>setIdx(total-1), [total]);
  const setIdxDirect = useCallback(i=>setIdx(Math.min(Math.max(i,0),total-1)), [total]);

  const doJump = useCallback(()=>{
    const n=parseInt(jumpVal,10);
    if(!isNaN(n)&&n>=1&&n<=total) setIdx(n-1);
    setJumpVal("");
  }, [jumpVal,total]);

  /* Playback */
  const stopPlay = useCallback(()=>{ clearInterval(timer.current); setPlaying(false); }, []);

  const startPlay = useCallback(()=>{
    if (playing||idx>=total-1) return;
    setPlaying(true);
    timer.current = setInterval(()=>{
      setIdx(i=>{
        const nx=i+1;
        if(nx>=total){ clearInterval(timer.current); setPlaying(false); return i; }
        const bm=ls("wod_bm",{});
        if(bm[nx]!==undefined){ clearInterval(timer.current); setPlaying(false); }
        return nx;
      });
    }, SPEEDS[speedIdx].ms);
  }, [playing,idx,total,speedIdx]);

  useEffect(()=>{
    if(!playing) return;
    clearInterval(timer.current);
    timer.current = setInterval(()=>setIdx(i=>{ const nx=i+1; if(nx>=total){clearInterval(timer.current);setPlaying(false);return i;} return nx; }), SPEEDS[speedIdx].ms);
  }, [speedIdx]); // eslint-disable-line

  /* Keyboard shortcuts */
  useEffect(()=>{
    const h=(e)=>{
      if(["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)) return;
      if(e.key===" "){ e.preventDefault(); playing?stopPlay():startPlay(); }
      else if(e.key==="ArrowLeft")  setIdx(i=>Math.max(i-1,0));
      else if(e.key==="ArrowRight") setIdx(i=>Math.min(i+1,total-1));
      else if(e.key==="Home") setIdx(0);
      else if(e.key==="End")  setIdx(total-1);
      else if(e.key>="1"&&e.key<="9") setIdx(Math.floor((parseInt(e.key)/10)*(total-1)));
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  }, [playing,startPlay,stopPlay,total]);

  /* Bookmarks */
  const toggleBookmark = useCallback((i,note="")=>{
    setBookmarks(prev=>{ const nx={...prev}; if(nx[i]!==undefined) delete nx[i]; else nx[i]=note; ss("wod_bm",nx); return nx; });
  },[]);
  const setBookmarkNote = useCallback((i,note)=>{
    setBookmarks(prev=>{ const nx={...prev,[i]:note}; ss("wod_bm",nx); return nx; });
  },[]);

  return {
    allData, idx, jumpVal, setJumpVal, playing, loading, error, total,
    speedIdx, setSpeedIdx, speedOptions: SPEEDS,
    liveMode, setLiveMode,
    dark, toggleDark:()=>setDark(d=>!d),
    bookmarks, toggleBookmark, setBookmarkNote,
    controls:{ goFirst, goPrev, goNext, goEnd, doJump, startPlay, stopPlay, setIdxDirect },
  };
}

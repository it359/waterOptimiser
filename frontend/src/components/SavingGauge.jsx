import { useRef, useEffect, useCallback } from "react";
import { SAVE_MIN, SAVE_MAX } from "../constants";
import { fmtCost } from "../utils/formatters";

const SEGS=[
  {s:0,e:1/6,c:"#c8e6c9"},{s:1/6,e:2/6,c:"#a5d6a7"},
  {s:2/6,e:3/6,c:"#66bb6a"},{s:3/6,e:4/6,c:"#43a047"},
  {s:4/6,e:5/6,c:"#2e7d32"},{s:5/6,e:1,c:"#1b5e20"},
];
const LBLS=[{p:0,t:"$0"},{p:0.2,t:"$5"},{p:0.4,t:"$10"},{p:0.6,t:"$15"},{p:0.8,t:"$20"},{p:1,t:"$25"}];
const NC="#2e7d32";

export default function SavingGauge({ label, value }) {
  const canvasRef=useRef(null),animRef=useRef(null),curAngleRef=useRef(null);
  const toAngle=v=>Math.PI+Math.min(1,Math.max(0,((v||0)-SAVE_MIN)/(SAVE_MAX-SAVE_MIN)))*Math.PI;

  const draw=useCallback((canvas,angle)=>{
    const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);
    const cx=W/2,cy=H*0.82,R=W*0.34,arcW=W*0.10;
    ctx.beginPath();ctx.arc(cx,cy,R-arcW/2,Math.PI,2*Math.PI);ctx.fillStyle="#fff";ctx.fill();
    ctx.beginPath();ctx.arc(cx,cy,R,Math.PI,2*Math.PI);ctx.lineWidth=arcW;ctx.strokeStyle="#e8ecf2";ctx.lineCap="butt";ctx.stroke();
    SEGS.forEach(({s,e,c})=>{ ctx.beginPath();ctx.arc(cx,cy,R,Math.PI+s*Math.PI,Math.PI+e*Math.PI);ctx.lineWidth=arcW;ctx.strokeStyle=c;ctx.lineCap="butt";ctx.stroke(); });
    ctx.font=`bold ${W*0.046}px Inter,Arial`;ctx.fillStyle="#6b7280";
    LBLS.forEach(({p,t})=>{
      const a=Math.PI+p*Math.PI,lr=R+W*0.11;
      ctx.save();ctx.translate(cx+Math.cos(a)*lr,cy+Math.sin(a)*lr+3);ctx.rotate(a+Math.PI/2);ctx.textAlign="center";ctx.fillText(t,0,0);ctx.restore();
    });
    for(let i=0;i<=10;i++){
      const a=Math.PI+(i/10)*Math.PI,maj=i%5===0;
      ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(R-(maj?W*0.13:W*0.085)),cy+Math.sin(a)*(R-(maj?W*0.13:W*0.085)));
      ctx.lineTo(cx+Math.cos(a)*(R-W*0.042),cy+Math.sin(a)*(R-W*0.042));
      ctx.lineWidth=maj?2.5:1;ctx.strokeStyle="rgba(0,0,0,0.18)";ctx.stroke();
    }
    ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);
    ctx.beginPath();ctx.moveTo(-10,2);ctx.lineTo(R-W*0.02,0);ctx.moveTo(-10,-2);ctx.lineTo(R-W*0.02,0);
    ctx.lineWidth=3;ctx.strokeStyle=NC;ctx.lineCap="round";ctx.stroke();ctx.restore();
    ctx.beginPath();ctx.arc(cx,cy,W*0.048,0,2*Math.PI);ctx.fillStyle="#fff";ctx.fill();ctx.strokeStyle="#d1d5db";ctx.lineWidth=1.5;ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,W*0.026,0,2*Math.PI);ctx.fillStyle=NC;ctx.fill();
  },[]);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const target=toAngle(value);
    if(curAngleRef.current===null) curAngleRef.current=toAngle(SAVE_MIN);
    if(animRef.current) cancelAnimationFrame(animRef.current);
    const start=curAngleRef.current,diff=target-start,t0=performance.now();
    function step(now){
      const prog=Math.min((now-t0)/700,1),ease=1-Math.pow(1-prog,3);
      curAngleRef.current=start+diff*ease;draw(canvas,curAngleRef.current);
      if(prog<1) animRef.current=requestAnimationFrame(step);
    }
    animRef.current=requestAnimationFrame(step);
    return()=>{ if(animRef.current) cancelAnimationFrame(animRef.current); };
  },[value,draw]);

  return (
    <div className="gauge-card">
      <p className="gauge-label">{label}</p>
      <canvas ref={canvasRef} width={300} height={230} style={{display:"block",width:"100%",height:"auto"}}/>
      <p className="gauge-value" style={{color:NC}}>{fmtCost(value)}</p>
    </div>
  );
}

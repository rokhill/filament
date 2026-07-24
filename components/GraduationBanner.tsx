"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";

export default function GraduationBanner({ name, symbol, address }: { name: string; symbol: string; address: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!; let alive = true; const P: any[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const color = (life: number) => {
      if (life > 0.75) { const t=(1-life)/0.25; return `rgb(255,${Math.round(255-t*35)},${Math.round(255-t*255)})`; }
      if (life > 0.4) { const t=(0.75-life)/0.35; return `rgb(255,${Math.round(220-t*100)},0)`; }
      const t=(0.4-life)/0.4; return `rgb(${Math.round(255-t*120)},${Math.round(120-t*120)},0)`;
    };
    const resize = () => { canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight; };
    resize(); const ro = new ResizeObserver(resize); ro.observe(canvas);
    const burst = (ox: number, oy: number) => {
      for (let i=0;i<rand(8,13);i++) { const side=Math.random()>.5?1:-1,angle=rand(-.3,.3),spd=rand(4,12); P.push({x:ox,y:oy,vx:Math.cos(angle)*spd*side,vy:Math.sin(angle)*spd-rand(.5,2),life:1,decay:rand(.025,.055),r:rand(.7,1.8),grav:rand(.05,.12),drag:rand(.97,.995),trail:[] as any[],tlen:Math.floor(rand(10,20)),type:"flat"}); }
      for (let j=0;j<3;j++) P.push({x:ox+rand(-12,12),y:oy+rand(-8,8),vx:rand(-.5,.5),vy:rand(-.6,.3),life:1,decay:rand(.02,.035),r:.4,grav:.002,drag:.999,trail:[] as any[],tlen:2,type:"depth",zspd:rand(1.8,3.2)});
    };
    let t=0;
    const loop = () => {
      if (!alive) return; t++;
      if (t%28===0) burst(rand(canvas.width*.1,canvas.width*.9),rand(canvas.height*.3,canvas.height*.8));
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for (let i=P.length-1;i>=0;i--) {
        const p=P[i]; p.trail.push({x:p.x,y:p.y}); if(p.trail.length>p.tlen)p.trail.shift();
        p.x+=p.vx;p.y+=p.vy;p.vy+=p.grav;p.vx*=p.drag;p.life-=p.decay;
        const col=color(p.life);
        if (p.type==="flat"&&p.trail.length>1) {
          for(let t2=1;t2<p.trail.length;t2++){ctx.beginPath();ctx.moveTo(p.trail[t2-1].x,p.trail[t2-1].y);ctx.lineTo(p.trail[t2].x,p.trail[t2].y);ctx.strokeStyle=color(p.life*(t2/p.trail.length));ctx.lineWidth=p.r*(t2/p.trail.length)*.8;ctx.globalAlpha=(t2/p.trail.length)*p.life*.45;ctx.stroke();}
          ctx.beginPath();ctx.arc(p.x,p.y,Math.max(p.r*p.life,.1),0,6.28);ctx.fillStyle=col;ctx.globalAlpha=p.life;ctx.shadowColor=col;ctx.shadowBlur=5;ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1;
        } else if (p.type==="depth") {
          const rad=p.r+(1-p.life)*p.zspd*3.5;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(rad,.2),0,6.28);ctx.fillStyle=col;ctx.globalAlpha=p.life*.95;ctx.shadowColor=col;ctx.shadowBlur=3;ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1;
        }
        if(p.life<=0)P.splice(i,1);
      }
      requestAnimationFrame(loop);
    };
    loop();
    return () => { alive=false; ro.disconnect(); };
  }, []);
  return (
    <div className="rounded-2xl mb-6 forge-breathe" style={{position:"relative",border:"1px solid rgba(255,140,30,.6)",background:"linear-gradient(135deg,#0d0a06,#1a0f04)",minHeight:160,overflow:"hidden"}}>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} />
      <div style={{position:"relative",zIndex:2,padding:"1.25rem 1.5rem"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:".75rem",marginBottom:"1rem"}}>
          <span style={{fontSize:32}}>🎓</span>
          <div>
            <div style={{fontSize:20,fontWeight:700,fontFamily:"var(--font-display),serif",color:"#ffaa32",textShadow:"0 0 20px rgba(255,140,30,.8)"}}>{name} has graduated</div>
            <div style={{fontSize:12,marginTop:4,color:"var(--ae-nebula)",lineHeight:1.6}}>The curve sold out — liquidity is live on Filament and the LP is burned forever.<br/>Nobody can pull it. Not even the Forge.</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <Link href="/" style={{background:"linear-gradient(180deg,#ffaa32,#e07a12)",color:"#140d05",borderRadius:10,padding:"8px 18px",fontSize:13,fontWeight:700,textDecoration:"none"}}>Trade ${symbol} on Filament →</Link>
          <a href={`https://mainnet.lightscan.app/address/${address}`} target="_blank" rel="noopener noreferrer" style={{border:"1px solid rgba(255,140,30,.4)",color:"#ffaa32",borderRadius:10,padding:"8px 18px",fontSize:13,fontWeight:600,textDecoration:"none"}}>Verify LP burn ↗</a>
        </div>
      </div>
    </div>
  );
}

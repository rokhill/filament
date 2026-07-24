"use client";
import React, { useRef, useEffect, useCallback } from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function SparkButton({ children, onClick, ...props }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<any[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
    document.body.appendChild(canvas);
    canvasRef.current = canvas;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const color = (life: number) => {
      if (life > 0.75) { const t = (1 - life) / 0.25; return `rgb(255,${Math.round(255 - t * 35)},${Math.round(255 - t * 255)})`; }
      if (life > 0.4) { const t = (0.75 - life) / 0.35; return `rgb(255,${Math.round(220 - t * 100)},0)`; }
      const t = (0.4 - life) / 0.4; return `rgb(${Math.round(255 - t * 120)},${Math.round(120 - t * 120)},0)`;
    };

    const loop = () => {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const P = particles.current;
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > p.tlen) p.trail.shift();
        p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.vx *= p.drag; p.life -= p.decay;
        const col = color(p.life);
        if (p.type === "flat" && p.trail.length > 1) {
          for (let t = 1; t < p.trail.length; t++) {
            ctx.beginPath(); ctx.moveTo(p.trail[t-1].x, p.trail[t-1].y); ctx.lineTo(p.trail[t].x, p.trail[t].y);
            ctx.strokeStyle = color(p.life * (t / p.trail.length));
            ctx.lineWidth = p.r * (t / p.trail.length) * 0.8;
            ctx.globalAlpha = (t / p.trail.length) * p.life * 0.45; ctx.stroke();
          }
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(p.r * p.life, 0.1), 0, 6.28);
          ctx.fillStyle = col; ctx.globalAlpha = p.life; ctx.shadowColor = col; ctx.shadowBlur = 5;
          ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        } else if (p.type === "depth") {
          const rad = p.r + (1 - p.life) * p.zspd * 3.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(rad, 0.2), 0, 6.28);
          ctx.fillStyle = col; ctx.globalAlpha = p.life * 0.95; ctx.shadowColor = col; ctx.shadowBlur = 3;
          ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }
        if (p.life <= 0) P.splice(i, 1);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
      canvas.remove();
    };
  }, []);

  const burst = useCallback((x: number, y: number) => {
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const n = Math.floor(rand(10, 15));
    for (let i = 0; i < n; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const angle = rand(-0.3, 0.3);
      const spd = rand(5, 14);
      particles.current.push({ x, y, vx: Math.cos(angle) * spd * side, vy: Math.sin(angle) * spd - rand(0.5, 2), life: 1, decay: rand(0.03, 0.06), r: rand(0.7, 1.6), grav: rand(0.05, 0.11), drag: rand(0.97, 0.995), trail: [], tlen: Math.floor(rand(12, 22)), type: "flat" });
    }
    for (let j = 0; j < 3; j++) {
      particles.current.push({ x: x + rand(-12, 12), y: y + rand(-8, 8), vx: rand(-0.6, 0.6), vy: rand(-0.8, 0.4), life: 1, decay: rand(0.022, 0.038), r: 0.4, grav: 0.002, drag: 0.999, trail: [], tlen: 2, type: "depth", zspd: rand(1.8, 3.2) });
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    burst(e.clientX, e.clientY);
    onClick?.(e);
  }, [burst, onClick]);

  return <button {...props} onClick={handleClick}>{children}</button>;
}

"use client";
import { useMemo } from "react";

export default function PriceSparkline({ points, height = 40, width = 100 }: { points: number[]; height?: number; width?: number }) {
  const { path, area, up } = useMemo(() => {
    if (points.length < 2) return { path: "", area: "", up: true };
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || max || 1;
    const x = (i: number) => (i / (points.length - 1)) * width;
    const y = (p: number) => height - 2 - ((p - min) / span) * (height - 4);
    const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
    const area = `${path} L${width},${height} L0,${height} Z`;
    const up = points[points.length - 1] >= points[0];
    return { path, area, up };
  }, [points, width, height]);

  if (points.length < 2) return <div style={{width,height,background:"var(--ae-night)",borderRadius:6}} />;

  const stroke = up ? "var(--clr-success)" : "var(--clr-danger)";
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{width,height}} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up?"#4ade80":"#f87171"} stopOpacity="0.3" />
          <stop offset="100%" stopColor={up?"#4ade80":"#f87171"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${up})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

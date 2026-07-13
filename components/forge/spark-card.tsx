"use client";

import { ReactNode } from "react";

/**
 * Filament's signature card: a breathing glow with a spark travelling its
 * border. The spark is a conic gradient rotated with `transform` (GPU
 * composited) and clipped by the card's overflow — so only the rim lights up.
 * Works on every browser including Android Chrome.
 *
 * `background` must be passed via `innerStyle` so the masking ::after picks
 * it up correctly.
 */
export default function SparkCard({
  children,
  className = "",
  style,
  duration = 4,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
}) {
  return (
    <div className={`spark-card ${className}`} style={style}>
      <span className="spark-dot" style={{ animationDuration: `${duration}s` }} aria-hidden />
      <div className="spark-inner">{children}</div>
    </div>
  );
}

"use client";

import { ReactNode } from "react";

/**
 * Filament's signature card: breathes (glow pulses) and has a bright spark
 * orbiting its border. The spark uses CSS offset-path with a rounded-rect
 * ray shape, animated with a plain @keyframes on offset-distance — supported
 * in all current browsers, no @property or SMIL calc needed.
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
      {children}
    </div>
  );
}

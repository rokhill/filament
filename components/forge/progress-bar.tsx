"use client";

/**
 * Heat-coded progress bar. Glow intensity encodes graduation proximity:
 * a coin at 8% smolders, a coin at 85% is white-hot.
 */
export default function ProgressBar({ bps, tall = false }: { bps: number; tall?: boolean }) {
  const pct = Math.min(100, bps / 100);
  const heat = pct / 100; // 0..1
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: tall ? 10 : 6, background: "var(--ae-veil)" }}
    >
      <div
        className={pct > 0 ? "h-full rounded-full transition-all forge-shimmer forge-fil-bar" : "h-full"}
        style={{
          width: `${pct}%`,
          background:
            "linear-gradient(90deg, var(--ae-aurum-deep), var(--ae-aurum), var(--ae-aurum-bright))",
          boxShadow: `0 0 ${4 + heat * 14}px ${heat * 3}px rgba(245, 214, 128, ${0.15 + heat * 0.45})`,
        }}
      />
    </div>
  );
}

/** Card glow scaled to curve heat — used by coin cards. */
export function heatStyle(bps: number, graduated: boolean): React.CSSProperties {
  if (graduated)
    return {
      border: "1px solid rgba(74,222,128,.35)",
      boxShadow: "0 0 18px rgba(74,222,128,.12)",
    };
  const heat = Math.min(1, bps / 10000);
  return {
    border: `1px solid rgba(227,179,65,${0.14 + heat * 0.6})`,
    boxShadow: heat > 0.02 ? `0 0 ${6 + heat * 26}px rgba(227,179,65,${heat * 0.35})` : undefined,
  };
}

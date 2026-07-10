"use client";

export default function ProgressBar({ bps, tall = false }: { bps: number; tall?: boolean }) {
  const pct = Math.min(100, bps / 100);
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: tall ? 10 : 6, background: "var(--ae-veil)" }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background:
            "linear-gradient(90deg, var(--ae-aurum-deep), var(--ae-aurum), var(--ae-aurum-bright))",
          boxShadow: pct > 60 ? "0 0 10px rgba(227,179,65,.5)" : undefined,
        }}
      />
    </div>
  );
}

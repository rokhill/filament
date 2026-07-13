"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useMarkets, { MarketStats, Venue, ForgeMarket, fmtUsd } from "@/hooks/useMarkets";
import { fmtLcai } from "@/hooks/useForge";
import SparkCard from "@/components/forge/spark-card";

/* ------------------------------------------------------------------ */
/*  Chart — gold, glowing, touch + mouse interactive                   */
/* ------------------------------------------------------------------ */

function PriceChart({ data }: { data: [number, number][] }) {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const points = useMemo(() => data.map((d) => d[1]), [data]);
  const times = useMemo(() => data.map((d) => d[0]), [data]);

  if (points.length < 2) {
    return (
      <div className="f-card f-card--inset h-56 flex items-center justify-center f-meta">
        Loading price history…
      </div>
    );
  }

  const W = 800, H = 220;
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min || max || 1;
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (p: number) => H - 18 - ((p - min) / span) * (H - 36);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const area = `${path} L${W},${H} L0,${H} Z`;

  const setFromClientX = (clientX: number, el: SVGSVGElement) => {
    const rect = el.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * W;
    const i = Math.max(0, Math.min(points.length - 1, Math.round((px / W) * (points.length - 1))));
    setHover({ i, x: x(i), y: y(points[i]) });
  };

  const hp = hover ? points[hover.i] : null;
  const ht = hover ? new Date(times[hover.i]) : null;

  return (
    <div className="f-card f-card--inset p-3 relative">
      {hover && hp !== null && ht && (
        <div className="absolute top-3 left-3 z-10 rounded-lg px-3 py-1.5 pointer-events-none"
          style={{ background: "var(--fs-1)", border: "1px solid var(--fs-line-strong)" }}>
          <span className="f-num text-sm" style={{ color: "var(--ft-gold)" }}>
            ${hp < 0.01 ? hp.toPrecision(3) : hp.toFixed(5)}
          </span>
          <span className="f-meta ml-2">
            {ht.toLocaleDateString(undefined, { month: "short", day: "numeric" })}{" "}
            {ht.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full cursor-crosshair" preserveAspectRatio="none"
        style={{ height: 220, touchAction: "pan-y" }}
        onMouseMove={(e) => setFromClientX(e.clientX, e.currentTarget)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => e.touches[0] && setFromClientX(e.touches[0].clientX, e.currentTarget)}
        onTouchMove={(e) => e.touches[0] && setFromClientX(e.touches[0].clientX, e.currentTarget)}
        onTouchEnd={() => setHover(null)}>
        <defs>
          <linearGradient id="mktArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e3b341" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#e3b341" stopOpacity="0" />
          </linearGradient>
          <filter id="mktGlow" x="-5%" y="-25%" width="110%" height="150%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={area} fill="url(#mktArea)" />
        <path d={path} fill="none" stroke="#f5d680" strokeWidth="2" strokeLinejoin="round" filter="url(#mktGlow)" />
        {hover && (
          <>
            <line x1={hover.x} y1="0" x2={hover.x} y2={H} stroke="#e3b341" strokeWidth="1" strokeOpacity="0.45" strokeDasharray="3 3" />
            <circle cx={hover.x} cy={hover.y} r="4.5" fill="#fff6da" stroke="#f5d680" strokeWidth="2" filter="url(#mktGlow)" />
          </>
        )}
      </svg>
      <p className="f-meta text-center mt-1 sm:hidden">Drag across the chart to read prices</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MarketsPage() {
  const { fetchStats, fetchVenues, fetchChart, fetchForgeMarket } = useMarkets();
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [chart, setChart] = useState<[number, number][]>([]);
  const [forge, setForge] = useState<ForgeMarket | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [s, v, f] = await Promise.all([fetchStats(), fetchVenues(), fetchForgeMarket()]);
      if (!alive) return;
      setStats(s); setVenues(v); setForge(f); setLoading(false);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    let alive = true;
    fetchChart(days).then((c) => { if (alive) setChart(c); });
    return () => { alive = false; };
    // eslint-disable-next-line
  }, [days]);

  const up = (stats?.change24h ?? 0) >= 0;

  const Stat = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <div className="f-card p-4">
      <div className="f-label mb-2">{label}</div>
      <div className="f-num text-lg" style={color ? { color } : undefined}>{value}</div>
    </div>
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 min-h-[70vh]">
      {/* Hero */}
      <div className="f-eyebrow mb-2">LightChain AI · Chain 9200</div>
      <h1 className="f-display text-4xl sm:text-5xl">The LCAI Market</h1>
      <p className="f-body text-sm mt-2 max-w-md">
        Every venue, every curve, one page. Live market data for LightChain AI and the Forge.
      </p>

      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
        <Stat label="LCAI Price" value={stats ? fmtUsd(stats.priceUsd) : "—"} />
        <Stat label="24h Change" value={stats ? `${up ? "+" : ""}${stats.change24h.toFixed(2)}%` : "—"}
          color={up ? "var(--ft-up)" : "var(--ft-down)"} />
        <Stat label="24h Volume" value={stats ? fmtUsd(stats.volume24h, { compact: true }) : "—"} />
        <Stat label="Market Cap" value={stats && stats.marketCap > 0 ? fmtUsd(stats.marketCap, { compact: true }) : "—"} />
      </div>

      {/* Chart */}
      <div className="f-section"><h2>LCAI / USD</h2></div>
      <div className="flex justify-end gap-1.5 mb-3 -mt-2">
        {[1, 7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`f-pill ${days === d ? "f-pill--on" : ""}`}>
            {d === 1 ? "24H" : `${d}D`}
          </button>
        ))}
      </div>
      <PriceChart data={chart} />

      {/* Venues */}
      <div className="f-section"><h2>Where LCAI Trades</h2></div>
      {loading ? (
        <div className="f-card py-10 text-center f-meta">Loading venues…</div>
      ) : venues.length === 0 ? (
        <div className="f-card py-10 text-center f-meta">No market data available right now.</div>
      ) : (
        <div className="space-y-2">
          {venues.map((v, i) => (
            <div key={i} className="f-card p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                {v.url ? (
                  <a href={v.url} target="_blank" rel="noopener noreferrer"
                    className="font-semibold hover:underline" style={{ color: "var(--ft-hi)" }}>
                    {v.name}
                  </a>
                ) : (
                  <span className="font-semibold" style={{ color: "var(--ft-hi)" }}>{v.name}</span>
                )}
                <span className="f-mono f-trunc mt-0.5">{v.pair}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="f-num text-sm">{fmtUsd(v.priceUsd)}</div>
                <div className="f-meta">{fmtUsd(v.volumeUsd, { compact: true })} · 24h</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Forge */}
      <div className="f-section"><h2>The Forge</h2></div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Coins Forged" value={forge ? String(forge.coinCount) : "—"} />
        <Stat label="LCAI on Curves" value={forge ? fmtLcai(forge.totalRaised, 0) : "—"} color="var(--ft-gold)" />
        <Stat label="Graduated" value={forge ? String(forge.graduated) : "—"} />
      </div>

      {forge?.topCoin && (
        <SparkCard className="mb-4" style={{ background: "var(--fs-1)" }}>
          <Link href={`/forge/${forge.topCoin.address}`} className="block p-5">
            <div className="f-eyebrow mb-2">Closest to Graduation</div>
            <div className="flex items-center justify-between gap-3">
              <span className="f-display text-lg truncate">
                {forge.topCoin.name} <span className="f-meta">${forge.topCoin.symbol}</span>
              </span>
              <span className="f-num text-lg flex-shrink-0" style={{ color: "var(--ft-gold)" }}>
                {(forge.topCoin.progressBps / 100).toFixed(1)}%
              </span>
            </div>
          </Link>
        </SparkCard>
      )}

      {forge && forge.recent.length > 0 && (
        <div className="space-y-2">
          {forge.recent.map((c) => (
            <Link key={c.address} href={`/forge/${c.address}`}
              className="f-card f-card--link flex items-center justify-between gap-3 px-4 py-3">
              <span className="truncate" style={{ color: "var(--ft-hi)" }}>
                {c.name} <span className="f-meta">${c.symbol}</span>
              </span>
              <span className="f-meta flex-shrink-0">{(c.progressBps / 100).toFixed(1)}% to graduation</span>
            </Link>
          ))}
        </div>
      )}

      {forge && forge.coinCount === 0 && (
        <div className="f-card py-10 text-center f-meta">
          No coins forged yet.{" "}
          <Link href="/forge" className="underline" style={{ color: "var(--ft-gold)" }}>Launch the first →</Link>
        </div>
      )}

      <p className="f-meta text-center mt-12">
        Market data from CoinGecko · Forge data live from LightChain AI mainnet
      </p>
    </main>
  );
}

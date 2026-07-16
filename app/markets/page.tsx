"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useMarkets, { MarketStats, Venue, ForgeMarket, fmtUsd } from "@/hooks/useMarkets";
import { fmtLcai } from "@/hooks/useForge";

// BitMart candle: [timestamp_s, open, high, low, close, volume, quoteVolume]
type Candle = [number, string, string, string, string, string, string];

async function fetchBitMartCandles(step: number, limit: number): Promise<Candle[]> {
  try {
    const r = await fetch(
      `https://api-cloud.bitmart.com/spot/quotation/v3/klines?symbol=LCAI_USDT&step=${step}&limit=${limit}`,
      { cache: "no-store" }
    );
    const j = await r.json();
    if (j.code !== 1000 || !j.data) return [];
    // BitMart returns oldest-first for klines — use as-is
    return j.data;
  } catch { return []; }
}

/* ------------------------------------------------------------------ */
/*  Candle chart — gold SVG, interactive, line/candle toggle           */
/* ------------------------------------------------------------------ */

function CandleChart({ candles, mode }: { candles: Candle[]; mode: "line" | "candle" }) {
  const [hover, setHover] = useState<{ i: number; x: number } | null>(null);

  if (candles.length < 2) {
    return (
      <div className="f-card f-card--inset h-56 flex items-center justify-center f-meta">
        Loading chart…
      </div>
    );
  }

  const W = 800, H = 220, PAD = 12;
  const closes = candles.map(c => parseFloat(c[4]));
  const highs  = candles.map(c => parseFloat(c[2]));
  const lows   = candles.map(c => parseFloat(c[3]));
  const opens  = candles.map(c => parseFloat(c[1]));
  const allVals = mode === "candle" ? [...highs, ...lows] : closes;
  const min = Math.min(...allVals), max = Math.max(...allVals);
  const span = max - min || max || 1;
  const n = candles.length;
  const x = (i: number) => PAD + (i / (n - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);

  const linePath = closes.map((c, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(c).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${W - PAD},${H} L${PAD},${H} Z`;

  const hp = hover ? closes[hover.i] : null;
  const ht = hover ? new Date(candles[hover.i][0] * 1000) : null;

  const setFromClientX = (clientX: number, el: SVGSVGElement) => {
    const rect = el.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * W;
    const i = Math.max(0, Math.min(n - 1, Math.round(((px - PAD) / (W - PAD * 2)) * (n - 1))));
    setHover({ i, x: x(i) });
  };

  const candleW = Math.max(2, Math.min(10, (W - PAD * 2) / n - 1));

  return (
    <div className="f-card f-card--inset p-3 relative">
      {hover && hp !== null && ht && (
        <div className="absolute top-3 left-3 z-10 rounded-lg px-3 py-1.5 pointer-events-none"
          style={{ background: "var(--fs-1)", border: "1px solid var(--fs-line-strong)" }}>
          <span className="f-num text-sm" style={{ color: "var(--ft-gold)" }}>
            ${hp < 0.001 ? hp.toPrecision(4) : hp.toFixed(5)}
          </span>
          <span className="f-meta ml-2">
            {ht.toLocaleDateString(undefined, { month: "short", day: "numeric" })}{" "}
            {ht.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full cursor-crosshair" preserveAspectRatio="none"
        style={{ height: 220, touchAction: "pan-y" }}
        onMouseMove={e => setFromClientX(e.clientX, e.currentTarget)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={e => e.touches[0] && setFromClientX(e.touches[0].clientX, e.currentTarget)}
        onTouchMove={e => e.touches[0] && setFromClientX(e.touches[0].clientX, e.currentTarget)}
        onTouchEnd={() => setHover(null)}>
        <defs>
          <linearGradient id="mktArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e3b341" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#e3b341" stopOpacity="0" />
          </linearGradient>
          <filter id="mktGlow" x="-5%" y="-25%" width="110%" height="150%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {mode === "line" ? (
          <>
            <path d={areaPath} fill="url(#mktArea)" />
            <path d={linePath} fill="none" stroke="#f5d680" strokeWidth="2" strokeLinejoin="round" filter="url(#mktGlow)" />
          </>
        ) : (
          candles.map((c, i) => {
            const o = parseFloat(c[1]), h2 = parseFloat(c[2]);
            const l2 = parseFloat(c[3]), cl = parseFloat(c[4]);
            const up = cl >= o;
            const col = up ? "#5ee6a8" : "#ff7a7a";
            const cx = x(i);
            return (
              <g key={i}>
                <line x1={cx} y1={y(h2)} x2={cx} y2={y(l2)} stroke={col} strokeWidth="1" strokeOpacity="0.7" />
                <rect
                  x={cx - candleW / 2} y={Math.min(y(o), y(cl))}
                  width={candleW} height={Math.max(1, Math.abs(y(o) - y(cl)))}
                  fill={col} fillOpacity="0.85"
                />
              </g>
            );
          })
        )}

        {hover && (
          <>
            <line x1={hover.x} y1="0" x2={hover.x} y2={H} stroke="#e3b341" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />
            {mode === "line" && (
              <circle cx={hover.x} cy={y(closes[hover.i])} r="4.5" fill="#fff6da" stroke="#f5d680" strokeWidth="2" filter="url(#mktGlow)" />
            )}
          </>
        )}
      </svg>
      <p className="f-meta text-center mt-1 sm:hidden">Drag to read prices</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MarketsPage() {
  const { fetchStats, fetchVenues, fetchForgeMarket } = useMarkets();
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [forge, setForge] = useState<ForgeMarket | null>(null);
  const [chartMode, setChartMode] = useState<"line" | "candle">("candle");
  const [timeframe, setTimeframe] = useState<{ step: number; limit: number; label: string }>(
    { step: 60, limit: 200, label: "1H" }
  );
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
    fetchBitMartCandles(timeframe.step, timeframe.limit).then(c => { if (alive) setCandles(c); });
    return () => { alive = false; };
    // eslint-disable-next-line
  }, [timeframe]);

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
      <div className="f-section"><h2>LCAI / USDT · BitMart</h2></div>
      <div className="flex justify-between items-center mb-3 -mt-2 gap-2 flex-wrap">
        <div className="flex gap-1.5">
          {([{ step: 15, limit: 200, label: "15M" }, { step: 60, limit: 200, label: "1H" }, { step: 240, limit: 200, label: "4H" }, { step: 1440, limit: 90, label: "1D" }] as const).map((tf) => (
            <button key={tf.label} onClick={() => setTimeframe(tf)}
              className={`f-pill ${timeframe.label === tf.label ? "f-pill--on" : ""}`}>
              {tf.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setChartMode("candle")} className={`f-pill ${chartMode === "candle" ? "f-pill--on" : ""}`}>Candles</button>
          <button onClick={() => setChartMode("line")} className={`f-pill ${chartMode === "line" ? "f-pill--on" : ""}`}>Line</button>
        </div>
      </div>
      <CandleChart candles={candles} mode={chartMode} />

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
        <Stat label="LCAI Raised" value={forge ? fmtLcai(forge.totalRaised, 0) : "—"} color="var(--ft-gold)" />
        <Stat label="Graduated" value={forge ? String(forge.graduated) : "—"} />
      </div>

      {forge?.topCoin && (
        <div className="f-featured mb-4">
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
        </div>
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

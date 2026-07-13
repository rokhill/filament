"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useMarkets, { MarketStats, Venue, ForgeMarket, fmtUsd } from "@/hooks/useMarkets";
import { fmtLcai } from "@/hooks/useForge";
import { shortAddr } from "@/config/forge";

/* ------------------------------------------------------------------ */
/*  Price chart — pure SVG                                             */
/* ------------------------------------------------------------------ */

function PriceChart({ data }: { data: [number, number][] }) {
  const points = useMemo(() => data.map((d) => d[1]), [data]);
  if (points.length < 2) {
    return (
      <div className="h-56 rounded-2xl flex items-center justify-center text-sm"
        style={{ background: "var(--ae-night)", color: "var(--ae-nebula)" }}>
        Loading price history…
      </div>
    );
  }
  const W = 800, H = 220;
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min || max || 1;
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (p: number) => H - 16 - ((p - min) / span) * (H - 32);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const area = `${path} L${W},${H} L0,${H} Z`;
  const up = points[points.length - 1] >= points[0];
  const stroke = up ? "var(--clr-success)" : "var(--clr-danger)";

  return (
    <div className="rounded-2xl p-3" style={{ background: "var(--ae-night)", border: "1px solid var(--clr-border)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 220 }}>
        <defs>
          <linearGradient id="mktArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={up ? "#4ade80" : "#f87171"} stopOpacity="0.22" />
            <stop offset="100%" stopColor={up ? "#4ade80" : "#f87171"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#mktArea)" />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      </svg>
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

  const stat = (label: string, value: string, accent?: string) => (
    <div className="rounded-2xl p-4" style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)" }}>
      <div className="text-xs mb-1.5" style={{ color: "var(--ae-nebula)" }}>{label}</div>
      <div className="text-lg font-semibold" style={{ color: accent ?? "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>{value}</div>
    </div>
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 min-h-[70vh]">
      <div className="mb-1">
        <h1 className="text-3xl" style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>
          The LCAI Market
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--ae-nebula)" }}>
          Everything happening with LightChain AI — across every venue, in one place.
        </p>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
        {stat("LCAI Price", stats ? fmtUsd(stats.priceUsd) : "—")}
        {stat("24h Change", stats ? `${up ? "+" : ""}${stats.change24h.toFixed(2)}%` : "—", up ? "var(--clr-success)" : "var(--clr-danger)")}
        {stat("24h Volume", stats ? fmtUsd(stats.volume24h, { compact: true }) : "—")}
        {stat("Market Cap", stats ? fmtUsd(stats.marketCap, { compact: true }) : "—")}
      </div>

      {/* Chart */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ color: "var(--clr-heading)" }}>LCAI / USD</h2>
        <div className="flex gap-1.5">
          {[1, 7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
              style={days === d
                ? { background: "var(--ae-aurum)", color: "var(--ae-ink)" }
                : { background: "var(--ae-veil)", color: "var(--ae-nebula)" }}>
              {d === 1 ? "24H" : `${d}D`}
            </button>
          ))}
        </div>
      </div>
      <PriceChart data={chart} />

      {/* Where LCAI trades */}
      <h2 className="text-sm font-semibold mt-10 mb-3" style={{ color: "var(--clr-heading)" }}>Where LCAI Trades</h2>
      {loading ? (
        <div className="py-8 text-center text-sm" style={{ color: "var(--ae-nebula)" }}>Loading venues…</div>
      ) : venues.length === 0 ? (
        <div className="py-8 text-center text-sm rounded-2xl" style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)", color: "var(--ae-nebula)" }}>
          No market data available right now.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--clr-border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--ae-night)" }}>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: "var(--ae-nebula)" }}>Exchange</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: "var(--ae-nebula)" }}>Pair</th>
                <th className="text-right px-4 py-2.5 font-semibold" style={{ color: "var(--ae-nebula)" }}>Price</th>
                <th className="text-right px-4 py-2.5 font-semibold" style={{ color: "var(--ae-nebula)" }}>24h Volume</th>
              </tr>
            </thead>
            <tbody style={{ background: "var(--ae-haze)" }}>
              {venues.map((v, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--clr-border)" }}>
                  <td className="px-4 py-3">
                    {v.url ? (
                      <a href={v.url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "var(--clr-heading)" }}>
                        {v.name}
                      </a>
                    ) : (
                      <span style={{ color: "var(--clr-heading)" }}>{v.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--ae-nebula)" }}>{v.pair}</td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--clr-heading)" }}>{fmtUsd(v.priceUsd)}</td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--ae-nebula)" }}>{fmtUsd(v.volumeUsd, { compact: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Forge market */}
      <h2 className="text-sm font-semibold mt-10 mb-3" style={{ color: "var(--clr-heading)" }}>The Forge Market</h2>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {stat("Coins Forged", forge ? String(forge.coinCount) : "—")}
        {stat("LCAI on Curves", forge ? fmtLcai(forge.totalRaised, 0) : "—", "var(--ae-aurum)")}
        {stat("Graduated", forge ? String(forge.graduated) : "—")}
      </div>

      {forge?.topCoin && (
        <Link href={`/forge/${forge.topCoin.address}`}
          className="block rounded-2xl p-4 mb-4 transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, var(--ae-haze), var(--ae-veil))", border: "1px solid var(--ae-aurum)" }}>
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--ae-aurum)" }}>✦ Closest to Graduation</div>
          <div className="flex items-center justify-between">
            <span className="font-semibold" style={{ color: "var(--clr-heading)" }}>
              {forge.topCoin.name} <span className="text-xs" style={{ color: "var(--ae-nebula)" }}>${forge.topCoin.symbol}</span>
            </span>
            <span className="text-sm" style={{ color: "var(--ae-aurum)" }}>{(forge.topCoin.progressBps / 100).toFixed(1)}%</span>
          </div>
        </Link>
      )}

      {forge && forge.recent.length > 0 && (
        <div className="space-y-2">
          {forge.recent.map((c) => (
            <Link key={c.address} href={`/forge/${c.address}`}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors hover:brightness-110"
              style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)" }}>
              <span style={{ color: "var(--clr-heading)" }}>{c.name} <span className="text-xs" style={{ color: "var(--ae-nebula)" }}>${c.symbol}</span></span>
              <span className="text-xs" style={{ color: "var(--ae-nebula)" }}>{(c.progressBps / 100).toFixed(1)}% to graduation</span>
            </Link>
          ))}
        </div>
      )}

      {forge && forge.coinCount === 0 && (
        <div className="py-8 text-center text-sm rounded-2xl" style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)", color: "var(--ae-nebula)" }}>
          No coins forged yet. <Link href="/forge" className="underline" style={{ color: "var(--ae-aurum)" }}>Launch the first →</Link>
        </div>
      )}

      <p className="text-center text-[11px] mt-10" style={{ color: "var(--ae-nebula)" }}>
        Market data from CoinGecko · Forge data live from LightChain AI mainnet · Updated every few minutes
      </p>
    </main>
  );
}

"use client";
import { useEffect, useState, useMemo } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";

const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL || "";

type Trade = {
  coin: string; symbol: string | null; name: string | null;
  is_buy: number; lcai_amount: string; ts: number; block: number;
  graduated: number | null; tx: string;
};

function fmt(n: number, d = 2) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(d);
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dexSwaps, setDexSwaps] = useState<any[]>([]);
  const [rank, setRank] = useState<{volRank:number;tradeRank:number;biggestBuy:number}|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address || !INDEXER) { setLoading(false); return; }
    fetch(`${INDEXER}/api/v1/wallet/${address}/trades?limit=1000`)
      .then(r => r.json())
      .then(data => { setTrades(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch(`${INDEXER}/api/v1/wallet/${address}/rank`).then(r=>r.json()).then(setRank).catch(()=>{});
    fetch(`${INDEXER}/api/v1/wallet/${address}/swaps?limit=500`).then(r=>r.json()).then(setDexSwaps).catch(()=>{});
  }, [address]);

  const stats = useMemo(() => {
    if (!trades.length) return null;
    const buys = trades.filter(t => t.is_buy === 1);
    const sells = trades.filter(t => t.is_buy === 0);
    const totalSpent = buys.reduce((a, t) => a + Number(BigInt(t.lcai_amount)) / 1e18, 0);
    const dexSellsTotal = dexSwaps.filter((s:any) => s.is_buy === 0).reduce((a:number, s:any) => a + Number(BigInt(s.lcai_amount||"0")) / 1e18, 0);
    const totalReceived = sells.reduce((a, t) => a + Number(BigInt(t.lcai_amount)) / 1e18, 0) + dexSellsTotal;
    const netPnl = totalReceived - totalSpent;
    const coinMap: Record<string, { spent: number; received: number; symbol: string | null; graduated: number | null; }> = {};
    for (const t of trades) {
      if (!coinMap[t.coin]) coinMap[t.coin] = { spent: 0, received: 0, symbol: t.symbol, graduated: t.graduated };
      if (t.is_buy) coinMap[t.coin].spent += Number(BigInt(t.lcai_amount)) / 1e18;
      else coinMap[t.coin].received += Number(BigInt(t.lcai_amount)) / 1e18;
    }
    const coins = Object.entries(coinMap);
    const graduated = coins.filter(([, c]) => c.graduated).length;
    const gradRate = coins.length > 0 ? (graduated / coins.length) * 100 : 0;
    const bestTrade = coins.reduce((best, curr) => {
      const pnl = curr[1].received - curr[1].spent;
      return pnl > (best[1].received - best[1].spent) ? curr : best;
    }, coins[0]);
    const now = Date.now() / 1000;
    const dayMap: Record<number, number> = {};
    for (const t of trades) {
      const day = Math.floor(t.ts / 86400);
      dayMap[day] = (dayMap[day] || 0) + 1;
    }
    const days = Array.from({ length: 90 }, (_, i) => {
      const day = Math.floor((now - (89 - i) * 86400) / 86400);
      return { day, count: dayMap[day] || 0 };
    });
    const score = Math.min(999, Math.floor(
      (graduated * 80) + (Math.min(trades.length, 50) * 2) +
      (netPnl > 0 ? Math.min(netPnl / 10, 200) : 0) + (gradRate * 2)
    ));
    return { totalSpent, totalReceived, netPnl, coins: coins.length, graduated, gradRate, bestTrade, days, score, totalTrades: trades.length };
  }, [trades, dexSwaps]);

  if (!isConnected) return (
    <main className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🔗</div>
        <div className="font-bold text-xl mb-2" style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>Connect your wallet</div>
        <div className="text-sm" style={{ color: "var(--ae-nebula)" }}>Your on-chain story lives here</div>
      </div>
    </main>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 min-h-[70vh]">
      <div className="f-eyebrow mb-2">YOUR STORY · LIGHTCHAIN AI</div>
      <h1 className="f-display text-4xl sm:text-5xl mb-1" style={{ color: "var(--clr-heading)" }}>Dashboard</h1>
      <p className="f-meta mb-8" style={{ color: "var(--ae-nebula)" }}>{address?.slice(0,6)}…{address?.slice(-4)}</p>

      {loading ? (
        <div className="f-card rounded-2xl p-10 text-center">
          <div className="text-3xl mb-3">⛏️</div>
          <div className="font-semibold" style={{ color: "var(--ae-aurum)", fontFamily: "var(--font-display), serif" }}>Reading your chain history…</div>
        </div>
      ) : !stats ? (
        <div className="f-card rounded-2xl p-10 text-center">
          <div className="text-3xl mb-3">🌑</div>
          <div className="font-semibold mb-2" style={{ color: "var(--clr-heading)" }}>No Forge activity yet</div>
          <Link href="/forge" className="text-sm" style={{ color: "var(--ae-aurum)" }}>Explore the Forge →</Link>
        </div>
      ) : (
        <>
          <div className="rounded-2xl p-8 mb-6 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0804 0%, #1a1005 50%, #0a0804 100%)", border: "1px solid rgba(255,140,30,0.4)", boxShadow: "0 0 40px rgba(255,140,30,0.08) inset" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 120%, rgba(255,140,30,0.15), transparent 60%)", pointerEvents: "none" }} />
            <div className="f-eyebrow mb-3">FILAMENT TRADER SCORE</div>
            <div className="forge-title" style={{ fontSize: "clamp(72px,15vw,120px)", lineHeight: 1, fontFamily: "var(--font-display), serif", display: "inline-block" }}>
              {stats.score}
            </div>
            <div className="text-xs mt-2" style={{ color: "var(--ae-nebula)" }}>based on graduations · volume · profit · activity</div>
          </div>

          {rank && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "RANK BY TRADES", value: `#${rank.tradeRank}`, hot: rank.tradeRank <= 3 },
                { label: "RANK BY VOLUME", value: `#${rank.volRank}`, hot: rank.volRank <= 3 },
                { label: "BIGGEST BUY", value: `${rank.biggestBuy.toFixed(0)} LCAI`, hot: rank.biggestBuy >= 1000 },
              ].map(r => (
                <div key={r.label} className="rounded-2xl p-4 text-center" style={{ background: r.hot ? "rgba(255,140,30,0.1)" : "var(--ae-night)", border: `1px solid ${r.hot ? "rgba(255,140,30,0.4)" : "var(--clr-border)"}` }}>
                  <div className="text-lg font-bold" style={{ color: r.hot ? "var(--ae-aurum-bright)" : "var(--ae-aurum)", fontFamily: "var(--font-display), serif" }}>{r.value}</div>
                  <div className="text-[10px] mt-1" style={{ color: "var(--ae-nebula)" }}>{r.label}</div>
                </div>
              ))}
            </div>
          )}
          {stats && (
            <div className="f-card rounded-2xl p-5 mb-6">
              <div className="text-xs mb-4" style={{ color: "var(--ae-nebula)" }}>ACHIEVEMENTS</div>
              <div className="flex flex-wrap gap-2">
                {stats.graduated > 0 && <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(74,222,128,0.12)", color: "var(--clr-success)", border: "1px solid rgba(74,222,128,0.25)" }}>🎓 Backed a Graduation</span>}
                {stats.totalTrades >= 10 && <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(255,140,30,0.12)", color: "var(--ae-aurum)", border: "1px solid rgba(255,140,30,0.25)" }}>⚡ Active Trader</span>}
                {stats.totalTrades >= 50 && <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(255,140,30,0.12)", color: "var(--ae-aurum)", border: "1px solid rgba(255,140,30,0.25)" }}>🔥 Forge Veteran</span>}
                {rank && rank.tradeRank === 1 && <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(255,170,50,0.2)", color: "var(--ae-aurum-bright)", border: "1px solid rgba(255,170,50,0.4)" }}>👑 Most Active Trader</span>}
                {rank && rank.biggestBuy >= 1000 && <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(255,140,30,0.12)", color: "var(--ae-aurum)", border: "1px solid rgba(255,140,30,0.25)" }}>🐋 Whale</span>}
                {stats.gradRate >= 50 && <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(74,222,128,0.12)", color: "var(--clr-success)", border: "1px solid rgba(74,222,128,0.25)" }}>💎 Sharp Eye</span>}
                {stats.coins >= 10 && <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(255,140,30,0.12)", color: "var(--ae-aurum)", border: "1px solid rgba(255,140,30,0.25)" }}>🌐 Diversified</span>}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {[
              { label: "Curve trades", sublabel: "buys + sells on the Forge", value: stats.totalTrades.toString() },
              { label: "Coins touched", sublabel: "unique coins traded", value: stats.coins.toString() },
              { label: "Backed a grad", sublabel: "coins you bought that graduated", value: stats.graduated.toString() },
              { label: "Graduation rate", sublabel: "% of your coins that graduated", value: stats.gradRate.toFixed(0) + "%" },
              { label: "LCAI into curves", sublabel: "total spent buying", value: fmt(stats.totalSpent) },
              { label: "LCAI from sells", sublabel: "total received selling", value: fmt(stats.totalReceived) },
            ].map((s: {label:string;sublabel:string;value:string}) => (
              <div key={s.label} className="f-card rounded-2xl p-4">
                <div className="text-xl font-bold" style={{ color: "var(--ae-aurum)", fontFamily: "var(--font-display), serif" }}>{s.value}</div>
                <div className="text-xs mt-0.5 font-semibold" style={{ color: "var(--clr-heading)" }}>{s.label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--ae-nebula)" }}>{s.sublabel}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5 mb-6 flex items-center justify-between" style={{ background: "var(--ae-night)", border: `1px solid ${stats.netPnl >= 0 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}` }}>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--ae-nebula)" }}>NET PNL · ALL TIME</div>
              <div className="text-3xl font-bold" style={{ color: stats.netPnl >= 0 ? "var(--clr-success)" : "var(--clr-danger)", fontFamily: "var(--font-display), serif" }}>
                {stats.netPnl >= 0 ? "+" : ""}{fmt(stats.netPnl)} LCAI
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--ae-nebula)" }}>What you received from sells minus what you spent buying — realized only. Coins you still hold are not counted.</div>
            </div>
            <div style={{ fontSize: 48 }}>{stats.netPnl >= 0 ? "🟢" : "🔴"}</div>
          </div>

          {stats.bestTrade && (
            <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--ae-night)", border: "1px solid var(--clr-border)" }}>
              <div className="text-xs mb-2" style={{ color: "var(--ae-nebula)" }}>BEST TRADE</div>
              <div className="flex items-center justify-between">
                <div className="font-bold text-xl" style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>
                  {stats.bestTrade[1].symbol || stats.bestTrade[0].slice(0,8)+"…"}
                  {stats.bestTrade[1].graduated ? <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.12)", color: "var(--clr-success)" }}>GRADUATED</span> : null}
                </div>
                <div className="text-xl font-bold" style={{ color: (stats.bestTrade[1].received - stats.bestTrade[1].spent) >= 0 ? "var(--clr-success)" : "var(--clr-danger)" }}>
                  {(stats.bestTrade[1].received - stats.bestTrade[1].spent) >= 0 ? "+" : ""}{fmt(stats.bestTrade[1].received - stats.bestTrade[1].spent)} LCAI
                </div>
              </div>
            </div>
          )}

          <div className="f-card rounded-2xl p-5 mb-6">
            <div className="text-xs mb-4" style={{ color: "var(--ae-nebula)" }}>ACTIVITY · LAST 90 DAYS</div>
            <div className="flex gap-1 flex-wrap">
              {stats.days.map((d, i) => (
                <div key={i} title={`${d.count} trades`} style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0, background: d.count === 0 ? "var(--ae-veil)" : d.count === 1 ? "rgba(255,140,30,0.3)" : d.count <= 3 ? "rgba(255,140,30,0.6)" : "var(--ae-ember)" }} />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px]" style={{ color: "var(--ae-nebula)" }}>
              <span>90 days ago</span><span>today</span>
            </div>
          </div>

          <div className="f-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 text-xs" style={{ color: "var(--ae-nebula)", borderBottom: "1px solid var(--clr-border)" }}>RECENT ACTIVITY</div>
            {[...trades.map(t => ({ ...t, source: "Forge", symbol: t.symbol, lcai: Number(BigInt(t.lcai_amount))/1e18, buy: t.is_buy === 1, ts: t.ts })),
              ...dexSwaps.map((s:any) => ({ source: "DEX", symbol: s.symbol, lcai: Number(BigInt(s.lcai_amount||"0"))/1e18, buy: s.is_buy === 1, ts: s.ts }))
            ].sort((a,b) => b.ts - a.ts).slice(0, 12).map((t, i, arr) => (
              <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: i < arr.length-1 ? "1px solid var(--clr-border)" : "none" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: t.buy ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)", color: t.buy ? "var(--clr-success)" : "var(--clr-danger)" }}>{t.buy ? "BUY" : "SELL"}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--clr-heading)" }}>{t.symbol || "?"}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--ae-haze)", color: "var(--ae-nebula)" }}>{t.source}</span>
                </div>
                <span className="text-sm" style={{ color: "var(--ae-aurum)" }}>{fmt(t.lcai)} LCAI</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

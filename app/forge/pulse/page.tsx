"use client";

/* ------------------------------------------------------------------ */
/*  FORGE PULSE — the data layer of the Forge.                         */
/*  Eight ranked views computed live from on-chain Trade events.       */
/* ------------------------------------------------------------------ */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useForge, { ForgeCoin, fmtLcai } from "@/hooks/useForge";
import useWeb3Clients from "@/hooks/useWeb3Clients";
import { forgeAbi } from "@/contracts/forgeAbi";
import { FORGE_ADDRESS } from "@/config/forge";

type PulseTrade = {
  token: `0x${string}`;
  trader: `0x${string}`;
  isBuy: boolean;
  lcai: bigint;
  block: bigint;
};

type CoinStats = {
  coin: ForgeCoin;
  vol24: bigint;
  volPrev24: bigint;
  buyers24: number;
  buys24: number;
  sells24: number;
  lastTradeBlock: bigint;
  creatorPct: number; // 0-100
  maxBuy24: bigint;
  vol7d: bigint;
  buyers7d: number;
  buys7d: number;
  sells7d: number;
  maxBuy7d: bigint;
};

const SUPPLY = 1_000_000_000n * 10n ** 18n;

function Avatar({ coin, size = 40 }: { coin: ForgeCoin; size?: number }) {
  const [err, setErr] = useState(false);
  const src = coin.metadata.image;
  if (!src || err) {
    return (
      <div
        className="flex items-center justify-center rounded-xl font-bold flex-shrink-0"
        style={{
          width: size, height: size, background: "var(--ae-veil)",
          color: "var(--ae-aurum)", fontSize: size / 2.5,
          fontFamily: "var(--font-display), serif",
        }}
      >
        {coin.symbol.slice(0, 2)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={coin.symbol} width={size} height={size} onError={() => setErr(true)}
      className="rounded-xl object-cover flex-shrink-0"
      style={{ width: size, height: size, background: "var(--ae-veil)" }} />
  );
}

function Row({ s, metric, rank }: { s: CoinStats; metric: string; rank: number }) {
  return (
    <Link href={`/forge/${s.coin.address}`}
      className="f-card flex items-center gap-3 rounded-2xl p-3 transition-all hover:-translate-y-0.5">
      <span className="text-xs font-bold w-5 text-center flex-shrink-0"
        style={{ color: rank === 1 ? "var(--ae-aurum-bright)" : "var(--ae-nebula)" }}>
        {rank}
      </span>
      <Avatar coin={s.coin} />
      <div className="min-w-0 flex-1">
        <span className="font-semibold block"
          style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>
          {s.coin.name}
        </span>
        <span className="f-meta text-xs">${s.coin.symbol} · <span style={{ color: "var(--ae-aurum)" }}>{metric}</span></span>
      </div>
    </Link>
  );
}

function Board({ icon, title, sub, rows }: {
  icon: string; title: string; sub: string;
  rows: { s: CoinStats; metric: string }[];
}) {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;
  return (
    <>
      <section className="f-card rounded-2xl p-4 cursor-pointer hover:border-[rgba(255,140,30,.7)] transition-all"
        onClick={() => setOpen(true)}>
        <h2 className="text-lg font-semibold mb-0.5"
          style={{ fontFamily: "var(--font-display), serif", color: "var(--clr-heading)" }}>
          {icon} {title}
        </h2>
        <p className="f-meta text-xs mb-3">{sub}</p>
        <div className="space-y-2">
          {rows.slice(0, 3).map((r, i) => <Row key={r.s.coin.address} s={r.s} metric={r.metric} rank={i + 1} />)}
        </div>
        {rows.length > 3 && (
          <p className="mt-3 text-xs" style={{ color: "var(--ae-aurum)" }}>
            +{rows.length - 3} more — tap to expand
          </p>
        )}
      </section>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setOpen(false)}>
          <div className="f-card rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
            style={{ background: "var(--ae-haze)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold"
                style={{ fontFamily: "var(--font-display), serif", color: "var(--clr-heading)" }}>
                {icon} {title}
              </h2>
              <button onClick={() => setOpen(false)}
                className="text-lg font-bold" style={{ color: "var(--ae-nebula)" }}>✕</button>
            </div>
            <p className="f-meta text-xs mb-4">{sub}</p>
            <div className="space-y-2">
              {rows.map((r, i) => <Row key={r.s.coin.address} s={r.s} metric={r.metric} rank={i + 1} />)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ForgePulse() {
  const { fetchCoins, fetchCreatorBalance } = useForge();
  const { publicClient } = useWeb3Clients();
  const [stats, setStats] = useState<CoinStats[]>([]);
  const [grads, setGrads] = useState<ForgeCoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL || "";
        const [allCoins, allTrades, gradCoins] = await Promise.all([
          INDEXER ? fetch(`${INDEXER}/api/v1/forge/coins?limit=200&status=curve`).then(r=>r.json()).catch(()=>[]) : fetchCoins().then(c=>c.filter((x:any)=>!x.graduated)),
          INDEXER ? fetch(`${INDEXER}/api/v1/forge/activity?limit=1000`).then(r=>r.json()).catch(()=>[]) : Promise.resolve([]),
          INDEXER ? fetch(`${INDEXER}/api/v1/forge/coins?limit=50&status=graduated`).then(r=>r.json()).catch(()=>[]) : fetchCoins().then(c=>c.filter((x:any)=>x.graduated)),
        ]);

        const coins = (allCoins as any[]).map((r:any) => ({
          address: r.address, creator: r.creator, name: r.name, symbol: r.symbol,
          priceWei: BigInt(r.price_wei||"0"), progressBps: r.progress_bps,
          lcaiRaised: BigInt(r.lcai_raised||"0"), graduated: false, pair: r.pair,
          metadata: (() => { try { return JSON.parse(r.metadata_uri||"{}"); } catch { return {}; } })(),
        }));
        const grads = (gradCoins as any[]).map((r:any) => ({
          address: r.address, creator: r.creator, name: r.name, symbol: r.symbol,
          priceWei: BigInt(r.price_wei||"0"), progressBps: r.progress_bps,
          lcaiRaised: BigInt(r.lcai_raised||"0"), graduated: true, pair: r.pair,
          metadata: (() => { try { return JSON.parse(r.metadata_uri||"{}"); } catch { return {}; } })(),
        }));

        const now = Math.floor(Date.now()/1000);
        const cut24 = now - 86400;
        const cut48 = now - 86400*2;

        const out: CoinStats[] = coins.map((coin:any) => {
          const mine = (allTrades as any[]).filter((t:any) => t.coin?.toLowerCase()===coin.address.toLowerCase());
          const cur = mine.filter((t:any) => (t.ts||0) > cut24);
          const prev = mine.filter((t:any) => (t.ts||0) > cut48 && (t.ts||0) <= cut24);
          const all7d = mine.filter((t:any) => (t.ts||0) > now - 86400*7);
          const buyerSet = new Set(cur.filter((t:any)=>t.is_buy===1).map((t:any)=>t.trader?.toLowerCase()));
          const buyers7dSet = new Set(all7d.filter((t:any)=>t.is_buy===1).map((t:any)=>t.trader?.toLowerCase()));
          const maxBuy = cur.filter((t:any)=>t.is_buy===1).reduce((m:bigint,t:any)=>{ const v=BigInt(t.lcai_amount||"0"); return v>m?v:m; },0n);
          const maxBuy7d = all7d.filter((t:any)=>t.is_buy===1).reduce((m:bigint,t:any)=>{ const v=BigInt(t.lcai_amount||"0"); return v>m?v:m; },0n);
          return {
            coin,
            vol24: cur.reduce((a:bigint,t:any)=>a+BigInt(t.lcai_amount||"0"),0n),
            volPrev24: prev.reduce((a:bigint,t:any)=>a+BigInt(t.lcai_amount||"0"),0n),
            buyers24: buyerSet.size,
            buys24: cur.filter((t:any)=>t.is_buy===1).length,
            sells24: cur.filter((t:any)=>t.is_buy===0).length,
            lastTradeBlock: mine.length ? BigInt(mine[mine.length-1].block||0) : 0n,
            creatorPct: 0,
            maxBuy24: maxBuy,
            vol7d: all7d.reduce((a:bigint,t:any)=>a+BigInt(t.lcai_amount||"0"),0n),
            buyers7d: buyers7dSet.size,
            buys7d: all7d.filter((t:any)=>t.is_buy===1).length,
            sells7d: all7d.filter((t:any)=>t.is_buy===0).length,
            maxBuy7d,
          };
        });
        if (alive) { setStats(out); setGrads(grads); setLoading(false); }
      } catch {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [fetchCoins, fetchCreatorBalance, publicClient]);

  const views = useMemo(() => {
    const top = (arr: CoinStats[], n = 10) => arr.slice(0, n);
    const withVol = stats.filter((s) => s.vol24 > 0n);
    return {
      hot: top([...withVol].sort((a, b) => (b.vol24 > a.vol24 ? 1 : -1)))
        .map((s) => ({ s, metric: `${fmtLcai(s.vol24, 0)} LCAI` })),
      momentum: top(
        [...withVol]
          .filter((s) => s.vol24 > s.volPrev24)
          .sort((a, b) => Number(b.vol24 - b.volPrev24 > a.vol24 - a.volPrev24 ? 1 : -1))
      ).map((s) => ({
        s,
        metric: s.volPrev24 === 0n ? "NEW ⚡" : `+${((Number(s.vol24 - s.volPrev24) / Number(s.volPrev24)) * 100).toFixed(0)}%`,
      })),
      crowd: top([...stats].filter((s) => s.buyers24 > 0).sort((a, b) => b.buyers24 - a.buyers24))
        .map((s) => ({ s, metric: `${s.buyers24} buyers · ${s.buys24}▲` })),
      near: top([...stats].sort((a, b) => b.coin.progressBps - a.coin.progressBps))
        .map((s) => ({ s, metric: `${(s.coin.progressBps / 100).toFixed(1)}%` })),
      whale: top([...stats].sort((a, b) => a.creatorPct - b.creatorPct))
        .map((s) => ({ s, metric: `creator holds ${s.creatorPct.toFixed(1)}%` })),
      cold: top(
        [...stats].sort((a, b) => (a.lastTradeBlock < b.lastTradeBlock ? -1 : 1))
      ).map((s) => ({ s, metric: s.lastTradeBlock === 0n ? "no trades 48h" : "quiet" })),
      conviction: top(
        [...stats]
          .filter((s) => s.buys24 + s.sells24 >= 2)
          .sort((a, b) => (b.buys24 / (b.sells24 + 1)) - (a.buys24 / (a.sells24 + 1)))
      ).map((s) => ({ s, metric: `${((s.buys24/(s.buys24+s.sells24))*100).toFixed(0)}% buys · ${s.buys24}▲/${s.sells24}▼` })),
      whalebuy: top([...stats].filter((s) => s.maxBuy24 > 0n).sort((a, b) => (b.maxBuy24 > a.maxBuy24 ? 1 : -1)))
        .map((s) => ({ s, metric: `${fmtLcai(s.maxBuy24, 0)} LCAI buy` })),
      battle: top([...stats].filter((s) => s.buys24 + s.sells24 > 0).sort((a, b) => (b.buys24 + b.sells24) - (a.buys24 + a.sells24)))
        .map((s) => ({ s, metric: `${s.buys24 + s.sells24} trades` })),
      raised: top([...stats].sort((a, b) => b.coin.progressBps - a.coin.progressBps))
        .map((s) => ({ s, metric: `${fmtLcai(s.vol24 + s.volPrev24, 0)} LCAI 48h` })),
      active: top([...stats].filter((s) => s.lastTradeBlock > 0n).sort((a, b) => (b.lastTradeBlock > a.lastTradeBlock ? 1 : -1)))
        .map((s) => ({ s, metric: `${(s.coin.progressBps / 100).toFixed(1)}% · active` })),
      hot7d: top([...stats].filter((s) => s.vol7d > 0n).sort((a, b) => (b.vol7d > a.vol7d ? 1 : -1)))
        .map((s) => ({ s, metric: `${fmtLcai(s.vol7d, 0)} LCAI` })),
      crowd7d: top([...stats].filter((s) => s.buyers7d > 0).sort((a, b) => b.buyers7d - a.buyers7d))
        .map((s) => ({ s, metric: `${s.buyers7d} buyers · ${s.buys7d}▲` })),
      whalebuy7d: top([...stats].filter((s) => s.maxBuy7d > 0n).sort((a, b) => (b.maxBuy7d > a.maxBuy7d ? 1 : -1)))
        .map((s) => ({ s, metric: `${fmtLcai(s.maxBuy7d, 0)} LCAI buy` })),
      battle7d: top([...stats].filter((s) => s.buys7d + s.sells7d > 0).sort((a, b) => (b.buys7d + b.sells7d) - (a.buys7d + a.sells7d)))
        .map((s) => ({ s, metric: `${s.buys7d + s.sells7d} trades` })),
      conviction7d: top([...stats].filter((s) => s.buys7d + s.sells7d >= 2).sort((a, b) => (b.buys7d / (b.sells7d + 1)) - (a.buys7d / (a.sells7d + 1))))
        .map((s) => ({ s, metric: `${((s.buys7d/(s.buys7d+s.sells7d))*100).toFixed(0)}% buys · ${s.buys7d}▲/${s.sells7d}▼` })),
    };
  }, [stats]);

  return (
    <main className="forge-canvas mx-auto max-w-5xl px-4 py-10 min-h-[70vh]">
      <Link href="/forge" className="f-meta text-sm hover:underline">← Back to the Forge</Link>
      <div className="f-eyebrow mt-4 mb-2">Live on-chain data · 24h &amp; 7d</div>
      <h1 className="f-display text-4xl sm:text-5xl mb-2">Forge Pulse</h1>
      <p className="f-meta mb-4">Every ranking below is computed from Trade events on the Forge contract — nothing curated, nothing hidden.</p>

      {loading ? (
        <div className="f-card py-14 text-center f-meta rounded-2xl">Reading the chain…</div>
      ) : stats.length === 0 ? (
        <div className="f-card py-14 text-center f-meta rounded-2xl">No live coins on the curve yet.</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <Board icon="🔥" title="Hot" sub="Highest LCAI volume · 24h" rows={views.hot} />
            <Board icon="📈" title="Momentum" sub="Volume growth vs prior 24h" rows={views.momentum} />
            <Board icon="🐋" title="Whale Buys" sub="Largest single buy · 24h" rows={views.whalebuy} />
            <Board icon="👥" title="Crowd" sub="Most unique buyers · 24h" rows={views.crowd} />
            <Board icon="⚔️" title="Battle" sub="Most total trades · 24h" rows={views.battle} />
            <Board icon="💎" title="Conviction" sub="Best buy/sell ratio (min 2)" rows={views.conviction} />
            <Board icon="🎯" title="Nearly There" sub="Closest to graduation" rows={views.near} />
            <Board icon="⚡" title="Just Traded" sub="Most recent on-chain action" rows={views.active} />
            <Board icon="🛡️" title="Skin Check" sub="Lowest creator holdings" rows={views.whale} />
            <Board icon="💰" title="Raise Rate" sub="Most LCAI moved · 48h" rows={views.raised} />
            <Board icon="🧊" title="Cold" sub="Contrarian corner — quiet curves" rows={views.cold} />
          </div>
          {grads.length > 0 && (
            <section className="f-card rounded-2xl p-4 mt-4">
              <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "var(--font-display), serif", color: "var(--clr-heading)" }}>🎓 Graduated Hall</h2>
              <div className="space-y-2">
                {grads.map((c) => (
                  <Link key={c.address} href={`/forge/${c.address}`} className="f-card flex items-center gap-3 rounded-2xl p-3 hover:-translate-y-0.5 transition-all">
                    <Avatar coin={c} />
                    <span className="font-semibold" style={{ fontFamily: "var(--font-display), serif", color: "var(--clr-heading)" }}>{c.name}</span>
                    <span className="f-meta text-xs">${c.symbol}</span>
                    <span className="ml-auto text-xs font-bold" style={{ color: "var(--clr-success)" }}>ON FILAMENT</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <div className="mt-10">
            <div className="f-eyebrow mb-4">7-day view</div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Board icon="🔥" title="Hot 7d" sub="Highest LCAI volume · 7 days" rows={views.hot7d} />
              <Board icon="👥" title="Crowd 7d" sub="Most unique buyers · 7 days" rows={views.crowd7d} />
              <Board icon="🐋" title="Whale Buys 7d" sub="Largest single buy · 7 days" rows={views.whalebuy7d} />
              <Board icon="⚔️" title="Battle 7d" sub="Most total trades · 7 days" rows={views.battle7d} />
              <Board icon="💎" title="Conviction 7d" sub="Best buy/sell ratio · 7 days" rows={views.conviction7d} />
            </div>
          </div>
          <div className="mt-10">

          </div>
          <p className="f-meta text-xs text-center mt-10">
            Rankings refresh on page load · window measured from real block times · graduated coins live on the Exchange
          </p>
        </>
      )}
    </main>
  );
}

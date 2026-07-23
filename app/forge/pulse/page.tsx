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
  const shown = open ? rows : rows.slice(0, 3);
  return (
    <section className="f-card rounded-2xl p-4">
      <h2 className="text-lg font-semibold mb-0.5"
        style={{ fontFamily: "var(--font-display), serif", color: "var(--clr-heading)" }}>
        {icon} {title}
      </h2>
      <p className="f-meta text-xs mb-3">{sub}</p>
      <div className="space-y-2">
        {shown.map((r, i) => <Row key={r.s.coin.address} s={r.s} metric={r.metric} rank={i + 1} />)}
      </div>
      {rows.length > 3 && (
        <button onClick={() => setOpen(!open)}
          className="mt-3 text-xs font-semibold hover:underline"
          style={{ color: "var(--ae-aurum)" }}>
          {open ? "Show less ↑" : `Show all ${rows.length} ↓`}
        </button>
      )}
    </section>
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
        const all = await fetchCoins();
        const coins = all.filter((c) => !c.graduated);
        const grads = all.filter((c) => c.graduated);
        if (coins.length === 0) { if (alive) { setStats([]); setLoading(false); } return; }

        // dynamic 24h window: measure real block time from the chain
        const latest = await publicClient.getBlock();
        const probeNum = latest.number > 10_000n ? latest.number - 10_000n : 0n;
        const probe = await publicClient.getBlock({ blockNumber: probeNum });
        const secsPerBlock =
          latest.number > probeNum
            ? Number(latest.timestamp - probe.timestamp) / Number(latest.number - probeNum)
            : 2;
        const blocks24h = BigInt(Math.max(1, Math.round(86_400 / Math.max(0.25, secsPerBlock))));
        const from48 = latest.number > blocks24h * 2n ? latest.number - blocks24h * 2n : 0n;
        const cut24 = latest.number > blocks24h ? latest.number - blocks24h : 0n;

        const logs = await publicClient.getContractEvents({
          address: FORGE_ADDRESS, abi: forgeAbi, eventName: "Trade",
          fromBlock: from48, toBlock: "latest",
        });
        const trades: PulseTrade[] = logs.map((l) => ({
          token: (l.args.token as `0x${string}`),
          trader: (l.args.trader as `0x${string}`),
          isBuy: l.args.isBuy as boolean,
          lcai: l.args.lcaiAmount as bigint,
          block: l.blockNumber,
        }));

        const creatorBals = await Promise.all(
          coins.map((c) => fetchCreatorBalance(c.address, c.creator))
        );

        const out: CoinStats[] = coins.map((coin, i) => {
          const mine = trades.filter((t) => t.token.toLowerCase() === coin.address.toLowerCase());
          const cur = mine.filter((t) => t.block > cut24);
          const prev = mine.filter((t) => t.block <= cut24);
          const buyerSet = new Set(cur.filter((t) => t.isBuy).map((t) => t.trader.toLowerCase()));
          const maxBuy = cur.filter((t) => t.isBuy).reduce((m, t) => (t.lcai > m ? t.lcai : m), 0n);
          return {
            coin,
            vol24: cur.reduce((a, t) => a + t.lcai, 0n),
            volPrev24: prev.reduce((a, t) => a + t.lcai, 0n),
            buyers24: buyerSet.size,
            buys24: cur.filter((t) => t.isBuy).length,
            sells24: cur.filter((t) => !t.isBuy).length,
            lastTradeBlock: mine.length ? mine[mine.length - 1].block : 0n,
            creatorPct: Number((creatorBals[i] * 10_000n) / SUPPLY) / 100,
            maxBuy24: maxBuy,
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
    };
  }, [stats]);

  return (
    <main className="forge-canvas mx-auto max-w-5xl px-4 py-10 min-h-[70vh]">
      <Link href="/forge" className="f-meta text-sm hover:underline">← Back to the Forge</Link>
      <div className="f-eyebrow mt-4 mb-2">Live on-chain data · rolling 24h</div>
      <h1 className="f-display text-4xl sm:text-5xl mb-2">Forge Pulse</h1>
      <p className="f-meta mb-8">Every ranking below is computed from Trade events on the Forge contract — nothing curated, nothing hidden.</p>

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
                    <span className="f-meta text-xs">${'{'}c.symbol{'}'}</span>
                    <span className="ml-auto text-xs font-bold" style={{ color: "var(--clr-success)" }}>ON FILAMENT</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <p className="f-meta text-xs text-center mt-10">
            Rankings refresh on page load · window measured from real block times · graduated coins live on the Exchange
          </p>
        </>
      )}
    </main>
  );
}

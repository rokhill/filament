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
        <span className="font-semibold truncate block"
          style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>
          {s.coin.name}
        </span>
        <span className="f-meta text-xs">${s.coin.symbol}</span>
      </div>
      <span className="text-sm font-semibold text-right flex-shrink-0" style={{ color: "var(--ae-aurum)" }}>
        {metric}
      </span>
    </Link>
  );
}

function Section({ icon, title, sub, rows }: {
  icon: string; title: string; sub: string;
  rows: { s: CoinStats; metric: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <section className="mb-8">
      <div className="f-section mb-1"><h2>{icon} {title}</h2></div>
      <p className="f-meta text-xs mb-3">{sub}</p>
      <div className="space-y-2">
        {rows.map((r, i) => <Row key={r.s.coin.address} s={r.s} metric={r.metric} rank={i + 1} />)}
      </div>
    </section>
  );
}

export default function ForgePulse() {
  const { fetchCoins, fetchCreatorBalance } = useForge();
  const { publicClient } = useWeb3Clients();
  const [stats, setStats] = useState<CoinStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const coins = (await fetchCoins()).filter((c) => !c.graduated);
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
          return {
            coin,
            vol24: cur.reduce((a, t) => a + t.lcai, 0n),
            volPrev24: prev.reduce((a, t) => a + t.lcai, 0n),
            buyers24: buyerSet.size,
            buys24: cur.filter((t) => t.isBuy).length,
            sells24: cur.filter((t) => !t.isBuy).length,
            lastTradeBlock: mine.length ? mine[mine.length - 1].block : 0n,
            creatorPct: Number((creatorBals[i] * 10_000n) / SUPPLY) / 100,
          };
        });
        if (alive) { setStats(out); setLoading(false); }
      } catch {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [fetchCoins, fetchCreatorBalance, publicClient]);

  const views = useMemo(() => {
    const top = (arr: CoinStats[], n = 3) => arr.slice(0, n);
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
        metric: s.volPrev24 === 0n ? "NEW ⚡" : `+${fmtLcai(s.vol24 - s.volPrev24, 0)} LCAI`,
      })),
      crowd: top([...stats].filter((s) => s.buyers24 > 0).sort((a, b) => b.buyers24 - a.buyers24))
        .map((s) => ({ s, metric: `${s.buyers24} buyer${s.buyers24 === 1 ? "" : "s"}` })),
      near: top([...stats].sort((a, b) => b.coin.progressBps - a.coin.progressBps))
        .map((s) => ({ s, metric: `${(s.coin.progressBps / 100).toFixed(1)}%` })),
      whale: top([...stats].sort((a, b) => a.creatorPct - b.creatorPct))
        .map((s) => ({ s, metric: `creator ${s.creatorPct.toFixed(1)}%` })),
      cold: top(
        [...stats].sort((a, b) => (a.lastTradeBlock < b.lastTradeBlock ? -1 : 1))
      ).map((s) => ({ s, metric: s.lastTradeBlock === 0n ? "no trades 48h" : "quiet" })),
      conviction: top(
        [...stats]
          .filter((s) => s.buys24 + s.sells24 >= 2)
          .sort((a, b) => (b.buys24 / (b.sells24 + 1)) - (a.buys24 / (a.sells24 + 1)))
      ).map((s) => ({ s, metric: `${s.buys24}▲ / ${s.sells24}▼` })),
    };
  }, [stats]);

  return (
    <main className="forge-canvas mx-auto max-w-3xl px-4 py-10 min-h-[70vh]">
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
          <Section icon="🔥" title="Hot" sub="Highest LCAI volume in the last 24h" rows={views.hot} />
          <Section icon="📈" title="Momentum" sub="Biggest volume growth vs the prior 24h" rows={views.momentum} />
          <Section icon="👥" title="Crowd" sub="Most unique buyers in the last 24h" rows={views.crowd} />
          <Section icon="🎯" title="Nearly There" sub="Closest to graduation and permanent liquidity" rows={views.near} />
          <Section icon="🐋" title="Whale Check" sub="Lowest creator holdings — least concentrated supply" rows={views.whale} />
          <Section icon="💎" title="Conviction" sub="Best buy/sell ratio (min 2 trades)" rows={views.conviction} />
          <Section icon="🧊" title="Cold" sub="Longest without a trade — contrarian corner" rows={views.cold} />
          <p className="f-meta text-xs text-center mt-10">
            Rankings refresh on page load · window measured from real block times · graduated coins live on the Exchange
          </p>
        </>
      )}
    </main>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import useForge, { ForgeCoin, fmtLcai, fmtTokens } from "@/hooks/useForge";
import useWeb3Clients from "@/hooks/useWeb3Clients";
import { ipfsToHttp, shortAddr } from "@/config/forge";

const WLCAI_ADDRESS = (process.env.NEXT_PUBLIC_WLCAI_ADDRESS ||
  "0xD73cedfc5b894323BdB18A1e31E7BB186fCe5F64") as `0x${string}`;

const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

type Holding = ForgeCoin & { balance: bigint; valueWei: bigint; spentWei: bigint; receivedWei: bigint; };
type LPPosition = {
  pair: `0x${string}`;
  token0Symbol: string;
  token1Symbol: string;
  lpBalance: bigint;
  lpTotal: bigint;
  reserveLCAI: bigint;
  valueWei: bigint;
  feeEarnings?: string;
};

const FACTORIES = [
  "0x5Cf3b069dDB232d1adc5139a9eFb30C48F629389",
  "0xBA502917c3F7233F9100f9430f4048a224A7D8DE",
] as const;
const WLCAI_LC = "0xd73cedfc5b894323bdb18a1e31e7bb186fce5f64";
const PAIR_ABI = [
  { type:"function",name:"getReserves",inputs:[],outputs:[{type:"uint112"},{type:"uint112"},{type:"uint32"}],stateMutability:"view" },
  { type:"function",name:"token0",inputs:[],outputs:[{type:"address"}],stateMutability:"view" },
  { type:"function",name:"totalSupply",inputs:[],outputs:[{type:"uint256"}],stateMutability:"view" },
  { type:"function",name:"balanceOf",inputs:[{type:"address"}],outputs:[{type:"uint256"}],stateMutability:"view" },
] as const;
const ERC20_SYM_ABI = [
  { type:"function",name:"symbol",inputs:[],outputs:[{type:"string"}],stateMutability:"view" },
] as const;
const FACTORY_ABI = [
  { type:"event",name:"PairCreated",inputs:[{type:"address",indexed:true},{type:"address",indexed:true},{type:"address",indexed:false},{type:"uint256",indexed:false}] },
] as const;

function CoinIcon({ coin, size = 44 }: { coin: ForgeCoin; size?: number }) {
  const [err, setErr] = useState(false);
  const src = ipfsToHttp(coin.metadata.image);
  if (!src || err) {
    return (
      <div className="flex items-center justify-center rounded-xl font-bold flex-shrink-0"
        style={{ width: size, height: size, background: "var(--ae-veil)", color: "var(--ae-aurum)", fontSize: size / 2.6, fontFamily: "var(--font-display), serif" }}>
        {coin.symbol.slice(0, 2)}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={coin.symbol} onError={() => setErr(true)} className="rounded-xl object-cover flex-shrink-0" style={{ width: size, height: size, background: "var(--ae-veil)" }} />;
}

export default function PortfolioPage() {
  const { address } = useAccount();
  const { publicClient } = useWeb3Clients();
  const { fetchCoins, getBalance, getLcaiUsdPrice } = useForge();

  const [nativeLcai, setNativeLcai] = useState<bigint>(0n);
  const [wlcai, setWlcai] = useState<bigint>(0n);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [lcaiUsd, setLcaiUsd] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lpPositions, setLpPositions] = useState<LPPosition[]>([]);

  const load = async () => {
    if (!address || !publicClient) { setLoading(false); return; }
    setLoading(true);
    try {
      const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL || "";
      const [native, wlcaiBal, coinRows, usd] = await Promise.all([
        publicClient.getBalance({ address }),
        publicClient.readContract({ address: WLCAI_ADDRESS, abi: erc20Abi, functionName: "balanceOf", args: [address] }).catch(() => 0n),
        INDEXER ? fetch(`${INDEXER}/api/v1/forge/coins?limit=200`).then(r=>r.json()).catch(()=>null) : null,
        getLcaiUsdPrice(),
      ]);
      const coins = coinRows
        ? (coinRows as any[]).map((r:any) => ({
            address: r.address, creator: r.creator, name: r.name, symbol: r.symbol,
            priceWei: BigInt(r.price_wei||"0"), progressBps: r.progress_bps,
            lcaiRaised: BigInt(r.lcai_raised||"0"), graduated: !!r.graduated, pair: r.pair,
            metadata: (() => { try { return JSON.parse(r.metadata_uri||"{}"); } catch { return {}; } })(),
          }))
        : await fetchCoins();
      setNativeLcai(native);
      setWlcai(wlcaiBal as bigint);
      setLcaiUsd(usd);

      // Fetch wallet trade history for PnL calculation
      let tradeMap: Record<string, {spent: bigint, received: bigint}> = {};
      if (INDEXER) {
        try {
          const trades = await fetch(`${INDEXER}/api/v1/wallet/${address}/trades?limit=1000`).then(r=>r.json());
          for (const t of (trades as any[])) {
            const coin = t.coin?.toLowerCase();
            if (!coin) continue;
            if (!tradeMap[coin]) tradeMap[coin] = {spent: 0n, received: 0n};
            const amt = BigInt(t.lcai_amount || "0");
            if (t.is_buy === 1) tradeMap[coin].spent += amt;
            else tradeMap[coin].received += amt;
          }
        } catch {}
      }
      // Sequential balance reads for each Forge coin
      const held: Holding[] = [];
      for (const c of coins) {
        try {
          const bal = await getBalance(c.address);
          if (bal > 0n) {
            let priceWei = c.priceWei;
            // for graduated coins fetch live DEX price from indexer
            if (c.graduated && c.pair && INDEXER) {
              try {
                const pd = await fetch(`${INDEXER}/api/v1/pairs/${c.pair}`).then(r=>r.json());
                if (pd?.reserve0 && pd?.reserve1) {
                  const resLCAI = BigInt(pd.wlcai_is_t0 ? pd.reserve0 : pd.reserve1);
                  const resTok = BigInt(pd.wlcai_is_t0 ? pd.reserve1 : pd.reserve0);
                  if (resTok > 0n) priceWei = (resLCAI * 10n**18n) / resTok;
                }
              } catch {}
            }
            const valueWei = (bal * priceWei) / 10n ** 18n;
            const coinKey = c.address.toLowerCase();
            const costBasis = tradeMap[coinKey] || {spent: 0n, received: 0n};
            held.push({ ...c, balance: bal, valueWei, spentWei: costBasis.spent, receivedWei: costBasis.received });
          }
        } catch { /* skip */ }
      }
      setHoldings(held);

      // Scan LP positions across both factories
      const lpHeld: LPPosition[] = [];
      for (const factory of FACTORIES) {
        try {
          const logs = await publicClient.getLogs({ address: factory as `0x${string}`, fromBlock: 0n, toBlock: "latest" });
          for (const l of logs) {
            if (!l.topics[1] || !l.topics[2]) continue;
            const pair = ("0x" + l.data.slice(26, 66)) as `0x${string}`;
            try {
              const lpBal = await publicClient.readContract({ address: pair, abi: PAIR_ABI, functionName: "balanceOf", args: [address] });
              if ((lpBal as bigint) === 0n) continue;
              const [t0addr, res, lpTotal] = await Promise.all([
                publicClient.readContract({ address: pair, abi: PAIR_ABI, functionName: "token0" }),
                publicClient.readContract({ address: pair, abi: PAIR_ABI, functionName: "getReserves" }),
                publicClient.readContract({ address: pair, abi: PAIR_ABI, functionName: "totalSupply" }),
              ]);
              const t0 = ("0x" + l.topics[1].slice(26)) as `0x${string}`;
              const t1 = ("0x" + l.topics[2].slice(26)) as `0x${string}`;
              const wlcaiIsT0 = (t0addr as string).toLowerCase() === WLCAI_LC;
              const r = res as [bigint, bigint, number];
              const reserveLCAI = wlcaiIsT0 ? r[0] : r[1];
              const tokenAddr = wlcaiIsT0 ? t1 : t0;
              const [sym0, sym1] = await Promise.all([
                publicClient.readContract({ address: tokenAddr, abi: ERC20_SYM_ABI, functionName: "symbol" }).catch(() => "???"),
                Promise.resolve("LCAI"),
              ]);
              const lpTotalBig = lpTotal as bigint;
              const share = lpTotalBig > 0n ? (lpBal as bigint) * 10n**18n / lpTotalBig : 0n;
              const valueWei = lpTotalBig > 0n ? reserveLCAI * 2n * share / 10n**18n : 0n;
              lpHeld.push({ pair, token0Symbol: sym0 as string, token1Symbol: "LCAI", lpBalance: lpBal as bigint, lpTotal: lpTotalBig, reserveLCAI, valueWei });
            } catch { continue; }
          }
        } catch { continue; }
      }
      setLpPositions(lpHeld);
      // fetch LP fee earnings
      if (INDEXER && address) {
        fetch(`${INDEXER}/api/v1/wallet/${address}/lp-earnings`).then(r=>r.json()).then((earnings:any[]) => {
          setLpPositions(prev => prev.map(lp => {
            const e = earnings.find((e:any) => e.pair.toLowerCase() === lp.pair.toLowerCase());
            return e ? { ...lp, feeEarnings: e.fee_earnings_lcai } : lp;
          }));
        }).catch(()=>{});
      }
    } catch { /* noop */ }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [address]);

  const totalForgeValue = useMemo(() => holdings.reduce((a, h) => a + h.valueWei, 0n), [holdings]);
  const totalLpValue = useMemo(() => lpPositions.reduce((a, p) => a + p.valueWei, 0n), [lpPositions]);
  const totalLcaiEquivalent = nativeLcai + wlcai + totalForgeValue + totalLpValue;

  const usd = (wei: bigint) => lcaiUsd > 0 ? `~$${(Number(formatEther(wei)) * lcaiUsd).toFixed(2)}` : "";

  if (!address) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center min-h-[70vh]">
        <div className="f-eyebrow mb-2">Your Holdings · LightChain AI</div>
        <h1 className="f-display text-4xl sm:text-5xl mb-3">Portfolio</h1>
        <p className="text-sm" style={{ color: "var(--ae-nebula)" }}>Connect your wallet to see your holdings.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 min-h-[70vh]">
      <div className="f-eyebrow mb-2">Your Holdings · LightChain AI</div>
      <h1 className="f-display text-4xl sm:text-5xl">Portfolio</h1>
      <p className="f-mono mt-2 mb-7">{shortAddr(address)}</p>

      {/* Total value — the one bold moment */}
      <div className="pf-hero rounded-3xl px-6 py-10 mb-6 text-center">
        <div className="pf-eyebrow mb-3">Total Portfolio Value</div>
        <div className="pf-total text-6xl sm:text-7xl">
          {fmtLcai(totalLcaiEquivalent, 2)}
        </div>
        <div className="mt-2 text-sm font-medium" style={{ color: "var(--ae-nebula)" }}>
          LCAI{lcaiUsd > 0 ? ` · ${usd(totalLcaiEquivalent)} USD` : ""}
        </div>
      </div>

      {/* Base assets */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="pf-card rounded-2xl p-4">
          <div className="text-xs mb-1.5" style={{ color: "var(--ae-nebula)" }}>LCAI · native</div>
          <div className="text-lg font-semibold" style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>{fmtLcai(nativeLcai, 3)}</div>
          {lcaiUsd > 0 && <div className="text-[11px] mt-0.5" style={{ color: "var(--ae-nebula)" }}>{usd(nativeLcai)}</div>}
        </div>
        <div className="pf-card rounded-2xl p-4">
          <div className="text-xs mb-1.5" style={{ color: "var(--ae-nebula)" }}>WLCAI · wrapped</div>
          <div className="text-lg font-semibold" style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>{fmtLcai(wlcai, 3)}</div>
          {lcaiUsd > 0 && <div className="text-[11px] mt-0.5" style={{ color: "var(--ae-nebula)" }}>{usd(wlcai)}</div>}
        </div>
      </div>

      {/* Forge holdings */}
      <div className="f-section">
        <h2>Forge Holdings</h2>
      </div>
      <div className="flex items-center justify-end -mt-2 mb-3">
        <button onClick={load} disabled={loading} className="text-xs underline" style={{ color: "var(--ae-aurum)" }}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color: "var(--ae-nebula)" }}>Reading the chain…</div>
      ) : holdings.length === 0 ? (
        <div className="py-12 text-center rounded-2xl" style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)" }}>
          <p className="text-sm mb-2" style={{ color: "var(--clr-heading)" }}>No Forge coins yet.</p>
          <Link href="/forge" className="text-sm underline" style={{ color: "var(--ae-aurum)" }}>Browse the Forge →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {holdings.map((h) => (
            <Link key={h.address} href={`/forge/${h.address}`}
              className="pf-card flex items-center gap-4 rounded-2xl p-4">
              <CoinIcon coin={h} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate" style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>{h.name}</span>
                  <span className="text-xs" style={{ color: "var(--ae-nebula)" }}>${h.symbol}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: "var(--ae-nebula)" }}>{fmtTokens(h.balance)} tokens</span>
                  {h.graduated && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,.12)", color: "var(--clr-success)" }}>GRADUATED</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-semibold" style={{ color: "var(--clr-heading)" }}>{fmtLcai(h.valueWei, 2)} LCAI</div>
                <div className="text-[10px]" style={{ color: "var(--ae-nebula)" }}>spot price{lcaiUsd > 0 ? ` · ${usd(h.valueWei)}` : ""}</div>
                {h.spentWei > 0n && (() => {
                  const pnl = h.valueWei + h.receivedWei - h.spentWei;
                  const isPos = pnl >= 0n;
                  return <div className="text-[10px] font-semibold mt-0.5" style={{ color: isPos ? "var(--clr-success)" : "var(--clr-danger)" }}>
                    {isPos ? "+" : "-"}{fmtLcai(isPos ? pnl : -pnl, 2)} LCAI
                  </div>;
                })()}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* LP Positions */}
      <div className="f-section mt-8">
        <h2>LP Positions</h2>
      </div>
      {lpPositions.length === 0 ? (
        <div className="py-8 text-center rounded-2xl mb-6" style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)" }}>
          <p className="text-sm" style={{ color: "var(--ae-nebula)" }}>No LP positions found.</p>
          <Link href="/pools" className="text-sm underline mt-1 block" style={{ color: "var(--ae-aurum)" }}>View Pools →</Link>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {lpPositions.map((lp) => (
            <Link key={lp.pair} href="/pools"
              className="pf-card flex items-center gap-4 rounded-2xl p-4">
              <div className="flex items-center justify-center rounded-xl font-bold flex-shrink-0"
                style={{ width: 44, height: 44, background: "var(--ae-veil)", color: "var(--ae-aurum)", fontSize: 13 }}>
                LP
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate" style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>
                  {lp.token0Symbol} / {lp.token1Symbol}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--ae-nebula)" }}>
                  {lp.lpTotal > 0n ? ((Number(lp.lpBalance) / Number(lp.lpTotal)) * 100).toFixed(4) : "0"}% of pool
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-semibold" style={{ color: "var(--clr-heading)" }}>{fmtLcai(lp.valueWei, 2)} LCAI</div>
                {lcaiUsd > 0 && <div className="text-[10px]" style={{ color: "var(--ae-nebula)" }}>{usd(lp.valueWei)}</div>}
                {lp.feeEarnings && Number(lp.feeEarnings) > 0 && (
                  <div className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--clr-success)" }}>+{Number(lp.feeEarnings).toFixed(4)} LCAI fees</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="text-center text-[11px] mt-8" style={{ color: "var(--ae-nebula)" }}>
        Forge coin values are estimated at the current curve price. Tap any coin to buy, sell, or view its chart.
      </p>
    </main>
  );
}

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

type Holding = ForgeCoin & { balance: bigint; valueWei: bigint };

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

  const load = async () => {
    if (!address || !publicClient) { setLoading(false); return; }
    setLoading(true);
    try {
      const [native, wlcaiBal, coins, usd] = await Promise.all([
        publicClient.getBalance({ address }),
        publicClient.readContract({ address: WLCAI_ADDRESS, abi: erc20Abi, functionName: "balanceOf", args: [address] }).catch(() => 0n),
        fetchCoins(),
        getLcaiUsdPrice(),
      ]);
      setNativeLcai(native);
      setWlcai(wlcaiBal as bigint);
      setLcaiUsd(usd);

      // Sequential balance reads for each Forge coin
      const held: Holding[] = [];
      for (const c of coins) {
        try {
          const bal = await getBalance(c.address);
          if (bal > 0n) {
            const valueWei = (bal * c.priceWei) / 10n ** 18n;
            held.push({ ...c, balance: bal, valueWei });
          }
        } catch { /* skip */ }
      }
      setHoldings(held);
    } catch { /* noop */ }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [address]);

  const totalForgeValue = useMemo(() => holdings.reduce((a, h) => a + h.valueWei, 0n), [holdings]);
  const totalLcaiEquivalent = nativeLcai + wlcai + totalForgeValue;

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
                  {h.graduated && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,.12)", color: "var(--clr-success)" }}>GRADUATED</span>}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--ae-nebula)" }}>{fmtTokens(h.balance)} tokens</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-semibold" style={{ color: "var(--clr-heading)" }}>{fmtLcai(h.valueWei, 2)} LCAI</div>
                {lcaiUsd > 0 && <div className="text-[10px]" style={{ color: "var(--ae-nebula)" }}>{usd(h.valueWei)}</div>}
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

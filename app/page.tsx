"use client";

import BootSplash from "@/components/boot-splash";
import useMarkets from "@/hooks/useMarkets";
import { useEffect, useState } from "react";
import { formatEther } from "viem";
import SwapForm from "@/components/swap-form";
import SwapPoolsTabs from "@/components/swap-pools-tabs";

export default function Home() {
  const { fetchForgeMarket } = useMarkets();
  const [forgeStats, setForgeStats] = useState<{ coins: number; raised: bigint; graduated: number } | null>(null);

  useEffect(() => {
    fetchForgeMarket().then(f => {
      if (f) setForgeStats({ coins: f.coinCount, raised: f.totalRaised, graduated: f.graduated });
    });
  // eslint-disable-next-line
  }, []);

  return (
    <div className="ex-canvas">
      <BootSplash />
      <div className="container max-w-lg mx-auto py-12">
        {/* Masthead — same structure as Markets: eyebrow, serif title, rule */}
        <div className="f-eyebrow mb-2">Non-custodial AMM · LightChain AI</div>
        <h1 className="f-display text-4xl sm:text-5xl">Exchange</h1>
        <p className="f-body text-sm mt-2 leading-relaxed">
          Swap tokens and earn fees. Every transaction is built in your browser,
          signed by your wallet, and settled entirely on-chain.
        </p>

        {forgeStats && (forgeStats.coins > 0 || forgeStats.graduated > 0) && (
          <div className="flex items-center gap-5 mt-5 mb-1 flex-wrap">
            {forgeStats.coins > 0 && (
              <span className="f-meta text-xs">
                <span style={{ color: "var(--ft-gold)", fontWeight: 600 }}>{forgeStats.coins}</span> coins forged
              </span>
            )}
            {Number(formatEther(forgeStats.raised)) > 0 && (
              <span className="f-meta text-xs">
                <span style={{ color: "var(--ft-gold)", fontWeight: 600 }}>
                  {Math.round(Number(formatEther(forgeStats.raised))).toLocaleString()}
                </span> LCAI on curves
              </span>
            )}
            {forgeStats.graduated > 0 && (
              <span className="f-meta text-xs">
                <span style={{ color: "var(--ft-up)", fontWeight: 600 }}>{forgeStats.graduated}</span> graduated
              </span>
            )}
          </div>
        )}

        <div className="mt-2 space-y-4">
          <SwapPoolsTabs />
          <SwapForm />
        </div>
      </div>
    </div>
  );
}

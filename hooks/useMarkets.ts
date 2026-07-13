"use client";

import { useCallback } from "react";
import { getContract } from "viem";
import useWeb3Clients from "./useWeb3Clients";
import { forgeAbi, launchTokenAbi } from "@/contracts/forgeAbi";
import { FORGE_ADDRESS, parseMetadata } from "@/config/forge";

const CG = "https://api.coingecko.com/api/v3";
const LCAI_ID = "lightchain-ai";

export type MarketStats = {
  priceUsd: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
};

export type Venue = {
  name: string;
  pair: string;
  priceUsd: number;
  volumeUsd: number;
  trustScore: string | null;
  url: string | null;
};

export type ForgeMarket = {
  coinCount: number;
  totalRaised: bigint;
  graduated: number;
  topCoin: { name: string; symbol: string; progressBps: number; address: string } | null;
  recent: { name: string; symbol: string; address: string; progressBps: number; image?: string }[];
};

export default function useMarkets() {
  const { publicClient } = useWeb3Clients();

  const fetchStats = useCallback(async (): Promise<MarketStats | null> => {
    try {
      const r = await fetch(
        `${CG}/simple/price?ids=${LCAI_ID}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`,
        { cache: "no-store" }
      );
      const j = await r.json();
      const d = j?.[LCAI_ID];
      if (!d) return null;
      return {
        priceUsd: d.usd ?? 0,
        change24h: d.usd_24h_change ?? 0,
        volume24h: d.usd_24h_vol ?? 0,
        marketCap: d.usd_market_cap ?? 0,
      };
    } catch {
      return null;
    }
  }, []);

  const fetchVenues = useCallback(async (): Promise<Venue[]> => {
    try {
      const r = await fetch(
        `${CG}/coins/${LCAI_ID}/tickers?include_exchange_logo=false&depth=false`,
        { cache: "no-store" }
      );
      const j = await r.json();
      const tickers = (j?.tickers ?? []) as any[];
      return tickers
        .map((t) => ({
          name: t.market?.name ?? "Unknown",
          pair: `${(t.base ?? "").slice(0, 8)}/${t.target ?? ""}`,
          priceUsd: t.converted_last?.usd ?? 0,
          volumeUsd: t.converted_volume?.usd ?? 0,
          trustScore: t.trust_score ?? null,
          url: t.trade_url ?? null,
        }))
        .filter((v) => v.volumeUsd > 0)
        .sort((a, b) => b.volumeUsd - a.volumeUsd)
        .slice(0, 12);
    } catch {
      return [];
    }
  }, []);

  const fetchChart = useCallback(async (days: number): Promise<[number, number][]> => {
    try {
      const r = await fetch(
        `${CG}/coins/${LCAI_ID}/market_chart?vs_currency=usd&days=${days}`,
        { cache: "no-store" }
      );
      const j = await r.json();
      return (j?.prices ?? []) as [number, number][];
    } catch {
      return [];
    }
  }, []);

  const fetchForgeMarket = useCallback(async (): Promise<ForgeMarket> => {
    const empty: ForgeMarket = { coinCount: 0, totalRaised: 0n, graduated: 0, topCoin: null, recent: [] };
    try {
      const reader = getContract({ abi: forgeAbi, address: FORGE_ADDRESS, client: { public: publicClient } });
      const count = Number(await reader.read.tokenCount());
      if (count === 0) return empty;
      const idx = Array.from({ length: count }, (_, i) => BigInt(i));
      const addrs = (await Promise.all(idx.map((i) => reader.read.allTokens([i])))) as `0x${string}`[];

      let totalRaised = 0n;
      let graduated = 0;
      let top: ForgeMarket["topCoin"] = null;
      const recent: ForgeMarket["recent"] = [];

      for (const a of addrs) {
        try {
          const t = getContract({ abi: launchTokenAbi, address: a, client: { public: publicClient } });
          const [curve, stats, name, symbol] = await Promise.all([
            reader.read.curves([a]),
            reader.read.curveStats([a]),
            t.read.name(),
            t.read.symbol(),
          ]);
          const progressBps = Number(stats[1]);
          const meta = parseMetadata(curve[6]);
          totalRaised += stats[2];
          if (curve[5]) graduated++;
          if (!curve[5] && progressBps > 0 && (!top || progressBps > top.progressBps)) {
            top = { name, symbol, progressBps, address: a };
          }
          recent.push({ name, symbol, address: a, progressBps, image: meta.image });
        } catch { /* skip */ }
      }
      return {
        coinCount: count,
        totalRaised,
        graduated,
        topCoin: top,
        recent: recent.reverse().slice(0, 6),
      };
    } catch {
      return empty;
    }
  }, [publicClient]);

  return { fetchStats, fetchVenues, fetchChart, fetchForgeMarket };
}

export function fmtUsd(n: number, opts?: { compact?: boolean }): string {
  if (n === 0) return "$0";
  if (opts?.compact && n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (opts?.compact && n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "K";
  if (n < 0.01) return "$" + n.toPrecision(3);
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

"use client";

import { lcai as lightchain } from "@/config/chains";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { formatEther, parseEther, getContract } from "viem";
import { toast } from "sonner";
import useWeb3Clients from "./useWeb3Clients";
import { forgeAbi, launchTokenAbi } from "@/contracts/forgeAbi";
import { FORGE_ADDRESS, CoinMetadata, parseMetadata } from "@/config/forge";

export type ForgeCoin = {
  address: `0x${string}`;
  name: string;
  symbol: string;
  creator: `0x${string}`;
  metadata: CoinMetadata;
  priceWei: bigint;
  progressBps: number;
  lcaiRaised: bigint;
  graduated: boolean;
  isLegacy?: boolean;
};

export type ForgeTrade = {
  trader: `0x${string}`;
  isBuy: boolean;
  lcaiAmount: bigint;
  tokenAmount: bigint;
  priceWei: bigint; // spot after trade
  block: bigint;
  tx: `0x${string}`;
};

const SLIPPAGE_BPS = 200n; // 2% default guard on curve trades

export default function useForge() {
  const { address } = useAccount();
  const { publicClient, walletClient } = useWeb3Clients();

  const forgeRead = getContract({
    abi: forgeAbi,
    address: FORGE_ADDRESS,
    client: { public: publicClient },
  });

  // ------------------------------------------------------------ list
  const fetchFromForge = useCallback(async (forgeAddr: `0x${string}`, legacy: boolean): Promise<ForgeCoin[]> => {
    const reader = getContract({ abi: forgeAbi, address: forgeAddr, client: { public: publicClient } });
    let count = 0;
    try { count = Number(await reader.read.tokenCount()); } catch { return []; }
    if (count === 0) return [];
    const idx = Array.from({ length: count }, (_, i) => BigInt(i));
    const addrs = (await Promise.all(
      idx.map((i) => reader.read.allTokens([i]))
    )) as `0x${string}`[];

    return Promise.all(
      addrs.map(async (a): Promise<ForgeCoin> => {
        const t = getContract({ abi: launchTokenAbi, address: a, client: { public: publicClient } });
        const [curve, stats, name, symbol] = await Promise.all([
          reader.read.curves([a]),
          reader.read.curveStats([a]),
          t.read.name(),
          t.read.symbol(),
        ]);
        return {
          address: a,
          name,
          symbol,
          creator: curve[0],
          metadata: parseMetadata(curve[6]),
          priceWei: stats[0],
          progressBps: Number(stats[1]),
          lcaiRaised: stats[2],
          graduated: curve[5],
          isLegacy: legacy,
        };
      })
    );
  }, [publicClient]);

  const fetchCoins = useCallback(async (): Promise<ForgeCoin[]> => {
    return fetchFromForge(FORGE_ADDRESS, false);
  }, [fetchFromForge]);



  // ------------------------------------------------------------ detail
  const fetchCoin = useCallback(
    async (a: `0x${string}`): Promise<ForgeCoin | null> => {
      const t = getContract({ abi: launchTokenAbi, address: a, client: { public: publicClient } });
      try {
        const [curve, stats, name, symbol] = await Promise.all([
          forgeRead.read.curves([a]),
          forgeRead.read.curveStats([a]),
          t.read.name(),
          t.read.symbol(),
        ]);
        if (curve[0] === "0x0000000000000000000000000000000000000000") return null;
        return {
          address: a,
          name,
          symbol,
          creator: curve[0],
          metadata: parseMetadata(curve[6]),
          priceWei: stats[0],
          progressBps: Number(stats[1]),
          lcaiRaised: stats[2],
          graduated: curve[5],
        };
      } catch {
        return null;
      }
    },
    [publicClient]
  );

  const fetchTrades = useCallback(
    async (a: `0x${string}`): Promise<ForgeTrade[]> => {
      try {
        const logs = await publicClient.getContractEvents({
          address: FORGE_ADDRESS,
          abi: forgeAbi,
          eventName: "Trade",
          args: { token: a },
          fromBlock: 0n,
          toBlock: "latest",
        });
        return logs.map((l) => ({
          trader: l.args.trader as `0x${string}`,
          isBuy: l.args.isBuy as boolean,
          lcaiAmount: l.args.lcaiAmount as bigint,
          tokenAmount: l.args.tokenAmount as bigint,
          priceWei: ((l.args.vLcai as bigint) * 10n ** 18n) / (l.args.vTok as bigint),
          block: l.blockNumber,
          tx: l.transactionHash,
        }));
      } catch {
        return [];
      }
    },
    [publicClient]
  );

  /** Recent trades across ALL coins — powers the live ticker. */
  const fetchActivity = useCallback(async (): Promise<(ForgeTrade & { token: `0x${string}` })[]> => {
    try {
      const latest = await publicClient.getBlockNumber();
      const from = latest > 250_000n ? latest - 250_000n : 0n;
      const logs = await publicClient.getContractEvents({
        address: FORGE_ADDRESS,
        abi: forgeAbi,
        eventName: "Trade",
        fromBlock: from,
        toBlock: "latest",
      });
      return logs.slice(-14).map((l) => ({
        token: l.args.token as `0x${string}`,
        trader: l.args.trader as `0x${string}`,
        isBuy: l.args.isBuy as boolean,
        lcaiAmount: l.args.lcaiAmount as bigint,
        tokenAmount: l.args.tokenAmount as bigint,
        priceWei: ((l.args.vLcai as bigint) * 10n ** 18n) / (l.args.vTok as bigint),
        block: l.blockNumber,
        tx: l.transactionHash,
      }));
    } catch {
      return [];
    }
  }, [publicClient]);

  const fetchCreatorBalance = useCallback(
    async (token: `0x${string}`, creator: `0x${string}`): Promise<bigint> => {
      const t = getContract({ abi: launchTokenAbi, address: token, client: { public: publicClient } });
      try {
        return await t.read.balanceOf([creator]);
      } catch {
        return 0n;
      }
    },
    [publicClient]
  );

  // ------------------------------------------------------------ writes
  const requireWallet = () => {
    if (!walletClient || !address) {
      toast.error("Connect your wallet first");
      return false;
    }
    return true;
  };

  const createCoin = async (
    name: string,
    symbol: string,
    metadataURI: string,
    initialBuyLcai: string
  ): Promise<`0x${string}` | null> => {
    if (!requireWallet()) return null;
    try {
      const fee = await forgeRead.read.creationFee();
      const buyVal = initialBuyLcai ? parseEther(initialBuyLcai) : 0n;
      let minOut = 0n;
      if (buyVal > 0n) {
        // quote against a fresh curve via a same-params token? Fresh curves all
        // share vLcai0/vTok0, so quoteBuy on any pre-launch state isn't available;
        // rely on the atomicity of create+buy (nothing can front-run inside one tx).
        minOut = 0n;
      }
      const { request, result } = await publicClient.simulateContract({
        account: address,
        address: FORGE_ADDRESS,
        abi: forgeAbi,
        functionName: "createToken",
        args: [name, symbol, metadataURI, minOut],
        value: fee + buyVal,
      });
      const hash = await walletClient!.switchChain({ id: lightchain.id }).catch(() => {}).then(() => walletClient!.writeContract({ ...request, chain: lightchain }));
      toast.loading("Deploying your coin…", { id: hash });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success(`${symbol} is live!`, { id: hash });
      return result as `0x${string}`;
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Create failed");
      return null;
    }
  };

  const buyCoin = async (token: `0x${string}`, lcaiIn: string): Promise<boolean> => {
    if (!requireWallet()) return false;
    try {
      const value = parseEther(lcaiIn);
      const quoted = await forgeRead.read.quoteBuy([token, value]);
      const minOut = (quoted * (10_000n - SLIPPAGE_BPS)) / 10_000n;
      const { request } = await publicClient.simulateContract({
        account: address,
        address: FORGE_ADDRESS,
        abi: forgeAbi,
        functionName: "buy",
        args: [token, minOut],
        value,
      });
      const hash = await walletClient!.switchChain({ id: lightchain.id }).catch(() => {}).then(() => walletClient!.writeContract({ ...request, chain: lightchain }));
      toast.loading("Buying…", { id: hash });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Buy confirmed", { id: hash });
      return true;
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Buy failed");
      return false;
    }
  };

  const sellCoin = async (token: `0x${string}`, amount: bigint): Promise<boolean> => {
    if (!requireWallet()) return false;
    try {
      const t = getContract({
        abi: launchTokenAbi,
        address: token,
        client: { public: publicClient, wallet: walletClient! },
      });
      const allowance = await t.read.allowance([address!, FORGE_ADDRESS]);
      if (allowance < amount) {
        const ah = await t.write.approve([FORGE_ADDRESS, amount]);
        toast.loading("Approving…", { id: ah });
        await publicClient.waitForTransactionReceipt({ hash: ah });
        toast.success("Approved", { id: ah });
      }
      const quoted = await forgeRead.read.quoteSell([token, amount]);
      const minOut = (quoted * (10_000n - SLIPPAGE_BPS)) / 10_000n;
      const { request } = await publicClient.simulateContract({
        account: address,
        address: FORGE_ADDRESS,
        abi: forgeAbi,
        functionName: "sell",
        args: [token, amount, minOut],
      });
      const hash = await walletClient!.switchChain({ id: lightchain.id }).catch(() => {}).then(() => walletClient!.writeContract({ ...request, chain: lightchain }));
      toast.loading("Selling…", { id: hash });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Sell confirmed", { id: hash });
      return true;
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Sell failed");
      return false;
    }
  };

  // convenience read wrappers for live quoting in the UI
  const quoteBuy = useCallback(
    async (token: `0x${string}`, lcaiIn: string) => {
      try {
        return await forgeRead.read.quoteBuy([token, parseEther(lcaiIn)]);
      } catch {
        return 0n;
      }
    },
    [publicClient]
  );

  const quoteSell = useCallback(
    async (token: `0x${string}`, amount: bigint) => {
      try {
        return await forgeRead.read.quoteSell([token, amount]);
      } catch {
        return 0n;
      }
    },
    [publicClient]
  );

  const getBalance = useCallback(
    async (token: `0x${string}`) => {
      if (!address) return 0n;
      const t = getContract({ abi: launchTokenAbi, address: token, client: { public: publicClient } });
      try {
        return await t.read.balanceOf([address]);
      } catch {
        return 0n;
      }
    },
    [publicClient, address]
  );

  const getCreationFee = useCallback(async () => {
    try {
      return await forgeRead.read.creationFee();
    } catch {
      return 0n;
    }
  }, [publicClient]);


// ------------------------------------------------------------ USD price
  const getLcaiUsdPrice = useCallback(async (): Promise<number> => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=lightchain-ai&vs_currencies=usd",
        { cache: "no-store" }
      );
      const json = await res.json();
      return json?.["lightchain-ai"]?.usd ?? 0;
    } catch {
      return 0;
    }
  }, []);

  return {
    getLcaiUsdPrice,
    fetchActivity,
    fetchCoins,
    fetchCoin,
    fetchTrades,
    fetchCreatorBalance,
    createCoin,
    buyCoin,
    sellCoin,
    quoteBuy,
    quoteSell,
    getBalance,
    getCreationFee,
  };
}

export function fmtLcai(wei: bigint, digits = 2): string {
  const n = Number(formatEther(wei));
  if (n === 0) return "0";
  if (n < 0.01) return n.toPrecision(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function fmtTokens(wei: bigint): string {
  const n = Number(formatEther(wei));
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

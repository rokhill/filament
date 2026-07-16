"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPublicClient,
  erc20Abi,
  formatEther,
  http,
  pad,
  parseEther,
} from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { wagmiConfig } from "@/config/wagmi";
import { useAppKit } from "@reown/appkit/react";
import { ArrowDownUpIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import { lcai } from "@/config/chains";
import {
  ETHEREUM_DOMAIN,
  LCAI_DOMAIN,
  LCAI_ERC20_ETHEREUM,
  WARP_ROUTE_ETHEREUM,
  WARP_ROUTE_LCAI,
  ethereum,
} from "@/config/bridge";
import warpRouteAbi from "@/contracts/warpRouteAbi";

type Direction = "deposit" | "withdraw"; // deposit: Ethereum -> LCAI, withdraw: LCAI -> Ethereum

const ethClient = createPublicClient({ chain: ethereum, transport: http() });
const lcaiClient = createPublicClient({ chain: lcai, transport: http() });

export default function BridgeForm() {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useAppKit();
  const { switchChainAsync } = useSwitchChain();
  const [direction, setDirection] = useState<Direction>("deposit");
  const [amount, setAmount] = useState("");
  const [ethBalance, setEthBalance] = useState<bigint>();
  const [lcaiBalance, setLcaiBalance] = useState<bigint>();
  const [gasQuote, setGasQuote] = useState<bigint>();
  const [busy, setBusy] = useState<"" | "approve" | "bridge" | "switch">("");
  const [lastTx, setLastTx] = useState<{ hash: string; origin: Direction }>();

  const origin = direction === "deposit" ? ethereum : lcai;
  const originRouter =
    direction === "deposit" ? WARP_ROUTE_ETHEREUM : WARP_ROUTE_LCAI;
  const originClient = direction === "deposit" ? ethClient : lcaiClient;
  const destDomain = direction === "deposit" ? LCAI_DOMAIN : ETHEREUM_DOMAIN;
  const originBalance = direction === "deposit" ? ethBalance : lcaiBalance;

  const parsedAmount = useMemo(() => {
    try {
      return amount ? parseEther(amount) : 0n;
    } catch {
      return 0n;
    }
  }, [amount]);

  const loadBalances = useCallback(async () => {
    if (!address) {
      setEthBalance(undefined);
      setLcaiBalance(undefined);
      return;
    }
    const [eth, native] = await Promise.allSettled([
      ethClient.readContract({
        abi: erc20Abi,
        address: LCAI_ERC20_ETHEREUM,
        functionName: "balanceOf",
        args: [address],
      }),
      lcaiClient.getBalance({ address }),
    ]);
    if (eth.status === "fulfilled") setEthBalance(eth.value);
    if (native.status === "fulfilled") setLcaiBalance(native.value);
  }, [address]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  // Interchain gas quote — also acts as a preflight: reverts if the
  // destination domain isn't enrolled on the route.
  useEffect(() => {
    let stale = false;
    setGasQuote(undefined);
    originClient
      .readContract({
        abi: warpRouteAbi,
        address: originRouter,
        functionName: "quoteGasPayment",
        args: [destDomain],
      })
      .then((q) => !stale && setGasQuote(q))
      .catch(() => !stale && setGasQuote(undefined));
    return () => {
      stale = true;
    };
  }, [originClient, originRouter, destDomain]);

  const ensureChain = async () => {
    if (chainId === origin.id) return true;
    setBusy("switch");
    try {
      await switchChainAsync({ chainId: origin.id });
      return true;
    } catch {
      toast.error(`Switch your wallet to ${origin.name} to continue.`);
      return false;
    } finally {
      setBusy("");
    }
  };

  const bridge = async () => {
    if (!address || parsedAmount <= 0n) return;
    if (gasQuote === undefined) {
      toast.error("Couldn't fetch the bridge gas quote. Try again.");
      return;
    }
    if (!(await ensureChain())) return;

    try {
      const walletClient = await getWalletClient(wagmiConfig, {
        chainId: origin.id,
      });
      const recipient = pad(address, { size: 32 });

      if (direction === "deposit") {
        // Ethereum side: approve ERC-20 to the collateral route if needed
        const allowance = await ethClient.readContract({
          abi: erc20Abi,
          address: LCAI_ERC20_ETHEREUM,
          functionName: "allowance",
          args: [address, WARP_ROUTE_ETHEREUM],
        });
        if (allowance < parsedAmount) {
          setBusy("approve");
          const approveHash = await walletClient.writeContract({
            chain: ethereum,
            abi: erc20Abi,
            address: LCAI_ERC20_ETHEREUM,
            functionName: "approve",
            args: [WARP_ROUTE_ETHEREUM, parsedAmount],
          });
          await ethClient.waitForTransactionReceipt({ hash: approveHash });
          toast.success("Approved");
        }
      }

      setBusy("bridge");
      const value =
        direction === "deposit" ? gasQuote : parsedAmount + gasQuote;
      const hash = await walletClient.writeContract({
        chain: origin,
        abi: warpRouteAbi,
        address: originRouter,
        functionName: "transferRemote",
        args: [destDomain, recipient, parsedAmount],
        value,
      });
      await originClient.waitForTransactionReceipt({ hash });
      setLastTx({ hash, origin: direction });
      setAmount("");
      toast.success("Bridge transfer sent — arrival in ~1–2 minutes.");
      loadBalances();
      // Refresh again after the relayer has likely delivered
      setTimeout(loadBalances, 90_000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(
        error?.walk?.().message || error?.message || "Bridge transfer failed."
      );
    } finally {
      setBusy("");
    }
  };

  const insufficient =
    originBalance !== undefined && parsedAmount > originBalance;
  const disabled =
    busy !== "" || parsedAmount <= 0n || insufficient || gasQuote === undefined;

  const chainRow = (label: string, balance?: bigint) => (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--clr-body)]">{label}</span>
      <span className="font-mono">
        {balance !== undefined
          ? `${formatNumber(formatEther(balance))} LCAI`
          : "—"}
      </span>
    </div>
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bridge</span>
          <span className="text-xs font-normal text-[var(--clr-body)]">
            via LightChain&apos;s Hyperlane route
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-xl border border-[rgba(135,135,135,0.2)] dark:border-[#333f53] p-4 flex flex-col gap-2">
          {chainRow(
            direction === "deposit" ? "From · Ethereum (ERC-20)" : "From · LightChain AI (native)",
            originBalance
          )}
          <input
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) =>
              /^\d*\.?\d*$/.test(e.target.value) && setAmount(e.target.value)
            }
            className="w-full bg-transparent text-2xl font-mono outline-none"
          />
          {originBalance !== undefined && (
            <button
              type="button"
              className="self-end text-xs text-[var(--clr-primary)]"
              onClick={() =>
                setAmount(
                  formatEther(
                    direction === "withdraw" && gasQuote !== undefined
                      ? originBalance > gasQuote
                        ? originBalance - gasQuote
                        : 0n
                      : originBalance
                  )
                )
              }
            >
              Max
            </button>
          )}
        </div>

        <div className="flex justify-center -my-2">
          <button
            type="button"
            aria-label="Switch direction"
            onClick={() =>
              setDirection((d) => (d === "deposit" ? "withdraw" : "deposit"))
            }
            className="rounded-full border border-[rgba(135,135,135,0.2)] dark:border-[#333f53] p-2 hover:text-[var(--clr-primary)] transition-colors"
          >
            <ArrowDownUpIcon className="size-4" />
          </button>
        </div>

        <div className="rounded-xl border border-[rgba(135,135,135,0.2)] dark:border-[#333f53] p-4 flex flex-col gap-2">
          {chainRow(
            direction === "deposit" ? "To · LightChain AI (native)" : "To · Ethereum (ERC-20)",
            direction === "deposit" ? lcaiBalance : ethBalance
          )}
          <div className="text-2xl font-mono text-[var(--clr-body)]">
            {parsedAmount > 0n ? formatNumber(formatEther(parsedAmount)) : "0.0"}
          </div>
        </div>

        <div className="text-xs text-[var(--clr-body)] flex justify-between">
          <span>Interchain gas</span>
          <span className="font-mono">
            {gasQuote !== undefined
              ? `${formatNumber(formatEther(gasQuote))} ${origin.nativeCurrency.symbol}`
              : "…"}
          </span>
        </div>

        {!isConnected ? (
          <Button onClick={() => open()}>Connect Wallet</Button>
        ) : (
          <Button disabled={disabled} onClick={bridge}>
            {busy !== "" && <Loader2Icon className="size-4 animate-spin" />}
            {busy === "approve"
              ? "Approving…"
              : busy === "bridge"
                ? "Bridging…"
                : busy === "switch"
                  ? "Switching network…"
                  : insufficient
                    ? "Insufficient balance"
                    : chainId !== origin.id
                      ? `Switch to ${origin.name} & Bridge`
                      : "Bridge"}
          </Button>
        )}

        {lastTx && (
          <a
            href={`${
              lastTx.origin === "deposit"
                ? ethereum.blockExplorers!.default.url
                : lcai.blockExplorers!.default.url
            }/tx/${lastTx.hash}`}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "text-center text-xs text-[var(--clr-primary)] underline underline-offset-2"
            )}
          >
            View origin transaction
          </a>
        )}

        <p className="text-[11px] leading-relaxed text-[var(--clr-body)]">
          Transfers use LightChain&apos;s official Hyperlane warp route. Tokens
          lock on Ethereum and mint as native LCAI on LightChain AI (and burn /
          unlock in reverse). Delivery typically takes 1–2 minutes.
        </p>
      </CardContent>
    </Card>
  );
}

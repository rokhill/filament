"use client";
import { useChainGuard } from "@/hooks/useChainGuard";
import { Loader2Icon, PencilLineIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useAccount, useBalance, useGasPrice } from "wagmi";
import { useDebounce } from "react-use";
import { useEffect, useMemo, useState } from "react";
import useWeb3Functions from "@/hooks/useWeb3Functions";
import useStore from "@/store";
import useTokens from "@/hooks/useTokens";
import TokenSelector from "./token-selector";
import { cn, formatNumber, getRouteAsPath } from "@/lib/utils";
import useUserStore from "@/store/user-store";
import useCurrentChain from "@/hooks/useCurrentChain";
import { Token } from "@/types/Token";
import { useAppKit } from "@reown/appkit/react";
import { SettingModal } from "./setting-modal";
import TransactionModal from "./transaction-modal";
import { formatEther, formatGwei } from "viem";
import usePair from "@/hooks/usePair";
import Link from "next/link";
import config from "@/config";
import useWeb3Clients from "@/hooks/useWeb3Clients";

export default function SwapForm() {
  useChainGuard();
  const chain = useCurrentChain();
  const { publicClient } = useWeb3Clients();
  const { address, isConnected } = useAccount();
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>("0x0");
  const [openTxModal, setOpenTxModal] = useState(false);
  const { open } = useAppKit();
  const { tokens } = useTokens();
  const { loading, token0, token1 } = useStore();
  const balance0 = useBalance({ address, token: token0?.address });
  const balance1 = useBalance({ address, token: token1?.address });
  const nativeBalance = useBalance({ address });
  const { getAmountFromTo, swap } = useWeb3Functions();
  const { slippageTolerance } = useUserStore();
  const setToken0 = (token?: Token) => useStore.setState({ token0: token });
  const setToken1 = (token?: Token) => useStore.setState({ token1: token });
  const [showDetails, setShowDetails] = useState(false);
  const gasPrice = useGasPrice();
  const pair = usePair({ token0, token1 });
  const wethAddress = config.WETH[chain.id]?.toLowerCase();

  const isNativeWrappedPair = useMemo(() => {
    if (!token0 || !token1 || !wethAddress) return false;

    const isToken0Native =
      !token0.address || token0.symbol === chain.nativeCurrency.symbol;
    const isToken1Native =
      !token1.address || token1.symbol === chain.nativeCurrency.symbol;
    const isToken0Wrapped = token0.address?.toLowerCase() === wethAddress;
    const isToken1Wrapped = token1.address?.toLowerCase() === wethAddress;

    return (
      (isToken0Native && isToken1Wrapped) || (isToken0Wrapped && isToken1Native)
    );
  }, [token0, token1, wethAddress, chain.nativeCurrency.symbol]);

  const swapRateLabel = useMemo(() => {
    if (!token0 || !token1) return "";
    if (isNativeWrappedPair) return `1 ${token0.symbol} = 1 ${token1.symbol}`;
    if (pair.data)
      return `1 ${token0.symbol} = ${formatNumber(pair.data.price)} ${
        token1.symbol
      }`;
    return "";
  }, [token0, token1, isNativeWrappedPair, pair.data]);

  useDebounce(
    () => {
      if (amount0 && !isNaN(+amount0) && token0 && token1) {
        getAmountFromTo(amount0, token0, token1).then((val) =>
          setAmount1(val || "")
        );
      } else setAmount1("");
    },
    300,
    [amount0, token0, token1]
  );

  const noPair = useMemo(() => {
    if (pair.isLoading) return false;
    if (!pair.data) return true;
    if (pair.data.totalSupply === BigInt(0)) return true;
    return false;
  }, [pair]);

  const insufficientBalance = useMemo(
    () => (balance0.data ? Number(balance0.data.formatted) < +amount0 : false),
    [balance0, amount0]
  );

  const disableButton = useMemo(
    () => loading || insufficientBalance || (isConnected && !amount0),
    [loading, insufficientBalance, isConnected, amount0]
  );

  const buttonTitle = useMemo(() => {
    if (loading) return "Proccessing";
    if (!isConnected) return "Connect Wallet";
    if (!amount0) return "Enter an amount";
    if (insufficientBalance) return "Insufficient balance";
    return "Exchange";
  }, [loading, isConnected, amount0, insufficientBalance]);

  const invertTokens = () => {
    useStore.setState({ token0: token1, token1: token0 });
    setAmount0(amount1);
    setAmount1(amount0);
  };

  const invalidateBalances = () => {
    if (token0) balance0.refetch();
    if (token1) balance1.refetch();
    nativeBalance.refetch();
  };

  const submit = async () => {
    if (!isConnected) {
      open();
    } else if (token0 && token1 && amount1) {
      if (!+amount0) return;
      useStore.setState({ loading: true });
      setOpenTxModal(true);
      const hash = await swap(amount0, amount1, token0, token1);
      setTxHash(hash);

      if (hash) {
        setAmount0("");
        setAmount1("");

        publicClient
          .waitForTransactionReceipt({ hash })
          .then(invalidateBalances);
      }

      useStore.setState({ loading: false });
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (chain) {
      timeout = setTimeout(() => {
        useStore.setState({
          token0: tokens[0],
          token1: tokens.find((token) => token.symbol === "USDT"),
        });
      }, 100);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [chain]);

  return (
    <Card className="border border-[rgba(255,140,30,0.5)] p-0 gap-0 shadow-[0_4px_20px_rgba(0,0,0,0.2)] overflow-hidden">
      <div className="absolute left-1/2 top-1/2 -translate-1/2 w-[394px] rounded-full h-[394px] bg-[radial-gradient(circle,rgba(255,140,30,0.35)_0%,rgba(255,140,30,0.18)_60%,transparent_100%)] blur-[110px]"></div>
      <CardHeader className="bg-[var(--clr-gray-100)] dark:bg-[var(--clr-darker-two)] py-6 lg:text-2xl text-xl z-[1]">
        <CardTitle className="text-center font-bold text-[var(--clr-black)] dark:text-[var(--clr-heading)]">
          Swap on <span className="theme-gradient ae-display">Filament</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid z-[1] bg-[#e1e3f6] dark:bg-[#080808]">
        <div className="space-y-2 pt-4 px-4 pb-10 rounded-lg bg-[var(--clr-gray-100)] dark:bg-[var(--clr-darker-two)] border-2 border-[rgba(from_var(--clr-primary)_r_g_b/.1)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm text-[var(--clr-body)] font-medium leading-[1.71]">
              You Pay
            </span>
            <TokenSelector
              className="bg-transparent"
              tokenSelected={token0}
              selectedToken={(token) => {
                if (token1?.address === token.address) setToken1(token0);
                setToken0(token);
              }}
            />
          </div>
          <input
            type="number"
            min={0}
            id="token0"
            value={amount0}
            placeholder="0.0"
            onChange={(e) => setAmount0(e.currentTarget.value)}
            readOnly={!isConnected || !token0}
            className={cn(
              "w-full px-0.5 py-3 text-2xl font-semibold leading-[1.16] outline-none text-[var(--clr-heading)] placeholder:text-[var(--clr-heading)] border-b border-[rgba(112,100,233,0.16)]",
              {
                "text-destructive !border-destructive": insufficientBalance,
              }
            )}
          />

          <div className="mt-4 flex items-center justify-between">
            {token0 && (
              <span className="flex items-center gap-1 text-[var(--clr-body)] font-semibold text-sm">
                Balance:{" "}
                {balance0.isFetching ? (
                  <Loader2Icon className="animate-spin" size={14} />
                ) : (
                  `${formatNumber(balance0.data?.formatted)} ${token0.symbol}`
                )}
              </span>
            )}
          </div>
        </div>
        <div className="relative py-2">
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-center bg-card size-15 mx-auto rounded-lg">
            <button
              className="size-12 bg-[var(--clr-gray-100)] dark:bg-[var(--clr-darker-two)] rounded-md"
              onClick={() => invertTokens()}
            >
              <i className="fa-solid fa-arrow-up-arrow-down"></i>
            </button>
          </div>
        </div>
        <div className="space-y-2 pt-4 px-4 pb-4 rounded-lg bg-[var(--clr-gray-100)] dark:bg-[var(--clr-darker-two)] border-2 border-[rgba(from_var(--clr-primary)_r_g_b/.1)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm text-[var(--clr-body)] font-medium leading-[1.71]">
              You Get
            </span>
            <TokenSelector
              className="bg-transparent"
              tokenSelected={token1}
              selectedToken={(token) => {
                if (token0?.address === token.address) setToken0(token1);
                setToken1(token);
              }}
            />
          </div>
          <input
            type="number"
            id="token1"
            value={amount1}
            placeholder="0.0"
            readOnly={true}
            className={cn(
              "w-full px-0.5 py-3 text-2xl font-semibold leading-[1.16] outline-none text-[var(--clr-heading)] placeholder:text-[var(--clr-heading)] border-b border-[rgba(112,100,233,0.16)]",
              {
                // "text-destructive !border-destructive": insufficientBalance,
              }
            )}
            // onChange={(e) => setAmount0(e.currentTarget.value)}
          />

          <div className="mt-4 flex items-center justify-between">
            {token1 && (
              <span className="flex items-center gap-1 text-[var(--clr-body)] font-semibold text-sm">
                Balance:{" "}
                {balance1.isFetching ? (
                  <Loader2Icon className="animate-spin" size={14} />
                ) : (
                  `${formatNumber(balance1.data?.formatted)} ${token1.symbol}`
                )}
              </span>
            )}
            <div className="text-sm font-medium text-[var(--clr-body)]">
              <SettingModal
                trigger={
                  <button className="flex items-center gap-2 hover:text-[var(--clr-body)]/80">
                    <PencilLineIcon size={20} />
                    <span>{slippageTolerance}%</span>
                  </button>
                }
              />
            </div>
          </div>
        </div>
        <Button
          type="button"
          className="mt-4 btn-default !h-12"
          disabled={disableButton}
          onClick={submit}
        >
          {buttonTitle}
        </Button>

        {noPair && (
          <div className="mt-4 p-3 font-medium text-sm leading-[1.71] rounded-lg bg-[var(--clr-gray-100)] dark:bg-[var(--clr-darker-two)] text-[var(--clr-body)]">
            <i className="fa-solid fa-info-circle mr-1.5"></i>
            This pair has no liquidity yet.
            Try a different pair, or be the first to earn fees by{" "}
            <Link
              className="text-[var(--ae-aurum)] border-b border-dashed border-transparent hover:border-[var(--ae-aurum)]"
              href={getRouteAsPath("/add/[token0]/[token1]", {
                token0: token0?.address || token0?.symbol,
                token1: token1?.address || token1?.symbol,
              })}
            >
              adding liquidity
            </Link>.
          </div>
        )}

        <div className="mt-4 flex justify-between items-center font-semibold text-[var(--clr-body)]">
          <span className="swap__form-balance--text">
            Balance:{" "}
            {nativeBalance.isFetching ? (
              <Loader2Icon className="animate-spin" size={14} />
            ) : (
              `${formatNumber(nativeBalance.data?.formatted)} ${
                chain.nativeCurrency.symbol
              }`
            )}
            {/* (±9,7500$) */}
          </span>
          <button
            type="button"
            className="flex items-center gap-1"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span className="swap__form-balance--text">
              Gwei:{" "}
              {gasPrice.isFetching ? (
                <Loader2Icon className="animate-spin" size={14} />
              ) : (
                `${formatNumber(formatGwei(gasPrice?.data || 0n))} ${
                  chain.nativeCurrency.symbol
                }`
              )}
            </span>
            <i
              className={cn("fa-regular fa-angle-down", {
                "rotate-180": showDetails,
              })}
            ></i>
          </button>
        </div>

        {showDetails && (
          <ul
            className={`mt-4 space-y-2 text-sm font-medium text-[var(--clr-body)] [&_li]:flex [&_li]:justify-between [&_li]:items-center [&_li]:gap-2`}
          >
            <li className="">
              <span>Rate</span>
              {/* <span>1 ETH = 0.00001 weETH ($0.000000134)</span> */}
              <span>
                {/* 1 {token0?.symbol} = {formatNumber(amount1)} {token1?.symbol} */}
                {pair.isLoading ? (
                  <Loader2Icon className="animate-spin" size={14} />
                ) : (
                  swapRateLabel
                )}
              </span>
            </li>
            <li className="">
              <span>Network cost</span>
              <span>
                {formatNumber(formatEther(gasPrice?.data || 0n))}{" "}
                {chain.nativeCurrency.symbol}
              </span>
            </li>
            <li className="">
              <span>Order routing</span>
              <span>Uniswap API</span>
            </li>
            <li className="">
              <span>Max slippage</span>
              <span>{slippageTolerance}%</span>
            </li>
          </ul>
        )}
      </CardContent>

      <TransactionModal
        open={openTxModal}
        txHash={txHash}
        content={`swapping ${amount0} ${token0?.symbol} for ${formatNumber(
          amount1
        )} ${token1?.symbol}`}
        setOpen={setOpenTxModal}
      />
    </Card>
  );
}

'use client'

import BackButton from "@/components/back-button";
import TokenSelector from "@/components/token-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import useCurrentChain from "@/hooks/useCurrentChain";
import usePair from "@/hooks/usePair";
import useTokens from "@/hooks/useTokens";
import { formatNumber, getRouteAsPath, sortTokens } from "@/lib/utils";
import useUserStore from "@/store/user-store";
import { Token } from "@/types/Token";
import { useAppKit } from "@reown/appkit/react";
import { Link, Loader2Icon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { formatEther, formatUnits } from "viem";
import { useAccount } from "wagmi";

export default function FindPool() {
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const chain = useCurrentChain();
  const [token0, setToken0] = useState<Token | undefined>(undefined);
  const [token1, setToken1] = useState<Token | undefined>(undefined);
  const { data: pair, isLoading } = usePair({ token0, token1 });
  const { tokens } = useTokens();
  const router = useRouter();

  const addLiquidityPath = useMemo(
    () =>
      token0 && token1
        ? getRouteAsPath("/add/[...slugs]", {
          slugs: [token0.address || token0.symbol, token1.address || token1.symbol],
        })
        : "/add",
    [token0, token1]
  );

  const importPool = async () => {
    if (!token0 || !token1) return;
    const tokens = [token0, token1].sort(sortTokens);
    const key = tokens.map((token) => token.address || token.symbol).join(":");
    useUserStore.setState((state) => ({
      pairs: {
        [chain.id]: {
          [key]: [tokens[0], tokens[1]],
          ...state.pairs[chain.id],
        },
        ...state.pairs,
      },
    }));
    router.push("/pools");
  };

  useEffect(() => {
    if (tokens.length > 0) {
      setToken0(tokens[0]);
      setToken1(undefined);
    }
  }, [chain]);

  return (
    <div className="container py-12">
      <Card className="w-full max-w-lg mx-auto border-2 border-[rgba(135,135,135,0.15)] dark:border-[#333f53] gap-0 shadow-[0_4px_20px_rgba(0,0,0,0.2)] bg-card">
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between gap-3">
            <BackButton />
            <CardTitle className="text-lg text-[var(--clr-black)] dark:text-[var(--clr-heading)]">
              Import V2 Pool
            </CardTitle>
            <div></div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--clr-gray-100)] dark:bg-[var(--clr-darker-two)] text-[var(--clr-body)]">
            <p className="text-sm">
              <strong>Tip:</strong>{" "}
              Use this tool to find V2 pools that don&apos;t automatically appear in the interface
            </p>
          </div>
          <TokenSelector
            className={""}
            tokenSelected={token0}
            selectedToken={(token) => {
              if (token1?.address === token.address) setToken1(token0);
              setToken0(token);
            }}
          />
          <div className="flex justify-center">
            <PlusIcon className="text-[var(--clr-black)] dark:text-[var(--clr-heading)]" size={20} />
          </div>
          <TokenSelector
            className={""}
            tokenSelected={token1}
            selectedToken={(token) => {
              if (token0?.address === token.address) setToken0(token1);
              setToken1(token);
            }}
          />

          {isConnected ? (
            <div>
              <div className="p-4 border text-muted-foreground bg-[var(--clr-gray-100)] dark:bg-[var(--clr-dark)] rounded-xl">
                {!isLoading ? (
                  !token0 || !token1 ? (
                    <p className="text-sm text-center text-[var(--clr-body)]">
                      Select a token to find your V2 liquidity
                    </p>
                  ) : pair ? (
                    pair.liquidity > 0n ? (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>Your Total Pool Tokens:</span>
                          <span>
                            {formatNumber(formatEther(pair.liquidity))}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            Pooled {pair.token0.symbol}:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="">
                              {formatNumber(
                                formatUnits(pair.amount0, pair.token0.decimals)
                              )}
                            </span>

                            <img
                              src={pair.token0.logoURI}
                              alt={pair.token0.symbol}
                              className="object-contain w-4 h-4 rounded-full"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            Pooled {pair.token1.symbol}:
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="">
                              {formatNumber(
                                formatUnits(pair.amount1, pair.token1.decimals)
                              )}
                            </span>

                            <img
                              src={pair.token1.logoURI}
                              alt={pair.token1.symbol}
                              className="object-contain w-4 h-4 rounded-full"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>Your Pool Share:</span>
                          <span>
                            {Number(
                              (BigInt(pair.liquidity) * 100n) /
                              BigInt(pair.totalSupply)
                            )}
                            %
                          </span>
                        </div>
                        <Button onClick={() => importPool()}>
                          Import Pool
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        <p className="text-sm text-center text-[var(--clr-body)]">
                          You don&apos;t have liquidity in this pool
                        </p>
                        <Button className="w-full" asChild>
                          <Link to={addLiquidityPath}>
                            Add Liquidity
                          </Link>
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="grid gap-4">
                      <p className="text-sm text-center text-[var(--clr-body)]">
                        No pool found
                      </p>
                      <Button className="w-full" asChild>
                        <Link to={addLiquidityPath}>Create Pool</Link>
                      </Button>
                    </div>
                  )
                ) : (
                  <Loader2Icon className="mx-auto animate-spin" size={24} />
                )}
              </div>
            </div>
          ) : (
            <Button className="w-full h-12 py-6 btn-default" onClick={() => open()}>
              Connect Wallet
            </Button>

          )}
        </CardContent>
      </Card>
    </div>
  );
}
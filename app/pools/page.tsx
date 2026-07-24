'use client'

import LoadingBlock from "@/components/loading-block";
import TokenAvatar from "@/components/token-avatar";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import config from "@/config";
import useContracts from "@/hooks/useContracts";
import pairAbi from "@/contracts/pairAbi";
import useCurrentChain from "@/hooks/useCurrentChain";
import useWeb3Clients from "@/hooks/useWeb3Clients";
import { formatNumber, getRouteAsPath } from "@/lib/utils";
import useUserStore from "@/store/user-store";
import { Pair } from "@/types/Pair";
import { useEffect, useState } from "react";
import { formatEther, formatUnits, getContract, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import Link from "next/link";
import SwapPoolsTabs from "@/components/swap-pools-tabs";

export default function Pools() {
    const [loadingPage, setLoadingPage] = useState(true);
    const chain = useCurrentChain();
    const { address } = useAccount();
    const { open } = useAppKit();
    const { publicClient } = useWeb3Clients();
    const { pairs: pairTokens } = useUserStore();
    const { factoryV2Contract } = useContracts();
    const [pairs, setPairs] = useState<Pair[]>([]);

    const loadMyPools = async () => {
        if (!address) { setLoadingPage(false); return; }

        setLoadingPage(true);

        const WETH = config.WETH[chain.id];
        const pairAddresses = await Promise.all(
            Object.values(pairTokens[chain.id] || {}).map(([token0, token1]) =>
                factoryV2Contract.read.getPair([
                    token0.address || WETH,
                    token1.address || WETH,
                ])
            )
        );

        const pairs = await Promise.all(
            pairAddresses.map((pairAddress, index) => {
                if (pairAddress === zeroAddress) return Promise.resolve(undefined);
                const pair = getContract({
                    address: pairAddress,
                    abi: pairAbi,
                    client: publicClient,
                });
                const tokens = Object.values(pairTokens[chain.id] || {})[index];
                return Promise.all([
                    pairAddress,
                    tokens[0],
                    tokens[1],
                    pair.read.getReserves(),
                    pair.read.balanceOf([address]),
                    pair.read.totalSupply(),
                ]);
            })
        );

        setPairs(
            pairs
                .filter((pair) => pair && pair[4] > 0n)
                .map(
                    (
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        [pairAddress, token0, token1, reserves, liquidity, totalSupply]
                    ) => ({
                        address: pairAddress,
                        token0,
                        token1,
                        liquidity,
                        reserve0: reserves[0],
                        reserve1: reserves[1],
                        amount0: BigInt((liquidity * reserves[0]) / totalSupply),
                        amount1: BigInt((liquidity * reserves[1]) / totalSupply),
                        totalSupply,
                    })
                ) as Pair[]
        );

        setLoadingPage(false);
    };

    useEffect(() => {
        loadMyPools();
    }, [address, chain]);

    return (
        <div className="container py-12">
            <div className="f-eyebrow mb-2">Liquidity · LightChain AI</div>
            <h1 className="f-display text-3xl sm:text-4xl mb-1">Pools</h1>
            <p className="f-body text-sm mb-6" style={{ maxWidth: "540px" }}>
                Provide liquidity to earn a share of every swap fee — like staking, but you
                stay in control of your tokens.{" "}
                <a href="/pools/guide" className="forge-guide-link">New here? How pools work →</a>
            </p>
            <div className="w-full max-w-3xl mx-auto mb-4">
                <SwapPoolsTabs />
            </div>
            <Card className="w-full max-w-3xl mx-auto border border-[rgba(227,179,65,0.45)] gap-0 shadow-[0_4px_20px_rgba(0,0,0,0.2)] bg-[var(--clr-gray-100)] dark:bg-[var(--clr-darker-two)]">
                <CardContent className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <CardTitle className="text-[var(--clr-black)] dark:text-[var(--clr-heading)]">Your V2 Liquidity</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href="/add" className="rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5" style={{border:"1px solid rgba(255,140,30,.5)",color:"var(--ae-aurum)"}}>Create Pair</Link>
                            <Link href="/find" className="rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5" style={{border:"1px solid rgba(255,140,30,.5)",color:"var(--ae-aurum)"}}>Import Pool</Link>
                        </div>
                    </div>
                    {loadingPage ? (
                        <LoadingBlock />
                    ) : (
                        <>
                        {!address && (
                          <div className="py-10 text-center">
                            <div style={{fontSize:36,marginBottom:12}}>{"🔥"}</div>
                            <div className="font-semibold mb-1" style={{color:"var(--ae-aurum)",fontFamily:"var(--font-display),serif"}}>No wallet connected</div>
                            <div className="text-sm mb-4" style={{color:"var(--ae-nebula)"}}>Connect your wallet to see your liquidity positions.</div>
                            <button onClick={()=>open()} className="rounded-xl px-5 py-2.5 text-sm font-bold" style={{background:"linear-gradient(180deg,#ffaa32,#e07a12)",color:"#140d05"}}>Connect Wallet</button>
                          </div>
                        )}
                        <Accordion type="single" collapsible className="grid w-full gap-6">
                            {pairs.length > 0 ? (
                                pairs.map((pair, index) => (
                                    <AccordionItem
                                        key={index}
                                        className="px-4 border rounded-xl bg-muted"
                                        value={`pair-$${index + 1}`}
                                    >
                                        <AccordionTrigger className="hover:no-underline">
                                            <div
                                                key={index}
                                                className="flex items-center space-x-2 transition-all rounded-md"
                                            >
                                                <div className="flex">
                                                    <TokenAvatar
                                                        token={pair.token0}
                                                        size={40}
                                                        className="bg-secondary"
                                                    />
                                                    <TokenAvatar
                                                        token={pair.token1}
                                                        size={40}
                                                        className="-translate-x-3 bg-secondary"
                                                    />
                                                </div>
                                                <div className="">
                                                    <p className="text-lg font-semibold">
                                                        {pair.token0.symbol} / {pair.token1.symbol}
                                                    </p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="grid grid-cols-1 gap-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span>Your Total Pool Tokens:</span>
                                                <span>{formatNumber(formatEther(pair.liquidity))}</span>
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
                                            <div className="flex items-center justify-end gap-2">
                                                <Button className="w-32 rounded-full" asChild>
                                                    <Link
                                                        href={getRouteAsPath("/add/[token0]/[token1]", {
                                                            token0: pair.token0.address || pair.token0.symbol,
                                                            token1: pair.token1.address || pair.token1.symbol,
                                                        })}
                                                    >
                                                        Add
                                                    </Link>
                                                </Button>
                                                <Button className="w-32 rounded-full" asChild>
                                                    <Link
                                                        href={getRouteAsPath("/remove/[token0]/[token1]", {
                                                            token0: pair.token0.address || pair.token0.symbol,
                                                            token1: pair.token1.address || pair.token1.symbol,
                                                        })}
                                                    >
                                                        Remove
                                                    </Link>
                                                </Button>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))
                            ) : (
                                <p className="py-6 text-lg text-center dark:text-[var(--clr-heading)]">
                                    No liquidity found
                                </p>
                            )}
                        </Accordion>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

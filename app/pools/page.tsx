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
import useMarkets from "@/hooks/useMarkets";
import useForge from "@/hooks/useForge";
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
    const [lcaiUsd, setLcaiUsd] = useState(0);
    const [logoMap, setLogoMap] = useState<Record<string,string>>({});
    const { fetchStats } = useMarkets();
    const { fetchCoins } = useForge();

    const loadMyPools = async () => {
        if (!address) { setLoadingPage(false); return; }
        setLoadingPage(true);
        try {
            const FACTORIES = [
                "0x5Cf3b069dDB232d1adc5139a9eFb30C48F629389",
                "0xBA502917c3F7233F9100f9430f4048a224A7D8DE",
            ] as const;
            const erc20Mini = [
                {type:"function",name:"symbol",inputs:[],outputs:[{type:"string"}],stateMutability:"view"},
                {type:"function",name:"name",inputs:[],outputs:[{type:"string"}],stateMutability:"view"},
            ] as const;
            const allPairs: Pair[] = [];
            for (const factory of FACTORIES) {
                const logs = await publicClient.getLogs({address:factory,fromBlock:0n,toBlock:"latest"});
                for (const l of logs) {
                    if (!l.topics[1]||!l.topics[2]) continue;
                    const pairAddress = ("0x"+l.data.slice(26,66)) as `0x${string}`;
                    const t0addr = ("0x"+l.topics[1].slice(26)) as `0x${string}`;
                    const t1addr = ("0x"+l.topics[2].slice(26)) as `0x${string}`;
                    const pair = getContract({address:pairAddress,abi:pairAbi,client:publicClient});
                    const lpBalance = await pair.read.balanceOf([address]);
                    if (lpBalance === 0n) continue;
                    const [reserves, totalSupply] = await Promise.all([
                        pair.read.getReserves(),
                        pair.read.totalSupply(),
                    ]);
                    const [sym0,sym1,name0,name1] = await Promise.all([
                        publicClient.readContract({address:t0addr,abi:erc20Mini,functionName:"symbol"}).catch(()=>"LCAI"),
                        publicClient.readContract({address:t1addr,abi:erc20Mini,functionName:"symbol"}).catch(()=>"LCAI"),
                        publicClient.readContract({address:t0addr,abi:erc20Mini,functionName:"name"}).catch(()=>"LightChainAI"),
                        publicClient.readContract({address:t1addr,abi:erc20Mini,functionName:"name"}).catch(()=>"LightChainAI"),
                    ]);
                    const token0 = {address:t0addr,symbol:sym0,name:name0,decimals:18,chainId:chain.id,logoURI:logoMap[t0addr.toLowerCase()]||""};
                    const token1 = {address:t1addr,symbol:sym1,name:name1,decimals:18,chainId:chain.id,logoURI:logoMap[t1addr.toLowerCase()]||""};
                    allPairs.push({
                        address:pairAddress, token0, token1,
                        liquidity:lpBalance,
                        reserve0:reserves[0], reserve1:reserves[1],
                        amount0:totalSupply>0n?lpBalance*reserves[0]/totalSupply:0n,
                        amount1:totalSupply>0n?lpBalance*reserves[1]/totalSupply:0n,
                        totalSupply,
                    } as Pair);
                }
            }
            // also include manually imported pairs
            const WETH = config.WETH[chain.id];
            const importedAddresses = await Promise.all(
                Object.values(pairTokens[chain.id]||{}).map(([t0,t1]) =>
                    factoryV2Contract.read.getPair([t0.address||WETH, t1.address||WETH])
                )
            );
            for (const [idx, pairAddress] of importedAddresses.entries()) {
                if (pairAddress===zeroAddress) continue;
                if (allPairs.find(p=>p.address.toLowerCase()===pairAddress.toLowerCase())) continue;
                const pair = getContract({address:pairAddress,abi:pairAbi,client:publicClient});
                const lpBalance = await pair.read.balanceOf([address]);
                if (lpBalance===0n) continue;
                const [reserves,totalSupply] = await Promise.all([pair.read.getReserves(),pair.read.totalSupply()]);
                const tokens = Object.values(pairTokens[chain.id]||{})[idx];
                allPairs.push({
                    address:pairAddress, token0:tokens[0], token1:tokens[1],
                    liquidity:lpBalance,
                    reserve0:reserves[0], reserve1:reserves[1],
                    amount0:totalSupply>0n?lpBalance*reserves[0]/totalSupply:0n,
                    amount1:totalSupply>0n?lpBalance*reserves[1]/totalSupply:0n,
                    totalSupply,
                } as Pair);
            }
            setPairs(allPairs);
        } catch(e) { console.error(e); }
        setLoadingPage(false);
    };

    useEffect(() => {
        loadMyPools();
        fetchStats().then(s => { if (s) setLcaiUsd(s.priceUsd); }).catch(()=>{});
        if (address) fetchCoins().then(coins => {
            const m: Record<string,string> = {};
            coins.forEach(c => {
                if (c.metadata?.image) {
                    const img = c.metadata.image.startsWith("ipfs://") ? "https://ipfs.io/ipfs/"+c.metadata.image.slice(7) : c.metadata.image;
                    m[c.address.toLowerCase()] = img;
                }
            });
            setLogoMap(m);
        }).catch(()=>{});
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
                            <Link href="/add" className="rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5" style={{background:"linear-gradient(180deg,#ffaa32,#e07a12)",color:"#140d05"}}>+ Add V2 Liquidity</Link>
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
                                            {lcaiUsd > 0 && (() => {
                                                const wlcai = "0xd73cedfc5b894323bdb18a1e31e7bb186fce5f64";
                                                const t0isWlcai = pair.token0.address?.toLowerCase() === wlcai;
                                                const t1isWlcai = pair.token1.address?.toLowerCase() === wlcai;
                                                const lcaiAmt = t0isWlcai ? Number(formatUnits(pair.amount0, 18)) : t1isWlcai ? Number(formatUnits(pair.amount1, 18)) : 0;
                                                const totalUsd = lcaiAmt * 2 * lcaiUsd;
                                                return totalUsd > 0 ? (
                                                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl p-3" style={{background:"rgba(255,140,30,.08)",border:"1px solid rgba(255,140,30,.2)"}}>
                                                        <span className="font-semibold" style={{color:"var(--ae-aurum)"}}>Estimated Position Value</span>
                                                        <span className="font-bold text-lg" style={{color:"var(--ae-aurum)"}}>${totalUsd.toLocaleString(undefined,{maximumFractionDigits:2})}</span>
                                                    </div>
                                                ) : null;
                                            })()}
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span>Your Total Pool Tokens:</span>
                                                <span>{formatNumber(formatEther(pair.liquidity))}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span>
                                                    Pooled {pair.token0.symbol === "WLCAI" ? "LCAI (wrapped)" : pair.token0.symbol}:
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
                                                    Pooled {pair.token1.symbol === "WLCAI" ? "LCAI (wrapped)" : pair.token1.symbol}:
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
                                            <div className="text-xs rounded-xl p-3" style={{background:"rgba(255,140,30,.06)",color:"var(--ae-nebula)"}}>
                                                ⚠️ <strong>Impermanent loss warning:</strong> If the price of your tokens changes significantly since you added liquidity, you may receive less value than if you had simply held them. <a href="/pools/guide" style={{color:"var(--ae-aurum)"}}>Learn more →</a>
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
                                <div className="py-10 text-center">
                                  <div style={{fontSize:32,marginBottom:12}}>{"💧"}</div>
                                  <div className="font-semibold mb-2" style={{color:"var(--clr-heading)",fontFamily:"var(--font-display),serif"}}>No LP positions found</div>
                                  <div className="text-sm" style={{color:"var(--ae-nebula)",maxWidth:400,margin:"0 auto 8px",lineHeight:1.6}}>
                                    Liquidity pools are created when a Forge coin graduates, or you can create one manually with any two tokens.<br/><br/>
                                    Looking for your token balances? Those live in <a href="/portfolio" style={{color:"var(--ae-aurum)"}}>Portfolio</a>.
                                  </div>
                                </div>
                            )}
                        </Accordion>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

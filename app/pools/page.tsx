'use client'
import { FORGE_IMAGE_OVERRIDES } from "@/config/forge";

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

    const loadMyPools = async (overrideLogoMap?: Record<string,string>) => {
        const logoMap = overrideLogoMap instanceof MouseEvent ? {} : (overrideLogoMap ?? {}); // use passed map, not stale state
        if (!address) { setLoadingPage(false); return; }
        setLoadingPage(true);
        try {
            // Get pair list + token map from indexer
            const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL || "";
            const [pairList, tokenList, coinList] = INDEXER
                ? await Promise.all([
                    fetch(`${INDEXER}/api/v1/pairs?limit=200`).then(r=>r.json()).catch(()=>[]),
                    fetch(`${INDEXER}/api/v1/tokens?limit=500`).then(r=>r.json()).catch(()=>[]),
                    fetch(`${INDEXER}/api/v1/forge/coins?limit=200`).then(r=>r.json()).catch(()=>[]),
                  ])
                : [[], [], []];
            const tokenMap: Record<string,{symbol:string,name:string}> = {};
            for (const t of (tokenList as any[])) {
                if (t.address) tokenMap[t.address.toLowerCase()] = {symbol: t.symbol||"TOKEN", name: t.name||"Token"};
            }
            // build logoMap from forge coins upfront so images show on first load
            const newLogoMap: Record<string,string> = {};
            for (const c of (coinList as any[])) {
                try {
                    const meta = JSON.parse(c.metadata_uri || "{}");
                    if (meta.image && !newLogoMap[c.address?.toLowerCase()]) {
                        const rawImg = meta.image.startsWith("ipfs://") ? "https://ipfs.io/ipfs/"+meta.image.slice(7) : meta.image;
                        const img = rawImg.startsWith("/api/image") ? rawImg : `/api/image?url=${encodeURIComponent(rawImg)}`;
                        newLogoMap[c.address.toLowerCase()] = img;
                    }
                } catch {}
            }
            if (Object.keys(newLogoMap).length) setLogoMap(newLogoMap);
            const allPairs: Pair[] = [];
            for (const p of (pairList as any[])) {
                const pairAddress = p.address as `0x${string}`;
                const pair = getContract({address:pairAddress,abi:pairAbi,client:publicClient});
                const lpBalance = await pair.read.balanceOf([address]);
                if (lpBalance === 0n) continue;
                const [reserves, totalSupply] = await Promise.all([
                    pair.read.getReserves(),
                    pair.read.totalSupply(),
                ]);
                const t0addr = p.token0 as `0x${string}`;
                const t1addr = p.token1 as `0x${string}`;
                const wlcai = "0xd73cedfc5b894323bdb18a1e31e7bb186fce5f64";
                const baseAddr = (p.base_token as string)?.toLowerCase();
                const baseInfo = tokenMap[baseAddr] || {symbol: baseAddr?.slice(0,6)||"TOKEN", name: baseAddr||"Token"};
                const baseLogoURI = logoMap[baseAddr] || "";
                const isT0Wlcai = t0addr.toLowerCase()===wlcai;
                const token0 = {address:t0addr,symbol:isT0Wlcai?"LCAI":baseInfo.symbol,name:isT0Wlcai?"LightChainAI":baseInfo.name,decimals:18,chainId:chain.id,logoURI:isT0Wlcai?"/images/brand/lcai.svg":baseLogoURI};
                const token1 = {address:t1addr,symbol:!isT0Wlcai?"LCAI":baseInfo.symbol,name:!isT0Wlcai?"LightChainAI":baseInfo.name,decimals:18,chainId:chain.id,logoURI:!isT0Wlcai?"/images/brand/lcai.svg":baseLogoURI};
                allPairs.push({
                    address:pairAddress, token0, token1,
                    liquidity:lpBalance,
                    reserve0:reserves[0], reserve1:reserves[1],
                    amount0:totalSupply>0n?lpBalance*reserves[0]/totalSupply:0n,
                    amount1:totalSupply>0n?lpBalance*reserves[1]/totalSupply:0n,
                    totalSupply,
                } as Pair);
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
        fetchStats().then(s => { if (s) setLcaiUsd(s.priceUsd); }).catch(()=>{});
        if (address) {
            fetchCoins().then(coins => {
                const m: Record<string,string> = {};
                coins.forEach(c => {
                    const override = FORGE_IMAGE_OVERRIDES[c.address.toLowerCase()] ?? FORGE_IMAGE_OVERRIDES[c.address];
                    if (override) {
                        m[c.address.toLowerCase()] = override;
                    } else if (c.metadata?.image) {
                        const rawImg = c.metadata.image.startsWith("ipfs://") ? "https://ipfs.io/ipfs/"+c.metadata.image.slice(7) : c.metadata.image;
                        m[c.address.toLowerCase()] = rawImg.startsWith("/api/image") ? rawImg : `/api/image?url=${encodeURIComponent(rawImg)}`;
                    }
                });
                setLogoMap(m);
                loadMyPools(m);
            }).catch(()=>{ loadMyPools(); });
        } else {
            loadMyPools();
        }
    }, [address, chain]);
    useEffect(() => {
        if (!Object.keys(logoMap).length) return;
        setPairs(prev => prev.map(pair => ({
            ...pair,
            token0: { ...pair.token0, logoURI: logoMap[pair.token0.address?.toLowerCase() ?? ""] || pair.token0.logoURI },
            token1: { ...pair.token1, logoURI: logoMap[pair.token1.address?.toLowerCase() ?? ""] || pair.token1.logoURI },
        })));
    }, [logoMap]);

    return (
        <div className="container py-12">
            <div className="mb-6 -mx-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/banners/pools.png" alt="Pools" className="w-full rounded-xl object-cover" style={{ maxHeight: 220 }} />
            </div>
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
                        <button onClick={() => loadMyPools()} className="text-xs underline hover:opacity-80" style={{color:"var(--ae-nebula)"}}>↺ Refresh</button>
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
                                            <div className="flex items-center justify-end flex-wrap gap-2">
                                                <Button className="w-32 rounded-full" asChild>
                                                    <Link
                                                        href={getRouteAsPath("/add/[token0]/[token1]", {
                                                            token0: pair.token0.address?.toLowerCase() === "0xd73cedfc5b894323bdb18a1e31e7bb186fce5f64" ? "LCAI" : (pair.token0.address || pair.token0.symbol),
                                                            token1: pair.token1.address?.toLowerCase() === "0xd73cedfc5b894323bdb18a1e31e7bb186fce5f64" ? "LCAI" : (pair.token1.address || pair.token1.symbol),
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

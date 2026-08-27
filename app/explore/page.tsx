"use client";
import { useEffect, useState } from "react";
import { FORGE_IMAGE_OVERRIDES } from "@/config/forge";
import { useAccount } from "wagmi";
import { createPublicClient, http, erc20Abi, formatEther } from "viem";
import { lcai } from "@/config/chains";
import Link from "next/link";
import useForge from "@/hooks/useForge";
import useMarkets from "@/hooks/useMarkets";
import PriceSparkline from "@/components/PriceSparkline";

const client = createPublicClient({ chain: lcai, transport: http("https://rpc.mainnet.lightchain.ai") });
const MY_FACTORY = "0x5cf3b069ddb232d1adc5139a9efb30c48f629389";
const TEAM_FACTORY = "0xba502917c3f7233f9100f9430f4048a224a7d8de";
const WLCAI = "0xd73cedfc5b894323bdb18a1e31e7bb186fce5f64";
const DEAD = "0x000000000000000000000000000000000000dead" as `0x${string}`;
const SYNC_TOPIC = "0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1";
const PAIR_ABI = [
  {type:"function",name:"getReserves",inputs:[],outputs:[{type:"uint112"},{type:"uint112"},{type:"uint32"}],stateMutability:"view"},
  {type:"function",name:"token0",inputs:[],outputs:[{type:"address"}],stateMutability:"view"},
  {type:"function",name:"totalSupply",inputs:[],outputs:[{type:"uint256"}],stateMutability:"view"},
  {type:"function",name:"balanceOf",inputs:[{type:"address"}],outputs:[{type:"uint256"}],stateMutability:"view"},
] as const;

type Pair = {
  pair:string; token:string; name:string; symbol:string; factory:string;
  reserveLCAI:bigint; pricePerToken:number; priceUsd:number;
  mcapUsd:number; lpBurned:boolean; logoURI?:string; history:number[]; change:number;
};
type ForgeCoin = { token:string; name:string; symbol:string; logoURI?:string; progressBps:number; lcaiRaised:bigint; };

const fmt = (n:number,d=2) => n.toLocaleString(undefined,{maximumFractionDigits:d});
const compact = (n:number) => n>=1e6?"$"+fmt(n/1e6)+"M":n>=1e3?"$"+fmt(n/1e3)+"K":"$"+fmt(n,4);
const fmtLiq = (v:bigint) => fmt(Number(formatEther(v)),0)+" LCAI";

function Logo({url,sym}:{url?:string;sym:string}){
  const [e,setE]=useState(false);
  return url&&!e
    ?<img src={url} onError={()=>setE(true)} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" style={{background:"var(--ae-veil)"}}/>
    :<div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{background:"var(--ae-veil)",color:"var(--ae-aurum)"}}>{sym.slice(0,2)}</div>;
}

export default function Explore(){
  const [pairs,setPairs]=useState<Pair[]>([]);
  const [forge,setForge]=useState<ForgeCoin[]>([]);
  const [loading,setLoading]=useState(true);
  const [lcaiUsdState,setLcaiUsdState]=useState(0);
  const [lpBalances,setLpBalances]=useState<Record<string,bigint>>({});
  const {fetchCoins}=useForge();
  const {fetchStats}=useMarkets();
  const {address}=useAccount();

  useEffect(()=>{
    (async()=>{
      const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL || "";
      const [pairsRaw, stats] = await Promise.all([
        INDEXER ? fetch(`${INDEXER}/api/v1/pairs?limit=200`).then(r=>r.json()).catch(()=>[]) : Promise.resolve([]),
        fetchStats().catch(()=>null),
      ]);
      const lcaiUsd = stats?.priceUsd ?? 0;
      setLcaiUsdState(lcaiUsd);

      const coins = await fetchCoins().catch(()=>[]);
      const logoMap:Record<string,string>={};
      Object.assign(logoMap, Object.fromEntries(Object.entries(FORGE_IMAGE_OVERRIDES).map(([k,v])=>[k.toLowerCase(),v])));
      for(const c of coins){
        if(!logoMap[c.address.toLowerCase()] && c.metadata?.image){
          const rawImg=c.metadata.image.startsWith("ipfs://")?"https://ipfs.io/ipfs/"+c.metadata.image.slice(7):c.metadata.image;
          logoMap[c.address.toLowerCase()]=rawImg.startsWith("/api/image") ? rawImg : `/api/image?url=${encodeURIComponent(rawImg)}`;
        }
      }

      const all:Pair[] = [];
      for(const p of (pairsRaw as any[])){
        if(!p.base_token) continue;
        const reserveLCAI = BigInt(p.wlcai_is_t0 ? p.reserve0 : p.reserve1);
        const reserveToken = BigInt(p.wlcai_is_t0 ? p.reserve1 : p.reserve0);
        if(reserveLCAI === 0n) continue;
        const pricePerToken = Number(reserveLCAI) / Number(reserveToken);
        const priceUsd = pricePerToken * lcaiUsd;
        const lpBurned = p.lp_burned;
        // fetch price history from indexer
        let history:number[] = [];
        let change = 0;
        try{
          const hist = INDEXER ? await fetch(`${INDEXER}/api/v1/pairs/${p.address}/history?limit=200`).then(r=>r.json()) : [];
          history = (hist as any[]).map((h:any)=>h.price_lcai).filter(Boolean);
          if(history.length>=2) change=((history[history.length-1]-history[0])/history[0])*100;
        }catch{}
        all.push({
          pair: p.address,
          token: p.base_token,
          name: p.base_token, // will be overridden by token name below
          symbol: p.base_token,
          factory: p.factory_label,
          reserveLCAI,
          pricePerToken,
          priceUsd,
          mcapUsd: 0,
          lpBurned,
          logoURI: logoMap[p.base_token.toLowerCase()],
          history,
          change,
        });
      }
      // enrich with token name/symbol from forge coins
      for(const c of coins){
        const row = all.find(a=>a.token.toLowerCase()===c.address.toLowerCase());
        if(row){ row.name=c.name; row.symbol=c.symbol; }
      }
      all.sort((a,b)=>b.reserveLCAI>a.reserveLCAI?1:-1);
      setPairs(all);
      if(address){
        const balMap:Record<string,bigint>={};
        await Promise.all(all.map(async pr=>{
          try{
            const bal=await client.readContract({address:pr.pair as `0x${string}`,abi:erc20Abi,functionName:"balanceOf",args:[address]});
            if((bal as bigint)>0n) balMap[pr.pair.toLowerCase()]=bal as bigint;
          }catch{}
        }));
        setLpBalances(balMap);
      }
      const forgeList:ForgeCoin[]=coins.filter(c=>!c.graduated).map(c=>({
        token:c.address,name:c.name,symbol:c.symbol,
        logoURI:logoMap[c.address.toLowerCase()],
        progressBps:c.progressBps,lcaiRaised:c.lcaiRaised,
      }));
      setForge(forgeList.sort((a,b)=>b.progressBps-a.progressBps));
      setLoading(false);
    })();
  },[]);

  const totalLCAI=pairs.reduce((a,p)=>a+p.reserveLCAI,0n);

  return(
    <main className="mx-auto max-w-5xl px-4 py-10 min-h-[70vh]">
      <div className="f-eyebrow mb-2">Filament DEX · LightChain AI</div>
      <h1 className="f-display text-4xl sm:text-5xl mb-1">Stay Ahead of the Curve.</h1>
      <p className="f-meta mb-8">Every token with liquidity on LightChain AI — live from on-chain events, powered by Filament Indexer™.</p>
      {loading?(
        <div className="f-card rounded-2xl p-10 text-center">
          <div className="text-3xl mb-3">🔍</div>
          <div className="font-semibold mb-1" style={{color:"var(--ae-aurum)",fontFamily:"var(--font-display),serif"}}>Scanning on-chain…</div>
          <div className="f-meta text-sm">Reading pair events from all DEX contracts</div>
        </div>
      ):(
        <>
          {/* stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="f-card rounded-2xl p-4 text-center">
                <div className="text-xl font-bold" style={{color:"var(--ae-aurum)"}}>{pairs.length}</div>
                <div className="f-meta text-xs mt-1">Live pairs</div>
              </div>
              <div className="f-card rounded-2xl p-4 text-center">
                <div className="text-xl font-bold" style={{color:"var(--ae-aurum)"}}>{pairs.filter(p=>p.lpBurned).length}</div>
                <div className="f-meta text-xs mt-1">LP burned</div>
              </div>
              </div>
              <div className="f-card rounded-2xl p-4 text-center mb-8">
                <div className="text-2xl font-bold" style={{color:"var(--ae-aurum)"}}>{fmtLiq(totalLCAI)}</div>
                <div className="f-meta text-xs mt-1">Total LCAI Locked</div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-8" style={{display:"none"}}>
          </div>

          {/* desktop header */}
          <div className="hidden sm:flex items-center gap-3 text-xs font-semibold px-4 mb-2" style={{color:"var(--ae-nebula)"}}>
            <span className="w-6">#</span>
            <span className="w-10"/>
            <span className="flex-1">Token</span>
            <span className="w-28 text-right">Price</span>
            <span className="w-24 text-right">Change</span>
            <span className="w-28 text-right">Liquidity</span>
            <span className="w-24 text-right">Mkt Cap</span>
            <span className="w-20 text-center">Chart</span>
            <span className="w-16 text-center">LP</span>
          </div>

          {/* pairs */}
          <div className="space-y-2 mb-10">
            {pairs.map((p,i)=>{
              const up=p.change>=0;
              return(
                <Link key={p.pair} href={`/forge/${p.token}`}
                  className="f-card rounded-2xl px-4 py-3.5 hover:-translate-y-0.5 transition-all block">
                  {/* desktop row */}
                  <div className="hidden sm:flex items-center gap-3">
                    <span className="w-6 text-xs text-center flex-shrink-0" style={{color:"var(--ae-nebula)"}}>{i+1}</span>
                    <Logo url={p.logoURI} sym={p.symbol}/>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-semibold truncate" style={{color:"var(--clr-heading)",fontFamily:"var(--font-display),serif"}}>
                        {p.name}
                      </div>
                      <div className="text-xs f-meta flex items-center gap-2 mt-0.5">
                        <span>${p.symbol}</span>
                        {p.factory==="Filament"&&<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{background:"rgba(255,140,30,.2)",color:"var(--ae-aurum)"}}>✦ Exclusive</span>}
                        {lpBalances[p.pair.toLowerCase()]&&<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{background:"rgba(74,222,128,.15)",color:"var(--clr-success)"}}>◆ Your LP</span>}
                      </div>
                    </div>
                    <div className="w-28 text-right flex-shrink-0">
                      <div className="text-sm font-semibold" style={{color:"var(--clr-heading)"}}>{p.priceUsd>0?"$"+p.priceUsd.toFixed(6):p.pricePerToken.toFixed(6)+" LCAI"}</div>
                      <div className="text-xs f-meta">{p.priceUsd>0?"USD":"LCAI"}</div>
                    </div>
                    <div className="w-24 text-right flex-shrink-0">
                      <div className="text-sm font-semibold" style={{color:up?"var(--clr-success)":"var(--clr-danger)"}}>{p.change!==0?(up?"+":"")+p.change.toFixed(1)+"%":"—"}</div>
                      <div className="text-xs f-meta">all time</div>
                    </div>
                    <div className="w-28 text-right flex-shrink-0">
                      <div className="text-sm font-semibold" style={{color:"var(--clr-heading)"}}>{fmt(Number(formatEther(p.reserveLCAI)),0)} LCAI</div>
                      <div className="text-xs f-meta">{lcaiUsdState>0?"$"+fmt(Number(formatEther(p.reserveLCAI))*lcaiUsdState,0)+" USD":""}</div>
                    </div>
                    <div className="w-24 text-right flex-shrink-0">
                      <div className="text-sm font-semibold" style={{color:"var(--clr-heading)"}}>{p.mcapUsd>0?compact(p.mcapUsd):"—"}</div>
                      <div className="text-xs f-meta">mkt cap</div>
                    </div>
                    <div className="w-20 flex-shrink-0 flex justify-center">
                      <PriceSparkline points={p.history} width={72} height={36}/>
                    </div>
                    <div className="w-16 flex-shrink-0 flex justify-center">
                      {p.lpBurned
                        ?<span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:"rgba(255,140,30,.15)",color:"var(--ae-aurum)"}}>🔥 Burned</span>
                        :<span className="text-[10px] px-2 py-0.5 rounded-full" style={{background:"var(--ae-veil)",color:"var(--ae-nebula)"}}>Active</span>}
                    </div>
                  </div>
                  {/* mobile row */}
                  <div className="flex sm:hidden items-center gap-3">
                    <Logo url={p.logoURI} sym={p.symbol}/>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-semibold truncate" style={{color:"var(--clr-heading)",fontFamily:"var(--font-display),serif"}}>{p.name}</div>
                      <div className="text-xs f-meta truncate">${p.symbol} · {fmt(Number(formatEther(p.reserveLCAI)),0)} LCAI</div>
                      {p.factory==="Filament"&&<div className="mt-1"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{background:"rgba(255,140,30,.2)",color:"var(--ae-aurum)"}}>✦ Exclusive</span></div>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold" style={{color:"var(--clr-heading)"}}>{p.priceUsd>0?"$"+p.priceUsd.toFixed(6):p.pricePerToken.toFixed(6)}</div>
                      <div className="text-xs font-semibold" style={{color:up?"var(--clr-success)":"var(--clr-danger)"}}>{p.change!==0?(up?"+":"")+p.change.toFixed(1)+"%":"—"}</div>
                    </div>
                    <PriceSparkline points={p.history} width={60} height={32}/>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* forge section */}
          {forge.length>0&&(
            <>
              <div className="f-eyebrow mb-4">🔥 On the Forge — approaching graduation</div>
              <div className="space-y-2">
                {forge.map(c=>(
                  <Link key={c.token} href={`/forge/${c.token}`}
                    className="f-card rounded-2xl p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all">
                    <Logo url={c.logoURI} sym={c.symbol}/>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold" style={{color:"var(--clr-heading)",fontFamily:"var(--font-display),serif"}}>
                        {c.name} <span className="f-meta font-normal">${c.symbol}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{background:"var(--ae-veil)",maxWidth:200}}>
                        <div className="h-full rounded-full forge-fil-bar" style={{width:`${Math.min(c.progressBps/100,100).toFixed(1)}%`}}/>
                      </div>
                      <div className="text-xs f-meta mt-0.5">{(c.progressBps/100).toFixed(1)}% · {fmt(Number(formatEther(c.lcaiRaised)),0)} LCAI raised</div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{background:"rgba(255,140,30,.15)",color:"var(--ae-aurum)"}}>Trade on Forge →</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}

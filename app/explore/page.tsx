"use client";
import { useEffect, useState } from "react";
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
  const {fetchCoins}=useForge();
  const {fetchStats}=useMarkets();

  useEffect(()=>{
    (async()=>{
      const [coins,stats]=await Promise.all([fetchCoins().catch(()=>[]),fetchStats().catch(()=>null)]);
      const lcaiUsd=stats?.priceUsd??0;
      const logoMap:Record<string,string>={};
      for(const c of coins){
        if(c.metadata?.image){
          const img=c.metadata.image.startsWith("ipfs://")?"https://ipfs.io/ipfs/"+c.metadata.image.slice(7):c.metadata.image;
          logoMap[c.address.toLowerCase()]=img;
        }
      }
      const all:Pair[]=[];
      const seen=new Set<string>();
      for(const fac of [{a:MY_FACTORY,l:"Filament"},{a:TEAM_FACTORY,l:"Official"}]){
        const logs=await client.getLogs({address:fac.a as `0x${string}`,fromBlock:0n,toBlock:"latest"});
        for(const l of logs){
          if(!l.topics[1]||!l.topics[2])continue;
          const t0=("0x"+l.topics[1].slice(26)) as `0x${string}`;
          const t1=("0x"+l.topics[2].slice(26)) as `0x${string}`;
          const pair=("0x"+l.data.slice(26,66)) as `0x${string}`;
          const token=t0.toLowerCase()===WLCAI?t1:t0;
          seen.add(token.toLowerCase());
          try{
            const [name,symbol,tsRaw,t0addr,res,ts,burned]=await Promise.all([
              client.readContract({address:token,abi:erc20Abi,functionName:"name"}),
              client.readContract({address:token,abi:erc20Abi,functionName:"symbol"}),
              client.readContract({address:token,abi:erc20Abi,functionName:"totalSupply"}),
              client.readContract({address:pair,abi:PAIR_ABI,functionName:"token0"}),
              client.readContract({address:pair,abi:PAIR_ABI,functionName:"getReserves"}),
              client.readContract({address:pair,abi:PAIR_ABI,functionName:"totalSupply"}),
              client.readContract({address:pair,abi:PAIR_ABI,functionName:"balanceOf",args:[DEAD]}),
            ]);
            const wlcaiIsT0=(t0addr as string).toLowerCase()===WLCAI;
            const r=res as [bigint,bigint,number];
            // if wlcai is token0: r[0]=wlcai=lcai, r[1]=token
            // if wlcai is token1: r[0]=token, r[1]=wlcai=lcai
            const reserveLCAI=wlcaiIsT0?r[0]:r[1];
            const reserveToken=wlcaiIsT0?r[1]:r[0];
            if(reserveLCAI===0n)continue;
            const pricePerToken=Number(formatEther(reserveLCAI))/Number(formatEther(reserveToken));
            const priceUsd=pricePerToken*lcaiUsd;
            const mcapUsd=priceUsd*Number(formatEther(tsRaw as bigint));
            const lpTotal=ts as bigint;
            const lpBurned=lpTotal>0n&&(burned as bigint)>=lpTotal*99n/100n;
            // price history from sync events
            const slogs=await client.getLogs({address:pair,fromBlock:0n,toBlock:"latest"});
            const history=slogs.filter(s=>s.topics[0]===SYNC_TOPIC).map(s=>{
              const sr0=BigInt("0x"+s.data.slice(2,66));
              const sr1=BigInt("0x"+s.data.slice(66,130));
              const lR=wlcaiIsT0?sr0:sr1;
              const tR=wlcaiIsT0?sr1:sr0;
              return tR>0n?Number(formatEther(lR))/Number(formatEther(tR)):0;
            }).filter(x=>x>0);
            const change=history.length>=2?((history[history.length-1]-history[0])/history[0])*100:0;
            all.push({pair,token,name:name as string,symbol:symbol as string,factory:fac.l,reserveLCAI,pricePerToken,priceUsd,mcapUsd,lpBurned,logoURI:logoMap[token.toLowerCase()],history,change});
          }catch{}
        }
      }
      all.sort((a,b)=>b.reserveLCAI>a.reserveLCAI?1:-1);
      setPairs(all);
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
      <div className="f-eyebrow mb-2">Tokens · LightChain AI</div>
      <h1 className="f-display text-4xl sm:text-5xl mb-1">Explore</h1>
      <p className="f-meta mb-8">Every token with liquidity on LightChain AI — live from on-chain events, zero curation.</p>
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
            {[
              {l:"Live pairs",v:pairs.length.toString()},
              {l:"LCAI locked",v:fmtLiq(totalLCAI)},
              {l:"LP burned",v:pairs.filter(p=>p.lpBurned).length+" pairs"},
            ].map(s=>(
              <div key={s.l} className="f-card rounded-2xl p-4 text-center">
                <div className="text-xl font-bold" style={{color:"var(--ae-aurum)"}}>{s.v}</div>
                <div className="f-meta text-xs mt-1">{s.l}</div>
              </div>
            ))}
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
                      <div className="text-sm font-semibold" style={{color:"var(--clr-heading)"}}>{fmt(Number(formatEther(p.reserveLCAI)),0)}</div>
                      <div className="text-xs f-meta">LCAI</div>
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

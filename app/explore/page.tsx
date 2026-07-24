"use client";
import { useEffect, useState } from "react";
import { createPublicClient, http, erc20Abi, formatEther } from "viem";
import { lcai } from "@/config/chains";
import Link from "next/link";

const client = createPublicClient({ chain: lcai, transport: http("https://rpc.mainnet.lightchain.ai") });

const FACTORIES = [
  { address: "0x5Cf3b069dDB232d1adc5139a9eFb30C48F629389" as `0x${string}`, label: "Filament" },
  { address: "0xBA502917c3F7233F9100f9430f4048a224A7D8DE" as `0x${string}`, label: "Official" },
];
const WLCAI = "0xd73cedfc5b894323bdb18a1e31e7bb186fce5f64";
const DEAD = "0x000000000000000000000000000000000000dead";

const PAIR_EVENT = [{type:"event",name:"PairCreated",inputs:[{name:"token0",type:"address",indexed:true},{name:"token1",type:"address",indexed:true},{name:"pair",type:"address",indexed:false},{name:"",type:"uint256",indexed:false}]}] as const;
const PAIR_ABI = [{type:"function",name:"getReserves",inputs:[],outputs:[{type:"uint112"},{type:"uint112"},{type:"uint32"}],stateMutability:"view"},{type:"function",name:"totalSupply",inputs:[],outputs:[{type:"uint256"}],stateMutability:"view"},{type:"function",name:"balanceOf",inputs:[{type:"address"}],outputs:[{type:"uint256"}],stateMutability:"view"}] as const;

type PairInfo = {
  pair: string;
  token: string;
  name: string;
  symbol: string;
  factory: string;
  reserveLCAI: bigint;
  lpBurned: boolean;
};

function shortAddr(a: string) { return a.slice(0,6)+"…"+a.slice(-4); }
function fmtLCAI(v: bigint) { return Number(formatEther(v)).toLocaleString(undefined,{maximumFractionDigits:0}); }

export default function ExplorePage() {
  const [pairs, setPairs] = useState<PairInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const all: PairInfo[] = [];
      for (const factory of FACTORIES) {
        const logs = await client.getLogs({ address: factory.address, event: PAIR_EVENT[0], fromBlock: 0n, toBlock: "latest" }).catch(() => []);
        for (const l of logs) {
          const raw = l as any;
          const t0 = ("0x"+raw.topics[1].slice(26)) as `0x${string}`;
          const t1 = ("0x"+raw.topics[2].slice(26)) as `0x${string}`;
          const pair = ("0x"+raw.data.slice(26,66)) as `0x${string}`;
          const token = t0.toLowerCase() === WLCAI ? t1 : t0;
          try {
            const [name, symbol, reserves, totalSupply, burnedLP] = await Promise.all([
              client.readContract({ address: token, abi: erc20Abi, functionName: "name" }),
              client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" }),
              client.readContract({ address: pair, abi: PAIR_ABI, functionName: "getReserves" }),
              client.readContract({ address: pair, abi: PAIR_ABI, functionName: "totalSupply" }),
              client.readContract({ address: pair, abi: PAIR_ABI, functionName: "balanceOf", args: [DEAD as `0x${string}`] }),
            ]);
            const isToken0WLCAI = t0.toLowerCase() === WLCAI;
            const reserveLCAI = isToken0WLCAI ? (reserves as any)[0] : (reserves as any)[1];
            const lpBurned = totalSupply > 0n && (burnedLP as bigint) >= (totalSupply as bigint) * 99n / 100n;
            all.push({ pair, token, name: name as string, symbol: symbol as string, factory: factory.label, reserveLCAI, lpBurned });
          } catch {}
        }
      }
      all.sort((a, b) => (b.reserveLCAI > a.reserveLCAI ? 1 : -1));
      setPairs(all);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 min-h-[70vh]">
      <div className="f-eyebrow mb-2">All tokens · LightChain AI</div>
      <h1 className="f-display text-4xl sm:text-5xl mb-2">Explore</h1>
      <p className="f-meta mb-8">Every token pair on LightChain AI — all DEX contracts, one page. Updated live from on-chain events.</p>

      {loading ? (
        <div className="f-card rounded-2xl p-10 text-center">
          <div className="text-2xl mb-2">🔍</div>
          <div className="f-meta">Scanning all pairs on-chain…</div>
        </div>
      ) : pairs.length === 0 ? (
        <div className="f-card rounded-2xl p-10 text-center f-meta">No pairs found.</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="f-card rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold" style={{color:"var(--ae-aurum)"}}>{pairs.length}</div>
              <div className="f-meta text-xs mt-1">Total pairs</div>
            </div>
            <div className="f-card rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold" style={{color:"var(--ae-aurum)"}}>{fmtLCAI(pairs.reduce((a,p)=>a+p.reserveLCAI,0n))}</div>
              <div className="f-meta text-xs mt-1">LCAI locked</div>
            </div>
            <div className="f-card rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold" style={{color:"var(--ae-aurum)"}}>{pairs.filter(p=>p.lpBurned).length}</div>
              <div className="f-meta text-xs mt-1">LP burned forever</div>
            </div>
          </div>

          <div className="space-y-3">
            {pairs.map((p, i) => (
              <Link key={p.pair} href={`/?token=${p.token}`}
                className="f-card rounded-2xl p-4 flex items-center gap-4 hover:-translate-y-0.5 transition-all block">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{background:"var(--ae-veil)",color:"var(--ae-aurum)"}}>
                  {i+1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold" style={{color:"var(--clr-heading)",fontFamily:"var(--font-display),serif"}}>
                    {p.name} <span className="f-meta font-normal">${p.symbol}</span>
                  </div>
                  <div className="text-xs mt-0.5 f-meta">{shortAddr(p.token)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold" style={{color:"var(--clr-heading)"}}>{fmtLCAI(p.reserveLCAI)} LCAI</div>
                  <div className="text-xs f-meta">liquidity</div>
                </div>
                {p.lpBurned && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{background:"rgba(255,140,30,.15)",color:"var(--ae-aurum)"}}>🔥 LP burned</span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{background:"var(--ae-veil)",color:"var(--ae-nebula)"}}>
                  {p.factory}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

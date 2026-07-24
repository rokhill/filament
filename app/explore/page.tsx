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
const FACTORIES = [
  { address: MY_FACTORY as `0x${string}`, label: "Filament" },
  { address: TEAM_FACTORY as `0x${string}`, label: "Official" },
];
const WLCAI = "0xd73cedfc5b894323bdb18a1e31e7bb186fce5f64";
const DEAD = "0x000000000000000000000000000000000000dead" as `0x${string}`;
const SYNC_TOPIC = "0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1";
const PAIR_ABI = [
  {type:"function",name:"getReserves",inputs:[],outputs:[{type:"uint112",name:"r0"},{type:"uint112",name:"r1"},{type:"uint32",name:"t"}],stateMutability:"view"},
  {type:"function",name:"token0",inputs:[],outputs:[{type:"address"}],stateMutability:"view"},
  {type:"function",name:"totalSupply",inputs:[],outputs:[{type:"uint256"}],stateMutability:"view"},
  {type:"function",name:"balanceOf",inputs:[{type:"address",name:"a"}],outputs:[{type:"uint256"}],stateMutability:"view"},
] as const;

type PairInfo = {
  pair: string; token: string; name: string; symbol: string;
  factory: string; reserveLCAI: bigint; reserveToken: bigint;
  pricePerToken: number; lpBurned: boolean; logoURI?: string;
  totalSupply: bigint; priceHistory: number[];
  change: number;
};

type ForgeOnly = {
  token: string; name: string; symbol: string; logoURI?: string; progressBps: number; lcaiRaised: bigint;
};

function shortAddr(a: string) { return a.slice(0,6)+"…"+a.slice(-4); }
function fmtLCAI(v: bigint, d=0) { return Number(formatEther(v)).toLocaleString(undefined,{maximumFractionDigits:d}); }
function fmtCompact(n: number) {
  if (n >= 1_000_000) return "$"+(n/1_000_000).toFixed(2)+"M";
  if (n >= 1_000) return "$"+(n/1_000).toFixed(1)+"K";
  return "$"+n.toFixed(2);
}
function fmtPrice(p: number) {
  if (p === 0) return "—";
  if (p < 0.000001) return p.toExponential(4);
  if (p < 0.01) return p.toFixed(6);
  if (p < 1) return p.toFixed(4);
  return p.toFixed(2);
}

function TokenLogo({ logo, symbol }: { logo?: string; symbol: string }) {
  const [err, setErr] = useState(false);
  if (logo && !err) return (
    <img src={logo} alt={symbol} onError={()=>setErr(true)}
      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
      style={{background:"var(--ae-veil)"}} />
  );
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
      style={{background:"var(--ae-veil)",color:"var(--ae-aurum)"}}>
      {symbol.slice(0,2).toUpperCase()}
    </div>
  );
}

export default function ExplorePage() {
  const [pairs, setPairs] = useState<PairInfo[]>([]);
  const [forgeOnly, setForgeOnly] = useState<ForgeOnly[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchCoins } = useForge();
  const { fetchStats } = useMarkets();
  const [lcaiUsd, setLcaiUsd] = useState(0);

  useEffect(() => {
    (async () => {
      const [forgeCoins, stats] = await Promise.all([fetchCoins().catch(()=>[]), fetchStats().catch(()=>null)]);
      if (stats) setLcaiUsd(stats.priceUsd);
      const logoMap: Record<string,string> = {};
      const progressMap: Record<string,number> = {};
      const raisedMap: Record<string,bigint> = {};
      for (const c of forgeCoins) {
        if (c.metadata?.image) {
          const img = c.metadata.image.startsWith("ipfs://")
            ? "https://ipfs.io/ipfs/"+c.metadata.image.slice(7)
            : c.metadata.image;
          logoMap[c.address.toLowerCase()] = img;
        }
        progressMap[c.address.toLowerCase()] = c.progressBps;
        raisedMap[c.address.toLowerCase()] = c.lcaiRaised;
      }

      const all: PairInfo[] = [];
      const seenTokens = new Set<string>();

      for (const factory of FACTORIES) {
        const logs = await client.getLogs({ address: factory.address, fromBlock: 0n, toBlock: "latest" });
        for (const l of logs) {
          if (!l.topics[1] || !l.topics[2]) continue;
          const t0 = ("0x"+l.topics[1].slice(26)) as `0x${string}`;
          const t1 = ("0x"+l.topics[2].slice(26)) as `0x${string}`;
          const pair = ("0x"+l.data.slice(26,66)) as `0x${string}`;
          const token = t0.toLowerCase() === WLCAI ? t1 : t0;
          seenTokens.add(token.toLowerCase());
          try {
            const [name, symbol, totalSupplyRaw, token0addr, reserves, totalSupply, burnedLP] = await Promise.all([
              client.readContract({ address: token, abi: erc20Abi, functionName: "name" }),
              client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" }),
              client.readContract({ address: token, abi: erc20Abi, functionName: "totalSupply" }),
              client.readContract({ address: pair, abi: PAIR_ABI, functionName: "token0" }),
              client.readContract({ address: pair, abi: PAIR_ABI, functionName: "getReserves" }),
              client.readContract({ address: pair, abi: PAIR_ABI, functionName: "totalSupply" }),
              client.readContract({ address: pair, abi: PAIR_ABI, functionName: "balanceOf", args: [DEAD] }),
            ]);
            const isToken0WLCAI = (token0addr as string).toLowerCase() === WLCAI;
            const r = reserves as [bigint,bigint,number];
            const reserveLCAI = isToken0WLCAI ? r[1] : r[0];
            const reserveToken = isToken0WLCAI ? r[0] : r[1];
            const ts = totalSupply as bigint;
            const bl = burnedLP as bigint;
            const lpBurned = ts > 0n && bl >= ts * 99n / 100n;

            // only show tokens with real liquidity
            if (reserveLCAI === 0n) continue;

            // price history from Sync events
            const syncLogs = await client.getLogs({ address: pair, fromBlock: 0n, toBlock: "latest" });
            const syncs = syncLogs.filter(sl => sl.topics[0] === SYNC_TOPIC);
            const priceHistory = syncs.map(sl => {
              const sr0 = BigInt("0x"+sl.data.slice(2,66));
              const sr1 = BigInt("0x"+sl.data.slice(66,130));
              const lcaiR = isToken0WLCAI ? sr1 : sr0;
              const tokR = isToken0WLCAI ? sr0 : sr1;
              return tokR > 0n ? Number(formatEther(lcaiR)) / Number(formatEther(tokR)) : 0;
            }).filter(p => p > 0);

            const pricePerToken = reserveToken > 0n
              ? Number(formatEther(reserveLCAI)) / Number(formatEther(reserveToken))
              : 0;

            const change = priceHistory.length >= 2
              ? ((priceHistory[priceHistory.length-1] - priceHistory[0]) / priceHistory[0]) * 100
              : 0;

            all.push({
              pair, token, name: name as string, symbol: symbol as string,
              factory: factory.label, reserveLCAI, reserveToken,
              pricePerToken, lpBurned,
              logoURI: logoMap[token.toLowerCase()],
              totalSupply: totalSupplyRaw as bigint,
              priceHistory,
              change,
            });
          } catch {}
        }
      }
      all.sort((a,b) => b.reserveLCAI > a.reserveLCAI ? 1 : -1);
      setPairs(all);

      // forge-only: on curve, not yet graduated to any DEX
      const forgeOnlyList: ForgeOnly[] = forgeCoins
        .filter(c => !c.graduated && !seenTokens.has(c.address.toLowerCase()))
        .map(c => ({
          token: c.address,
          name: c.name,
          symbol: c.symbol,
          logoURI: logoMap[c.address.toLowerCase()],
          progressBps: c.progressBps,
          lcaiRaised: c.lcaiRaised,
        }));
      setForgeOnly(forgeOnlyList);
      setLoading(false);
    })();
  }, []);

  const totalLCAI = pairs.reduce((a,p)=>a+p.reserveLCAI,0n);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 min-h-[70vh]">
      <div className="f-eyebrow mb-2">Tokens · LightChain AI</div>
      <h1 className="f-display text-4xl sm:text-5xl mb-1">Explore</h1>
      <p className="f-meta mb-8">Every token with liquidity on LightChain AI — live from on-chain events, zero curation.</p>

      {loading ? (
        <div className="f-card rounded-2xl p-10 text-center">
          <div className="text-3xl mb-3">🔍</div>
          <div className="font-semibold mb-1" style={{color:"var(--ae-aurum)",fontFamily:"var(--font-display),serif"}}>Scanning on-chain…</div>
          <div className="f-meta text-sm">Reading pair events from all DEX contracts</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              {label:"Live pairs", value:pairs.length.toString()},
              {label:"LCAI locked", value:lcaiUsd>0?fmtCompact(Number(formatEther(totalLCAI))*lcaiUsd):fmtLCAI(totalLCAI)+" LCAI"},
              {label:"LP burned", value:pairs.filter(p=>p.lpBurned).length+" pairs"},
            ].map(s=>(
              <div key={s.label} className="f-card rounded-2xl p-4 text-center">
                <div className="text-xl font-bold" style={{color:"var(--ae-aurum)"}}>{s.value}</div>
                <div className="f-meta text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* column headers */}
          <div className="hidden sm:grid text-xs font-semibold px-4 mb-2"
            style={{gridTemplateColumns:"2rem 2.5rem 1fr 6rem 7rem 7rem 7rem 5rem 5rem",color:"var(--ae-nebula)",gap:"0.75rem"}}>
            <span>#</span><span></span><span>Token</span>
            <span className="text-right">Price</span>
            <span className="text-right">Change</span>
            <span className="text-right">Liquidity</span>
            <span className="text-right">Mkt Cap</span>
            <span className="text-center">7d</span>
            <span className="text-center">LP</span>
          </div>

          <div className="space-y-2 mb-10">
            {pairs.map((p,i) => {
              const mcap = p.pricePerToken > 0 ? p.pricePerToken * Number(formatEther(p.totalSupply)) : 0;
              const isFilamentOnly = p.factory === "Filament";
              const changePos = p.change >= 0;
              return (
                <Link key={p.pair} href={`/?outputToken=${p.token}`}
                  className="f-card rounded-2xl p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all">
                  <span className="text-xs font-bold w-6 text-center flex-shrink-0"
                    style={{color:"var(--ae-nebula)"}}>{i+1}</span>
                  <TokenLogo logo={p.logoURI} symbol={p.symbol} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-2 flex-wrap"
                      style={{color:"var(--clr-heading)",fontFamily:"var(--font-display),serif"}}>
                      {p.name}
                      {isFilamentOnly && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{background:"rgba(255,140,30,.2)",color:"var(--ae-aurum)"}}>
                          ✦ Filament Exclusive
                        </span>
                      )}
                    </div>
                    <div className="text-xs f-meta">${p.symbol} · {shortAddr(p.token)}</div>
                  </div>
                  {/* mobile: price + change stacked */}
                  <div className="text-right flex-shrink-0 sm:hidden">
                    <div className="text-sm font-semibold" style={{color:"var(--clr-heading)"}}>{lcaiUsd>0?"$"+(p.pricePerToken*lcaiUsd).toFixed(4):fmtPrice(p.pricePerToken)}</div>
                    {p.change!==0&&<div className="text-xs font-semibold" style={{color:changePos?"var(--clr-success)":"var(--clr-danger)"}}>{changePos?"+":""}{p.change.toFixed(1)}%</div>}
                  </div>
                  {/* desktop columns */}
                  <div className="text-right flex-shrink-0 hidden sm:block" style={{minWidth:80}}>
                    <div className="text-sm font-semibold" style={{color:"var(--clr-heading)"}}>{lcaiUsd>0?"$"+(p.pricePerToken*lcaiUsd).toFixed(6):fmtPrice(p.pricePerToken)+" LCAI"}</div>
                    <div className="text-xs f-meta">{lcaiUsd>0?"USD":"LCAI"}</div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block" style={{minWidth:80}}>
                    {p.change !== 0 ? (
                      <div className="text-sm font-semibold" style={{color:changePos?"var(--clr-success)":"var(--clr-danger)"}}>
                        {changePos?"+":""}{p.change.toFixed(1)}%
                      </div>
                    ) : <div className="text-sm f-meta">—</div>}
                    <div className="text-xs f-meta">all time</div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block" style={{minWidth:90}}>
                    <div className="text-sm font-semibold" style={{color:"var(--clr-heading)"}}>{fmtLCAI(p.reserveLCAI)}</div>
                    <div className="text-xs f-meta">LCAI liq.</div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block" style={{minWidth:90}}>
                    <div className="text-sm font-semibold" style={{color:"var(--clr-heading)"}}>
                      {mcap>0?lcaiUsd>0?fmtCompact(mcap*lcaiUsd):fmtLCAI(BigInt(Math.floor(mcap)))+" LCAI":"—"}
                    </div>
                    <div className="text-xs f-meta">mkt cap</div>
                  </div>
                  <div className="flex-shrink-0 hidden sm:block">
                    <PriceSparkline points={p.priceHistory} width={80} height={36} />
                  </div>
                  {p.lpBurned ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{background:"rgba(255,140,30,.15)",color:"var(--ae-aurum)"}}>🔥 Burned</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{background:"var(--ae-veil)",color:"var(--ae-nebula)"}}>Active</span>
                  )}
                </Link>
              );
            })}
          </div>

          {forgeOnly.length > 0 && (
            <>
              <div className="f-eyebrow mb-4">🔥 On the Forge — approaching graduation</div>
              <div className="space-y-2">
                {forgeOnly.sort((a,b)=>b.progressBps-a.progressBps).map(c => (
                  <Link key={c.token} href={`/forge/${c.token}`}
                    className="f-card rounded-2xl p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all">
                    <TokenLogo logo={c.logoURI} symbol={c.symbol} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold" style={{color:"var(--clr-heading)",fontFamily:"var(--font-display),serif"}}>
                        {c.name} <span className="f-meta font-normal">${c.symbol}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{background:"var(--ae-veil)",maxWidth:200}}>
                        <div className="h-full rounded-full forge-fil-bar"
                          style={{width:`${(c.progressBps/100).toFixed(1)}%`}} />
                      </div>
                      <div className="text-xs f-meta mt-0.5">{(c.progressBps/100).toFixed(1)}% to graduation · {fmtLCAI(c.lcaiRaised)} LCAI raised</div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{background:"rgba(255,140,30,.15)",color:"var(--ae-aurum)"}}>
                      Trade on Forge →
                    </span>
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

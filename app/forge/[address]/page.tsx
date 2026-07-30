"use client"
import { FORGE_IMAGE_OVERRIDES } from "@/config/forge-image-overrides";;
import GraduationBanner from "@/components/GraduationBanner";
import SparkButton from "@/components/SparkButton";
import { useAccount } from "wagmi";
import { useChainGuard } from "@/hooks/useChainGuard";
import useWeb3Clients from "@/hooks/useWeb3Clients";
import useMarkets from "@/hooks/useMarkets";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import useForge, { ForgeCoin, ForgeTrade, fmtLcai, fmtTokens } from "@/hooks/useForge";
import { ipfsToHttp, shortAddr, TOTAL_SUPPLY } from "@/config/forge";
import ProgressBar from "@/components/forge/progress-bar";

/* ------------------------------------------------------------------ */
/*  Price chart — pure SVG from Trade events, no chart lib             */
/* ------------------------------------------------------------------ */

function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 280;
  const isLong = text.length > LIMIT;
  return (
    <div className="mb-4 max-w-2xl">
      <p className="text-sm" style={{ color: "var(--ae-nebula)" }}>
        {expanded || !isLong ? text : text.slice(0, LIMIT) + "…"}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs mt-1 font-semibold"
          style={{ color: "var(--ae-aurum)" }}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function PriceChart({ trades, live }: { trades: ForgeTrade[]; live: bigint }) {
  const points = useMemo(() => {
    const prices = trades.map((t) => Number(formatEther(t.priceWei)));
    prices.push(Number(formatEther(live)));
    return prices;
  }, [trades, live]);

  if (points.length < 2) {
    return (
      <div
        className="h-48 rounded-xl flex items-center justify-center text-xs"
        style={{ background: "var(--ae-night)", color: "var(--ae-nebula)" }}
      >
        Chart appears after the first trades
      </div>
    );
  }

  const W = 600;
  const H = 180;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || max || 1;
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (p: number) => H - 12 - ((p - min) / span) * (H - 24);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const area = `${path} L${W},${H} L0,${H} Z`;
  const up = points[points.length - 1] >= points[0];
  const stroke = up ? "var(--clr-success)" : "var(--clr-danger)";

  return (
    <div className="rounded-xl p-2" style={{ background: "var(--ae-night)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
        <defs>
          <linearGradient id="forgeArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={up ? "#4ade80" : "#f87171"} stopOpacity="0.25" />
            <stop offset="100%" stopColor={up ? "#4ade80" : "#f87171"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#forgeArea)" />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trade panel                                                        */
/* ------------------------------------------------------------------ */

function TradePanel({ coin, onTraded }: { coin: ForgeCoin; onTraded: () => void }) {
  const { buyCoin, sellCoin, quoteBuy, quoteSell, getBalance } = useForge();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<bigint>(0n);
  const [balance, setBalance] = useState<bigint>(0n);
  const [isMax, setIsMax] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getBalance(coin.address).then(setBalance);
  }, [coin.address, getBalance]);

  useEffect(() => {
    const v = amount.trim();
    if (!v || Number(v) <= 0) {
      setQuote(0n);
      return;
    }
    const t = setTimeout(async () => {
      if (side === "buy") setQuote(await quoteBuy(coin.address, v));
      else {
        try {
          const amt = BigInt(Math.floor(Number(v) * 1e6)) * 10n ** 12n;
          setQuote(await quoteSell(coin.address, amt > balance ? balance : amt));
        } catch {
          setQuote(0n);
        }
      }
    }, 300);
    return () => clearTimeout(t);
  }, [amount, side, coin.address, balance, quoteBuy, quoteSell]);

  const doTrade = async () => {
    if (!amount || Number(amount) <= 0) return;
    setBusy(true);
    let ok = false;
    if (side === "buy") {
      ok = await buyCoin(coin.address, amount);
    } else {
      let amt = isMax ? balance : BigInt(Math.floor(Number(amount) * 1e6)) * 10n ** 12n;
      if (amt > balance) amt = balance;
      ok = await sellCoin(coin.address, amt);
    }
    setBusy(false);
    if (ok) {
      setAmount("");
      getBalance(coin.address).then(setBalance);
      onTraded();
    }
  };

  const sideBtn = (s: "buy" | "sell", label: string, color: string) => (
    <SparkButton
      onClick={() => { if (side !== s) { setSide(s); setAmount(""); setQuote(0n); } }}
      className="flex-1 rounded-xl py-2 text-sm font-semibold transition-all"
      style={
        side === s && s === "buy"
          ? { background: "#0b0b0b", color: "#ffaa32", border: "1px solid rgba(255,140,30,0.6)", boxShadow: "0 0 14px -4px rgba(255,140,30,0.6)" }
          : side === s && s === "sell"
          ? { background: color, color: "var(--ae-ink)", boxShadow: "0 0 12px -3px " + color }
          : { background: "transparent", color: "var(--ae-nebula)", border: "1px dashed var(--clr-border)", opacity: 0.65 }
      }
    >
      {label}
    </SparkButton>
  );

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)" }}
    >
      <div className="flex gap-2 mb-4">
        {sideBtn("buy", "Buy", "var(--clr-success)")}
        {sideBtn("sell", "Sell", "var(--clr-danger)")}
      </div>

      <div
        className="rounded-xl p-3"
        style={{ background: "var(--ae-night)", border: "1px solid var(--clr-border)" }}
      >
        <div className="flex justify-between text-xs mb-1" style={{ color: "var(--ae-nebula)" }}>
          <span>{side === "buy" ? "You pay (LCAI)" : `You sell (${coin.symbol})`}</span>
          {side === "sell" && (
            <button
              className="underline"
              onClick={() => { setIsMax(true); setAmount(formatEther(balance)); }}
            >
              Max: {fmtTokens(balance)}
            </button>
          )}
        </div>
        <input
          className="w-full bg-transparent outline-none text-lg font-semibold"
          style={{ color: "var(--clr-heading)" }}
          placeholder="0.0"
          inputMode="decimal"
          value={amount}
          onChange={(e) => { setIsMax(false); setAmount(e.target.value.replace(/[^0-9.]/g, "")); }}
        />
      </div>

      <div className="text-xs mt-3 flex justify-between" style={{ color: "var(--ae-nebula)" }}>
        <span>You receive (est.)</span>
        <span style={{ color: "var(--clr-heading)" }}>
          {quote > 0n
            ? side === "buy"
              ? `${fmtTokens(quote)} ${coin.symbol}`
              : `${fmtLcai(quote, 4)} LCAI`
            : "—"}
        </span>
      </div>

      <SparkButton
        className="w-full rounded-xl py-3 mt-4 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
        style={{
          background: side === "buy" ? "var(--clr-success)" : "var(--clr-danger)",
          color: "var(--ae-ink)",
        }}
        onClick={doTrade}
        disabled={busy || !amount || Number(amount) <= 0}
      >
        {busy ? "Confirming…"
          : !amount || Number(amount) <= 0 ? "Enter an amount"
          : side === "buy" ? `Buy ${coin.symbol}` : `Sell ${coin.symbol}`}
      </SparkButton>

      <p className="text-[11px] mt-3 text-center" style={{ color: "var(--ae-nebula)" }}>
        1% fee on curve trades · 2% slippage guard applied
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CoinPage({ params }: { params: Promise<{ address: string }> }) {
  useChainGuard();
  const { address: walletAddress } = useAccount();
  const addToWallet = async () => {
    if (!walletAddress) return;
    try {
      const img = coin?.metadata?.image
        ? coin.metadata.image.startsWith("ipfs://")
          ? "https://ipfs.io/ipfs/" + coin.metadata.image.slice(7)
          : coin.metadata.image
        : undefined;
      const eth = (window as any).ethereum;
      if (!eth) return;
      await eth.request({
        method: "wallet_watchAsset",
        params: [
          "ERC20",
          {
            address: token,
            symbol: coin?.symbol ?? "",
            decimals: 18,
            image: img ?? "",
          },
        ],
      });
    } catch(e) { console.error(e); }
  };
  const { address } = use(params);
  const token = address as `0x${string}`;
  const { fetchCoin, fetchTrades, fetchCreatorBalance } = useForge();
  const { publicClient } = useWeb3Clients();

  const [coin, setCoin] = useState<ForgeCoin | null | undefined>(undefined);
  const [trades, setTrades] = useState<ForgeTrade[]>([]);
  const [creatorBal, setCreatorBal] = useState<bigint>(0n);
  const [dexPrice, setDexPrice] = useState<number | null>(null);
  const [lpReserves, setLpReserves] = useState<{lcai: bigint, tok: bigint} | null>(null);
  const [lcaiUsd, setLcaiUsd] = useState(0);
  const { fetchStats } = useMarkets();

  const load = async () => {
    const c = await fetchCoin(token);
    setCoin(c);
    if (c) {
      fetchTrades(token).then(setTrades);
      fetchCreatorBalance(token, c.creator).then(setCreatorBal);
      fetchStats().then(s => { if (s) setLcaiUsd(s.priceUsd); }).catch(()=>{});
      if (c.graduated && c.pair && c.pair !== "0x0000000000000000000000000000000000000000") {
        const PAIR_ABI = [{type:"function",name:"getReserves",inputs:[],outputs:[{type:"uint112"},{type:"uint112"},{type:"uint32"}],stateMutability:"view"},{type:"function",name:"token0",inputs:[],outputs:[{type:"address"}],stateMutability:"view"}] as const;
        const WLCAI = "0xd73cedfc5b894323bdb18a1e31e7bb186fce5f64";
        Promise.all([
          publicClient.readContract({address:c.pair as `0x${string}`,abi:PAIR_ABI,functionName:"getReserves"}),
          publicClient.readContract({address:c.pair as `0x${string}`,abi:PAIR_ABI,functionName:"token0"}),
        ]).then(([res,t0])=>{
          const r = res as [bigint,bigint,number];
          const wlcaiIsT0 = (t0 as string).toLowerCase()===WLCAI;
          const resLCAI = wlcaiIsT0?r[0]:r[1];
          const resTok = wlcaiIsT0?r[1]:r[0];
          if(resTok>0n) { setDexPrice(Number(resLCAI)/Number(resTok)); setLpReserves({lcai:resLCAI, tok:resTok}); }
        }).catch(()=>{});
      }
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (coin === undefined)
    return (
      <main className="mx-auto max-w-5xl px-4 py-24 text-center text-sm" style={{ color: "var(--ae-nebula)" }}>
        Reading the chain…
      </main>
    );

  if (coin === null)
    return (
      <main className="mx-auto max-w-5xl px-4 py-24 text-center">
        <p style={{ color: "var(--clr-heading)" }}>No coin at this address.</p>
        <Link href="/forge" className="text-sm underline" style={{ color: "var(--ae-aurum)" }}>
          Back to the Forge
        </Link>
      </main>
    );

  const img = FORGE_IMAGE_OVERRIDES[coin.address?.toLowerCase()] ?? FORGE_IMAGE_OVERRIDES[coin.address] ?? ipfsToHttp(coin.metadata.image);
  const creatorPct = Number((creatorBal * 10_000n) / TOTAL_SUPPLY) / 100;
  const socials: [string, string | undefined][] = [
    ["Website", coin.metadata.website],
    ["X", coin.metadata.twitter],
    ["Telegram", coin.metadata.telegram],
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 min-h-[70vh]">
      <Link href="/forge" className="text-xs" style={{ color: "var(--ae-nebula)" }}>
        ← Back to the Forge
      </Link>

      <div className="flex gap-4 items-center mt-4 mb-6 flex-wrap">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={coin.symbol} className="w-16 h-16 rounded-xl object-cover" style={{ background: "var(--ae-veil)" }} />
        ) : (
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold" style={{ background: "var(--ae-veil)", color: "var(--ae-aurum)" }}>
            {coin.symbol.slice(0, 2)}
          </div>
        )}
        <div>
          <h1 className="text-2xl" style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>
            {coin.name} <span className="text-base" style={{ color: "var(--ae-nebula)" }}>${coin.symbol}</span>
          </h1>
          <div className="flex gap-3 text-xs mt-1 flex-wrap" style={{ color: "var(--ae-nebula)" }}>
            <a href={`https://mainnet.lightscan.app/address/${coin.address}`} target="_blank" className="underline">
              {shortAddr(coin.address)}
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(coin.address).then(() => alert("Address copied! In MetaMask tap Import Tokens, paste address and tap Next."))}
              className="text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ color: "var(--ae-aurum)" }}
            >
              📋 Copy to add to wallet
            </button>
            <span>
              creator {shortAddr(coin.creator)} holds{" "}
              <b style={{ color: creatorPct > 10 ? "var(--clr-warning)" : "var(--clr-success)" }}>
                {creatorPct.toFixed(1)}%
              </b>
            </span>
            {socials.filter(([, u]) => u).map(([label, u]) => (
              <a key={label} href={u} target="_blank" rel="noopener noreferrer" className="underline">
                {label}
              </a>
            ))}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs" style={{ color: "var(--ae-nebula)" }}>{coin.graduated ? "DEX Price" : "Price"}</div>
          <div className="text-lg font-semibold" style={{ color: "var(--clr-heading)" }}>
            {coin.graduated && dexPrice !== null
              ? lcaiUsd > 0
                ? <>${(dexPrice * lcaiUsd).toFixed(8)}</>
                : <>{dexPrice.toFixed(6)} <span className="text-xs">LCAI</span></>
              : <>{Number(formatEther(coin.priceWei)).toPrecision(4)} <span className="text-xs">LCAI</span></>}
          </div>
          {coin.graduated && dexPrice !== null && lcaiUsd > 0 && (
            <div className="text-xs" style={{ color: "var(--ae-nebula)" }}>{dexPrice.toFixed(6)} LCAI</div>
          )}
        </div>
      </div>

      {coin.metadata.description && (
        <ExpandableDescription text={coin.metadata.description} />
      )}

      {coin?.graduated && (
        <GraduationBanner name={coin.name} symbol={coin.symbol} address={coin.address} />
      )}


      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div>
          <PriceChart trades={trades} live={coin.priceWei} />

          {!coin.graduated && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--ae-nebula)" }}>
                <span>{(coin.progressBps / 100).toFixed(1)}% of the curve sold</span>
                <span>{fmtLcai(coin.lcaiRaised, 0)} LCAI raised</span>
              </div>
              <ProgressBar bps={coin.progressBps} tall />
              <p className="text-[11px] mt-2" style={{ color: "var(--ae-nebula)" }}>
                When the curve sells out, all raised LCAI pairs with 200M {coin.symbol} on
                Filament and the LP is burned. Nobody — not even the Forge — can pull that liquidity.
              </p>
            </div>
          )}

          {!coin.graduated && (() => {
            const raised = coin.lcaiRaised / BigInt(1e18);
            const remaining = raised < 300000n ? 300000n - raised : 0n;
            return <div className="text-xs mt-2" style={{ color: "var(--ae-aurum)" }}>~{fmtLcai(remaining * BigInt(1e18), 0)} LCAI until graduation</div>;
          })()}
          {walletAddress?.toLowerCase() === coin.creator.toLowerCase() && (
            <div className="mt-6 rounded-2xl p-5 forge-breathe" style={{ background: "var(--ae-haze)", border: "1px solid rgba(255,140,30,.45)" }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: "var(--ae-aurum)" }}>✦</span>
                <h3 className="text-sm font-semibold" style={{ color: "var(--ae-aurum)" }}>Your Coin</h3>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,140,30,.15)", color: "var(--ae-aurum)" }}>Creator</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl p-3" style={{ background: "var(--ae-night)" }}>
                  <div style={{ color: "var(--ae-nebula)" }}>Your holdings</div>
                  <div className="font-semibold mt-0.5" style={{ color: "var(--clr-heading)" }}>{fmtTokens(creatorBal)} {coin.symbol}</div>
                  <div style={{ color: creatorPct > 10 ? "var(--clr-warning)" : "var(--clr-success)" }}>{creatorPct.toFixed(1)}% of supply</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: "var(--ae-night)" }}>
                  <div style={{ color: "var(--ae-nebula)" }}>LCAI raised</div>
                  <div className="font-semibold mt-0.5" style={{ color: "var(--clr-heading)" }}>{fmtLcai(coin.lcaiRaised, 0)} LCAI</div>
                  <div style={{ color: "var(--ae-nebula)" }}>{(coin.progressBps / 100).toFixed(1)}% to graduation</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: "var(--ae-night)" }}>
                  <div style={{ color: "var(--ae-nebula)" }}>Your bag value</div>
                  <div className="font-semibold mt-0.5" style={{ color: "var(--clr-heading)" }}>{fmtLcai(creatorBal * coin.priceWei / BigInt(1e18), 2)} LCAI</div>
                  <div style={{ color: "var(--ae-nebula)" }}>at current price</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: "var(--ae-night)" }}>
                  <div style={{ color: "var(--ae-nebula)" }}>Contract</div>
                  <a href={`https://mainnet.lightscan.app/address/${coin.address}`} target="_blank" rel="noopener noreferrer" className="font-semibold mt-0.5 underline block truncate" style={{ color: "var(--ae-aurum)" }}>{coin.address.slice(0,6)}…{coin.address.slice(-4)} ↗</a>
                  <div style={{ color: "var(--ae-nebula)" }}>View on Lightscan</div>
                  <a href={`https://mainnet.lightscan.app/address/${coin.address}?tab=contract`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs underline mt-1 block"
                    style={{ color: "var(--ae-nebula)" }}>Verify contract →</a>
                </div>
              </div>
            </div>
          )}
          <h3 className="text-sm font-semibold mt-8 mb-3" style={{ color: "var(--clr-heading)" }}>
            Recent trades
          </h3>
          {trades.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--ae-nebula)" }}>No trades yet.</p>
          ) : (
            <div className="space-y-1.5">
              {[...trades].reverse().slice(0, 30).map((t, i) => (
                <a
                  key={i}
                  href={`https://mainnet.lightscan.app/tx/${t.tx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors hover:brightness-110"
                  style={{ background: "var(--ae-night)" }}
                >
                  <span style={{ color: t.isBuy ? "var(--clr-success)" : "var(--clr-danger)" }}>
                    {t.isBuy ? "BUY" : "SELL"}
                  </span>
                  <span style={{ color: "var(--ae-nebula)" }}>{shortAddr(t.trader)}</span>
                  <span style={{ color: "var(--clr-heading)" }}>{fmtTokens(t.tokenAmount)} {coin.symbol}</span>
                  <span style={{ color: "var(--ae-nebula)" }}>{fmtLcai(t.lcaiAmount, 2)} LCAI</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          {!coin.graduated ? (
            <TradePanel coin={coin} onTraded={load} />
          ) : (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)" }}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: "var(--ae-aurum)", fontSize: 18 }}>🎓</span>
                <span className="font-bold text-sm" style={{ color: "var(--clr-heading)" }}>Graduated — Live on Filament DEX</span>
              </div>

              {/* Pool stats */}
              {lpReserves && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3" style={{ background: "var(--ae-night)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--ae-nebula)" }}>LCAI in Pool</div>
                    <div className="font-semibold text-sm" style={{ color: "var(--clr-heading)" }}>
                      {Number(lpReserves.lcai / 10n**18n).toLocaleString()} LCAI
                    </div>
                    {lcaiUsd > 0 && (
                      <div className="text-xs" style={{ color: "var(--ae-nebula)" }}>
                        ${(Number(lpReserves.lcai / 10n**18n) * lcaiUsd).toLocaleString(undefined, {maximumFractionDigits:2})}
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "var(--ae-night)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--ae-nebula)" }}>{coin.symbol} in Pool</div>
                    <div className="font-semibold text-sm" style={{ color: "var(--clr-heading)" }}>
                      {Number(lpReserves.tok / 10n**18n).toLocaleString()} {coin.symbol}
                    </div>
                  </div>
                  <div className="rounded-xl p-3 col-span-2" style={{ background: "var(--ae-night)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--ae-nebula)" }}>Pair Address</div>
                    <a href={`https://mainnet.lightscan.app/address/${coin.pair}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono underline" style={{ color: "var(--ae-aurum)" }}>
                      {coin.pair?.slice(0,6)}…{coin.pair?.slice(-4)} ↗
                    </a>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/swap?inputCurrency=LCAI&outputCurrency=${coin.address}`}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-center transition-all"
                  style={{ background: "linear-gradient(180deg,#ffaa32,#e07a12)", color: "#140d05" }}
                >
                  Buy {coin.symbol}
                </Link>
                <Link
                  href={`/swap?inputCurrency=${coin.address}&outputCurrency=LCAI`}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-center transition-all"
                  style={{ background: "var(--ae-night)", color: "var(--ae-nebula)", border: "1px solid var(--clr-border)" }}
                >
                  Sell {coin.symbol}
                </Link>
              </div>
              <Link
                href={`/add/LCAI/${coin.address}`}
                className="block w-full rounded-xl py-2.5 text-sm font-semibold text-center transition-all"
                style={{ background: "var(--ae-night)", color: "var(--ae-aurum)", border: "1px dashed rgba(255,140,30,0.4)" }}
              >
                + Add Liquidity
              </Link>

              {/* Recent trades */}
              {trades.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--ae-nebula)" }}>Recent Trades</div>
                  <div className="space-y-1">
                    {trades.slice(0, 8).map((t, i) => (
                      <div key={i} className="flex items-center justify-between text-xs rounded-lg px-2 py-1.5" style={{ background: "var(--ae-night)" }}>
                        <span className="font-semibold" style={{ color: t.isBuy ? "var(--clr-success)" : "var(--clr-danger)" }}>
                          {t.isBuy ? "BUY" : "SELL"}
                        </span>
                        <span style={{ color: "var(--ae-nebula)" }}>{t.trader.slice(0,6)}…{t.trader.slice(-4)}</span>
                        <span style={{ color: "var(--clr-heading)" }}>{Number(t.lcaiAmount / 10n**18n).toFixed(2)} LCAI</span>
                        <a href={`https://mainnet.lightscan.app/tx/${t.tx}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ae-aurum)" }}>↗</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

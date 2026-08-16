"use client";
import { useEffect, useState, useMemo } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { FORGE_IMAGE_OVERRIDES } from "@/config/forge-image-overrides";
import { ipfsToHttp } from "@/config/forge";

const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL || "";

type Coin = {
  address: string; name: string; symbol: string;
  progress_bps: number; graduated: number;
  lcai_raised: string; created_ts: number;
  metadata_uri: string; v_lcai: string;
};

function fmt(n: number, d = 2) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(d);
}

function CoinCard({ coin }: { coin: Coin }) {
  const meta = useMemo(() => { try { return JSON.parse(coin.metadata_uri || "{}"); } catch { return {}; } }, [coin.metadata_uri]);
  const img = FORGE_IMAGE_OVERRIDES[coin.address?.toLowerCase()] ?? ipfsToHttp(meta.image);
  const raised = Number(BigInt(coin.lcai_raised || "0")) / 1e18;
  const vol = Number(BigInt(coin.v_lcai || "0")) / 1e18;
  const pct = coin.progress_bps / 100;

  return (
    <Link href={`/forge/${coin.address}`} className="f-card rounded-2xl p-4 flex gap-4 hover:-translate-y-0.5 transition-all">
      <div className="flex-shrink-0">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={coin.symbol} width={52} height={52} className="rounded-xl object-cover" style={{ width: 52, height: 52 }} />
        ) : (
          <div className="rounded-xl flex items-center justify-center font-bold text-sm" style={{ width: 52, height: 52, background: "var(--ae-veil)", color: "var(--ae-aurum)" }}>{coin.symbol.slice(0,2)}</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold truncate" style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>{coin.name}</span>
          <span className="text-xs" style={{ color: "var(--ae-nebula)" }}>${coin.symbol}</span>
          {coin.graduated ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(74,222,128,0.12)", color: "var(--clr-success)" }}>GRADUATED</span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,140,30,0.12)", color: "var(--ae-aurum)" }}>{pct.toFixed(1)}%</span>
          )}
        </div>
        <div className="w-full rounded-full mb-2" style={{ height: 4, background: "var(--ae-veil)" }}>
          <div className="rounded-full h-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: coin.graduated ? "var(--clr-success)" : "var(--ae-ember)" }} />
        </div>
        <div className="flex gap-4 text-[11px]" style={{ color: "var(--ae-nebula)" }}>
          <span>⚡ {fmt(raised)} LCAI raised</span>
          <span>📊 {fmt(vol)} LCAI vol</span>
        </div>
      </div>
    </Link>
  );
}

export default function CreatorAnalytics() {
  const { address, isConnected } = useAccount();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address || !INDEXER) { setLoading(false); return; }
    fetch(`${INDEXER}/api/v1/forge/coins?creator=${address}&limit=100`)
      .then(r => r.json())
      .then(data => { setCoins(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [address]);

  const stats = useMemo(() => {
    if (!coins.length) return null;
    const graduated = coins.filter(c => c.graduated);
    const totalRaised = coins.reduce((a, c) => a + Number(BigInt(c.lcai_raised || "0")) / 1e18, 0);
    const totalVol = coins.reduce((a, c) => a + Number(BigInt(c.v_lcai || "0")) / 1e18, 0);
    const gradRate = (graduated.length / coins.length) * 100;
    return { total: coins.length, graduated: graduated.length, totalRaised, totalVol, gradRate };
  }, [coins]);

  if (!isConnected) return (
    <main className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🔨</div>
        <div className="font-bold text-xl mb-2" style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>Connect your wallet</div>
        <div className="text-sm" style={{ color: "var(--ae-nebula)" }}>See your Forge creator stats</div>
      </div>
    </main>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 min-h-[70vh]">
      <div className="f-eyebrow mb-2">CREATOR ANALYTICS · LIGHTCHAIN AI</div>
      <h1 className="f-display text-4xl sm:text-5xl mb-1" style={{ color: "var(--clr-heading)" }}>Your Forge</h1>
      <p className="f-meta mb-8" style={{ color: "var(--ae-nebula)" }}>{address?.slice(0,6)}…{address?.slice(-4)} · coin performance</p>

      {loading ? (
        <div className="f-card rounded-2xl p-10 text-center">
          <div className="text-3xl mb-3">⛏️</div>
          <div className="font-semibold" style={{ color: "var(--ae-aurum)", fontFamily: "var(--font-display), serif" }}>Loading your coins…</div>
        </div>
      ) : !stats ? (
        <div className="f-card rounded-2xl p-10 text-center">
          <div className="text-3xl mb-3">🌑</div>
          <div className="font-semibold mb-2" style={{ color: "var(--clr-heading)" }}>No coins forged yet</div>
          <Link href="/forge/create" className="text-sm" style={{ color: "var(--ae-aurum)" }}>Launch your first coin →</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Coins forged", value: stats.total.toString() },
              { label: "Graduated", value: stats.graduated.toString() },
              { label: "Grad rate", value: stats.gradRate.toFixed(0) + "%" },
              { label: "LCAI raised", value: fmt(stats.totalRaised) },
            ].map(s => (
              <div key={s.label} className="f-card rounded-2xl p-4" style={{ borderLeft: "3px solid var(--ae-aurum-deep)" }}>
                <div className="text-xl font-bold" style={{ color: "var(--ae-aurum)", fontFamily: "var(--font-display), serif" }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: "var(--ae-nebula)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="f-card rounded-2xl p-5 mb-6 flex items-center justify-between" style={{ borderLeft: "3px solid var(--ae-aurum-deep)" }}>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--ae-nebula)" }}>TOTAL CURVE VOLUME</div>
              <div className="text-3xl font-bold" style={{ color: "var(--ae-aurum)", fontFamily: "var(--font-display), serif" }}>{fmt(stats.totalVol)} LCAI</div>
              <div className="text-xs mt-1" style={{ color: "var(--ae-nebula)" }}>across all your coins</div>
            </div>
            <div style={{ fontSize: 48 }}>🔨</div>
          </div>

          <div className="text-xs mb-3 font-semibold" style={{ color: "var(--ae-nebula)" }}>YOUR COINS — {coins.length} total</div>
          <div className="space-y-3">
            {coins.sort((a,b) => (b.graduated - a.graduated) || (b.progress_bps - a.progress_bps)).map(coin => (
              <CoinCard key={coin.address} coin={coin} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

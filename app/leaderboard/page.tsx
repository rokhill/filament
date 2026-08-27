"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";

const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL || "";

function shortAddr(a: string) { return a.slice(0, 6) + "…" + a.slice(-4); }
function fmt(n: number | null | undefined) {
  if (n == null || isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(0);
}

type Tab = "creators" | "traders" | "holders" | "lp" | "scores";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "creators", label: "Creators", icon: "🔥" },
  { id: "traders", label: "Traders", icon: "⚡" },
  { id: "holders", label: "Holders", icon: "💎" },
  { id: "lp", label: "Liquidity", icon: "💧" },
  { id: "scores", label: "Scores", icon: "🎯" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("creators");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!INDEXER) return;
    setLoading(true);
    setData([]);
    const endpoint = tab === "scores" ? "leaderboard/scores" : `leaderboard/${tab}`;
    fetch(`${INDEXER}/api/v1/${endpoint}?limit=50`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tab]);

  return (
    <main className="fil-main" style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display), serif", color: "var(--clr-heading)" }}>
          🏆 Leaderboard
        </h1>
        <p className="text-sm" style={{ color: "var(--ae-nebula)" }}>
          On-chain rankings powered by Filament Indexer™
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: tab === t.id ? "var(--ae-aurum)" : "var(--ae-veil)",
              color: tab === t.id ? "#000" : "var(--ae-nebula)",
              border: "none", cursor: "pointer"
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)" }}>
        {loading ? (
          <div className="py-16 text-center" style={{ color: "var(--ae-nebula)" }}>Loading…</div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--ae-nebula)" }}>No data yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--clr-border)" }}>
                {tab === "creators" && <>
                  <th style={th}>#</th>
                  <th style={th}>Creator</th>
                  <th style={{...th, textAlign:"right"}}>Coins</th>
                  <th style={{...th, textAlign:"right"}}>Graduated</th>
                  <th style={{...th, textAlign:"right"}}>LCAI Raised</th>
                  <th style={{...th, textAlign:"right"}}>Best Coin</th>
                </>}
                {tab === "traders" && <>
                  <th style={th}>#</th>
                  <th style={th}>Trader</th>
                  <th style={{...th, textAlign:"right"}}>Trades</th>
                  <th style={{...th, textAlign:"right"}}>Coins</th>
                  <th style={{...th, textAlign:"right"}}>Volume</th>
                  <th style={{...th, textAlign:"right"}}>Biggest Trade</th>
                </>}
                {tab === "holders" && <>
                  <th style={th}>#</th>
                  <th style={th}>Holder</th>
                  <th style={{...th, textAlign:"right"}}>Tokens Held</th>
                  <th style={{...th, textAlign:"right"}}>Graduated Held</th>
                </>}
                {tab === "lp" && <>
                  <th style={th}>#</th>
                  <th style={th}>Provider</th>
                  <th style={{...th, textAlign:"right"}}>Pools</th>
                  <th style={{...th, textAlign:"right"}}>LP Events</th>
                </>}
                {tab === "scores" && <>
                  <th style={th}>#</th>
                  <th style={th}>Trader</th>
                  <th style={{...th, textAlign:"right"}}>Score</th>
                  <th style={{...th, textAlign:"right"}}>Trades</th>
                  <th style={{...th, textAlign:"right"}}>Graduated</th>
                  <th style={{...th, textAlign:"right"}}>Net PnL</th>
                  <th style={{...th, textAlign:"right"}}>Biggest Trade</th>
                </>}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const addr = row.creator || row.trader || row.address || row.wallet;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--clr-border)", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--ae-veil)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{...td, fontWeight:"bold", color: i < 3 ? "var(--ae-aurum)" : "var(--ae-nebula)", fontSize: i < 3 ? "1.1rem" : "0.9rem"}}>
                      {MEDALS[i] ?? i + 1}
                    </td>
                    <td style={td}>
                      <a href={`https://mainnet.lightscan.app/address/${addr}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: "var(--clr-heading)", textDecoration: "none", fontFamily: "monospace", fontSize: "0.85rem" }}>
                        {shortAddr(addr)}
                      </a>
                    </td>
                    {tab === "creators" && <>
                      <td style={{...td, textAlign:"right"}}>{row.coins_created}</td>
                      <td style={{...td, textAlign:"right"}}>
                        <span style={{ color: row.coins_graduated > 0 ? "var(--clr-success)" : "var(--ae-nebula)" }}>
                          {row.coins_graduated}
                        </span>
                      </td>
                      <td style={{...td, textAlign:"right", color:"var(--ae-aurum)", fontWeight:"600"}}>{fmt(row.total_lcai_raised)} LCAI</td>
                      <td style={{...td, textAlign:"right"}}>{fmt(row.best_coin_lcai)} LCAI</td>
                    </>}
                    {tab === "traders" && <>
                      <td style={{...td, textAlign:"right"}}>{row.total_trades}</td>
                      <td style={{...td, textAlign:"right"}}>{row.unique_coins_traded}</td>
                      <td style={{...td, textAlign:"right", color:"var(--ae-aurum)", fontWeight:"600"}}>{fmt(row.total_volume_lcai)} LCAI</td>
                      <td style={{...td, textAlign:"right"}}>{fmt(row.biggest_single_trade)} LCAI</td>
                    </>}
                    {tab === "holders" && <>
                      <td style={{...td, textAlign:"right", color:"var(--ae-aurum)", fontWeight:"600"}}>{row.unique_tokens_held}</td>
                      <td style={{...td, textAlign:"right", color: row.graduated_tokens_held > 0 ? "var(--clr-success)" : "var(--ae-nebula)"}}>
                        {row.graduated_tokens_held}
                      </td>
                    </>}
                    {tab === "lp" && <>
                      <td style={{...td, textAlign:"right", color:"var(--ae-aurum)", fontWeight:"600"}}>{row.pools_provided}</td>
                      <td style={{...td, textAlign:"right"}}>{row.lp_events_count}</td>
                    </>}
                    {tab === "scores" && <>
                      <td style={{...td, textAlign:"right"}}>
                        <span style={{ fontSize:"1.1rem", fontWeight:"bold", color: row.score >= 700 ? "var(--ae-aurum)" : row.score >= 400 ? "var(--clr-heading)" : "var(--ae-nebula)" }}>
                          {row.score}
                        </span>
                      </td>
                      <td style={{...td, textAlign:"right"}}>{row.total_trades}</td>
                      <td style={{...td, textAlign:"right", color:"var(--clr-success)"}}>{row.graduated_coins_traded}</td>
                      <td style={{...td, textAlign:"right", color: row.net_pnl >= 0 ? "var(--clr-success)" : "var(--clr-danger)"}}>
                        {row.net_pnl >= 0 ? "+" : ""}{fmt(row.net_pnl)} LCAI
                      </td>
                      <td style={{...td, textAlign:"right"}}>{fmt(row.biggest_trade)} LCAI</td>
                    </>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-center text-xs mt-6" style={{ color: "var(--ae-nebula)" }}>
        Rankings update in real-time · All data is on-chain · <Link href="/forge" style={{ color: "var(--ae-aurum)" }}>Launch a coin →</Link>
      </p>
    </main>
  );
}

const th: React.CSSProperties = {
  padding: "0.75rem 1rem",
  textAlign: "left",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--ae-nebula)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const td: React.CSSProperties = {
  padding: "0.75rem 1rem",
  fontSize: "0.875rem",
  color: "var(--clr-heading)",
};

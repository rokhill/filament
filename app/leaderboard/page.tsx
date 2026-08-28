"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";

const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL || "";

function shortAddr(a: string) { return a.slice(0, 6) + "…" + a.slice(-4); }
function fmt(n: number | null | undefined) {
  if (n == null || isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(0);
}

type Tab = "overall" | "creators" | "traders" | "holders" | "lp" | "scores";

const TABS: { id: Tab; label: string; icon: string; endpoint: string }[] = [
  { id: "overall",  label: "Overall",   icon: "🏆", endpoint: "leaderboard/overall" },
  { id: "creators", label: "Creators",  icon: "🔥", endpoint: "leaderboard/creators" },
  { id: "traders",  label: "Traders",   icon: "⚡", endpoint: "leaderboard/traders" },
  { id: "holders",  label: "Holders",   icon: "💎", endpoint: "leaderboard/holders" },
  { id: "lp",       label: "Liquidity", icon: "💧", endpoint: "leaderboard/lp" },
  { id: "scores",   label: "Scores",    icon: "🎯", endpoint: "leaderboard/scores" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("overall");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!INDEXER) return;
    setLoading(true);
    setData([]);
    setExpanded(false);
    const endpoint = TABS.find(t => t.id === tab)?.endpoint || "leaderboard/overall";
    fetch(`${INDEXER}/api/v1/${endpoint}?limit=50`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tab]);

  const visible = expanded ? data : data.slice(0, 10);

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Banner */}
      <div style={{ marginBottom: "1.5rem", marginLeft: "-1rem", marginRight: "-1rem" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/banners/leaderboard.png" alt="Leaderboard" style={{ width: "100%", borderRadius: "0.75rem", objectFit: "cover", maxHeight: 220 }} />
      </div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "var(--font-display), serif", color: "var(--clr-heading)", marginBottom: "0.5rem" }}>
          🏆 Filament Leaderboard
        </h1>
        <p style={{ color: "var(--ae-nebula)", fontSize: "0.875rem" }}>
          On-chain rankings powered by Filament Indexer™
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: "0.5rem 1rem", borderRadius: "0.75rem", fontSize: "0.875rem",
              fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.15s",
              background: tab === t.id ? "var(--ae-aurum)" : "var(--ae-veil)",
              color: tab === t.id ? "#000" : "var(--ae-nebula)",
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ borderRadius: "1rem", overflow: "hidden", background: "var(--ae-haze)", border: "1px solid var(--clr-border)" }}>
        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--ae-nebula)" }}>Loading…</div>
        ) : data.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--ae-nebula)" }}>No data yet</div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--clr-border)" }}>
                  {tab === "overall" && <>
                    <th style={th}>#</th>
                    <th style={th}>Wallet</th>
                    <th style={{...th, textAlign:"right"}}>Score</th>
                    <th style={{...th, textAlign:"right"}}>Trades</th>
                    <th style={{...th, textAlign:"right"}}>Created</th>
                    <th style={{...th, textAlign:"right"}}>Graduated</th>
                    <th style={{...th, textAlign:"right"}}>Pools</th>
                  </>}
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
                    <th style={{...th, textAlign:"right"}}>Biggest Trade</th>
                  </>}
                </tr>
              </thead>
              <tbody>
                {visible.map((row, i) => {
                  const addr = row.wallet || row.creator || row.trader || row.address;
                  return (
                    <tr key={i}
                      style={{ borderBottom: "1px solid var(--clr-border)", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--ae-veil)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ ...td, fontWeight: "bold", fontSize: i < 3 ? "1.1rem" : "0.875rem", color: i < 3 ? "var(--ae-aurum)" : "var(--ae-nebula)", width: 40 }}>
                        {MEDALS[i] ?? i + 1}
                      </td>
                      <td style={td}>
                        <a href={`https://mainnet.lightscan.app/address/${addr}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: "var(--clr-heading)", textDecoration: "none", fontFamily: "monospace", fontSize: "0.85rem" }}>
                          {shortAddr(addr || "")}
                        </a>
                      </td>
                      {tab === "overall" && <>
                        <td style={{ ...td, textAlign: "right" }}>
                          <span style={{ fontWeight: 700, fontSize: "1rem", color: row.score >= 800 ? "var(--ae-aurum)" : row.score >= 400 ? "var(--clr-heading)" : "var(--ae-nebula)" }}>
                            {row.score}
                          </span>
                        </td>
                        <td style={{ ...td, textAlign: "right" }}>{row.trades}</td>
                        <td style={{ ...td, textAlign: "right" }}>{row.coins_created}</td>
                        <td style={{ ...td, textAlign: "right", color: row.coins_graduated > 0 ? "var(--clr-success)" : "var(--ae-nebula)" }}>{row.coins_graduated}</td>
                        <td style={{ ...td, textAlign: "right" }}>{row.pools}</td>
                      </>}
                      {tab === "creators" && <>
                        <td style={{ ...td, textAlign: "right" }}>{row.coins_created}</td>
                        <td style={{ ...td, textAlign: "right", color: row.coins_graduated > 0 ? "var(--clr-success)" : "var(--ae-nebula)" }}>{row.coins_graduated}</td>
                        <td style={{ ...td, textAlign: "right", color: "var(--ae-aurum)", fontWeight: 600 }}>{fmt(row.total_lcai_raised)} LCAI</td>
                        <td style={{ ...td, textAlign: "right" }}>{fmt(row.best_coin_lcai)} LCAI</td>
                      </>}
                      {tab === "traders" && <>
                        <td style={{ ...td, textAlign: "right" }}>{row.total_trades}</td>
                        <td style={{ ...td, textAlign: "right" }}>{row.unique_coins_traded}</td>
                        <td style={{ ...td, textAlign: "right", color: "var(--ae-aurum)", fontWeight: 600 }}>{fmt(row.total_volume_lcai)} LCAI</td>
                        <td style={{ ...td, textAlign: "right" }}>{fmt(row.biggest_single_trade)} LCAI</td>
                      </>}
                      {tab === "holders" && <>
                        <td style={{ ...td, textAlign: "right", color: "var(--ae-aurum)", fontWeight: 600 }}>{row.unique_tokens_held}</td>
                        <td style={{ ...td, textAlign: "right", color: row.graduated_tokens_held > 0 ? "var(--clr-success)" : "var(--ae-nebula)" }}>{row.graduated_tokens_held}</td>
                      </>}
                      {tab === "lp" && <>
                        <td style={{ ...td, textAlign: "right", color: "var(--ae-aurum)", fontWeight: 600 }}>{row.pools_provided}</td>
                        <td style={{ ...td, textAlign: "right" }}>{row.lp_events_count}</td>
                      </>}
                      {tab === "scores" && <>
                        <td style={{ ...td, textAlign: "right" }}>
                          <span style={{ fontWeight: 700, color: row.score >= 700 ? "var(--ae-aurum)" : row.score >= 400 ? "var(--clr-heading)" : "var(--ae-nebula)" }}>
                            {row.score}
                          </span>
                        </td>
                        <td style={{ ...td, textAlign: "right" }}>{row.total_trades}</td>
                        <td style={{ ...td, textAlign: "right", color: "var(--clr-success)" }}>{row.graduated_coins_traded}</td>
                        <td style={{ ...td, textAlign: "right" }}>{fmt(row.biggest_trade)} LCAI</td>
                      </>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data.length > 10 && (
              <div style={{ padding: "1rem", textAlign: "center" }}>
                <button onClick={() => setExpanded(!expanded)}
                  style={{ background: "var(--ae-veil)", border: "1px solid var(--clr-border)", borderRadius: "0.75rem", padding: "0.5rem 1.5rem", color: "var(--ae-nebula)", cursor: "pointer", fontSize: "0.875rem" }}>
                  {expanded ? "Show less ↑" : `Show all ${data.length} →`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <p style={{ textAlign: "center", fontSize: "0.75rem", marginTop: "1.5rem", color: "var(--ae-nebula)" }}>
        Rankings update in real-time · All data is on-chain
      </p>
    </main>
  );
}

const th: React.CSSProperties = {
  padding: "0.5rem 0.5rem", textAlign: "left", fontSize: "0.6rem",
  fontWeight: 600, color: "var(--ae-nebula)", textTransform: "uppercase", letterSpacing: "0.03em",
};
const td: React.CSSProperties = {
  padding: "0.5rem 0.5rem", fontSize: "0.75rem", color: "var(--clr-heading)",
};

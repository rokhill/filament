"use client";
import { useEffect, useState, useMemo } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";

const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL || "";

type Trade = {
  coin: string; symbol: string | null; name: string | null;
  is_buy: number; lcai_amount: string; ts: number; block: number;
  graduated: number | null; tx: string;
};

function fmt(n: number, d = 2) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(d);
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dexSwaps, setDexSwaps] = useState<any[]>([]);
  const [rank, setRank] = useState<{volRank:number;tradeRank:number;biggestBuy:number}|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address || !INDEXER) { setLoading(false); return; }
    fetch(`${INDEXER}/api/v1/wallet/${address}/trades?limit=1000`)
      .then(r => r.json())
      .then(data => { setTrades(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch(`${INDEXER}/api/v1/wallet/${address}/rank`).then(r=>r.json()).then(setRank).catch(()=>{});
    fetch(`${INDEXER}/api/v1/wallet/${address}/swaps?limit=500`).then(r=>r.json()).then(setDexSwaps).catch(()=>{});
  }, [address]);

  const stats = useMemo(() => {
    if (!trades.length) return null;
    const buys = trades.filter(t => t.is_buy === 1);
    const sells = trades.filter(t => t.is_buy === 0);
    const totalSpent = buys.reduce((a, t) => a + Number(BigInt(t.lcai_amount)) / 1e18, 0);
    const dexSellsTotal = dexSwaps.filter((s:any) => s.is_buy === 0).reduce((a:number, s:any) => a + Number(BigInt(s.lcai_amount||"0")) / 1e18, 0);
    const totalReceived = sells.reduce((a, t) => a + Number(BigInt(t.lcai_amount)) / 1e18, 0) + dexSellsTotal;
    const netPnl = totalReceived - totalSpent;
    const coinMap: Record<string, { spent: number; received: number; symbol: string | null; graduated: number | null; }> = {};
    for (const t of trades) {
      if (!coinMap[t.coin]) coinMap[t.coin] = { spent: 0, received: 0, symbol: t.symbol, graduated: t.graduated };
      if (t.is_buy) coinMap[t.coin].spent += Number(BigInt(t.lcai_amount)) / 1e18;
      else coinMap[t.coin].received += Number(BigInt(t.lcai_amount)) / 1e18;
    }
    const coins = Object.entries(coinMap);
    const graduated = coins.filter(([, c]) => c.graduated).length;
    const gradRate = coins.length > 0 ? (graduated / coins.length) * 100 : 0;
    const bestTrade = coins.reduce((best, curr) => {
      const pnl = curr[1].received - curr[1].spent;
      return pnl > (best[1].received - best[1].spent) ? curr : best;
    }, coins[0]);
    const now = Date.now() / 1000;
    const dayMap: Record<number, number> = {};
    for (const t of trades) {
      const day = Math.floor(t.ts / 86400);
      dayMap[day] = (dayMap[day] || 0) + 1;
    }
    const days = Array.from({ length: 90 }, (_, i) => {
      const day = Math.floor((now - (89 - i) * 86400) / 86400);
      return { day, count: dayMap[day] || 0 };
    });
    const score = Math.min(999, Math.floor(
      (graduated * 80) + (Math.min(trades.length, 50) * 2) +
      (netPnl > 0 ? Math.min(netPnl / 10, 200) : 0) + (gradRate * 2)
    ));
    return { totalSpent, totalReceived, netPnl, coins: coins.length, graduated, gradRate, bestTrade, days, score, totalTrades: trades.length };
  }, [trades, dexSwaps]);

  if (!isConnected) return (
    <main className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🔗</div>
        <div className="font-bold text-xl mb-2" style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>Connect your wallet</div>
        <div className="text-sm" style={{ color: "var(--ae-nebula)" }}>Your on-chain story lives here</div>
      </div>
    </main>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 min-h-[70vh]">
      <div className="f-eyebrow mb-2">YOUR STORY · LIGHTCHAIN AI</div>
      <h1 className="f-display text-4xl sm:text-5xl mb-1" style={{ color: "var(--clr-heading)" }}>Dashboard</h1>
      <p className="f-meta mb-8" style={{ color: "var(--ae-nebula)" }}>{address?.slice(0,6)}…{address?.slice(-4)}</p>

      {loading ? (
        <div className="f-card rounded-2xl p-10 text-center">
          <div className="text-3xl mb-3">⛏️</div>
          <div className="font-semibold" style={{ color: "var(--ae-aurum)", fontFamily: "var(--font-display), serif" }}>Reading your chain history…</div>
        </div>
      ) : !stats ? (
        <div className="f-card rounded-2xl p-10 text-center">
          <div className="text-3xl mb-3">🌑</div>
          <div className="font-semibold mb-2" style={{ color: "var(--clr-heading)" }}>No Forge activity yet</div>
          <Link href="/forge" className="text-sm" style={{ color: "var(--ae-aurum)" }}>Explore the Forge →</Link>
        </div>
      ) : (
        <>
          <div className="rounded-2xl p-8 mb-6 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0804 0%, #1a1005 50%, #0a0804 100%)", border: "1px solid rgba(255,140,30,0.4)", boxShadow: "0 0 40px rgba(255,140,30,0.08) inset" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 120%, rgba(255,140,30,0.15), transparent 60%)", pointerEvents: "none" }} />
            <div className="f-eyebrow mb-3">FILAMENT TRADER SCORE</div>
            <div className="forge-title" style={{ fontSize: "clamp(72px,15vw,120px)", lineHeight: 1, fontFamily: "var(--font-display), serif", display: "inline-block" }}>
              {stats.score}
            </div>
            <div className="text-xs mt-2" style={{ color: "var(--ae-nebula)" }}>based on graduations · volume · profit · activity</div>
          </div>

          {rank && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "RANK BY TRADES", value: `#${rank.tradeRank}`, hot: rank.tradeRank <= 3 },
                { label: "RANK BY VOLUME", value: `#${rank.volRank}`, hot: rank.volRank <= 3 },
                { label: "BIGGEST BUY", value: `${rank.biggestBuy.toFixed(0)} LCAI`, hot: rank.biggestBuy >= 1000 },
              ].map(r => (
                <div key={r.label} className="rounded-2xl p-4 text-center" style={{ background: r.hot ? "rgba(255,140,30,0.1)" : "var(--ae-night)", border: `1px solid ${r.hot ? "rgba(255,140,30,0.4)" : "var(--clr-border)"}` }}>
                  <div className="text-lg font-bold" style={{ color: r.hot ? "var(--ae-aurum-bright)" : "var(--ae-aurum)", fontFamily: "var(--font-display), serif" }}>{r.value}</div>
                  <div className="text-[10px] mt-1" style={{ color: "var(--ae-nebula)" }}>{r.label}</div>
                </div>
              ))}
            </div>
          )}
          {stats && (() => {
            // compute trading streak
            const tradeDays = new Set(trades.map(t => Math.floor(t.ts / 86400)));
            const now = Math.floor(Date.now()/1000/86400);
            let streak = 0;
            for (let d = now; tradeDays.has(d); d--) streak++;

            // compute biggest single buy
            const biggestBuy = rank?.biggestBuy || 0;

            // all achievements definition
            const allAchievements = [
              // TRADING ACTIVITY
              { id:"first_spark", label:"First Spark", desc:"Made your first trade", earned: stats.totalTrades >= 1 },
              { id:"getting_warmed_up", label:"Getting Warmed Up", desc:"5 trades", earned: stats.totalTrades >= 5 },
              { id:"active_trader", label:"Active Trader", desc:"10 trades", earned: stats.totalTrades >= 10 },
              { id:"on_a_roll", label:"On A Roll", desc:"25 trades", earned: stats.totalTrades >= 25 },
              { id:"forge_veteran", label:"Forge Veteran", desc:"50 trades", earned: stats.totalTrades >= 50 },
              { id:"centurion", label:"Centurion", desc:"100 trades", earned: stats.totalTrades >= 100 },
              { id:"forge_legend", label:"Forge Legend", desc:"250 trades", earned: stats.totalTrades >= 250 },
              { id:"forge_god", label:"Forge God", desc:"500 trades", earned: stats.totalTrades >= 500 },
              { id:"immortal", label:"Immortal", desc:"1,000 trades", earned: stats.totalTrades >= 1000 },
              { id:"consistent", label:"Consistent", desc:"3-day trading streak", earned: streak >= 3 },
              { id:"week_warrior", label:"Week Warrior", desc:"7-day trading streak", earned: streak >= 7 },
              { id:"fortnight", label:"Fortnight", desc:"14-day trading streak", earned: streak >= 14 },
              { id:"monthly", label:"Monthly", desc:"30-day trading streak", earned: streak >= 30 },
              { id:"ghost", label:"Ghost", desc:"Came back after 7+ days away", earned: false },
              { id:"comeback", label:"Comeback", desc:"Came back after 30+ days", earned: false },
              { id:"resurrection", label:"Resurrection", desc:"Came back after 60+ days", earned: false },
              { id:"circus", label:"Circus", desc:"5 different coins in one day", earned: false },
              { id:"coin_flipper", label:"Coin Flipper", desc:"Bought and sold same coin same day", earned: false },
              { id:"trigger_happy", label:"Trigger Happy", desc:"3 trades in 10 minutes", earned: false },
              { id:"marathon", label:"Marathon", desc:"Traded every day for a week", earned: streak >= 7 },
              { id:"speed_trader", label:"Speed Trader", desc:"5 trades in one hour", earned: false },
              { id:"blitz", label:"Blitz", desc:"10 trades in one hour", earned: false },
              // GRADUATION
              { id:"backed_a_grad", label:"Backed a Grad", desc:"Bought a coin that graduated", earned: stats.graduated >= 1 },
              { id:"double_down", label:"Double Down", desc:"2 graduations backed", earned: stats.graduated >= 2 },
              { id:"hat_trick", label:"Hat Trick", desc:"3 graduations backed", earned: stats.graduated >= 3 },
              { id:"grad_hunter", label:"Grad Hunter", desc:"5 graduations backed", earned: stats.graduated >= 5 },
              { id:"graduation_machine", label:"Graduation Machine", desc:"8 graduations backed", earned: stats.graduated >= 8 },
              { id:"rocket_fuel", label:"Rocket Fuel", desc:"All current grads backed", earned: stats.graduated >= 8 },
              { id:"oracle", label:"Oracle", desc:"Bought before 10% curve filled", earned: false },
              { id:"visionary", label:"Visionary", desc:"Bought before 5% curve filled", earned: false },
              { id:"prophet", label:"Prophet", desc:"First buyer on a graduated coin", earned: false },
              { id:"diamond_hands", label:"Diamond Hands", desc:"Held through graduation without selling", earned: false },
              { id:"patient", label:"Patient", desc:"Bought early and waited for graduation", earned: false },
              { id:"early_majority", label:"Early Majority", desc:"Bought before 25% curve", earned: false },
              { id:"late_bloomer", label:"Late Bloomer", desc:"Bought after 75% curve and it graduated", earned: false },
              // SPENDING
              { id:"first_lcai", label:"First LCAI", desc:"Spent any amount on the Forge", earned: stats.totalSpent > 0 },
              { id:"small_fish", label:"Small Fish", desc:"100 LCAI spent", earned: stats.totalSpent >= 100 },
              { id:"getting_serious", label:"Getting Serious", desc:"500 LCAI spent", earned: stats.totalSpent >= 500 },
              { id:"dolphin", label:"Dolphin", desc:"1,000 LCAI spent", earned: stats.totalSpent >= 1000 },
              { id:"big_player", label:"Big Player", desc:"2,500 LCAI spent", earned: stats.totalSpent >= 2500 },
              { id:"whale", label:"Whale", desc:"5,000 LCAI spent", earned: stats.totalSpent >= 5000 },
              { id:"shark", label:"Shark", desc:"10,000 LCAI spent", earned: stats.totalSpent >= 10000 },
              { id:"leviathan", label:"Leviathan", desc:"50,000 LCAI spent", earned: stats.totalSpent >= 50000 },
              { id:"high_roller", label:"High Roller", desc:"Single buy over 1,000 LCAI", earned: biggestBuy >= 1000 },
              { id:"all_in", label:"All In", desc:"Single buy over 5,000 LCAI", earned: biggestBuy >= 5000 },
              { id:"moonshot", label:"Moonshot", desc:"Single buy over 10,000 LCAI", earned: biggestBuy >= 10000 },
              { id:"satoshi_mode", label:"Satoshi Mode", desc:"Spent exactly 0.001 LCAI", earned: false },
              // PROFIT & LOSS
              { id:"first_green", label:"First Green", desc:"First profitable sell", earned: stats.netPnl > 0 },
              { id:"in_the_green", label:"In The Green", desc:"Positive all-time PnL", earned: stats.netPnl > 0 },
              { id:"printing", label:"Printing", desc:"100 LCAI profit", earned: stats.netPnl >= 100 },
              { id:"stacking", label:"Stacking", desc:"500 LCAI profit", earned: stats.netPnl >= 500 },
              { id:"money_printer", label:"Money Printer", desc:"1,000 LCAI profit", earned: stats.netPnl >= 1000 },
              { id:"filament_rich", label:"Filament Rich", desc:"5,000 LCAI profit", earned: stats.netPnl >= 5000 },
              { id:"sharp_eye", label:"Sharp Eye", desc:"50%+ graduation rate", earned: stats.gradRate >= 50 },
              { id:"sniper", label:"Sniper", desc:"75%+ graduation rate", earned: stats.gradRate >= 75 },
              { id:"omniscient", label:"Omniscient", desc:"100% graduation rate (min 3)", earned: stats.gradRate >= 100 && stats.coins >= 3 },
              { id:"tuition_paid", label:"Tuition Paid", desc:"Lost 100 LCAI", earned: stats.netPnl <= -100 },
              { id:"expensive_lesson", label:"Expensive Lesson", desc:"Lost 500 LCAI", earned: stats.netPnl <= -500 },
              { id:"rekt", label:"Rekt", desc:"Lost 1,000 LCAI", earned: stats.netPnl <= -1000 },
              { id:"absolutely_rekt", label:"Absolutely Rekt", desc:"Lost 5,000 LCAI", earned: stats.netPnl <= -5000 },
              { id:"comeback_kid", label:"Comeback Kid", desc:"Turned negative PnL positive", earned: false },
              { id:"phoenix", label:"Phoenix", desc:"Recovered from 1,000 LCAI loss", earned: false },
              { id:"teflon", label:"Teflon", desc:"Never had a losing sell", earned: false },
              { id:"lucky_streak", label:"Lucky Streak", desc:"5 profitable sells in a row", earned: false },
              { id:"cold_streak", label:"Cold Streak", desc:"5 losing sells in a row", earned: false },
              { id:"gambler", label:"Gambler", desc:"10 losing sells in a row", earned: false },
              // DIVERSITY
              { id:"curious", label:"Curious", desc:"3 different coins traded", earned: stats.coins >= 3 },
              { id:"explorer", label:"Explorer", desc:"5 different coins", earned: stats.coins >= 5 },
              { id:"adventurer", label:"Adventurer", desc:"10 different coins", earned: stats.coins >= 10 },
              { id:"nomad", label:"Nomad", desc:"20 different coins", earned: stats.coins >= 20 },
              { id:"collector", label:"Collector", desc:"30 different coins", earned: stats.coins >= 30 },
              { id:"completionist", label:"Completionist", desc:"Traded every graduated coin", earned: false },
              { id:"omnivore", label:"Omnivore", desc:"Traded curve and DEX same day", earned: false },
              { id:"both_sides", label:"Both Sides", desc:"Bought and sold on DEX and Forge same week", earned: false },
              // TIME BASED
              { id:"night_owl", label:"Night Owl", desc:"Traded after midnight", earned: trades.some(t => new Date(t.ts*1000).getHours() >= 0 && new Date(t.ts*1000).getHours() < 4) },
              { id:"vampire", label:"Vampire", desc:"3 trades after midnight", earned: trades.filter(t => new Date(t.ts*1000).getHours() < 4).length >= 3 },
              { id:"early_bird", label:"Early Bird", desc:"Traded before 6am", earned: trades.some(t => new Date(t.ts*1000).getHours() < 6) },
              { id:"rooster", label:"Rooster", desc:"3 trades before 6am", earned: trades.filter(t => new Date(t.ts*1000).getHours() < 6).length >= 3 },
              { id:"weekend_warrior", label:"Weekend Warrior", desc:"Traded Sat and Sun", earned: false },
              { id:"holiday_trader", label:"Holiday Trader", desc:"Traded 4 weekends in a row", earned: false },
              { id:"no_days_off", label:"No Days Off", desc:"7-day streak including weekend", earned: streak >= 7 },
              { id:"lunch_break", label:"Lunch Break", desc:"Traded between 12-1pm", earned: trades.some(t => new Date(t.ts*1000).getHours() === 12) },
              { id:"after_hours", label:"After Hours", desc:"Traded between 5-7pm", earned: trades.some(t => { const h = new Date(t.ts*1000).getHours(); return h >= 17 && h < 19; }) },
              // COMMUNITY & SOCIAL
              { id:"pioneer", label:"Pioneer", desc:"Among first 100 traders on Filament", earned: rank ? rank.tradeRank <= 100 : false },
              { id:"og", label:"OG", desc:"Among first 50 traders", earned: rank ? rank.tradeRank <= 50 : false },
              { id:"genesis", label:"Genesis", desc:"Among first 10 traders", earned: rank ? rank.tradeRank <= 10 : false },
              { id:"most_active", label:"Most Active", desc:"#1 trader by trade count", earned: rank ? rank.tradeRank === 1 : false },
              { id:"king_of_volume", label:"King of Volume", desc:"#1 by LCAI volume", earned: rank ? rank.volRank === 1 : false },
              { id:"supporter", label:"Supporter", desc:"Traded 5 coins by others", earned: false },
              { id:"community_builder", label:"Community Builder", desc:"Traded 10 coins by others", earned: false },
              { id:"true_believer", label:"True Believer", desc:"Traded 20 coins by others", earned: false },
              { id:"creators_friend", label:"Creator's Friend", desc:"Bought the creator's own coin", earned: false },
              { id:"solo_mission", label:"Solo Mission", desc:"Only traded your own coins", earned: false },
              // COINS & CREATION
              { id:"creator", label:"Creator", desc:"Launched a coin", earned: false },
              { id:"serial_creator", label:"Serial Creator", desc:"Launched 3 coins", earned: false },
              { id:"factory", label:"Factory", desc:"Launched 5 coins", earned: false },
              { id:"mint_master", label:"Mint Master", desc:"Launched 10 coins", earned: false },
              { id:"graduation_day", label:"Graduation Day", desc:"Your created coin graduated", earned: false },
              { id:"double_grad_creator", label:"Double Grad Creator", desc:"2 of your coins graduated", earned: false },
              { id:"legend_creator", label:"Legend Creator", desc:"5 of your coins graduated", earned: false },
              // DEX SPECIFIC
              { id:"dex_trader", label:"DEX Trader", desc:"First DEX swap", earned: dexSwaps.length >= 1 },
              { id:"dex_veteran", label:"DEX Veteran", desc:"10 DEX swaps", earned: dexSwaps.length >= 10 },
              { id:"liquidity_provider", label:"Liquidity Provider", desc:"Added liquidity to any pool", earned: false },
              { id:"pool_owner", label:"Pool Owner", desc:"Added liquidity to 3 pools", earned: false },
              { id:"lp_farmer", label:"LP Farmer", desc:"Earned LP fees", earned: false },
              { id:"token_swapper", label:"Token Swapper", desc:"Swapped between two Forge coins", earned: false },
              { id:"arbitrageur", label:"Arbitrageur", desc:"Swapped same pair both directions same day", earned: false },
              // SPECIAL & RARE
              { id:"lucky_number_7", label:"Lucky Number 7", desc:"7th trade was profitable", earned: false },
              { id:"round_number", label:"Round Number", desc:"Traded exactly 100, 500, or 1000 LCAI", earned: false },
              { id:"symmetry", label:"Symmetry", desc:"Spent and received equal LCAI", earned: false },
              { id:"filament_native", label:"Filament Native", desc:"Used every Filament feature", earned: false },
              { id:"full_stack", label:"Full Stack", desc:"Used Exchange, Forge, Pools, Bridge in one day", earned: false },
              { id:"bridge_crosser", label:"Bridge Crosser", desc:"Used the bridge", earned: false },
              { id:"perfectionist", label:"Perfectionist", desc:"0 failed transactions", earned: false },
              { id:"crash_test", label:"Crash Test", desc:"Had a transaction revert", earned: false },
              { id:"survivor", label:"Survivor", desc:"Recovered after a failed transaction", earned: false },
              { id:"whale_watcher", label:"Whale Watcher", desc:"Your buy triggered a whale alert", earned: biggestBuy >= 30000 },
              { id:"trend_setter", label:"Trend Setter", desc:"Bought before coin hit Forge Pulse top 3", earned: false },
              { id:"king_of_the_hill", label:"King of the Hill", desc:"Held #1 on Forge Pulse", earned: false },
              { id:"filament_forever", label:"Filament Forever", desc:"Used Filament 90 consecutive days", earned: streak >= 90 },
            ];

            const earned = allAchievements.filter(a => a.earned);
            const locked = allAchievements.filter(a => !a.earned);

            return (
              <div className="f-card rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs" style={{ color: "var(--ae-nebula)" }}>ACHIEVEMENTS</div>
                  <div className="text-xs font-semibold" style={{ color: "var(--ae-aurum)" }}>{earned.length} unlocked</div>
                </div>
                <div className="flex flex-wrap gap-3 mb-4">
                  {earned.map(a => (
                    <div key={a.id} className="flex flex-col items-center gap-1" style={{ width: 64 }} title={a.desc}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/badges/${a.id}.png`} alt={a.label} width={48} height={48} style={{ borderRadius: "50%", filter: "drop-shadow(0 0 6px rgba(255,140,30,0.5))" }} />
                      <span className="text-[9px] text-center leading-tight" style={{ color: "var(--ae-aurum)" }}>{a.label}</span>
                    </div>
                  ))}
                </div>

              </div>
            );
          })()}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {[
              { label: "Curve trades", sublabel: "buys + sells on the Forge", value: stats.totalTrades.toString() },
              { label: "Coins touched", sublabel: "unique coins traded", value: stats.coins.toString() },
              { label: "Backed a grad", sublabel: "coins you bought that graduated", value: stats.graduated.toString() },
              { label: "Graduation rate", sublabel: "% of your coins that graduated", value: stats.gradRate.toFixed(0) + "%" },
              { label: "LCAI into curves", sublabel: "total spent buying", value: fmt(stats.totalSpent) },
              { label: "LCAI from sells", sublabel: "total received selling", value: fmt(stats.totalReceived) },
            ].map((s: {label:string;sublabel:string;value:string}) => (
              <div key={s.label} className="f-card rounded-2xl p-4">
                <div className="text-xl font-bold" style={{ color: "var(--ae-aurum)", fontFamily: "var(--font-display), serif" }}>{s.value}</div>
                <div className="text-xs mt-0.5 font-semibold" style={{ color: "var(--clr-heading)" }}>{s.label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--ae-nebula)" }}>{s.sublabel}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5 mb-6 flex items-center justify-between" style={{ background: "var(--ae-night)", border: `1px solid ${stats.netPnl >= 0 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}` }}>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--ae-nebula)" }}>NET PNL · ALL TIME</div>
              <div className="text-3xl font-bold" style={{ color: stats.netPnl >= 0 ? "var(--clr-success)" : "var(--clr-danger)", fontFamily: "var(--font-display), serif" }}>
                {stats.netPnl >= 0 ? "+" : ""}{fmt(stats.netPnl)} LCAI
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--ae-nebula)" }}>What you received from sells minus what you spent buying — realized only. Coins you still hold are not counted.</div>
            </div>
            <div style={{ fontSize: 48 }}>{stats.netPnl >= 0 ? "🟢" : "🔴"}</div>
          </div>

          {stats.bestTrade && (
            <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--ae-night)", border: "1px solid var(--clr-border)" }}>
              <div className="text-xs mb-2" style={{ color: "var(--ae-nebula)" }}>BEST TRADE</div>
              <div className="flex items-center justify-between">
                <div className="font-bold text-xl" style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>
                  {stats.bestTrade[1].symbol || stats.bestTrade[0].slice(0,8)+"…"}
                  {stats.bestTrade[1].graduated ? <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.12)", color: "var(--clr-success)" }}>GRADUATED</span> : null}
                </div>
                <div className="text-xl font-bold" style={{ color: (stats.bestTrade[1].received - stats.bestTrade[1].spent) >= 0 ? "var(--clr-success)" : "var(--clr-danger)" }}>
                  {(stats.bestTrade[1].received - stats.bestTrade[1].spent) >= 0 ? "+" : ""}{fmt(stats.bestTrade[1].received - stats.bestTrade[1].spent)} LCAI
                </div>
              </div>
            </div>
          )}

          <div className="f-card rounded-2xl p-5 mb-6">
            <div className="text-xs mb-4" style={{ color: "var(--ae-nebula)" }}>ACTIVITY · LAST 90 DAYS</div>
            <div className="flex gap-1 flex-wrap">
              {stats.days.map((d, i) => (
                <div key={i} title={`${d.count} trades`} style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0, background: d.count === 0 ? "var(--ae-veil)" : d.count === 1 ? "rgba(255,140,30,0.3)" : d.count <= 3 ? "rgba(255,140,30,0.6)" : "var(--ae-ember)" }} />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px]" style={{ color: "var(--ae-nebula)" }}>
              <span>90 days ago</span><span>today</span>
            </div>
          </div>

          <div className="f-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 text-xs" style={{ color: "var(--ae-nebula)", borderBottom: "1px solid var(--clr-border)" }}>RECENT ACTIVITY</div>
            {[...trades.map(t => ({ ...t, source: "Forge", symbol: t.symbol, lcai: Number(BigInt(t.lcai_amount))/1e18, buy: t.is_buy === 1, ts: t.ts })),
              ...dexSwaps.map((s:any) => ({ source: "DEX", symbol: s.symbol, lcai: Number(BigInt(s.lcai_amount||"0"))/1e18, buy: s.is_buy === 1, ts: s.ts }))
            ].sort((a,b) => b.ts - a.ts).slice(0, 12).map((t, i, arr) => (
              <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: i < arr.length-1 ? "1px solid var(--clr-border)" : "none" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: t.buy ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)", color: t.buy ? "var(--clr-success)" : "var(--clr-danger)" }}>{t.buy ? "BUY" : "SELL"}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--clr-heading)" }}>{t.symbol || "?"}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--ae-haze)", color: "var(--ae-nebula)" }}>{t.source}</span>
                </div>
                <span className="text-sm" style={{ color: "var(--ae-aurum)" }}>{fmt(t.lcai)} LCAI</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

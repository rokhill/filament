import Link from "next/link";

export const metadata = {
  title: "How Pools Work — Filament",
  description: "Provide liquidity on Filament to earn swap fees. Learn how it works, what you earn, and the risk of impermanent loss.",
};

export default function PoolsGuidePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 min-h-[70vh]">
      <div className="f-eyebrow mb-2">Liquidity</div>
      <h1 className="f-display text-3xl sm:text-4xl">How Pools Work</h1>
      <p className="f-body text-sm mt-3 leading-relaxed" style={{ maxWidth: "560px" }}>
        Providing liquidity is how you earn passive income on Filament. Deposit a pair of
        tokens into a pool and you collect a share of every swap fee that pool generates —
        for as long as your funds stay in it. Think of it like staking, except you&apos;re the
        one powering the market.
      </p>

      <div className="mt-9 space-y-8">
        <section>
          <div className="f-section"><h2>What you're doing</h2></div>
          <p className="f-body text-sm leading-relaxed">
            Every trading pair on Filament (say LCAI / USDT) has a pool holding both tokens.
            When someone swaps, they pay a <strong className="text-[var(--ft-hi)]">0.30% fee</strong>,
            and that fee is added to the pool. As a liquidity provider (LP), you own a share of
            the pool proportional to what you deposited — so you earn that same share of every fee.
            The more the pair trades, the more you earn.
          </p>
        </section>

        <section>
          <div className="f-section"><h2>How to add liquidity</h2></div>
          <ol className="space-y-2 text-sm f-body list-decimal list-inside">
            <li>Go to <Link href="/pools" className="forge-guide-link">Pools</Link> → Add V2 Liquidity.</li>
            <li>Pick both tokens. Enter an amount for one — the other fills in automatically at the current pool ratio.</li>
            <li>Confirm two transactions: an approval, then the deposit.</li>
            <li>You receive <strong className="text-[var(--ft-hi)]">LP tokens</strong> — your receipt and proof of ownership. Hold them to keep earning.</li>
          </ol>
        </section>

        <section>
          <div className="f-section"><h2>What you earn</h2></div>
          <p className="f-body text-sm leading-relaxed">
            Fees accrue directly into the pool, which means your LP tokens are continuously
            becoming redeemable for slightly more than you put in. You don&apos;t claim rewards
            separately — when you remove your liquidity, you get your share of the pool
            <em> including</em> all the fees it earned while you were in.
          </p>
        </section>

        <section>
          <div className="f-section"><h2>The risk: impermanent loss</h2></div>
          <div className="f-card p-4 mb-3" style={{ borderColor: "rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.06)" }}>
            <p className="f-body text-sm leading-relaxed">
              <strong style={{ color: "var(--ft-gold)" }}>This is the part to understand before you deposit.</strong>{" "}
              If the price ratio between your two tokens changes a lot while you&apos;re providing
              liquidity, you can end up with less dollar value than if you&apos;d simply held the two
              tokens in your wallet. This gap is called <strong className="text-[var(--ft-hi)]">impermanent loss</strong>.
            </p>
          </div>
          <p className="f-body text-sm leading-relaxed">
            It&apos;s &quot;impermanent&quot; because it only becomes real when you withdraw — if the price
            ratio returns to where you started, the loss disappears. The fees you earn can offset
            it, and on stable or low-volatility pairs it&apos;s minimal. But on a volatile pair, a big
            price move can outweigh the fees. Provide liquidity to pairs you understand, and don&apos;t
            assume LP-ing is risk-free just because it earns yield.
          </p>
        </section>

        <section>
          <div className="f-section"><h2>Removing liquidity</h2></div>
          <p className="f-body text-sm leading-relaxed">
            Go to Pools → Your V2 Liquidity, select the pool, and choose how much to withdraw.
            You get back your share of both tokens plus the fees earned. You can leave anytime —
            there&apos;s no lock-up.
          </p>
        </section>
      </div>

      <div className="f-card p-5 mt-10">
        <p className="f-body text-sm">
          Liquidity provision earns real yield, but it isn&apos;t free money. Understand impermanent
          loss, start with pairs you know, and only provide what you can afford to have exposed.
          See the full <Link href="/disclaimer" className="forge-guide-link">risk disclaimer</Link>.
        </p>
      </div>
    </main>
  );
}

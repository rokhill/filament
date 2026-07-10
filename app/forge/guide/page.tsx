import Link from "next/link";

export const metadata = {
  title: "Forge Guide — Filament",
  description:
    "How the Forge works — fair-launch memecoins on the LightChain AI network with automatic listing on Filament.",
};

export default function ForgeGuidePage() {
  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-[var(--clr-heading)] ae-display mb-2">
        How the <span className="theme-gradient">Forge</span> works
      </h1>
      <p className="text-[var(--clr-body)] mb-10">
        The Forge is a fair-launch pad for memecoins on LightChain AI. Every coin starts on a
        bonding curve — a smart contract that sells tokens at a price that rises as more people
        buy. When the curve sells out, the coin automatically lists on Filament with its
        liquidity locked forever. No presale, no team allocation, no rug.
      </p>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">The lifecycle of a coin</h2>
        <ol className="space-y-3 text-sm text-[var(--clr-body)] list-decimal list-inside">
          <li>
            <strong className="text-[var(--clr-heading)]">Forged.</strong> Anyone creates a coin for 300 LCAI.
            Every coin has exactly 1,000,000,000 tokens — all of them start inside the curve. Nobody,
            including the creator, gets free tokens.
          </li>
          <li>
            <strong className="text-[var(--clr-heading)]">Traded on the curve.</strong> People buy and sell
            with native LCAI. Price starts tiny and rises automatically with every buy. You can sell back
            to the curve at any time before graduation.
          </li>
          <li>
            <strong className="text-[var(--clr-heading)]">Graduated.</strong> When 800M of the 1B tokens have
            been bought (roughly 293,000 LCAI raised), the coin graduates in that same transaction: all the
            raised LCAI is paired with the remaining 200M tokens as a liquidity pool on Filament, and the
            LP tokens are burned. From then on it trades on the open market like any other token.
          </li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">Buying a coin</h2>
        <ol className="space-y-2 text-sm text-[var(--clr-body)] list-decimal list-inside">
          <li>Connect your wallet on LCAI mainnet and open any coin from the <Link href="/forge" className="text-[var(--ae-aurum)] underline">Forge</Link>.</li>
          <li>Enter how much LCAI you want to spend in the <strong className="text-[var(--clr-heading)]">Buy</strong> panel. The estimate shows how many tokens you&apos;ll get.</li>
          <li>Click <strong className="text-[var(--clr-heading)]">Buy</strong> and confirm in your wallet. Done — the tokens are yours.</li>
        </ol>
        <p className="text-xs text-[var(--clr-body)] mt-3 opacity-70">
          There is a 1% fee on curve trades and a 2% slippage guard applied automatically. Earlier buys get lower prices — that&apos;s the whole game.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">Selling a coin</h2>
        <ol className="space-y-2 text-sm text-[var(--clr-body)] list-decimal list-inside">
          <li>Open the coin page and switch to <strong className="text-[var(--clr-heading)]">Sell</strong>.</li>
          <li>Enter the amount (or hit Max). Your first sell asks for two confirmations: an approval, then the sell itself.</li>
          <li>You receive LCAI back at the current curve price, minus the 1% fee.</li>
        </ol>
        <p className="text-xs text-[var(--clr-body)] mt-3 opacity-70">
          Before graduation, coins can only be traded through the Forge — you can&apos;t transfer them wallet-to-wallet. That&apos;s deliberate: it blocks snipers from creating fake pools. Transfers unlock the moment a coin graduates.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">Forging your own coin</h2>
        <ol className="space-y-2 text-sm text-[var(--clr-body)] list-decimal list-inside">
          <li>Click <strong className="text-[var(--clr-heading)]">+ Forge a coin</strong> on the Forge page.</li>
          <li>Pick a name and symbol. Add a description, an image URL, and your socials — this is what traders see, so make it count.</li>
          <li>Optionally enter an <strong className="text-[var(--clr-heading)]">initial buy</strong>. This purchase happens in the same transaction as creation, which means nobody can buy before you. Strongly recommended.</li>
          <li>Confirm in your wallet. Cost: 300 LCAI creation fee + your initial buy.</li>
        </ol>
        <div className="mt-4 p-3 rounded-lg bg-[rgba(227,179,65,0.08)] border border-[rgba(227,179,65,0.2)] text-xs text-[var(--clr-body)]">
          <strong className="text-[var(--ae-aurum)]">Creators get no free tokens.</strong> Your only edge is buying first at the lowest price. Every coin page publicly shows how much of the supply the creator holds — the community is watching.
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">Graduation and the progress bar</h2>
        <p className="text-sm text-[var(--clr-body)] mb-3">
          Every live coin shows a gold progress bar — that&apos;s how much of the curve has been bought.
          At 100% the coin graduates automatically, inside the final buy transaction:
        </p>
        <ul className="space-y-2 text-sm text-[var(--clr-body)] list-disc list-inside">
          <li>All raised LCAI (minus a 2% graduation fee) is paired with 200M tokens on Filament.</li>
          <li>The LP tokens are sent to the burn address — <strong className="text-[var(--clr-heading)]">that liquidity can never be withdrawn, by anyone, ever.</strong></li>
          <li>Token transfers unlock and the coin trades freely on the <Link href="/" className="text-[var(--ae-aurum)] underline">swap page</Link>.</li>
        </ul>
        <p className="text-xs text-[var(--clr-body)] mt-3 opacity-70">
          The curve is calibrated so the opening market price on Filament matches the final curve price — graduation is a doorway, not a cliff.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">Honest risks</h2>
        <ul className="space-y-2 text-sm text-[var(--clr-body)] list-disc list-inside">
          <li>Memecoins are speculation, not investment. Most never graduate. Only spend what you can lose entirely.</li>
          <li>The contract prevents rug-pulls of liquidity — it cannot prevent a coin from simply going to zero because people stop caring.</li>
          <li>Creators and early buyers can sell into your buys. Check the creator&apos;s holding % and the recent trades on every coin page.</li>
          <li>Anyone can forge a coin with any name. A coin called &quot;LCAI2&quot; has nothing to do with LightChain. Verify addresses, not names.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">The fine print</h2>
        <div className="rounded-xl bg-[var(--ae-haze)] border border-[var(--clr-border)] p-4 text-sm font-mono text-[var(--clr-body)] space-y-1">
          <div><span className="text-[var(--ae-aurum)]">Forge contract</span> — 0x17b48A0070DC048E81f7104a1bA65F937BbD8D94</div>
          <div><span className="text-[var(--ae-aurum)]">Supply per coin</span> — 1,000,000,000 (fixed, no minting)</div>
          <div><span className="text-[var(--ae-aurum)]">Curve / LP split</span> — 800M curve / 200M liquidity</div>
          <div><span className="text-[var(--ae-aurum)]">Creation fee</span> — 300 LCAI</div>
          <div><span className="text-[var(--ae-aurum)]">Trade fee</span> — 1% (hard-capped at 3% in bytecode)</div>
          <div><span className="text-[var(--ae-aurum)]">Graduation fee</span> — 2% of raise (hard-capped at 5%)</div>
          <div><span className="text-[var(--ae-aurum)]">Graduation raise</span> — ~293,000 LCAI</div>
        </div>
        <p className="text-xs text-[var(--clr-body)] mt-3 opacity-70">
          Fee caps are enforced by the contract itself — the operator cannot raise them beyond those limits or touch curve reserves. Verify everything on lightscan.app.
        </p>
      </section>
    </div>
  );
}

import Link from "next/link";

export const metadata = {
  title: "Forge Guide — Filament",
  description:
    "How the Forge works — fair-launch memecoins on LightChain AI with real economics explained.",
};

const callout = (color: string, bg: string, border: string, children: React.ReactNode) => (
  <div className="rounded-xl p-4 my-4" style={{ background: bg, border: `1px solid ${border}` }}>
    <p className="text-sm" style={{ color }}>
      {children}
    </p>
  </div>
);

export default function ForgeGuidePage() {
  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">

      {/* ---- Hero ---- */}
      <h1 className="text-3xl font-bold text-[var(--clr-heading)] ae-display mb-2">
        How the <span className="theme-gradient">Forge</span> works
      </h1>
      <p className="text-[var(--clr-body)] mb-2">
        The Forge is a fair-launch memecoin platform on LightChain AI. Fair launch means
        exactly what it sounds like: <strong className="text-[var(--clr-heading)]">nobody
        gets a head start.</strong> No team allocation, no presale, no insider
        wallets. The creator buys at the same price as everyone else — or earlier,
        if they put in an initial buy at creation.
      </p>
      <p className="text-[var(--clr-body)] mb-10">
        Every coin starts on a bonding curve, a smart contract that is the market.
        When the curve sells out, the coin graduates: it gets permanent liquidity on
        Filament DEX with the LP tokens burned so nobody can ever pull it.
      </p>

      {/* ---- The actual point ---- */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-1 border-b border-[var(--clr-border)] pb-2">
          Why early buyers win — the real economics
        </h2>
        <p className="text-sm text-[var(--clr-body)] mt-3 mb-3">
          The bonding curve sets a starting price and raises it automatically with
          every buy. The earlier you get in, the cheaper your tokens. This is not
          hype — it is math baked into the contract.
        </p>
        <p className="text-sm text-[var(--clr-body)] mb-4">
          Here is a concrete example. Say a coin launches and you are the very
          first buyer, putting in <strong className="text-[var(--clr-heading)]">50 LCAI</strong>:
        </p>

        {/* Example table */}
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid var(--clr-border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--ae-night)" }}>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--clr-heading)]">Event</th>
                <th className="text-right px-4 py-2.5 font-semibold text-[var(--clr-heading)]">Your position</th>
              </tr>
            </thead>
            <tbody style={{ background: "var(--ae-haze)" }}>
              <tr style={{ borderTop: "1px solid var(--clr-border)" }}>
                <td className="px-4 py-3 text-[var(--clr-body)]">You buy first — 50 LCAI at the lowest curve price</td>
                <td className="px-4 py-3 text-right font-mono text-[var(--clr-heading)]">~36,900,000 tokens</td>
              </tr>
              <tr style={{ borderTop: "1px solid var(--clr-border)" }}>
                <td className="px-4 py-3 text-[var(--clr-body)]">The community buys the rest of the curve (293k LCAI total raised)</td>
                <td className="px-4 py-3 text-right font-mono" style={{ color: "var(--ae-aurum)" }}>Price has risen ~3x</td>
              </tr>
              <tr style={{ borderTop: "1px solid var(--clr-border)" }}>
                <td className="px-4 py-3 text-[var(--clr-body)]">Coin graduates — your tokens unlock, Filament pool opens</td>
                <td className="px-4 py-3 text-right font-mono" style={{ color: "var(--clr-success)" }}>~146 LCAI value</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm text-[var(--clr-body)] mb-2">
          Your 50 LCAI bought at the bottom of the curve. By graduation the price is
          roughly 3x where you bought. Your tokens are worth ~146 LCAI before the
          open market even starts trading — purely from being early on a curve that
          sold out.
        </p>

        {callout(
          "var(--ae-aurum)",
          "rgba(227,179,65,0.08)",
          "rgba(227,179,65,0.25)",
          <>
            <strong>The earlier you buy, the better the graduation math works for you.</strong>{" "}
            Someone who buys at 90% of the curve has almost no upside from graduation
            itself — they bought near the final price. Someone who buys at 5% of the
            curve gets the full ride.
          </>
        )}
      </section>

      {/* ---- Tokens locked ---- */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">
          Why tokens are locked before graduation
        </h2>
        <p className="text-sm text-[var(--clr-body)] mb-3">
          Before graduation, the tokens you hold on the curve cannot be transferred
          to another wallet or listed on any other exchange. They can only be sold
          back to the curve. This is intentional and it protects you:
        </p>
        <ul className="space-y-2 text-sm text-[var(--clr-body)] list-disc list-inside mb-3">
          <li>Nobody can create a fake liquidity pool with the token before the real one opens</li>
          <li>Nobody can front-run the launch by sniping tokens and dumping them immediately on a side market</li>
          <li>The only market that exists before graduation is the curve — which always has a price and always lets you sell back</li>
        </ul>
        {callout(
          "var(--clr-success)",
          "rgba(74,222,128,0.08)",
          "rgba(74,222,128,0.25)",
          <>
            <strong>Graduation is the unlock event.</strong> The moment the curve sells
            out, your tokens become standard ERC-20s that transfer freely and trade on
            Filament. Graduation is not a risk — it is the finish line.
          </>
        )}
      </section>

      {/* ---- LP burn ---- */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">
          The LP burn — why it matters
        </h2>
        <p className="text-sm text-[var(--clr-body)] mb-3">
          When a coin graduates, the contract takes all the LCAI raised on the curve
          and pairs it with 200,000,000 tokens to create a liquidity pool on Filament.
          Whoever creates that pool normally receives LP tokens — proof of ownership
          that lets them withdraw the liquidity later.
        </p>
        <p className="text-sm text-[var(--clr-body)] mb-3">
          <strong className="text-[var(--clr-heading)]">The Forge sends those LP tokens
          straight to the burn address.</strong> Nobody holds them. The contract itself
          cannot withdraw the liquidity. The team cannot withdraw it. There is no
          multisig, no timelock, no governance vote that could change this — it is
          done in the same transaction as graduation and cannot be reversed.
        </p>
        <p className="text-sm text-[var(--clr-body)] mb-3">
          This is how the Forge eliminates the most common memecoin scam — the rug
          pull. A rug pull requires someone to hold LP tokens. Nobody does.
        </p>
        {callout(
          "var(--clr-body)",
          "var(--ae-night)",
          "var(--clr-border)",
          <>
            <strong className="text-[var(--clr-heading)]">In plain English:</strong>{" "}
            the liquidity that backs every graduated coin on Filament is there
            permanently. The pool cannot be drained. Ever. You can verify this
            yourself on{" "}
            <a
              href="https://mainnet.lightscan.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "var(--ae-aurum)" }}
            >
              lightscan
            </a>
            .
          </>
        )}
      </section>

      {/* ---- Can I sell before graduation ---- */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">
          Can I sell before graduation?
        </h2>
        <p className="text-sm text-[var(--clr-body)] mb-3">
          Yes, anytime. The curve contract is always the buyer. You do not need
          another person to be on the other side of your sell — the contract pays
          you back in LCAI at the current curve price, minus the 1% fee.
        </p>
        <p className="text-sm text-[var(--clr-body)] mb-3">
          If the coin has had a lot of sells since you bought, you may get back less
          than you put in. If it has had a lot of buys, you get back more. The curve
          price moves in both directions.
        </p>
        {callout(
          "var(--clr-warning, #f59e0b)",
          "rgba(245,158,11,0.08)",
          "rgba(245,158,11,0.25)",
          <>
            <strong>Your 50 LCAI does not become 50 LCAI guaranteed.</strong> It
            becomes however many tokens you bought, at whatever the curve price is
            when you sell. Early buyers profit if the coin sells out. Late buyers
            profit less from graduation but still profit if the open market keeps
            buying after. Everyone can lose if the coin dies on the curve.
          </>
        )}
      </section>

      {/* ---- How to buy ---- */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">
          How to buy a coin
        </h2>
        <ol className="space-y-2 text-sm text-[var(--clr-body)] list-decimal list-inside">
          <li>Connect your wallet on LCAI mainnet and open any coin from the <Link href="/forge" className="underline" style={{ color: "var(--ae-aurum)" }}>Forge</Link>.</li>
          <li>Enter how much LCAI you want to spend. The panel shows you exactly how many tokens you will receive at the current curve price.</li>
          <li>Click Buy and confirm in your wallet. Tokens are in your wallet immediately — but cannot be transferred until graduation.</li>
        </ol>
        <p className="text-xs mt-3" style={{ color: "var(--ae-nebula)" }}>
          1% fee on all curve trades. 2% slippage guard applied automatically to protect against sandwich attacks.
        </p>
      </section>

      {/* ---- How to launch ---- */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">
          How to launch your own coin
        </h2>
        <ol className="space-y-2 text-sm text-[var(--clr-body)] list-decimal list-inside">
          <li>Click <strong className="text-[var(--clr-heading)]">+ Forge a coin</strong>. Only a name and symbol are required.</li>
          <li>Add a description, image, and socials if you have them. Coins with a story and a face sell better than anonymous tickers.</li>
          <li>
            Enter an initial buy amount. This is strongly recommended —{" "}
            <strong className="text-[var(--clr-heading)]">your first buy happens in the
            same transaction as creation</strong>, which means it is physically
            impossible for anyone to buy before you. Without an initial buy you
            create the coin at zero and walk away.
          </li>
          <li>Confirm in your wallet. Cost: 300 LCAI creation fee + your initial buy.</li>
        </ol>
        {callout(
          "var(--clr-body)",
          "var(--ae-night)",
          "var(--clr-border)",
          <>
            <strong className="text-[var(--clr-heading)]">You get no free tokens as creator.</strong>{" "}
            Your only advantage is buying first at the cheapest possible price. Every
            coin page shows the creator&apos;s current holding percentage in real time.
            The community can see exactly how much you hold and whether you are selling.
          </>
        )}
      </section>

      {/* ---- Owning your coin ---- */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">
          You own your coin — build something with it
        </h2>
        <p className="text-sm text-[var(--clr-body)] mb-3">
          The Forge is just the launch mechanism. Once your coin graduates, the token
          contract is yours — Filament takes no ongoing control. What you build around
          it is entirely up to you.
        </p>
        <p className="text-sm text-[var(--clr-body)] mb-3">
          After graduation your token is a standard, freely-tradeable ERC-20 with
          permanent, rug-proof liquidity on Filament. That&apos;s a real foundation to build
          on. Creators can turn a memecoin into a project with actual utility:
        </p>
        <ul className="space-y-2 text-sm text-[var(--clr-body)] list-disc list-inside mb-3">
          <li><strong className="text-[var(--clr-heading)]">Governance / DAO</strong> — use the token for community votes and decisions</li>
          <li><strong className="text-[var(--clr-heading)]">Staking or rewards</strong> — build a contract that pays holders</li>
          <li><strong className="text-[var(--clr-heading)]">Access / membership</strong> — gate a game, app, NFT mint, or Discord behind holding it</li>
          <li><strong className="text-[var(--clr-heading)]">In-app currency</strong> — power a game or platform with it</li>
          <li><strong className="text-[var(--clr-heading)]">Charity / cause</strong> — route a treasury or proceeds transparently on-chain</li>
        </ul>
        <div className="mt-4 p-3 rounded-lg text-xs text-[var(--clr-body)]" style={{ background: "rgba(227,179,65,0.08)", border: "1px solid rgba(227,179,65,0.2)" }}>
          <strong className="text-[var(--ae-aurum)]">The edge Filament gives builders:</strong>{" "}
          most launchpads leave graduated coins with no guaranteed liquidity. Yours have a
          permanent, burned-LP pool from day one — so your community can always buy and sell,
          forever. That&apos;s the difference between a coin that dies and one you can actually
          build on. What you make of it is your call — and your responsibility.
        </div>
      </section>


      {/* ---- Honest risks ---- */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">
          Honest risks
        </h2>
        <ul className="space-y-2 text-sm text-[var(--clr-body)] list-disc list-inside">
          <li>Most memecoins never graduate. If a coin stalls on the curve and people sell, early buyers can still lose money.</li>
          <li>The contract prevents liquidity rugs — it cannot prevent a coin from going to zero because people stop caring.</li>
          <li>Creators and early buyers can sell into your buys at any time before graduation.</li>
          <li>Anyone can launch a coin with any name. A coin called &quot;LCAI2&quot; has nothing to do with LightChain AI. Verify the contract address, not the name.</li>
          <li>This is speculation, not investment. Only spend what you can afford to lose entirely.</li>
        </ul>
      </section>

      {/* ---- Fine print ---- */}
      <section>
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">
          The numbers
        </h2>
        <div className="rounded-xl p-4 text-sm font-mono space-y-1.5" style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)" }}>
          <div><span style={{ color: "var(--ae-aurum)" }}>Forge contract</span> — 0xB4Ba841e14943184840A939134ffc5c8Ab9403E1</div>
          <div><span style={{ color: "var(--ae-aurum)" }}>Supply per coin</span> — 1,000,000,000 (fixed, no minting)</div>
          <div><span style={{ color: "var(--ae-aurum)" }}>Curve / LP split</span> — 800M on curve / 200M to Filament pool</div>
          <div><span style={{ color: "var(--ae-aurum)" }}>Creation fee</span> — 300 LCAI (~$1)</div>
          <div><span style={{ color: "var(--ae-aurum)" }}>Trade fee</span> — 1% (hard-capped at 3% in bytecode)</div>
          <div><span style={{ color: "var(--ae-aurum)" }}>Graduation raise</span> — ~293,000 LCAI total</div>
          <div><span style={{ color: "var(--ae-aurum)" }}>Early buyer upside</span> — up to ~3x from graduation alone if first in</div>
          <div><span style={{ color: "var(--ae-aurum)" }}>LP destination</span> — 0x000000000000000000000000000000000000dEaD</div>
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--ae-nebula)" }}>
          Fee caps are enforced by the contract itself. Verify everything on{" "}
          <a href="https://mainnet.lightscan.app" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--ae-aurum)" }}>
            lightscan
          </a>. The burn address is public record — anyone can confirm the LP was sent there.
        </p>
      </section>

      {/* ---- Verify your coin ---- */}
      <section>
        <h2 className="text-lg font-bold text-[var(--clr-heading)] mb-3 border-b border-[var(--clr-border)] pb-2">
          Verifying your coin on Lightscan
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--ae-nebula)" }}>
          Every coin launched on Filament Forge uses identical, auditable source code. You can verify your token on Lightscan so anyone can read its source and confirm there are no hidden mint functions, no owner privileges, and no way to rug.
        </p>
        <div className="rounded-xl p-4 text-sm space-y-3" style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)" }}>
          <div><span className="font-semibold" style={{ color: "var(--ae-aurum)" }}>1.</span> Go to your coin&apos;s address on <a href="https://mainnet.lightscan.app" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--ae-aurum)" }}>Lightscan</a> → Contract tab → Verify &amp; Publish</div>
          <div><span className="font-semibold" style={{ color: "var(--ae-aurum)" }}>2.</span> Select <strong style={{ color: "var(--clr-heading)" }}>Solidity (Single file)</strong></div>
          <div><span className="font-semibold" style={{ color: "var(--ae-aurum)" }}>3.</span> Compiler: <code className="px-1 rounded" style={{ background: "var(--ae-night)" }}>v0.8.24+commit.e11b9ed9</code> · EVM: default · Optimization: ✓ 200 runs · License: MIT</div>
          <div><span className="font-semibold" style={{ color: "var(--ae-aurum)" }}>4.</span> Paste the LaunchToken source code — available in the <a href="https://github.com/rokhill/filament-contracts" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--ae-aurum)" }}>filament-contracts repo</a></div>
          <div><span className="font-semibold" style={{ color: "var(--ae-aurum)" }}>5.</span> Hit Verify &amp; Publish — Lightscan auto-detects constructor args</div>
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--ae-nebula)" }}>
          Need help? Ask in the <a href="https://discord.gg/lightchain" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--ae-aurum)" }}>LightChain Discord</a> — tag @Llihkor.
        </p>
      </section>
    </div>
  );
}

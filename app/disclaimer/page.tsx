export const metadata = {
  title: "Risk Disclaimer — Filament",
  description: "Risk disclosures and terms for using Filament, a non-custodial DEX and memecoin launchpad on LightChain AI.",
};

export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 min-h-[70vh]">
      <div className="f-eyebrow mb-2">Legal</div>
      <h1 className="f-display text-3xl sm:text-4xl">Risk Disclaimer</h1>
      <p className="f-meta mt-2">Last updated {new Date().getFullYear()}</p>

      <div className="mt-8 space-y-7">
        <section>
          <h2 className="f-display text-lg mb-2">No custody, no control</h2>
          <p className="f-body text-sm leading-relaxed">
            Filament is a non-custodial interface to smart contracts deployed on the
            LightChain AI network. It never takes custody of your assets, never holds
            your private keys, and cannot move, freeze, reverse, or recover your funds.
            Every transaction is constructed in your browser and signed by your own
            wallet. You are solely responsible for the transactions you sign.
          </p>
        </section>

        <section>
          <h2 className="f-display text-lg mb-2">Not financial advice</h2>
          <p className="f-body text-sm leading-relaxed">
            Nothing on this site is financial, investment, legal, or tax advice, or a
            recommendation to buy, sell, or hold any asset. Information is provided for
            general purposes only and may be incomplete, delayed, or inaccurate. Do your
            own research and consult a qualified professional before making any decision.
          </p>
        </section>

        <section>
          <h2 className="f-display text-lg mb-2">Extreme risk of loss</h2>
          <p className="f-body text-sm leading-relaxed">
            Digital assets are highly volatile and speculative. Tokens launched through
            the Forge are memecoins: they have no intrinsic value, no guaranteed utility,
            no roadmap, and no promise of future worth. Most will lose all value. You
            should be prepared to lose everything you commit. Never risk funds you cannot
            afford to lose entirely.
          </p>
        </section>

        <section>
          <h2 className="f-display text-lg mb-2">Third-party tokens</h2>
          <p className="f-body text-sm leading-relaxed">
            Anyone can deploy a token through the Forge. Filament does not create, endorse,
            vet, audit, or vouch for any token, its creator, its name, its imagery, or any
            claims made about it. A token&apos;s name or symbol may imitate an existing project
            and has no affiliation with it. Always verify the contract address, not the name.
            Creators and early buyers may sell at any time.
          </p>
        </section>

        <section>
          <h2 className="f-display text-lg mb-2">Smart contract risk</h2>
          <p className="f-body text-sm leading-relaxed">
            Smart contracts may contain bugs, be exploited, or behave unexpectedly. While
            Filament&apos;s contracts are public and verifiable on-chain, no audit or review
            eliminates risk. Transactions on a blockchain are irreversible. Use at your
            own risk.
          </p>
        </section>

        <section>
          <h2 className="f-display text-lg mb-2">No warranty</h2>
          <p className="f-body text-sm leading-relaxed">
            This interface is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of
            any kind, express or implied. To the fullest extent permitted by law, the
            operators of Filament disclaim all liability for any loss or damage arising
            from your use of this interface or the underlying contracts, including loss
            of funds, loss of profits, or interruption of service.
          </p>
        </section>

        <section>
          <h2 className="f-display text-lg mb-2">Your responsibility</h2>
          <p className="f-body text-sm leading-relaxed">
            You are responsible for complying with the laws of your jurisdiction, including
            any restrictions on the use of digital assets, and for any tax obligations
            arising from your activity. If use of this interface is unlawful where you are,
            do not use it.
          </p>
        </section>
      </div>

      <div className="f-card p-5 mt-10">
        <p className="f-body text-sm">
          By using Filament you acknowledge that you have read and understood this
          disclaimer, and that you accept full responsibility for your own decisions
          and transactions.
        </p>
      </div>
    </main>
  );
}

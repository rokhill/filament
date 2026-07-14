import SwapForm from "@/components/swap-form";
import SwapPoolsTabs from "@/components/swap-pools-tabs";

export default function Home() {
  return (
    <div className="ex-canvas">
      <div className="container max-w-lg mx-auto py-12">
        {/* Masthead — same structure as Markets: eyebrow, serif title, rule */}
        <div className="f-eyebrow mb-2">Non-custodial AMM · LightChain AI</div>
        <h1 className="f-display text-4xl sm:text-5xl">Exchange</h1>
        <p className="f-body text-sm mt-2 leading-relaxed">
          Swap tokens and earn fees. Every transaction is built in your browser,
          signed by your wallet, and settled entirely on-chain.
        </p>

        <div className="mt-7 space-y-4">
          <SwapPoolsTabs />
          <SwapForm />
        </div>
      </div>
    </div>
  );
}

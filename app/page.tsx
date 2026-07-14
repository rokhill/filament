import SwapForm from "@/components/swap-form";
import SwapPoolsTabs from "@/components/swap-pools-tabs";

export default function Home() {
  return (
    <div className="ex-canvas">
      <div className="container max-w-lg mx-auto py-10 space-y-4">
        {/* Masthead — sibling to the Forge masthead, but sober */}
        <div className="ex-masthead">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/bulb-icon.png" alt="" className="ex-masthead-bulb" aria-hidden />
          <div className="ex-masthead-text">
            <h1 className="ex-masthead-title">Exchange</h1>
            <p className="ex-masthead-sub">Non-custodial AMM · LightChain AI</p>
          </div>
        </div>

        <p className="ex-tagline">
          Swap tokens and earn fees. Every transaction is built in your browser,
          signed by your wallet, and settled entirely on-chain.
        </p>

        <SwapPoolsTabs />
        <SwapForm />
      </div>
    </div>
  );
}

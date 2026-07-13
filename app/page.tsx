import SwapForm from "@/components/swap-form";
import SwapPoolsTabs from "@/components/swap-pools-tabs";

function LiveFilament() {
  // The signature: a glowing filament coil with current running through it.
  // The wire pulses (brightness breathing) and a bright charge travels along
  // the path — like electricity moving through a lightbulb filament.
  const coil =
    "M-40 300 C 80 300, 80 430, 170 430 S 260 300, 350 300 S 440 430, 530 430 S 620 300, 710 300 S 800 430, 890 430 S 980 300, 1060 300";
  return (
    <div className="ae-filament" aria-hidden="true">
      <svg viewBox="0 0 1020 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="filWire" x1="0" y1="0" x2="1020" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9c7a1e" />
            <stop offset="50%" stopColor="#f5d680" />
            <stop offset="100%" stopColor="#9c7a1e" />
          </linearGradient>
          <filter id="filGlow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* soft under-glow of the whole coil */}
        <path d={coil} stroke="#e3b341" strokeOpacity="0.18" strokeWidth="14" strokeLinecap="round" filter="url(#filGlow)" className="ae-fil-halo" />

        {/* the filament wire itself — pulses brightness */}
        <path d={coil} stroke="url(#filWire)" strokeWidth="2.5" strokeLinecap="round" className="ae-fil-wire" />

        {/* the traveling charge — a bright dash racing along the coil */}
        <path d={coil} stroke="#fff6da" strokeWidth="3.5" strokeLinecap="round" className="ae-fil-charge" filter="url(#filGlow)" />

        {/* anchor node points where the coil peaks */}
        <circle cx="350" cy="300" r="3" fill="#f5d680" className="ae-fil-node" />
        <circle cx="710" cy="300" r="3" fill="#f5d680" className="ae-fil-node" style={{ animationDelay: "1.2s" }} />
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative">
      <LiveFilament />
      <div className="container py-10 max-w-lg mx-auto space-y-4 relative z-[1]">
        <div className="text-center space-y-1 pb-2">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--ae-aurum)] opacity-80">LightChain AI Mainnet</p>
          <p className="text-sm text-[var(--clr-body)]">Swap tokens and earn fees — non-custodial, on-chain.</p>
        </div>
        <SwapPoolsTabs />
        <SwapForm />
      </div>
    </div>
  );
}

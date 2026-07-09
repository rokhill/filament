import SwapForm from "@/components/swap-form";
import SwapPoolsTabs from "@/components/swap-pools-tabs";

function FilamentGlow() {
  return (
    <div className="ae-astrolabe" aria-hidden="true">
      <svg viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M-20 300 C 90 300, 90 420, 170 420 S 250 300, 330 300 S 410 420, 490 420 S 570 300, 650 300 S 730 420, 810 420 S 890 300, 940 300"
          stroke="#E3B341" strokeOpacity="0.16" strokeWidth="2" strokeLinecap="round"
        />
        <path
          d="M-20 320 C 90 320, 90 440, 170 440 S 250 320, 330 320 S 410 440, 490 440 S 570 320, 650 320 S 730 440, 810 440 S 890 320, 940 320"
          stroke="#7FB4E8" strokeOpacity="0.07" strokeWidth="1.2" strokeLinecap="round"
        />
        <circle cx="330" cy="300" r="2.5" fill="#F5D680" fillOpacity="0.8" />
        <circle cx="650" cy="300" r="1.8" fill="#F5D680" fillOpacity="0.5" />
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative">
      <FilamentGlow />
      <div className="container py-12 max-w-lg mx-auto space-y-4 relative z-[1]">
        <SwapPoolsTabs />
        <SwapForm />
      </div>
    </div>
  );
}

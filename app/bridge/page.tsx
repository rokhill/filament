import { notFound } from "next/navigation";
import SwapPoolsTabs from "@/components/swap-pools-tabs";
import BridgeForm from "@/components/bridge/bridge-form";
import { BRIDGE_ENABLED } from "@/config/bridge";

export const metadata = {
  title: "Bridge | Filament",
  description:
    "Move LCAI between Ethereum and LightChain AI mainnet via the official Hyperlane route.",
};

export default function BridgePage() {
  if (!BRIDGE_ENABLED) notFound();

  return (
    <div className="container max-w-lg mx-auto py-12 flex flex-col gap-6">
      <SwapPoolsTabs />
      <BridgeForm />
    </div>
  );
}

import { notFound } from "next/navigation";
import BridgeForm from "@/components/bridge/bridge-form";
import {
  BRIDGE_ENABLED,
  LCAI_ERC20_ETHEREUM,
  WARP_ROUTE_ETHEREUM,
  WARP_ROUTE_LCAI,
} from "@/config/bridge";

export const metadata = {
  title: "Bridge | Filament",
  description:
    "Move LCAI between Ethereum and LightChain AI mainnet through the LightChain team's official Hyperlane bridge.",
};

function AddressRow({
  label,
  address,
  href,
}: {
  label: string;
  address: string;
  href: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b border-[rgba(227,179,65,0.18)] last:border-0">
      <span className="f-body text-xs">{label}</span>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs text-[var(--clr-primary)] break-all hover:underline underline-offset-2"
      >
        {address}
      </a>
    </div>
  );
}

export default function BridgePage() {
  if (!BRIDGE_ENABLED) notFound();

  return (
    <main className="mx-auto max-w-xl px-4 py-12 min-h-[70vh]">
      {/* Hero */}
      <div className="f-eyebrow mb-2">LightChain AI · Chain 9200</div>
      <h1 className="f-display text-4xl sm:text-5xl">Bridge</h1>
      <p className="f-body text-sm mt-2 max-w-md">
        Move LCAI between Ethereum and LightChain AI mainnet. Every transfer
        goes directly through the LightChain team&apos;s official Hyperlane
        bridge contracts — Filament provides the interface and never holds
        your funds.
      </p>

      <div className="mt-8">
        <BridgeForm />
      </div>

      {/* Trust block — the official route contracts */}
      <div className="mt-10">
        <div className="f-eyebrow mb-2">Official bridge contracts</div>
        <p className="f-body text-xs mb-3">
          These are the same contracts used by LightChain&apos;s own bridge
          app. Verify them yourself before bridging:
        </p>
        <div className="rounded-xl border border-[rgba(227,179,65,0.45)] px-4 py-2">
          <AddressRow
            label="LCAI token · Ethereum (ERC-20)"
            address={LCAI_ERC20_ETHEREUM}
            href={`https://etherscan.io/token/${LCAI_ERC20_ETHEREUM}`}
          />
          <AddressRow
            label="Warp route · Ethereum (locks ERC-20)"
            address={WARP_ROUTE_ETHEREUM}
            href={`https://etherscan.io/address/${WARP_ROUTE_ETHEREUM}`}
          />
          <AddressRow
            label="Warp route · LightChain AI (mints native)"
            address={WARP_ROUTE_LCAI}
            href={`https://mainnet.lightscan.app/address/${WARP_ROUTE_LCAI}`}
          />
        </div>
        <p className="f-body text-xs mt-3">
          How it works: LCAI locks in the Ethereum contract and mints as
          native LCAI on chain 9200 (burns and unlocks in reverse). Delivery
          is handled by LightChain&apos;s Hyperlane relayer, typically within
          1–2 minutes.
        </p>
      </div>
    </main>
  );
}

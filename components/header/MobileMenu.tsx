"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DarkSwitch from "./DarkSwitcher";
import WalletConnectButton from "../wallet-connect-button";
import { cn } from "@/lib/utils";

const PRODUCTS = [
  { href: "/", label: "Exchange", sub: "Swap tokens" },
  { href: "/forge", label: "Forge", sub: "Memecoin launchpad" },
  { href: "/pools", label: "Pools", sub: "Earn from liquidity" },
  { href: "/markets", label: "Markets", sub: "LCAI market data" },
  { href: "/portfolio", label: "Portfolio", sub: "Your holdings" },
];

const GUIDES = [
  { href: "/guide", label: "Using Filament", sub: "Swaps, wallets, WLCAI" },
  { href: "/forge/guide", label: "How the Forge Works", sub: "Curves, graduation, burned LP" },
  { href: "/pools/guide", label: "How Pools Work", sub: "Fees, yield, impermanent loss" },
];

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="fil-header lg:hidden">
        <div className="fil-mheader-inner">
          <button className="fil-icon-btn" onClick={() => setIsOpen(true)} aria-label="Open menu">
            <i className="fa-solid fa-bars" />
          </button>
          <Link href="/" className="fil-brand fil-brand--mobile">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/bulb-mark.png" alt="" className="fil-brand-bulb" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/filament-wire.png" alt="Filament" className="fil-brand-mark" />
          </Link>
          <DarkSwitch />
        </div>
      </header>

      <div className={cn("fil-drawer lg:hidden", { "is-open": isOpen })}>
        <div className="fil-drawer-head">
          <Link href="/" onClick={() => setIsOpen(false)} className="fil-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/bulb-mark.png" alt="" className="fil-brand-bulb" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/filament-wire.png" alt="Filament" className="fil-brand-mark" />
          </Link>
          <button className="fil-icon-btn" onClick={() => setIsOpen(false)} aria-label="Close menu">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <span className="fil-network fil-network--drawer">
          <span className="fil-dot" />
          LightChain AI · Chain 9200
        </span>

        <nav className="fil-drawer-nav">
          {PRODUCTS.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setIsOpen(false)}
              className={cn("fil-drawer-link", { "is-active": n.href === "/" ? pathname === "/" : pathname === n.href })}>
              <span className="fil-drawer-label">{n.label}</span>
              <span className="fil-drawer-sub">{n.sub}</span>
            </Link>
          ))}

          <div className="fil-drawer-heading">Guides</div>
          {GUIDES.map((g) => (
            <Link key={g.href} href={g.href} onClick={() => setIsOpen(false)}
              className={cn("fil-drawer-link", { "is-active": pathname === g.href })}>
              <span className="fil-drawer-label">{g.label}</span>
              <span className="fil-drawer-sub">{g.sub}</span>
            </Link>
          ))}

          <div className="fil-drawer-heading">Reference</div>
          <div className="fil-drawer-links">
            <a href="https://mainnet.lightscan.app" target="_blank" rel="noopener noreferrer">Explorer ↗</a>
            <Link href="/disclaimer" onClick={() => setIsOpen(false)}>Risk Disclaimer</Link>
          </div>
        </nav>

        <WalletConnectButton className="fil-wallet fil-wallet--full" />
        <p className="fil-drawer-foot">Non-custodial · Self-custody · On-chain</p>
      </div>

      {isOpen && <div className="fil-scrim lg:hidden" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default MobileMenu;

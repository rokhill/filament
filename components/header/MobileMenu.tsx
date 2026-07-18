"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DarkSwitch from "./DarkSwitcher";
import WalletConnectButton from "../wallet-connect-button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Exchange", sub: "Swap tokens" },
  { href: "/forge", label: "Forge", sub: "Memecoin launchpad" },
  { href: "/pools", label: "Pools", sub: "Earn from liquidity" },
  { href: "/bridge", label: "Bridge", sub: "Official LCAI bridge" },
  { href: "/markets", label: "Markets", sub: "LCAI market data" },
  { href: "/portfolio", label: "Portfolio", sub: "Your holdings" },
  { href: "/guides", label: "Guides", sub: "Learn how it all works" },
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
            <img src="/brand/filament-wire.png" alt="Filament" className="fil-brand-mark" />
          </Link>
          <DarkSwitch />
        </div>
      </header>

      <div className={cn("fil-drawer lg:hidden", { "is-open": isOpen })}>
        <div className="fil-drawer-head">
          <Link href="/" onClick={() => setIsOpen(false)} className="fil-brand">
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
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setIsOpen(false)}
              className={cn("fil-drawer-link", {
                "is-active": n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)
              })}>
              <span className="fil-drawer-label">{n.label}</span>
              <span className="fil-drawer-sub">{n.sub}</span>
            </Link>
          ))}
        </nav>

        <WalletConnectButton className="fil-wallet fil-wallet--full" />
        <p className="fil-drawer-foot">Non-custodial · Self-custody · On-chain</p>
      </div>

      {isOpen && <div className="fil-scrim lg:hidden" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default MobileMenu;

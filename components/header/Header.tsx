"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DarkSwitch from "./DarkSwitcher";
import MobileMenu from "./MobileMenu";
import WalletConnectButton from "../wallet-connect-button";

const NAV = [
  { href: "/", label: "Exchange" },
  { href: "/forge", label: "Forge" },
  { href: "/markets", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
];

const Header = () => {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="fil-header hidden lg:block">
        <div className="fil-header-inner">
          {/* Brand */}
          <Link href="/" className="fil-brand" aria-label="Filament — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/bulb-mark.png" alt="" className="fil-brand-bulb" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/filament-script.png" alt="Filament" className="fil-brand-mark" />
          </Link>

          {/* Products */}
          <nav className="fil-nav" aria-label="Primary">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`fil-nav-link ${isActive(n.href) ? "is-active" : ""}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Trust + actions */}
          <div className="fil-actions">
            <span className="fil-network" title="Connected to LightChain AI mainnet">
              <span className="fil-dot" />
              LightChain AI
            </span>
            <DarkSwitch />
            <WalletConnectButton className="fil-wallet" />
          </div>
        </div>
      </header>
      <MobileMenu />
    </>
  );
};

export default Header;

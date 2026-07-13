"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logoLight from "../../public/images/logo/logo.svg";
import logoDark from "../../public/images/logo/logo-dark.svg";
import DarkSwitch from "./DarkSwitcher";
import WalletConnectButton from "../wallet-connect-button";
import { cn } from "@/lib/utils";

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <nav className="swap__navbar lg:hidden flex header-default">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div><DarkSwitch /></div>
            <div className="flex flex-col items-center">
              <div className="swap__navbar-logo">
                <Link className="swap__navbar-logolight" href="/">
                  <Image src={logoLight} width={140} height={28} alt="Filament" />
                </Link>
                <Link className="swap__navbar-logodark" href="/">
                  <Image src={logoDark} width={140} height={28} alt="Filament" />
                </Link>
              </div>
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase mt-0.5" style={{ color: "var(--ae-aurum)", opacity: 0.8 }}>
                Exchange · Forge
              </span>
            </div>
            <div className="mobile-menu-bar block lg:hidden ms-4">
              <div className="swap__hamberger">
                <button className="swap__hamberger-button" type="button" onClick={() => setIsOpen(!isOpen)}>
                  <i className="fa-solid fa-bars"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className={cn(
        "swap__navbar-small lg:hidden block fixed top-0 left-0 w-full h-[100dvh] z-50 max-w-md transition-all duration-300 popup-mobile-menu",
        { "translate-x-0": isOpen, "-translate-x-full": !isOpen }
      )}>
        <div>
          <div className="py-4 px-6 flex items-center justify-between swap__navbar-small--head">
            <div>
              <Link className="swap__navbar-small--logo swap__navbar-logodark" href="/" onClick={() => setIsOpen(false)}>
                <Image src={logoDark} width={140} height={28} alt="Filament" />
              </Link>
              <p className="text-[9px] font-bold tracking-[0.15em] uppercase mt-1" style={{ color: "var(--ae-aurum)", opacity: 0.8 }}>
                DEX · Memecoin Launchpad · LightChain AI
              </p>
            </div>
            <button className="btn-close" onClick={() => setIsOpen(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="px-4 py-4">
            <ul className="flex flex-col gap-4 mb-6">
              <li>
                <Link href="/" className="text-[var(--clr-heading)] font-semibold text-base" onClick={() => setIsOpen(false)}>
                  Exchange <span className="text-xs font-normal ml-1" style={{ color: "var(--ae-nebula)" }}>Swap tokens</span>
                </Link>
              </li>
              <li>
                <Link href="/pools" className="text-[var(--clr-heading)] font-semibold text-base" onClick={() => setIsOpen(false)}>
                  Pools <span className="text-xs font-normal ml-1" style={{ color: "var(--ae-nebula)" }}>Provide liquidity</span>
                </Link>
              </li>
              <li>
                <Link href="/forge" className="text-[var(--clr-heading)] font-semibold text-base" onClick={() => setIsOpen(false)}>
                  Forge <span className="text-xs font-normal ml-1" style={{ color: "var(--ae-aurum)" }}>Memecoin launchpad</span>
                </Link>
              </li>
              <li>
                <Link href="/markets" className="text-[var(--clr-heading)] font-semibold text-base" onClick={() => setIsOpen(false)}>
                  Markets <span className="text-xs font-normal ml-1" style={{ color: "var(--ae-nebula)" }}>LCAI market data</span>
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-[var(--clr-heading)] font-semibold text-base" onClick={() => setIsOpen(false)}>
                  Portfolio <span className="text-xs font-normal ml-1" style={{ color: "var(--ae-nebula)" }}>Your holdings</span>
                </Link>
              </li>
              <li>
                <Link href="/guide" className="text-[var(--clr-heading)] font-semibold text-base" onClick={() => setIsOpen(false)}>
                  Guide
                </Link>
              </li>
            </ul>
            <WalletConnectButton className="!w-full mt-4" />
            <hr className="block mt-6 mb-4 border-[var(--clr-border)]" />
            <p className="text-xs text-[var(--clr-body)] text-center">Non-custodial · Self-custody · LightChain AI mainnet</p>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed top-0 left-0 lg:hidden block w-full h-full z-40 bg-black/50" onClick={() => setIsOpen(false)}></div>
      )}
    </>
  );
};

export default MobileMenu;

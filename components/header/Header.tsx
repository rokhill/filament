import React from "react";
import Image from "next/image";
import Link from "next/link";
import logoLight from "../../public/images/logo/logo.svg";
import logoDark from "../../public/images/logo/logo-dark.svg";
import DarkSwitch from "./DarkSwitcher";
import MobileMenu from "./MobileMenu";
import WalletConnectButton from "../wallet-connect-button";

const Header = () => {
  return (
    <>
      <nav className="swap__navbar hidden lg:flex header-default">
        <div className="header-wrapper mx-auto">
          <div className="flex justify-between items-center">
            <div className="swap__navbar-logo">
              <Link className="swap__navbar-logolight" href="/">
                <Image src={logoLight} width={176} height={35} alt="Filament" />
              </Link>
              <Link className="swap__navbar-logodark" href="/">
                <Image src={logoDark} width={176} height={35} alt="Filament" />
              </Link>
            </div>

            {/* Product identity strip */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--ae-nebula)]">
                DEX
              </span>
              <span className="text-[var(--ae-veil)]">·</span>
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--ae-aurum)]">
                Memecoin Launchpad
              </span>
              <span className="text-[var(--ae-veil)]">·</span>
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--ae-nebula)]">
                LightChain AI
              </span>
            </div>

            <nav className="flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-[var(--clr-body)] hover:text-[var(--ae-aurum)] transition-colors">Exchange</Link>
              <Link href="/pools" className="text-sm font-medium text-[var(--clr-body)] hover:text-[var(--ae-aurum)] transition-colors">Pools</Link>
              <Link href="/forge" className="text-sm font-medium text-[var(--clr-body)] hover:text-[var(--ae-aurum)] transition-colors">Forge</Link>
              <Link href="/markets" className="text-sm font-medium text-[var(--clr-body)] hover:text-[var(--ae-aurum)] transition-colors">Markets</Link>
              <Link href="/portfolio" className="text-sm font-medium text-[var(--clr-body)] hover:text-[var(--ae-aurum)] transition-colors">Portfolio</Link>
              <Link href="/guide" className="text-sm font-medium text-[var(--clr-body)] hover:text-[var(--ae-aurum)] transition-colors">Guide</Link>
            </nav>

            <div className="swap__navbar-right flex items-center">
              <DarkSwitch />
              <WalletConnectButton className="ml-4" />
            </div>
          </div>
        </div>
      </nav>
      <MobileMenu />
    </>
  );
};

export default Header;

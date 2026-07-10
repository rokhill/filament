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
            <div className="flex items-center gap-2"><span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--ae-aurum)] border border-[rgba(227,179,65,0.3)] rounded px-2 py-0.5 opacity-80">Exchange</span></div>
            <nav className="flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-[var(--clr-body)] hover:text-[var(--ae-aurum)] transition-colors">Swap</Link>
              <Link href="/pools" className="text-sm font-medium text-[var(--clr-body)] hover:text-[var(--ae-aurum)] transition-colors">Pools</Link>
              <Link href="/forge" className="text-sm font-medium text-[var(--clr-body)] hover:text-[var(--ae-aurum)] transition-colors">Forge</Link>
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

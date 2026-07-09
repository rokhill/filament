import Image from "next/image";
import Link from "next/link";
import logoLight from "../../public/images/logo/logo.svg";
import logoDark from "../../public/images/logo/logo-dark.svg";

const Footer = () => {
  return (
    <footer className="ae-footer">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 py-8">
        <div className="swap__navbar-logo">
          <Link className="swap__navbar-logolight px-2" href="/">
            <Image src={logoLight} width={176} height={35} alt="Filament" />
          </Link>
          <Link className="swap__navbar-logodark px-2" href="/">
            <Image src={logoDark} width={176} height={35} alt="Filament" />
          </Link>
        </div>
        <p className="text-sm text-[var(--clr-body)] mb-0">
          © {new Date().getFullYear()} Filament · a non-custodial AMM on
          the LightChain AI network
        </p>
      </div>
    </footer>
  );
};

export default Footer;

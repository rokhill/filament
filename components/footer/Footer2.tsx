import Link from "next/link";

const Footer = () => {
  return (
    <footer className="fil-footer">
      <div className="fil-footer-inner">
        <Link href="/" className="fil-brand fil-brand--footer" aria-label="Filament — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/bulb-mark.png" alt="" className="fil-brand-bulb" aria-hidden />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/filament-script.png" alt="Filament" className="fil-brand-mark" />
        </Link>

        <p className="fil-footer-copy">
          © {new Date().getFullYear()} Filament · non-custodial DEX &amp; memecoin
          launchpad on LightChain AI (chain 9200)
        </p>

        <div className="fil-footer-links">
          <Link href="/guide">Guide</Link>
          <Link href="/forge/guide">Forge Guide</Link>
          <a href="https://mainnet.lightscan.app" target="_blank" rel="noopener noreferrer">Explorer</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

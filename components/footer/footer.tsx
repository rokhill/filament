import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className="swap__footer">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center text-center relative z-10 py-4 border-t border-[#0606091a] dark:border-[var(--clr-border)]">
          <div className="swap__footer-left order-2 sm:order-1">
            <p className="swap__footer-text copyright-text mb-0">Copyright © 2025 <Link href={"https://lightchain.ai/"} className="transition btn-read-more ps-2 duration-300 font-medium dark:text-[var(--clr-light)] hover:text-[var(--clr-primary)]">Lightchain Protocol</Link></p>
          </div>
          <div className="swap__footer-right flex justify-center order-1 sm:order-2 pb-3 sm:pb-0">
            <div className="flex items-center gap-4">
                <Link href="https://discord.gg/bbqvSB8wtM" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold px-3 py-1.5 rounded-xl transition-all hover:-translate-y-0.5" style={{background:"rgba(255,140,30,.15)",color:"var(--ae-aurum)"}}>
                  💬 Need help? Join Discord
                </Link>
                <Link href="https://x.com/LlihkorProduct" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold" style={{color:"var(--ae-nebula)"}}>
                  𝕏 @LlihkorProduct
                </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

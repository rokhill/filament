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
            <ul className="swap__footer-list flex items-center">
              <li>
                <Link href="https://x.com/LightchainAI">
                  <i className="fa-brands fa-twitter" />
                </Link>
              </li>
              <li>
                <Link href="https://t.me/LightchainProtocol">
                  <i className="fa-brands fa-telegram" />
                </Link>
              </li>
              <li>
                <Link href="https://linktr.ee/lightchainai">
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 10h16" />
                    <path d="M6.5 4.5l11 11" />
                    <path d="M6.5 15.5l11 -11" />
                    <path d="M12 10v-8" />
                    <path d="M12 15v7" />
                  </svg>
                </Link>
              </li>
              <li>
                <Link href="https://news.lightchain.ai/">
                  <i className="fa-brands fa-medium" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

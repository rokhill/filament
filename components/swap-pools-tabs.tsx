"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Swap" },
  { href: "/pools", label: "Pools" },
];

export default function SwapPoolsTabs() {
  const pathname = usePathname();

  return (
    <div className="w-full flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full p-1 bg-[var(--clr-gray-100)] dark:bg-[var(--clr-darker-two)] border border-[rgba(255,140,30,0.4)]">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-colors",
                isActive
                  ? "text-[#140d05] bg-[linear-gradient(180deg,#ffaa32,#e07a12)]"
                  : "text-[var(--clr-black)] dark:text-[var(--clr-heading)] hover:text-[var(--clr-primary)]"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

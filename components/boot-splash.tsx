"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Boot splash — the bulb takes the whole screen, ignites, flickers like a
 * real incandescent filament settling, then fades. Once per session.
 */
export default function BootSplash() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // remove the static pre-paint canvas — the animated splash covers it now
    const pre = document.getElementById("pre-boot");
    if (pre) pre.remove();
    if (sessionStorage.getItem("fil:booted")) return;
    setShow(true);
    sessionStorage.setItem("fil:booted", "1");
    const t1 = setTimeout(() => setLeaving(true), 2100);
    const t2 = setTimeout(() => setShow(false), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Kill any lingering pre-boot overlay on EVERY navigation
  useEffect(() => {
    const pre = document.getElementById("pre-boot");
    if (pre) pre.remove();
  }, [pathname]);

  if (!show) return null;

  return (
    <div className={`fil-boot ${leaving ? "is-leaving" : ""}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/bulb-splash.png" alt="" className="fil-boot-bulb" />
    </div>
  );
}

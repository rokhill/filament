"use client";

import { useEffect, useState } from "react";

/**
 * Boot splash — the bulb takes the whole screen, ignites, flickers like a
 * real incandescent filament settling, then fades. Once per session.
 */
export default function BootSplash() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("fil:booted")) return;
    setShow(true);
    sessionStorage.setItem("fil:booted", "1");
    const t1 = setTimeout(() => setLeaving(true), 1600);
    const t2 = setTimeout(() => setShow(false), 2250);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return null;

  return (
    <div className={`fil-boot ${leaving ? "is-leaving" : ""}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/bulb-splash.png" alt="" className="fil-boot-bulb" />
    </div>
  );
}

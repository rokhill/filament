import type { RawNavConfig } from "./types";

// Navigation menu is loaded from a remote JSON config. The URL is
// configurable via NEXT_PUBLIC_NAV_CONFIG_URL and defaults to Lightchain's.
// Set it to an empty string to disable remote nav entirely.
const NAV_CONFIG_URL =
  process.env.NEXT_PUBLIC_NAV_CONFIG_URL ?? "";

export async function fetchNavConfig(): Promise<RawNavConfig[]> {
  if (!NAV_CONFIG_URL) return [];
  try {
    const res = await fetch(NAV_CONFIG_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Failed to fetch nav config: ${res.status}`);
    return (await res.json()) as RawNavConfig[];
  } catch (err) {
    // Never let a missing/unavailable config crash the page render.
    console.error("Nav config unavailable, rendering empty menu:", err);
    return [];
  }
}

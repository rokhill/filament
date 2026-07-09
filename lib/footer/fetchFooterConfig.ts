import type { RawFooterConfig } from "./types";

// Footer is loaded from a remote JSON config. The URL is configurable via
// NEXT_PUBLIC_FOOTER_CONFIG_URL and defaults to Lightchain's. Set it to an
// empty string to disable remote footer content entirely.
const FOOTER_CONFIG_URL =
  process.env.NEXT_PUBLIC_FOOTER_CONFIG_URL ?? "";

const EMPTY_FOOTER: RawFooterConfig = { columns: [], social: [] };

export async function fetchFooterConfig(): Promise<RawFooterConfig> {
  if (!FOOTER_CONFIG_URL) return EMPTY_FOOTER;
  try {
    const res = await fetch(FOOTER_CONFIG_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Failed to fetch footer config: ${res.status}`);
    return (await res.json()) as RawFooterConfig;
  } catch (err) {
    // Never let a missing/unavailable config crash the page render.
    console.error("Footer config unavailable, rendering empty footer:", err);
    return EMPTY_FOOTER;
  }
}

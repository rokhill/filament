// Filament Forge — launchpad configuration
export const FORGE_ADDRESS = (process.env.NEXT_PUBLIC_FORGE_ADDRESS ||
  "0x17b48A0070DC048E81f7104a1bA65F937BbD8D94") as `0x${string}`;

export const CURVE_SUPPLY = 800_000_000n * 10n ** 18n;
export const TOTAL_SUPPLY = 1_000_000_000n * 10n ** 18n;

// Metadata is stored on-chain as a JSON string in metadataURI (LCAI gas is
// cheap enough that this beats depending on an IPFS pinning service).
export type CoinMetadata = {
  description?: string;
  image?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
};

export function parseMetadata(uri: string): CoinMetadata {
  if (!uri) return {};
  try {
    const o = JSON.parse(uri);
    return typeof o === "object" && o !== null ? o : {};
  } catch {
    // legacy/plain string: treat as image url if it looks like one
    if (/^(https?:\/\/|ipfs:\/\/)/.test(uri)) return { image: uri };
    return { description: uri };
  }
}

export function encodeMetadata(m: CoinMetadata): string {
  const clean: CoinMetadata = {};
  if (m.description?.trim()) clean.description = m.description.trim().slice(0, 500);
  if (m.image?.trim()) clean.image = m.image.trim();
  if (m.twitter?.trim()) clean.twitter = m.twitter.trim();
  if (m.telegram?.trim()) clean.telegram = m.telegram.trim();
  if (m.website?.trim()) clean.website = m.website.trim();
  return Object.keys(clean).length ? JSON.stringify(clean) : "";
}

export function ipfsToHttp(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith("ipfs://")
    ? url.replace("ipfs://", "https://ipfs.io/ipfs/")
    : url;
}

// Coins hidden from public grid — add addresses here and redeploy to hide
export const BLOCKED_COINS: string[] = [
  "0xE0025336b2a45961B9885Ab4B82A57fa3005Cb76", // duplicate Black Dog
  "0xFF171cbF37Bd9bb9253965704218A1fbC65859C2", // SmokeTest
];

export function shortAddr(a: string): string {
  return a.slice(0, 6) + "…" + a.slice(-4);
}

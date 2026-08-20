// Filament Forge — launchpad configuration
export const FORGE_ADDRESS = (process.env.NEXT_PUBLIC_FORGE_ADDRESS ||
  "0xB4Ba841e14943184840A939134ffc5c8Ab9403E1") as `0x${string}`;

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
  if (m.description?.trim()) clean.description = m.description.trim().slice(0, 2000);
  if (m.image?.trim()) clean.image = m.image.trim();
  if (m.twitter?.trim()) clean.twitter = m.twitter.trim();
  if (m.telegram?.trim()) clean.telegram = m.telegram.trim();
  if (m.website?.trim()) clean.website = m.website.trim();
  return Object.keys(clean).length ? JSON.stringify(clean) : "";
}

export function ipfsToHttp(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith("ipfs://")
    ? url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
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

// Image overrides — Cloudinary → IPFS migration (all 44 legacy coins)
export const FORGE_IMAGE_OVERRIDES: Record<string, string> = {
  "0xb9f71bc908652165ce3b1e3503890fd9c2076871": "https://gateway.pinata.cloud/ipfs/QmX4CWqrES41pv9W8C4k3vwKVShBFX7VkeR96raaZkqVgY",
  "0xff87c7ce65f5b2d7e6d08733989ea384b95782af": "https://gateway.pinata.cloud/ipfs/QmbqDo59d9pJ7JDFbku33ptoofxNTueM7C3mGCar4CaPTG",
  "0x73ad0b0f5aabda4238928c92cc219175b8b215be": "https://gateway.pinata.cloud/ipfs/QmdPFqskH4ppdE35xDcSxMTZT62HsmGg1z94oUyBLJdZzo",
  "0xce514f286d5377f1f5c4e5f2b6bbb6e50fe96e6d": "https://gateway.pinata.cloud/ipfs/QmUSLcjyVeZzcT7xUQedqjx5RZ9camqcyCvgEogYWnf3Dx",
  "0xac6dbd8659951ac7786fa9fb537bafacc483be27": "https://gateway.pinata.cloud/ipfs/QmbBvaa8EdYUZYZHEhHA3JfSy6buCwES3ssbU2MbLLh6G2",
  "0xbbbed489e327f7f531b71b5dbd725cea15f70a85": "https://gateway.pinata.cloud/ipfs/QmcLwXiZzqh2xT3VqnmBihLfupg9kaeXH24JdUx86KZpAB",
  "0x5f9681d3238ef9daeef4229e9b7c6d5347347cd2": "https://gateway.pinata.cloud/ipfs/QmXhyjnQmcyMJZQZnc9a6Wc7YDCtCbYSS6xkwVLBKKP961",
  "0x6c399bdd2da3ae312e81112d80f51b9eab548411": "https://gateway.pinata.cloud/ipfs/QmVqFymbFQVWnshnWYdrPj7HdsEB4xmLnyccVTk4N4sFhL",
  "0x147d042e26a0ab901f277c8c6291cd3bdebec714": "https://gateway.pinata.cloud/ipfs/QmaKpfoWeKAmvR69w6Za72tUsVj9FfhCjjiKw9UTbzc81B",
  "0x16acffa8e8c5ba6a0c2d7a2676b699eea787fff6": "https://gateway.pinata.cloud/ipfs/QmYAeV2tXGYyqcZ9t6oYu5mG7LfDGWSjoVMUsaaUxK1LuT",
  "0x5ce3a4131f2a8eb878d82d966cfc76e73ac0603e": "https://gateway.pinata.cloud/ipfs/QmTxDRBVnBG5kTtsMxBqNhBSk7oLioisawRmDPJRfmcd5U",
  "0xf737457314c1788b473be37baaddf29c02d710ad": "https://gateway.pinata.cloud/ipfs/QmSVD42V4wCVWEpHcqgMDZfD3XznGzQZkkyySwtXJtLWCE",
  "0x4b5e2be6858afee1a06c6f46759635e3dd698bde": "https://gateway.pinata.cloud/ipfs/QmbNHdhutmCFEUmx5R6XaqBJmRAQk8R9Ach493Y3YkHvtX",
  "0x23def4c920477f44cf00d6b70cff67bb6b6ec5fe": "https://gateway.pinata.cloud/ipfs/Qmc7cd2DRWV5iSmd7Wv2eaRazEMKKQ888jkfiNybGdpuae",
  "0xcbd46ea9c414a78a9338c2cd3d4a8fc8ecd04814": "https://gateway.pinata.cloud/ipfs/QmSJkkn1EwrJmzCVDNBJQAfbYG6EUEzFBPifwTWzuo5QRQ",
  "0x39967858006f7383d38b71c8cff23e0e23a9308c": "https://gateway.pinata.cloud/ipfs/QmR3GeuL995KcgWtDHSgabRxgkK1sD5QLEvHZQUvy6LC6i",
  "0x570116ec52cf1550d8a418912d7d500e9d9db02b": "https://gateway.pinata.cloud/ipfs/QmXYEoYUZX5RAEHfvuQnN8cTu59xEUMTm8DYGSQU9X2BXH",
  "0x61942accfa50bb81a7254c56e50bc8be22df9cd6": "https://gateway.pinata.cloud/ipfs/QmUp4bzPQr351rFZzbqq5mFRK4NgCgZwshaY4N1bDBGrdW",
  "0x38ad85046178a95f258ac5126f952bc370d1affa": "https://gateway.pinata.cloud/ipfs/QmUTD6vwE2ztsEm2KXLSLzE3UNAHTiS9qC2wfddKNyxdiD",
  "0xe5bf9ea630cfcb75b228528bad8a10302e6ceb0c": "https://gateway.pinata.cloud/ipfs/QmbVZFTN3TqdMa9mNiow5GUurQmeDL97hUBC2tUGwTwUxX",
  "0xdc053baa0aa05f0cfb80f41fe900c9f7540c6e01": "https://gateway.pinata.cloud/ipfs/QmcqPQpEVv38NKh2NSe5tnJBfAwpf1pPkdeSWUTR6e2obp",
  "0x93ed20e33e7c88cfa73348086ed1f2c7a2b50854": "https://gateway.pinata.cloud/ipfs/QmPeyJbdrCe26TtwqQyRpQJPPaZuevLgseiSGS3EKLoYaz",
  "0x34822558977bffcf4bc2fe54e8c03f8607d28002": "https://gateway.pinata.cloud/ipfs/QmVCcexE3uWZeV1oyjJ9SUBtMwmzxxyRh6iQboDtiMdz9C",
  "0x485c421b83d09b8d513e77791573f3f7ace593f6": "https://gateway.pinata.cloud/ipfs/QmbdpGCUjaXtukpn93YvhioU7fvboahhCZfJ4291nwocgn",
  "0x95a6314ba7eadb61943f9f2cb2139a218d53ba1f": "https://gateway.pinata.cloud/ipfs/QmU8sxYiiwgqpJuF8ESGUY4dob7KgAvgrVsbkeGHMp1x3y",
  "0xc98b454a2d13477516f4048094bc06995cf11c85": "https://gateway.pinata.cloud/ipfs/Qma4nJM5CXxUGexANgHNPSMwKBaa1rb1eGdeeuxMo5cvi8",
  "0x94c6fbeefdbd3c7d1b2e6a7fa164b38de04e9e43": "https://gateway.pinata.cloud/ipfs/Qmdh4DEnYyXwFdJUwCTtmiX8kQNAsa5SBahmcK5wQxsq4h",
  "0x33e24cd72c7ad6bd78706aec1786972e758f228a": "https://gateway.pinata.cloud/ipfs/QmRxR3y6c4owdNNMpMmBvo6xXFgPFBon9naXSjq9epamhb",
  "0x8895dadca58ce4b2a61019258be9199232296b87": "https://gateway.pinata.cloud/ipfs/QmRP5YxftwK2vxFJNTXWQ6shpqvKgcndkjgeYinFDoCPuR",
  "0xc75dfb5ca983ed33149089922cbed9a8423eecb8": "https://gateway.pinata.cloud/ipfs/QmNM2v6Ziupay9s84xXJCgK6rhsb8oqVc45QDLQxZPjHa4",
  "0x248b3d9caf7a06f94ac9ab777f51dab16b9a6426": "https://gateway.pinata.cloud/ipfs/QmaDT6vua2UruZExjWUNLCiNiukpYmBnYMp4SU5Qc5ZvN5",
  "0x7ab63a2af8195563911a930550179a25d993fdc4": "https://gateway.pinata.cloud/ipfs/QmZSgtqpyMgftWBTEL6rAFiwzGLpGQ6yhYRfJTwpXBStZS",
  "0xd6cddbc752b2cec5ff086f94c744692788f7f3e0": "https://gateway.pinata.cloud/ipfs/QmWP2ys2MUFV7BCpyCUTy4xtDqvjzFrGbWSVAqRScX7HeF",
  "0x46cb6e9a9c44f4b04a0f3f9c33f4ceef77b0bff7": "https://gateway.pinata.cloud/ipfs/QmRDrmX76F4yGjnjFuGQfKntrSrwWAc5S2DgEDFtM3xARM",
  "0x902a278fe761ecaf7d6a079039d52a570d072025": "https://gateway.pinata.cloud/ipfs/QmXUWop4bd7ThR44HHouoHQmtTwhkuhDsXHhJ6zznjPzmx",
  "0xd2ecbd3652c5b9a42c472645e7bd5498abcf64b5": "https://gateway.pinata.cloud/ipfs/QmPFgHSSLH9firpiAqGjuR87CGRQLzkN5EhcKNK2VKemvi",
  "0x250a6f2230ac3574a273fec8196dc1a516232260": "https://gateway.pinata.cloud/ipfs/QmPFavrwm7U6EUkDGQNFW8iwb1c8P4AihsrHaKtRM2yq35",
  "0x803609809b85767dcd41ebfc3a1f594cf36f0df3": "https://gateway.pinata.cloud/ipfs/QmbApmBVUhJ5yvCjHVo4gv8j9FvmSKoY1WgrBgCty8FxY7",
  "0x401d126ef12fe44cbdb7371ef993f8848e658053": "https://gateway.pinata.cloud/ipfs/QmUWEpiqcMUrp2r7ZAZUsXvULho57FnjPYvG8JokBG2qoT",
  "0xe6ea0d0bf774261e641dfb55b507d48d4c941db2": "https://gateway.pinata.cloud/ipfs/QmaS156J7K6k2bJJ4DtE1ERhiyXUKjCNAHfEYRCzbUvRmE",
  "0x958ca3f0add2d7007d13564f7d0ba7d51db9ae1d": "https://gateway.pinata.cloud/ipfs/QmVGtEiVYfSkBE8H3diYiAiafAQejBxpJ97Eo6xUC26S5v",
  "0x0700b2c2c3f92c0e5caed27951017c358bef51d9": "https://gateway.pinata.cloud/ipfs/QmYc35EdUukBScD3Wpzb4xgz6xZcutBiw1zVYPPYQqjqrQ",
  "0x4ff915a2984442040f8997fc791907b399499e2d": "https://gateway.pinata.cloud/ipfs/QmcmRi8mockgRLE7Eq9rqgSEnvSZit1yo1cfrXhBRZbGWC",
  "0xcc64663d5e45b0d3dd4442369f7822d6090085b2": "https://gateway.pinata.cloud/ipfs/QmVRrrjA8jT51JgzGh1RwdTt1DSzTv3NvSmnwbJesNDbP5",
  "0x5bd52ef3e553b28a9da9f9655a1dcc9026a4639f": "https://gateway.pinata.cloud/ipfs/QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH",
};
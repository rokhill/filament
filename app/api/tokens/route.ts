import { NextResponse } from "next/server";

const FORGE = "0xB4Ba841e14943184840A939134ffc5c8Ab9403E1" as const;
const CHAIN_ID = 9200;

const forgeAbi = [
  { type: "function", name: "allTokens", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "curves", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "address" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "bool" }, { type: "string" }] },
] as const;

const erc20Abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;

const ipfs = (u: string) => (u.startsWith("ipfs://") ? "https://ipfs.io/ipfs/" + u.slice(7) : u);

export async function GET() {
  try {
    const { createPublicClient, http } = await import("viem");
    const { lcai } = await import("@/config/chains");
    const client = createPublicClient({ chain: lcai, transport: http("https://rpc.mainnet.lightchain.ai") });

    const addrs: `0x${string}`[] = [];
    for (let i = 0; i < 500; i++) {
      try {
        addrs.push(await client.readContract({ address: FORGE, abi: forgeAbi, functionName: "allTokens", args: [BigInt(i)] }));
      } catch { break; }
    }

    const tokens = [];
    for (const addr of addrs) {
      try {
        const [name, symbol, curve] = await Promise.all([
          client.readContract({ address: addr, abi: erc20Abi, functionName: "name" }),
          client.readContract({ address: addr, abi: erc20Abi, functionName: "symbol" }),
          client.readContract({ address: FORGE, abi: forgeAbi, functionName: "curves", args: [addr] }),
        ]);
        let logoURI = "";
        const metadataURI = curve[6] as string;
        if (metadataURI) {
          try {
            const meta = await fetch(ipfs(metadataURI), { signal: AbortSignal.timeout(3000) }).then(r => r.json());
            if (meta?.image) logoURI = ipfs(meta.image);
          } catch {}
        }
        tokens.push({ chainId: CHAIN_ID, address: addr, name, symbol, decimals: 18, ...(logoURI ? { logoURI } : {}) });
      } catch {}
    }

    const tokenList = {
      name: "Filament Token List",
      timestamp: new Date().toISOString(),
      version: { major: 1, minor: 1, patch: 0 },
      logoURI: "https://filament.exchange/brand/bulb-icon.png",
      keywords: ["filament", "forge", "lcai", "lightchain"],
      tokens: [
        { chainId: CHAIN_ID, address: "0xD73cedfc5b894323BdB18A1e31E7BB186fCe5F64", name: "Wrapped LCAI", symbol: "WLCAI", decimals: 18 },
        ...tokens,
      ],
    };

    return NextResponse.json(tokenList, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "s-maxage=300" } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

const FORGE = "0xB4Ba841e14943184840A939134ffc5c8Ab9403E1";
const CHAIN_ID = 9200;

const forgeAbi = [
  {type:"function",name:"allCoins",inputs:[{type:"uint256"}],outputs:[{type:"address"}],stateMutability:"view"},
  {type:"function",name:"coinCount",inputs:[],outputs:[{type:"uint256"}],stateMutability:"view"},
] as const;

const erc20Abi = [
  {type:"function",name:"name",inputs:[],outputs:[{type:"string"}],stateMutability:"view"},
  {type:"function",name:"symbol",inputs:[],outputs:[{type:"string"}],stateMutability:"view"},
] as const;

const tokenCreatedAbi = [{
  type:"event",name:"TokenCreated",
  inputs:[
    {name:"token",type:"address",indexed:true},
    {name:"creator",type:"address",indexed:true},
    {name:"name",type:"string",indexed:false},
    {name:"symbol",type:"string",indexed:false},
    {name:"metadataURI",type:"string",indexed:false},
    {name:"vLcai0",type:"uint256",indexed:false},
    {name:"pair",type:"address",indexed:false},
  ]
}] as const;

export async function GET() {
  try {
    const { createPublicClient, http } = await import("viem");
    const { lcai } = await import("@/config/chains");
    const client = createPublicClient({ chain: lcai, transport: http("https://rpc.mainnet.lightchain.ai") });

    const count = await client.readContract({ address: FORGE, abi: forgeAbi, functionName: "coinCount" });
    const tokens = [];

    const allLogs = await client.getContractEvents({
      address: FORGE, abi: tokenCreatedAbi, eventName: "TokenCreated",
      fromBlock: 0n, toBlock: "latest",
    });

    for (let i = 0; i < Number(count); i++) {
      try {
        const addr = await client.readContract({ address: FORGE, abi: forgeAbi, functionName: "allCoins", args: [BigInt(i)] });
        const [name, symbol] = await Promise.all([
          client.readContract({ address: addr, abi: erc20Abi, functionName: "name" }),
          client.readContract({ address: addr, abi: erc20Abi, functionName: "symbol" }),
        ]);
        const log = allLogs.find(l => (l.args.token as string).toLowerCase() === addr.toLowerCase());
        let logoURI = "";
        if (log?.args?.metadataURI) {
          try {
            const uri = log.args.metadataURI as string;
            const url = uri.startsWith("ipfs://") ? "https://ipfs.io/ipfs/" + uri.slice(7) : uri;
            const meta = await fetch(url, {signal: AbortSignal.timeout(3000)}).then(r => r.json());
            if (meta.image) logoURI = meta.image.startsWith("ipfs://") ? "https://ipfs.io/ipfs/" + meta.image.slice(7) : meta.image;
          } catch {}
        }
        tokens.push({ chainId: CHAIN_ID, address: addr, name, symbol, decimals: 18, ...(logoURI ? { logoURI } : {}) });
      } catch {}
    }

    const tokenList = {
      name: "Filament Token List",
      timestamp: new Date().toISOString(),
      version: { major: 1, minor: 0, patch: 0 },
      logoURI: "https://filament.exchange/images/brand/lcai.svg",
      keywords: ["filament", "forge", "lcai", "lightchain"],
      tokens: [
        { chainId: CHAIN_ID, address: "0xD73cedfc5b894323BdB18A1e31E7BB186fCe5F64", name: "Wrapped LCAI", symbol: "WLCAI", decimals: 18, logoURI: "https://filament.exchange/images/brand/lcai.svg" },
        ...tokens,
      ],
    };

    return NextResponse.json(tokenList, {
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "s-maxage=300" },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

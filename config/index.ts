import { Chain } from "viem/chains";
import { lcai } from "./chains";

// Contract addresses are provided at deploy time via environment variables.
// Run the contracts package deploy script to obtain them.
const routerAddress = process.env.NEXT_PUBLIC_ROUTER_ADDRESS as `0x${string}`;
const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;
const wlcaiAddress = process.env.NEXT_PUBLIC_WLCAI_ADDRESS as `0x${string}`;

if (!routerAddress || !factoryAddress || !wlcaiAddress) {
  throw new Error(
    "Missing contract addresses. Set NEXT_PUBLIC_ROUTER_ADDRESS, NEXT_PUBLIC_FACTORY_ADDRESS and NEXT_PUBLIC_WLCAI_ADDRESS in .env.local"
  );
}

// Team DAO contracts — verified on-chain, used for best-price routing
const TEAM_ROUTER   = "0x1f94c0A6Cf48D3075f9713A79f87FA4eEdAF7021" as `0x${string}`;
const TEAM_FACTORY  = "0xBA502917c3F7233F9100f9430f4048a224A7D8DE" as `0x${string}`;
const TEAM_WLCAI    = "0xeBf97f16d843bFD9d9E6B1857B4C00d94ca7e2B2" as `0x${string}`;

const config = {
  chains: [lcai] as [Chain, ...Chain[]],
  routerV2Address:    { [lcai.id]: routerAddress } as Record<number, `0x${string}`>,
  factoryV2Address:   { [lcai.id]: factoryAddress } as Record<number, `0x${string}`>,
  WETH:               { [lcai.id]: wlcaiAddress } as Record<number, `0x${string}`>,
  // Alt (team) contracts for best-price routing
  altRouterV2Address: { [lcai.id]: TEAM_ROUTER }  as Record<number, `0x${string}`>,
  altFactoryV2Address:{ [lcai.id]: TEAM_FACTORY } as Record<number, `0x${string}`>,
  altWETH:            { [lcai.id]: TEAM_WLCAI }   as Record<number, `0x${string}`>,
};

export default config;

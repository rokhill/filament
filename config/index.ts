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

const config = {
  chains: [lcai] as [Chain, ...Chain[]],
  routerV2Address: { [lcai.id]: routerAddress } as Record<number, `0x${string}`>,
  factoryV2Address: { [lcai.id]: factoryAddress } as Record<number, `0x${string}`>,
  WETH: { [lcai.id]: wlcaiAddress } as Record<number, `0x${string}`>,
};

export default config;

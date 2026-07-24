import { Token } from "@/types/Token";
import { lcai } from "./chains";
import config from ".";

export const tokenList: Token[] = [
  {
    chainId: lcai.id,
    symbol: "LCAI",
    name: "LightChainAI",
    address: undefined,
    logoURI: "/images/brand/lcai.svg",
    decimals: 18,
  },
  {
    chainId: lcai.id,
    symbol: "WLCAI",
    name: "Wrapped LCAI",
    address: config.WETH[lcai.id],
    logoURI: "/images/brand/lcai.svg",
    decimals: 18,
  },
];

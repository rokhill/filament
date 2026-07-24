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
,
  { chainId: 9200, symbol: "WMNK", name: "WolfMonkey", address: "0xcc64663d5e45b0d3dd4442369f7822d6090085b2", decimals: 18 },
  { chainId: 9200, symbol: "SPRK", name: "Sparky", address: "0x4ff915a2984442040f8997fc791907b399499e2d", decimals: 18 },
  { chainId: 9200, symbol: "BDOG", name: "The Black Dog", address: "0x0700b2c2c3f92c0e5caed27951017c358bef51d9", decimals: 18 },
  { chainId: 9200, symbol: "SLICE", name: "$SLICE", address: "0x958ca3f0add2d7007d13564f7d0ba7d51db9ae1d", decimals: 18 },
  { chainId: 9200, symbol: "RAY", name: "Ray", address: "0xe6ea0d0bf774261e641dfb55b507d48d4c941db2", decimals: 18 },
  { chainId: 9200, symbol: "LUMI", name: "LUMINARA", address: "0x401d126ef12fe44cbdb7371ef993f8848e658053", decimals: 18 },
  { chainId: 9200, symbol: "BRBN", name: "Smoke\'s Bourbon Coin", address: "0x803609809b85767dcd41ebfc3a1f594cf36f0df3", decimals: 18 },
];

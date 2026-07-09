import { Chain } from "viem";

export const lcai: Chain = {
  id: 9200,
  name: "LightChainAI",
  nativeCurrency: {
    name: "LightChainAI",
    symbol: "LCAI",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mainnet.lightchain.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "LightChainAI Explorer",
      url: "https://mainnet.lightscan.app",
    },
  },
};

export const lcaiTestnet: Chain = {
  id: 8200,
  name: "LightChainAI Testnet",
  nativeCurrency: {
    name: "LightChainAI",
    symbol: "LCAI",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.lightchain.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "LightChainAI Testnet Explorer",
      url: "https://testnet.lightscan.app",
    },
  },
};

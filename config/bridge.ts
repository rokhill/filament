import { Chain } from "viem";
import { mainnet } from "viem/chains";

// Filament Bridge — UI for the team's official Hyperlane warp route.
// Addresses verified from lightchain-protocol/bridge-ui src/consts/warpRoutes.ts
// (mainnet entries only; testnet routes are commented out upstream).
//
// Flow: LCAI ERC-20 locked in HypCollateral on Ethereum <-> native LCAI
// minted/burned by HypNative on chain 9200. Filament never custodies funds —
// all transfers go directly through the team's deployed route contracts.

export const BRIDGE_ENABLED =
  (process.env.NEXT_PUBLIC_BRIDGE_ENABLED ?? "true") !== "false";

// LCAI ERC-20 token on Ethereum
export const LCAI_ERC20_ETHEREUM =
  "0x9cA8530CA349c966Fe9ef903Df17a75B8A778927" as const;

// Hyperlane warp route — Ethereum side (EvmHypCollateral, locks the ERC-20)
export const WARP_ROUTE_ETHEREUM =
  "0x01f80bb8e78e79881E8Ec7832fB6C2c59f64e353" as const;

// Hyperlane warp route — LCAI mainnet side (EvmHypNative, mints/burns native LCAI)
export const WARP_ROUTE_LCAI =
  "0xEc7096A3116EE769457C939617375Ec1785AA6f1" as const;

// Hyperlane domain IDs (EVM chains use their chain ID as the domain).
// The UI preflights quoteGasPayment(dest) before any transfer, so a wrong
// domain fails loudly at quote time — funds never move on a bad domain.
export const ETHEREUM_DOMAIN = 1;
export const LCAI_DOMAIN = 9200;

// Ethereum mainnet chain for wagmi/viem. Public RPC by default; override
// with a dedicated endpoint (Alchemy/Infura) in production for reliability.
const ethRpc = process.env.NEXT_PUBLIC_ETH_RPC_URL;

export const ethereum: Chain = ethRpc
  ? {
      ...mainnet,
      rpcUrls: {
        default: { http: [ethRpc] },
      },
    }
  : mainnet;

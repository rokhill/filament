# Lightchain DEX

**Lightchain DEX** is the official decentralized exchange (DEX) frontend for the **LightChain AI** network, branded **LCAI Swap** in the app — open-sourced so anyone can run their own instance.

It is a complete DEX interface: users connect a wallet, swap tokens, provide and withdraw liquidity, and track their positions, all executed directly against on-chain Uniswap V2–style contracts (no backend, no custody). Swaps and liquidity actions are built and signed client-side and sent straight to the router, factory, and pair contracts.

Built with Next.js (App Router), TypeScript, wagmi/viem, and Reown AppKit.

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Supported Networks](#supported-networks)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Available Scripts](#available-scripts)
- [Configuration](#configuration)
  - [Chains](#chains)
  - [Contracts](#contracts)
  - [Token List](#token-list)
  - [Remote Navigation & Footer Config](#remote-navigation--footer-config)
- [Deploying Your Own DEX](#deploying-your-own-dex)
- [Deployment](#deployment)
- [Security](#security)
- [Disclaimer](#disclaimer)
- [Trademarks & Branding](#trademarks--branding)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
- [License](#license)

---

## Features

### Trading
- **Token swaps** — pricing via the router's `getAmountsOut` over the direct token pair, with user-configurable slippage tolerance and transaction deadline, and on-chain minimum-output protection.
- **Native ⇄ wrapped** — transparent `deposit` / `withdraw` handling for the native LCAI ↔ WLCAI pair.
- **Live quotes** — the output amount updates as you type (debounced), quoted on-chain through the router.

### Liquidity management
- **Provide liquidity** — add to existing pools or create a new pair, including native-token pairs via `addLiquidityETH`. First-time providers set the initial price.
- **Withdraw liquidity** — remove by percentage (25 / 50 / 75 / 100%) with slippage-protected minimums.
- **Gasless LP approvals** — removals use **EIP-2612 permit signatures** (`removeLiquidityWithPermit` / `removeLiquidityETHWithPermit`), so users sign a message instead of sending a separate approval transaction.
- **Positions overview** — the pools page reads live reserves and LP-token balances to show each of your positions and your share of the pool.
- **Import / find pools** — locate any pair by its two tokens and jump straight to adding or removing liquidity.

### Wallet & accounts
- **Multi-wallet connection** — via [Reown AppKit](https://reown.com) (WalletConnect) with the wagmi adapter.
- **Allowance management** — on-chain allowance checks with ERC-20 approvals before trades and liquidity actions.
- **Wallet helpers** — add a token to the connected wallet in one click (`watchAsset`) from the token list.
- **Trade settings** — slippage tolerance and transaction deadline persisted per user.

### App
- **Responsive UI** — mobile-friendly layout with light/dark theme (defaults to dark).
- **Configurable site chrome** — navigation and footer content load from a remote JSON source (with safe fallbacks; see [below](#remote-navigation--footer-config)).

## How It Works

Lightchain DEX is a pure frontend that talks to a Uniswap V2–compatible contract suite on the LightChain AI network. There is no application server in the trade path — the browser builds transactions with [viem](https://viem.sh)/[wagmi](https://wagmi.sh) and submits them to the user's wallet for signing.

The ABIs the app interacts with live in [`contracts/`](contracts):

| Contract | ABI | Role |
| --- | --- | --- |
| Router V2 | [`routerV2Abi.ts`](contracts/routerV2Abi.ts) | Swaps, add/remove liquidity, `getAmountsOut` quoting |
| Factory V2 | [`factoryV2Abi.ts`](contracts/factoryV2Abi.ts) | Resolve and create trading pairs |
| Pair | [`pairAbi.ts`](contracts/pairAbi.ts) | Reserves, LP-token balances, EIP-2612 permit |
| Wrapped native | [`wethAbi.ts`](contracts/wethAbi.ts) | Wrap/unwrap native LCAI ↔ WLCAI |

Most on-chain logic — quoting, swaps, and the liquidity lifecycle — lives in [`hooks/useWeb3Functions.ts`](hooks/useWeb3Functions.ts), with ERC-20 approvals in [`hooks/useApprove.tsx`](hooks/useApprove.tsx).

## Tech Stack

| Layer            | Technology                                                        |
| ---------------- | ----------------------------------------------------------------- |
| Framework        | [Next.js 15](https://nextjs.org) (App Router, Turbopack), React 19 |
| Language         | TypeScript                                                         |
| Web3             | [wagmi](https://wagmi.sh), [viem](https://viem.sh), [Reown AppKit](https://reown.com) |
| Data fetching    | [TanStack Query](https://tanstack.com/query)                      |
| State            | [Zustand](https://zustand-demo.pmnd.rs) (with persistence)         |
| UI               | [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) (Radix primitives), Lucide icons |
| Notifications    | [Sonner](https://sonner.emilkowal.ski)                            |
| Package manager  | [pnpm](https://pnpm.io)                                            |

## Supported Networks

| Network              | Chain ID | Native Currency | RPC                                  | Explorer                              |
| -------------------- | -------- | --------------- | ------------------------------------ | ------------------------------------- |
| LightChainAI Mainnet | `9200`   | LCAI            | `https://rpc.mainnet.lightchain.ai`  | `https://mainnet.lightscan.app`       |
| LightChainAI Testnet | `8200`   | LCAI            | `https://rpc.testnet.lightchain.ai`  | `https://testnet.lightscan.app`       |

Mainnet is the active network by default. Chain definitions live in [`config/chains.ts`](config/chains.ts) and the active set is selected in [`config/index.ts`](config/index.ts).

## Project Structure

```
.
├── app/                # Next.js App Router routes
│   ├── page.tsx        #   Swap (home)
│   ├── pools/          #   Your liquidity positions
│   ├── add/            #   Add / provide liquidity
│   ├── remove/         #   Remove liquidity
│   └── find/           #   Find / import a pair
├── components/         # UI (swap form, liquidity forms, modals, header/footer, shadcn/ui)
├── config/             # Chains, contract addresses, token list, wagmi/AppKit setup
├── contracts/          # Contract ABIs (router, factory, pair, WETH, swap)
├── context/            # AppKit + wagmi providers
├── hooks/              # Web3 hooks — useWeb3Functions (swap + liquidity), useApprove,
│                       #   useAllowance, usePair, useTokens, useContracts, clients
├── lib/                # Nav/footer config fetching, link resolution, utils
├── store/              # Zustand stores (user settings, tokens, auth)
├── types/              # Shared TypeScript types (Token, Pair, …)
└── public/             # Static assets, SCSS, fonts
```

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm`)
- A [Reown Cloud](https://cloud.reown.com) project ID for wallet connectivity

### Installation

```bash
git clone <repository-url>
cd lightchain-dex
pnpm install
```

### Environment Variables

Wallet connectivity requires a Reown (WalletConnect) project ID. Copy the example file and fill in your value:

```bash
cp .env.example .env.local
```

```bash
# .env.local
# Required — Reown / WalletConnect project ID (https://cloud.reown.com)
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here

# Optional — override the remote nav/footer config sources (defaults to Lightchain's)
# NEXT_PUBLIC_NAV_CONFIG_URL=https://docs.lightchain.ai/nav-config.json
# NEXT_PUBLIC_FOOTER_CONFIG_URL=https://docs.lightchain.ai/footer-config.json
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Yes | Reown/WalletConnect project ID. Read in [`config/wagmi.ts`](config/wagmi.ts); the app throws at startup if it is missing. |
| `NEXT_PUBLIC_NAV_CONFIG_URL` | No | Remote navigation config URL. Defaults to Lightchain's; set empty to disable. |
| `NEXT_PUBLIC_FOOTER_CONFIG_URL` | No | Remote footer config URL. Defaults to Lightchain's; set empty to disable. |

### Running Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command      | Description                                    |
| ------------ | ---------------------------------------------- |
| `pnpm dev`   | Start the development server (Turbopack)       |
| `pnpm build` | Create an optimized production build           |
| `pnpm start` | Run the production build                       |
| `pnpm lint`  | Run ESLint                                     |

## Configuration

### Chains

Network definitions (RPC URLs, explorers, native currency) are in [`config/chains.ts`](config/chains.ts). The active chain set is exported from [`config/index.ts`](config/index.ts).

### Contracts

Router (V2), factory (V2), and wrapped-native (WLCAI) addresses are keyed by chain ID in [`config/index.ts`](config/index.ts); the matching ABIs live in [`contracts/`](contracts). The mainnet addresses are the official LightChain AI deployments and are verified on the [block explorer](https://mainnet.lightscan.app):

| Contract | Mainnet address |
| --- | --- |
| `UniswapV2Router02` | `0x1f94c0A6Cf48D3075f9713A79f87FA4eEdAF7021` |
| `UniswapV2Factory` | `0xBA502917c3F7233F9100f9430f4048a224A7D8DE` |
| `WLCAI` (wrapped native) | `0xeBf97f16d843bFD9d9E6B1857B4C00d94ca7e2B2` |

> If you fork this to target a different deployment or chain, update these addresses and verify each one on-chain — a wrong router/factory address can result in loss of funds.

### Token List

The default token list is defined in [`config/token-list.ts`](config/token-list.ts). Add or remove tokens by editing this file (symbol, name, address, decimals, logo URI).

### Remote Navigation & Footer Config

Header navigation and footer links are fetched at runtime from a remote JSON source (cached for 1 hour via Next.js `revalidate`):

- Navigation — [`lib/nav/fetchNavConfig.ts`](lib/nav/fetchNavConfig.ts), URL from `NEXT_PUBLIC_NAV_CONFIG_URL` (default `https://docs.lightchain.ai/nav-config.json`)
- Footer — [`lib/footer/fetchFooterConfig.ts`](lib/footer/fetchFooterConfig.ts), URL from `NEXT_PUBLIC_FOOTER_CONFIG_URL` (default `https://docs.lightchain.ai/footer-config.json`)

Both are **optional and fail-safe**: if the URL is unset or the fetch fails, the corresponding menu renders empty rather than crashing the page — so a fresh clone runs out of the box without hosting any config. Point the env vars at your own JSON to customize the menus.

External link targets are resolved through [`lib/nav/resolveTarget.ts`](lib/nav/resolveTarget.ts), which opens off-origin links in a new tab.

## Deploying Your Own DEX

This repository is the **frontend only**. To run an independent DEX you must also deploy the on-chain contracts it talks to, then point the app at your own addresses. Lightchain DEX targets a standard **Uniswap V2**–compatible AMM; the ABIs in [`contracts/`](contracts) match the canonical Uniswap V2 interfaces.

This project does **not** redistribute the AMM contract source. Deploy it from the official upstream repositories:

1. **Factory** — deploy `UniswapV2Factory` from [Uniswap/v2-core](https://github.com/Uniswap/v2-core) (GPL-3.0), passing your `feeToSetter` address.
2. **Wrapped native token** — deploy a WETH9-style wrapped-native ERC-20 with `deposit` / `withdraw`. Lightchain uses `WLCAI`, an OpenZeppelin ERC-20 with `ERC20Permit` (EIP-2612), which enables the gasless liquidity-removal flow.
3. **Router** — deploy `UniswapV2Router02` from [Uniswap/v2-periphery](https://github.com/Uniswap/v2-periphery) (GPL-3.0), passing your factory and wrapped-native addresses.
   - ⚠️ **Pair init-code hash:** `UniswapV2Library.pairFor` hard-codes the pair init-code hash. If you compile the factory yourself, set the periphery's `INIT_CODE_HASH` to your factory's actual `pairCodeHash()`, or the router will derive wrong pair addresses and swaps/liquidity will fail.
4. **Wire it into the frontend** — set your deployed addresses in [`config/index.ts`](config/index.ts) (`factoryV2Address`, `routerV2Address`, `WETH`), define your network in [`config/chains.ts`](config/chains.ts), and update [`config/token-list.ts`](config/token-list.ts).

The Uniswap V2 contracts are licensed under **GPL-3.0**; your on-chain deployment and any modifications to those contracts are governed by that license, independently of this frontend's MIT license. See [Acknowledgements](#acknowledgements).

## Deployment

The app is a standard Next.js application and can be deployed to any platform that supports Next.js 15 (e.g. [Vercel](https://vercel.com), Node.js hosting, or a container).

```bash
pnpm build
pnpm start
```

Make sure the required [environment variables](#environment-variables) are set in your hosting provider.

## Security

This is financial software that interacts with users' wallets and on-chain funds. When self-hosting or forking:

- **Verify the contract addresses** in [`config/index.ts`](config/index.ts) against the deployment you intend to use. A wrong router/factory address can result in loss of funds.
- **Understand the approval model.** Trades and liquidity actions request an unlimited (`MAX_UINT256`) ERC-20 allowance to the router (see [`hooks/useWeb3Functions.ts`](hooks/useWeb3Functions.ts)). Liquidity removal instead uses EIP-2612 permit signatures where supported.
- **Trust the remote config source.** Navigation and footer links load from the configured URL at runtime; that origin must remain under trusted control.
- **Keep credentials in environment variables.** The Reown project ID is read from `.env.local` and is never committed; do not hardcode IDs or keys in source.

If you discover a security vulnerability, please report it privately to the maintainers rather than opening a public issue.

## Disclaimer

Lightchain DEX is free, open-source software provided **"as is", without warranty of any kind**, as set out in the [MIT License](LICENSE). It is a **non-custodial** interface — it never takes possession of your funds; all transactions are constructed client-side and signed and broadcast by your own wallet.

- **No advice.** Nothing in this software or its documentation is financial, investment, legal, or tax advice, or a solicitation to buy or sell any asset.
- **Use at your own risk.** Interacting with smart contracts and digital assets is inherently risky and may result in the **total loss of funds**. Always verify contract addresses and review each transaction before signing.
- **Your compliance responsibility.** If you deploy, host, or operate an instance of this software, **you alone** are responsible for compliance with all applicable laws and regulations in your jurisdiction — including securities, money-transmission/money-services, sanctions, AML/KYC, tax, and consumer-protection laws.
- **Not audited by default.** This code and the contracts it interacts with may not have been independently audited. Review them before any production use.

The authors and contributors accept no liability for any loss or damage arising from the use of this software, to the maximum extent permitted by law.

## Trademarks & Branding

The [MIT License](LICENSE) covers the **source code only**. The names **"Lightchain", "Lightchain AI", "LCAI"**, and the associated logos and brand assets are trademarks of Lightchain Protocol and are **not** licensed for reuse.

If you deploy your own instance, **replace the Lightchain branding** and do not present your deployment as the official Lightchain DEX. The only official deployment is served at **https://dex.lightchain.ai** — any other site using this code is an independent, unaffiliated instance.

## Contributing

Contributions are welcome. To propose a change:

1. Fork the repository and create a feature branch.
2. Make your changes and run `pnpm lint`.
3. Open a pull request describing the change and its motivation.

## Acknowledgements

Lightchain DEX builds on the following open-source work, each under its own license:

- [Uniswap V2](https://github.com/Uniswap/v2-core) — core & periphery AMM contracts (GPL-3.0)
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) — MIT
- [Next.js](https://nextjs.org), [wagmi](https://wagmi.sh), [viem](https://viem.sh), [Reown AppKit](https://reown.com), [TanStack Query](https://tanstack.com/query), [Zustand](https://zustand-demo.pmnd.rs), [Tailwind CSS](https://tailwindcss.com), and [shadcn/ui](https://ui.shadcn.com) — see each project for its license.

## License

The source code in this repository is released under the [MIT License](LICENSE).

The MIT license applies to this frontend only. Third-party dependencies and the on-chain contracts this app interacts with (notably the Uniswap V2 contracts, GPL-3.0) are governed by their own licenses — see [Acknowledgements](#acknowledgements) and [Deploying Your Own DEX](#deploying-your-own-dex).

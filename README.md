# Filament

**Non-custodial DEX and memecoin launchpad on LightChain AI mainnet (chain 9200)**

Live at [filament.exchange](https://filament.exchange)

---

## What is Filament?

Filament is an independent, community-built decentralized exchange on the LightChain AI network. It lets anyone swap tokens, provide liquidity, and fair-launch memecoins — all on-chain, non-custodial, with no intermediaries. Your wallet signs every transaction. Filament never holds your funds.

Filament has two products built into one application:

### Exchange

A Uniswap V2-compatible AMM for swapping tokens on LCAI mainnet. Swap any token pair, provide liquidity to earn 0.30% of every swap in your pool, or remove liquidity at any time. Built with independently deployed contracts — our own Factory, Router, and WLCAI addresses, not shared with any other deployment.

### The Forge

The first fair-launch memecoin launchpad on LightChain AI. Every coin launches on a bonding curve priced in native LCAI with a fixed 1,000,000,000 supply. No team allocation. No presale. No insider wallets.

**How it works:**
- Pay 300 LCAI to launch a coin
- Price rises automatically with every buy — early buyers get the lowest price
- Sell back to the curve at any time before graduation (always a buyer, always a price)
- When the curve sells out (~293,000 LCAI raised), the coin auto-lists on Filament with all raised LCAI as permanent liquidity — LP tokens burned to `0xdead`, forever

**What makes it different:**
- Tokens are non-transferable before graduation — no fake pools, no snipe markets
- Creator's first buy is atomic with creation — nobody can front-run launch block 1
- LP burned in the same transaction as graduation — not "locked," burned
- Trade fee hard-capped at 3% in bytecode — operator cannot change the rules post-deploy
- Creator holding % shown live on every coin page — full transparency

---

## Contracts (LightChain AI mainnet — chain 9200)

| Contract | Address | Verified |
|---|---|---|
| WLCAI | `0xD73cedfc5b894323BdB18A1e31E7BB186fCe5F64` | — |
| UniswapV2Factory | `0x5Cf3b069dDB232d1adc5139a9eFb30C48F629389` | — |
| UniswapV2Router02 | `0x0fA126B579eA894baD98D89815B3494640d29ac6` | — |
| FilamentForge | `0xB4Ba841e14943184840A939134ffc5c8Ab9403E1` | ✅ [lightscan](https://mainnet.lightscan.app/address/0xB4Ba841e14943184840A939134ffc5c8Ab9403E1) |

All contracts are independently deployed. The Factory's `INIT_CODE_HASH` was recomputed for this deployment. `feeToSetter` is owned by the Filament deployer, not the Lightchain team.

---

## Revenue model

| Fee | Amount | Trigger |
|---|---|---|
| Creation fee | 300 LCAI | Each new coin launched on the Forge |
| Trade fee | 1% | Every buy or sell on any bonding curve |
| Graduation fee | 2% of raise | When a coin's curve sells out (~5,860 LCAI per graduation) |
| Swap fee | 0.30% | Every Exchange swap (paid to LPs, not the protocol) |

Fee caps are enforced in contract bytecode. Trade fee max: 3%. Graduation fee max: 5%. These limits cannot be raised by anyone.

---

## Security

- **Non-custodial** — Filament holds no user funds at any point
- **No upgrade keys** — contracts are immutable post-deploy
- **LP burned** — graduated coin liquidity goes to `0x000...dead`, unredeemable by anyone
- **Curve reserves** — operator cannot withdraw LCAI held in bonding curves
- **Fee caps** — hard-coded in bytecode, not settable above maximums
- **Transfer lock** — Forge tokens cannot be transferred before graduation, preventing snipe pools

---

## Network

- **Chain ID:** 9200
- **RPC:** https://rpc.mainnet.lightchain.ai
- **Explorer:** https://mainnet.lightscan.app

---

## Links

- **App:** https://filament.exchange
- **Forge:** https://filament.exchange/forge
- **Guide:** https://filament.exchange/guide
- **Forge Guide:** https://filament.exchange/forge/guide
- **dApp Hub:** https://hub.lightchain.ai

---

## Licenses

Frontend: MIT · Contracts: GPL-3.0 (Uniswap V2), WLCAI is canonical WETH9 ported to Solidity 0.5.x

*Built on LightChain AI mainnet by the Filament community.*

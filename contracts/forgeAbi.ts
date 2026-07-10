export const forgeAbi = [
  {
    type: "function", name: "createToken", stateMutability: "payable",
    inputs: [
      { name: "name_", type: "string" },
      { name: "symbol_", type: "string" },
      { name: "metadataURI_", type: "string" },
      { name: "minTokensOut", type: "uint256" },
    ],
    outputs: [{ name: "token", type: "address" }],
  },
  {
    type: "function", name: "buy", stateMutability: "payable",
    inputs: [{ name: "token", type: "address" }, { name: "minTokensOut", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function", name: "sell", stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "tokenAmount", type: "uint256" },
      { name: "minLcaiOut", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function", name: "quoteBuy", stateMutability: "view",
    inputs: [{ name: "token", type: "address" }, { name: "lcaiIn", type: "uint256" }],
    outputs: [{ name: "tokensOut", type: "uint256" }],
  },
  {
    type: "function", name: "quoteSell", stateMutability: "view",
    inputs: [{ name: "token", type: "address" }, { name: "tokenAmount", type: "uint256" }],
    outputs: [{ name: "lcaiOut", type: "uint256" }],
  },
  {
    type: "function", name: "curveStats", stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [
      { name: "priceWei", type: "uint256" },
      { name: "progressBps", type: "uint256" },
      { name: "lcaiRaised", type: "uint256" },
    ],
  },
  {
    type: "function", name: "curves", stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "vLcai", type: "uint256" },
      { name: "vTok", type: "uint256" },
      { name: "realLcai", type: "uint256" },
      { name: "tokensSold", type: "uint256" },
      { name: "graduated", type: "bool" },
      { name: "metadataURI", type: "string" },
    ],
  },
  { type: "function", name: "tokenCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allTokens", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "creationFee", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "tradeFeeBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "CURVE_SUPPLY", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "event", name: "TokenCreated",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false },
      { name: "metadataURI", type: "string", indexed: false },
      { name: "vLcai0", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event", name: "Trade",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "trader", type: "address", indexed: true },
      { name: "isBuy", type: "bool", indexed: false },
      { name: "lcaiAmount", type: "uint256", indexed: false },
      { name: "tokenAmount", type: "uint256", indexed: false },
      { name: "vLcai", type: "uint256", indexed: false },
      { name: "vTok", type: "uint256", indexed: false },
      { name: "tokensSold", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event", name: "Graduation",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "pair", type: "address", indexed: true },
      { name: "lcaiToPool", type: "uint256", indexed: false },
      { name: "tokensToPool", type: "uint256", indexed: false },
      { name: "liquidityBurned", type: "uint256", indexed: false },
    ],
  },
] as const;

export const launchTokenAbi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "graduated", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  {
    type: "function", name: "allowance", stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }],
  },
  {
    type: "function", name: "approve", stateMutability: "nonpayable",
    inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }],
  },
] as const;

export default forgeAbi;

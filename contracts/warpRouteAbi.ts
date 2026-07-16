// Minimal ABI for Hyperlane TokenRouter (HypCollateral / HypNative).
// transferRemote is payable: for HypNative msg.value = amount + gas quote,
// for HypCollateral msg.value = gas quote only.
const warpRouteAbi = [
  {
    type: "function",
    name: "transferRemote",
    stateMutability: "payable",
    inputs: [
      { name: "_destination", type: "uint32" },
      { name: "_recipient", type: "bytes32" },
      { name: "_amountOrId", type: "uint256" },
    ],
    outputs: [{ name: "messageId", type: "bytes32" }],
  },
  {
    type: "function",
    name: "quoteGasPayment",
    stateMutability: "view",
    inputs: [{ name: "_destinationDomain", type: "uint32" }],
    outputs: [{ name: "_gasPayment", type: "uint256" }],
  },
  {
    type: "function",
    name: "domains",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint32[]" }],
  },
] as const;

export default warpRouteAbi;

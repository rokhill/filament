import { Address } from "viem";
import { Token } from "./Token";

export type Pair = {
  name?: string;
  address: Address;
  token0: Token;
  token1: Token;
  reserve0: bigint;
  reserve1: bigint;
  amount0: bigint;
  amount1: bigint;
  liquidity: bigint;
  totalSupply: bigint;
  price: number;
};

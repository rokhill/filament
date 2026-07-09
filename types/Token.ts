import { Address } from "viem";

export type Token = {
  name: string;
  symbol: string;
  address?: Address;
  decimals: number;
  chainId: number;
  logoURI?: string;
};

export type TokenBalance = Token & {
  address: `0x${string}`;
  balance: bigint;
  quote: number;
};

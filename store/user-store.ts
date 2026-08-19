import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Token } from "../types/Token";

type StateType = {
  tokens: {
    [chainId: number]: {
      [address: string]: Token;
    };
  };
  pairs: {
    [chainId: number]: {
      [key: string]: [Token, Token];
    };
  };
  slippageTolerance: number;
  txDeadline: number;
  bestPriceRouting: boolean;
};

const useUserStore = create<StateType>()(
  persist(
    () => ({
      tokens: {},
      pairs: {},
      slippageTolerance: 0.5,
      txDeadline: 20,
      bestPriceRouting: true as boolean,
    }),
    { name: "user", version: 1 }
  )
);

export default useUserStore;

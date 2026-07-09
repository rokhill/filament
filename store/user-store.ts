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
};

const useUserStore = create<StateType>()(
  persist(
    () => ({
      tokens: {},
      pairs: {},
      slippageTolerance: 0.5,
      txDeadline: 20,
    }),
    { name: "user" }
  )
);

export default useUserStore;

import { Token } from "@/types/Token";
import { create } from "zustand";

type StateType = {
  loading: boolean;
  token0?: Token;
  token1?: Token;
};

const useStore = create<StateType>(() => ({
  loading: false,
}));

export default useStore;

import { tokenList } from "@/config/token-list";
import { Token } from "@/types/Token";
import { create } from "zustand";

type TokenStoreState = {
  tokens: Token[];
};

const useTokenStore = create<TokenStoreState>(() => ({
  tokens: tokenList || [],
}));

export default useTokenStore;

import { useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { lcai } from "@/config/chains";

/**
 * Drop this in any page/component that writes to LCAI.
 * If the wallet is connected on the wrong chain, silently
 * prompts a switch. No UI needed — wallet handles the modal.
 */
export function useChainGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (isConnected && chainId !== lcai.id) {
      switchChain({ chainId: lcai.id });
    }
  }, [isConnected, chainId, switchChain]);

  return chainId === lcai.id;
}

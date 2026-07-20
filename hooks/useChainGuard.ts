"use client";
import { useEffect, useRef } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { lcai } from "@/config/chains";

export function useChainGuard() {
  const { isConnected, status } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const triggered = useRef(false);

  useEffect(() => {
    // wait until wagmi is fully hydrated and wallet confirmed connected
    if (status !== "connected") { triggered.current = false; return; }
    if (chainId === lcai.id) { triggered.current = false; return; }
    if (triggered.current) return;
    triggered.current = true;
    // small delay so AppKit modal doesn't fight the switch prompt
    const t = setTimeout(() => switchChain({ chainId: lcai.id }), 800);
    return () => clearTimeout(t);
  }, [status, chainId, switchChain]);

  return chainId === lcai.id;
}

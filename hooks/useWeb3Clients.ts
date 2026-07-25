import { useWalletClient, useAccount } from "wagmi";
import useCurrentChain from "./useCurrentChain";
import { useMemo } from "react";
import { createPublicClient, http } from "viem";

const useWeb3Clients = () => {
  const chain = useCurrentChain();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient({ query: { enabled: !!address } });

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: chain,
        transport: http(),
        batch: { multicall: true },
      }),
    [chain]
  );

  return { publicClient, walletClient };
};

export default useWeb3Clients;

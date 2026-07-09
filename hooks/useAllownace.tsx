import useWeb3Clients from "./useWeb3Clients";
import { Token } from "@/types/Token";
import { erc20Abi, formatUnits } from "viem";
import useCurrentChain from "./useCurrentChain";
import { useQuery } from "@tanstack/react-query";

type UseAllowanceProps = {
  token?: Token;
  address?: `0x${string}`;
  spender?: `0x${string}`;
  enabled?: boolean;
};

const useAllowance = ({
  token,
  address,
  spender,
  enabled,
}: UseAllowanceProps) => {
  const chain = useCurrentChain();
  const { publicClient } = useWeb3Clients();
  return useQuery({
    queryKey: ["allownace", token?.address, address, chain.id],
    queryFn: async () => {
      if (!token?.address || !spender || !address) return;
      const allowance = await publicClient?.readContract({
        abi: erc20Abi,
        address: token.address,
        args: [address, spender],
        functionName: "allowance",
      });
      return {
        value: allowance,
        formatted: formatUnits(allowance, token.decimals),
      };
    },
    enabled: !!token && !!address && !!enabled,
  });
};

export default useAllowance;

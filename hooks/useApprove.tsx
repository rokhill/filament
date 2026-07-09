import { Token } from "@/types/Token";
import useWeb3Clients from "./useWeb3Clients";
import { MutationOptions, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { erc20Abi } from "viem";

type UseApproveProps = {
  amount?: bigint;
  token?: Token;
  spender?: `0x${string}`;
} & MutationOptions;

const useApprove = ({ token, amount, spender, ...props }: UseApproveProps) => {
  const { walletClient, publicClient } = useWeb3Clients();
  return useMutation({
    mutationFn: async () => {
      if (!token?.address || !amount || !walletClient || !spender) return;
      const hash = await walletClient.writeContract({
        abi: erc20Abi,
        address: token.address,
        functionName: "approve",
        args: [spender, amount],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(
        error?.walk?.().message ||
        error?.message ||
        "Signing failed, please try again!"
      );
    },
    ...props,
  });
};

export default useApprove;

import { useAccount } from "wagmi";
import useCurrentChain from "./useCurrentChain";
import { useEffect, useState } from "react";
import config from "@/config";
import { formatUnits, getContract, zeroAddress } from "viem";
import useContracts from "./useContracts";
import { Token } from "@/types/Token";
import { Pair } from "@/types/Pair";
import pairAbi from "@/contracts/pairAbi";
import useWeb3Clients from "./useWeb3Clients";
import { useDebounce } from "react-use";

type UsePairProps = {
  token0?: Token;
  token1?: Token;
};
const usePair = ({ token0, token1 }: UsePairProps) => {
  const chain = useCurrentChain();
  const { address } = useAccount();
  const [data, setData] = useState<Pair | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { publicClient } = useWeb3Clients();
  const { factoryV2Contract } = useContracts();

  const refresh = async () => {
    if (!data || !address) return;
    setIsLoading(true);

    const pair = getContract({
      address: data.address,
      abi: pairAbi,
      client: {
        public: publicClient
      },
    });

    const [liquidity, totalSupply] = await Promise.all([
      pair.read.balanceOf([address]),
      pair.read.totalSupply(),
    ]);
    setData((state) => {
      if (!state) return state;
      return {
        ...state,
        amount0: BigInt((liquidity * state.reserve0) / totalSupply),
        amount1: BigInt((liquidity * state.reserve1) / totalSupply),
        liquidity,
        totalSupply,
        price:
          +formatUnits(state.reserve1, state.token1.decimals) /
          +formatUnits(state.reserve0, state.token0.decimals),
      };
    });

    setIsLoading(false);
  };

  const loadPair = async () => {
    if (!token0 || !token1 || !address) return setData(undefined);

    const WETH = config.WETH[chain.id];
    setIsLoading(true);
    const pairAddress = await factoryV2Contract.read.getPair([
      token0?.address || WETH,
      token1?.address || WETH,
    ]);

    if (pairAddress === zeroAddress) {
      setData(undefined);
      setIsLoading(false);
      return;
    }

    const pair = getContract({
      address: pairAddress,
      abi: pairAbi,
      client: { public: publicClient },
    });

    const [reserves, liquidity, totalSupply] = await Promise.all([
      pair.read.getReserves(),
      pair.read.balanceOf([address]),
      pair.read.totalSupply(),
    ]);

    const [reserve0, reserve1] =
      (token0?.address || WETH).localeCompare(token1?.address || WETH) === -1
        ? [reserves[0], reserves[1]]
        : [reserves[1], reserves[0]];

    setData({
      address: pairAddress,
      token0,
      token1,
      reserve0,
      reserve1,
      amount0: BigInt((liquidity * reserve0) / totalSupply),
      amount1: BigInt((liquidity * reserve1) / totalSupply),
      liquidity,
      totalSupply,
      price:
        +formatUnits(reserve1, token1.decimals) /
        +formatUnits(reserve0, token0.decimals),
    });

    setIsLoading(false);
  };

  useDebounce(() => loadPair(), 200, [token0, token1]);

  useEffect(() => {
    refresh();
  }, [chain, address]);

  return {
    data,
    isLoading,
    refresh,
  };
};

export default usePair;

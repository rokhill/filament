import { useEffect, useMemo } from "react";
import useTokenStore from "@/store/token-store";
import { Token } from "@/types/Token";
import { erc20Abi, isAddress } from "viem";
import useWeb3Clients from "./useWeb3Clients";
import useUserStore from "@/store/user-store";
import useCurrentChain from "./useCurrentChain";
import useForge from "./useForge";

const useTokens = () => {
  const chain = useCurrentChain();
  const { fetchCoins } = useForge();
  const { publicClient } = useWeb3Clients();
  const userTokens = useUserStore();
  const listedTokens = useTokenStore();

  // auto-add all forge coins to token list (indexer first, RPC fallback)
  useEffect(() => {
    // wipe stale persisted tokens for this chain so old V1 coins don't linger
    useUserStore.setState((state) => ({ tokens: { ...state.tokens, [chain.id]: {} } }));
    const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL || "";
    const load = INDEXER
      ? fetch(`${INDEXER}/api/v1/forge/coins?limit=200`).then(r=>r.json()).then((rows:any[]) =>
          rows.map((r:any) => {
            let img: string|undefined;
            try { const m = JSON.parse(r.metadata_uri||"{}"); img = m.image ? (m.image.startsWith("ipfs://") ? "https://ipfs.io/ipfs/"+m.image.slice(7) : m.image) : undefined; } catch {}
            return { address: r.address as `0x${string}`, chainId: chain.id, name: r.name, symbol: r.symbol, decimals: 18, ...(img ? { logoURI: img } : {}) };
          })
        ).catch(()=>null)
      : Promise.resolve(null);
    load.then(coins => {
      if (coins) {
        coins.forEach(addToken);
        // also load ALL tokens with pairs from indexer (non-Forge tokens)
        if (INDEXER) {
          fetch(`${INDEXER}/api/v1/tokens`).then(r=>r.json()).then((rows:any[]) => {
            rows.filter((r:any) => r.symbol && r.address && !r.is_forge_coin).forEach((r:any) => {
              addToken({ address: r.address as `0x${string}`, chainId: chain.id, name: r.name || r.symbol, symbol: r.symbol, decimals: r.decimals || 18 });
            });
          }).catch(()=>{});
        }
        return;
      }
      fetchCoins().then((coins) => {
        coins.forEach((c) => {
          const img = c.metadata?.image ? (c.metadata.image.startsWith("ipfs://") ? "https://ipfs.io/ipfs/" + c.metadata.image.slice(7) : c.metadata.image) : undefined;
          addToken({ address: c.address as `0x${string}`, chainId: chain.id, name: c.name, symbol: c.symbol, decimals: 18, ...(img ? { logoURI: img } : {}) });
        });
      }).catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain.id]);

  const listedTokensByChain = useMemo(() => {
    return listedTokens.tokens
      .filter((t) => t.chainId === chain.id)
      .reduce((acc, t) => {
        acc[t.address || t.symbol] = t;
        return acc;
      }, {} as Record<string, Token>);
  }, [listedTokens, chain]);

  const userTokensByChain = useMemo(() => {
    return userTokens.tokens[chain.id] || {};
  }, [userTokens, chain]);

  const tokens = useMemo<Token[]>(
    () =>
      Object.values({
        ...listedTokensByChain,
        ...userTokensByChain,
      }),
    [listedTokensByChain, userTokensByChain]
  );

  const pairTokens = useMemo(() => {
    const acc = [];
    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        acc.push([tokens[i], tokens[j]]);
      }
    }
    return acc;
  }, [tokens]);

  const findToken = async (value: string) => {
    const token = tokens.find((t) =>
      isAddress(value)
        ? t.address?.toLowerCase() === value.toLowerCase()
        : t.symbol?.toLowerCase() === value.toLowerCase()
    );
    if (token) return token;
    if (isAddress(value)) {
      return await fetchToken(value);
    }
    return undefined;
  };

  const addToken = (token: Token & { address: `0x${string}` }) => {
    useUserStore.setState((state) => ({
      tokens: {
        ...state.tokens,
        [token.chainId]: {
          ...state.tokens[token.chainId],
          [token.address]: token,
        },
      },
    }));
  };

  const fetchToken = async (address: `0x${string}`): Promise<Token> => {
    const contractInfo = { abi: erc20Abi, address };
    const [name, symbol, decimals] = await publicClient.multicall({
      contracts: [
        { ...contractInfo, functionName: "name" },
        { ...contractInfo, functionName: "symbol" },
        { ...contractInfo, functionName: "decimals" },
      ],
    });
    if (!name.result || !symbol.result || !decimals.result)
      throw new Error("Token not found");

    const newToken = {
      address,
      chainId: publicClient.chain.id,
      name: name.result,
      symbol: symbol.result,
      decimals: decimals.result,
    };
    addToken(newToken);
    return newToken;
  };

  const fetchTokens = async () => {
    // const response = await fetch(
    //   "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
    //   {
    //     cache: "force-cache",
    //   }
    // ).then((res) => res.json());
    // const tokens = response.tokens.map((token: Token) => ({
    //   chainId: token.chainId,
    //   symbol: token.symbol,
    //   name: token.name,
    //   address: token.address,
    //   logoURI: token.logoURI,
    //   decimals: token.decimals,
    // }));

    useTokenStore.setState({
      tokens: [...useTokenStore.getState().tokens, ...tokens],
    });
  };

  return {
    tokens,
    pairTokens,
    fetchTokens,
    findToken,
  };
};

export default useTokens;

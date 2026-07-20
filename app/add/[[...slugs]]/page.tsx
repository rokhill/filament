'use client'
import { useChainGuard } from "@/hooks/useChainGuard";

import BackButton from "@/components/back-button";
import { SettingModal } from "@/components/setting-modal";
import TokenSelector from "@/components/token-selector";
import TransactionModal from "@/components/transaction-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useAllowance from "@/hooks/useAllownace";
import useApprove from "@/hooks/useApprove";
import useContracts from "@/hooks/useContracts";
import useCurrentChain from "@/hooks/useCurrentChain";
import usePair from "@/hooks/usePair";
import useTokens from "@/hooks/useTokens";
import useWeb3Functions from "@/hooks/useWeb3Functions";
import { MAX_UINT256, formatNumber, getRouteAsPath, sortTokens } from "@/lib/utils";
import useStore from "@/store";
import useUserStore from "@/store/user-store";
import { Token } from "@/types/Token";
import { useAppKit } from "@reown/appkit/react";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useDebounce } from "react-use";
import { formatEther } from "viem";
import { useAccount, useBalance } from "wagmi";

export default function AddLiquidty() {
  useChainGuard();
    const params = useParams<{ slugs: string[] }>();
    const { isConnected, address } = useAccount();
    const { open } = useAppKit();
    const chain = useCurrentChain();
    const { routerV2Contract } = useContracts();
    const { addLiquidity } = useWeb3Functions();
    const router = useRouter();
    const [token0, setToken0] = useState<Token | undefined>(undefined);
    const [token1, setToken1] = useState<Token | undefined>(undefined);
    const [amount0, setAmount0] = useState<string>("");
    const [amount1, setAmount1] = useState<string>("");
    const [txHash, setTxHash] = useState<string | undefined>(undefined);
    const [openTxModal, setOpenTxModal] = useState(false);
    const { tokens, findToken } = useTokens();
    const { data: pair } = usePair({ token0, token1 });
    const balance0 = useBalance({ address, token: token0?.address });
    const balance1 = useBalance({ address, token: token1?.address });
    const allownace0 = useAllowance({
        address,
        token: token0,
        spender: routerV2Contract.address,
        enabled: !!token0?.address,
    });
    const allownace1 = useAllowance({
        address,
        token: token1,
        spender: routerV2Contract.address,
        enabled: !!token1?.address,
    });
    const approve0 = useApprove({
        token: token0,
        amount: MAX_UINT256,
        spender: routerV2Contract.address,
        onSuccess: () => allownace0.refetch(),
    });
    const approve1 = useApprove({
        token: token1,
        amount: MAX_UINT256,
        spender: routerV2Contract.address,
        onSuccess: () => allownace1.refetch(),
    });

    const liquidity = useMemo(() => {
        if (!amount0 || !amount1 || !pair) return 0;
        return Math.sqrt(+amount0 * +amount1);
    }, [amount0, amount1, pair]);

    const poolTokenPercentage = useMemo(
        () =>
            pair?.totalSupply
                ? (liquidity * 100) / (+formatEther(pair.totalSupply) + liquidity)
                : 100,
        [pair, liquidity]
    );

    const { loading } = useStore();

    const fetchTokens = async () => {
        const [token0, token1] = await Promise.all([
            params.slugs?.[0]
                ? findToken(params.slugs[0]).catch(() => undefined)
                : undefined,
            params.slugs?.[1]
                ? findToken(params.slugs[1]).catch(() => undefined)
                : undefined,
        ]);

        setToken0(token0 || tokens[0]);
        setToken1(token1);
    };

    useDebounce(
        () => {
            fetchTokens();

            setAmount0("");
            setAmount1("");
        },
        200,
        [params.slugs]
    );

    const onAmount0Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount0(e.target.value);

        if (!pair) return;
        if (!e.target.value) return setAmount1("");

        setAmount1((+e.target.value * pair.price).toString());
    };

    const onAmount1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount1(e.target.value);

        if (!pair) return;
        if (!e.target.value) return setAmount0("");

        setAmount0((+e.target.value / pair.price).toString());
    };

    const insufficientBalance = useMemo(
        () =>
            balance0.data && balance1.data
                ? Number(balance0.data.formatted) < +amount0 ||
                Number(balance1.data.formatted) < +amount1
                : false,
        [balance0, balance1, amount0, amount1]
    );

    const disbaledActionButton = useMemo(
        () =>
            !amount0 ||
            !amount1 ||
            !token0 ||
            !token1 ||
            insufficientBalance ||
            (token0.address &&
                allownace0.data &&
                +allownace0.data.formatted < +amount0) ||
            (token1.address &&
                allownace1.data &&
                +allownace1.data.formatted < +amount1) ||
            loading,
        [
            amount0,
            amount1,
            token0,
            token1,
            insufficientBalance,
            loading,
            allownace0,
            allownace1,
        ]
    );

    const addLiquidtyAction = async () => {
        if (!token0 || !token1 || !amount0 || !amount1) return;

        useStore.setState({ loading: true });
        setOpenTxModal(true);
        const hash = await addLiquidity([token0, token1], [amount0, amount1]);
        setTxHash(hash);

        if (hash) {
            setAmount0("");
            setAmount1("");
            const tokens = [token0, token1].sort(sortTokens);
            const key = tokens
                .map((token) => token.address || token.symbol)
                .join(":");
            useUserStore.setState((state) => ({
                pairs: {
                    [chain.id]: {
                        [key]: [tokens[0], tokens[1]],
                        ...state.pairs[chain.id],
                    },
                    ...state.pairs,
                },
            }));
        }
        useStore.setState({ loading: false });
    };
    return (
        <div className="container py-12">
            <Card className="w-full max-w-lg mx-auto border border-[rgba(112,100,233,0.24)] gap-0 shadow-[0_4px_20px_rgba(0,0,0,0.2)] bg-card p-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 -translate-1/2 w-[394px] rounded-full h-[394px] bg-[linear-gradient(90deg,#2765FF_0%,#BA2AF9_100%)] blur-[110px]"></div>
            <CardHeader className="bg-[var(--clr-gray-100)] dark:bg-[var(--clr-darker-two)] py-6 lg:text-2xl text-xl z-[1]">
              <CardTitle className="text-center font-bold text-[var(--clr-black)] dark:text-[var(--clr-heading)]">
                <div className="flex items-center justify-between gap-3">
                  <BackButton className="hover:bg-transparent border-none shadow-none dark:hover:bg-transparent" />
                  <CardTitle className="text-2xl font-semibold leading-[1.33] text-[var(--clr-black)] dark:text-[var(--clr-heading)]">Add Liquidity</CardTitle>
                  <SettingModal className={"border border-[rgba(112,100,233,0.10)] text-[var(--clr-body)] hover:bg-transparent! hover:text-[var(--clr-primary)]"} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 px-6 pt-6 pb-7.5 z-[1] bg-[#e1e3f6] dark:bg-[#080808]">
              <div className="p-4 rounded-xl bg-[var(--clr-gray-100)] dark:bg-[var(--clr-darker-two)] text-[var(--clr-body)] border-2 border-[rgba(from_var(--clr-primary)_r_g_b/.1)]">
                <p className="text-sm font-medium leading-[1.71] text-[var(--clr-body)]">
                  <strong>Tip:</strong>{" "}
                  When you add liquidity, you will receive pool tokens representing your position. These tokens automatically earn fees proportional to your share of the pool and can be redeemed at any time.
                </p>
              </div>
              <div>
                <div className="space-y-2 pb-4 px-4 pt-10 rounded-lg bg-[var(--clr-gray-100)] dark:bg-[var(--clr-darker-two)] border-2 border-[rgba(from_var(--clr-primary)_r_g_b/.1)]">
                    <div className="flex justify-end items-center gap-4">
                        <TokenSelector
                            tokenSelected={token0}
                            selectedToken={(token) =>
                                token.symbol !== token1?.symbol &&
                                router.replace(
                                    getRouteAsPath('/add/[...slugs]', {
                                        slugs: [token.address || token.symbol, token1?.address || token1?.symbol || undefined],
                                    })
                                )
                            }
                        />
                    </div>
                    <input
                        className="w-full px-0.5 py-3 text-2xl font-semibold leading-[1.16] outline-none text-[var(--clr-heading)] placeholder:text-[var(--clr-heading)] border-b border-[rgba(112,100,233,0.16)]"
                        type="number"
                        id="token0"
                        value={amount0}
                        onChange={onAmount0Change}
                        placeholder="0"
                        min={0}
                    />
                    {token0 && (
                        <div className="flex">
                            <span className="flex items-center gap-1 text-sm font-medium leading-[1.71] text-[var(--clr-body)]">
                                Balance:{" "}
                                {balance0.isFetching ? (
                                    <Loader2Icon className="animate-spin" size={14} />
                                ) : (
                                    formatNumber(balance0.data?.formatted)
                                )}
                            </span>
                        </div>
                    )}
                </div>
                <div className="relative py-2">
                  <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-center bg-card size-15 mx-auto rounded-lg">
                  <div
                    className="size-12 bg-[var(--clr-gray-100)] dark:bg-[var(--clr-darker-two)] rounded-md flex items-center justify-center"
                  >
                    <PlusIcon className="text-[var(--clr-black)] dark:text-[var(--clr-heading)]" size={20} />
                  </div>
                  </div>
                </div>
                <div className="space-y-2 pt-4 px-4 pb-10 rounded-lg bg-[var(--clr-gray-100)] dark:bg-[var(--clr-darker-two)] border-2 border-[rgba(from_var(--clr-primary)_r_g_b/.1)]">
                    <div className="flex justify-end items-center gap-4">
                        <TokenSelector
                            tokenSelected={token1}
                            selectedToken={(token) =>
                                token.symbol !== token0?.symbol &&
                                router.replace(
                                    getRouteAsPath('/add/[...slugs]', {
                                        slugs: [token0?.address || token0?.symbol || undefined, token.address || token.symbol],
                                    })
                                )
                            }
                        />
                    </div>
                    <input
                      className="w-full px-0.5 py-3 text-2xl font-semibold leading-[1.16] outline-none text-[var(--clr-heading)] placeholder:text-[var(--clr-heading)] border-b border-[rgba(112,100,233,0.16)]"
                      type="number"
                      id="token1"
                      value={amount1}
                      onChange={onAmount1Change}
                      placeholder="0"
                      min={0}
                    />
                    {token1 && (
                        <div className="flex">
                            <span className="flex items-center gap-1 text-sm font-medium leading-[1.71] text-[var(--clr-body)]">
                                Balance:{" "}
                                {balance1.isFetching ? (
                                    <Loader2Icon className="animate-spin" size={14} />
                                ) : (
                                    formatNumber(balance1.data?.formatted)
                                )}
                            </span>
                        </div>
                    )}
                </div>
              </div>

              {amount0 && amount1 && token0 && token1 && (
                  <div className="p-4 space-y-4 border bg-muted rounded-xl">
                      <p className="font-semibold">
                          Initial Prices and Pool Share
                      </p>
                      <hr />
                      <div className="grid gap-6 lg:grid-cols-3">
                          <div className="space-y-3 font-semibold text-center">
                              <p>
                                  {+amount0 === 0 ? 0 : formatNumber(+amount1 / +amount0)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                  {token1.symbol} per {token0.symbol}
                              </p>
                          </div>
                          <div className="space-y-3 font-semibold text-center">
                              <p>
                                  {+amount1 === 0 ? 0 : formatNumber(+amount0 / +amount1)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                  {token0.symbol} per {token1.symbol}
                              </p>
                          </div>
                          <div className="space-y-3 font-semibold text-center">
                              <p>{poolTokenPercentage.toLocaleString()}%</p>
                              <p className="text-sm text-muted-foreground">
                                  Share of Pool
                              </p>
                          </div>
                      </div>
                  </div>
              )}

              {isConnected ? (
                  <div>
                      <div className="flex items-center gap-4">
                          {token0 &&
                              allownace0.data &&
                              +allownace0.data.formatted < +amount0 && (
                                  <Button
                                      className="w-full h-12 mb-6"
                                      disabled={approve0.isPending}
                                      onClick={() => approve0.mutate()}
                                  >
                                      {approve0.isPending && (
                                          <Loader2Icon className="mr-2 animate-spin" size={16} />
                                      )}
                                      Approve {token0.symbol}
                                  </Button>
                              )}
                          {token1 &&
                              allownace1.data &&
                              +allownace1.data.formatted < +amount1 && (
                                  <Button
                                      className="w-full h-12 mb-6"
                                      disabled={approve1.isPending}
                                      onClick={() => approve1.mutate()}
                                  >
                                      {approve1.isPending && (
                                          <Loader2Icon className="mr-2 animate-spin" size={16} />
                                      )}
                                      Approve {token1.symbol}
                                  </Button>
                              )}
                      </div>
                      <Button
                          className="!w-full h-12 py-6 btn-default"
                          disabled={disbaledActionButton}
                          onClick={() => addLiquidtyAction()}
                      >
                          {loading && (
                              <Loader2Icon className="mr-2 animate-spin" size={16} />
                          )}
                          {insufficientBalance ? "Insufficient Balance" : "Supply"}
                      </Button>
                  </div>
              ) : (
                  <Button className="w-full btn-default h-12 py-6" onClick={() => open()}>
                      Connect Wallet
                  </Button>
              )}
            </CardContent>
            </Card>
            <TransactionModal
                open={openTxModal}
                txHash={txHash}
                setOpen={setOpenTxModal}
            />
        </div>
    );
}

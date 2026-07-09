'use client'
import { useState } from "react";
import useFunctions from "../hooks/useWeb3Functions";
import TokenSelectorModal from "./token-selector-modal";
import { Token } from "../types/Token";
import useCurrentChain from "../hooks/useCurrentChain";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import TokenAvatar from "./token-avatar";
type Props = {
  tokenSelected: Token | undefined;
  selectedToken: (token: Token) => void;
  showMetaMaskImport?: boolean;
  disabled?: boolean;
  className?: string;
};

const TokenSelector = ({
  tokenSelected,
  selectedToken,
  disabled,
  showMetaMaskImport,
  className,
}: Props) => {
  const chain = useCurrentChain();
  const { addTokenAsset } = useFunctions();
  const [isOpenModal, setIsOpenModal] = useState(false);

  const toggleTokenModal = () => {
    setIsOpenModal(!isOpenModal);
  };

  const sendSelectedToken = (token: Token) => {
    setIsOpenModal(false);
    selectedToken(token);
    setTimeout(() => {
      setIsOpenModal(false);
    }, 100);
  };

  return (
    <>
      <Button
        className={cn(
          "swap__currency-btn h-auto text-sm gap-2 justify-between border border-input rounded-xl",
          className
        )}
        variant={"secondary"}
        onClick={() => !disabled && toggleTokenModal()}
      >
        {tokenSelected ? (
          <div className="flex flex-wrap items-center gap-2">
            <TokenAvatar token={tokenSelected} size={24} />

            <span>{tokenSelected.symbol}</span>
          </div>
        ) : (
          <p className="text-sm">Select a token</p>
        )}

        {!disabled && (
          <i className="fa-regular fa-angle-down"></i>
        )}
      </Button>

      {showMetaMaskImport &&
        tokenSelected &&
        chain.nativeCurrency.symbol !== tokenSelected?.symbol && (
          <img
            src="/images/metamask.svg"
            className="h-5 cursor-pointer"
            alt="Import token to metamask"
            title="Import token to metamask"
            onClick={() => addTokenAsset(tokenSelected)}
          />
        )}
      <TokenSelectorModal
        open={isOpenModal}
        setOpen={setIsOpenModal}
        selectedToken={(token) => sendSelectedToken(token)}
      />
    </>
  );
};

export default TokenSelector;

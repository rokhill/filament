/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React from "react";
import useForge from "@/hooks/useForge";
import { useEffect, useMemo, useRef, useState } from "react";
import { Token } from "../types/Token";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Loader2Icon, SearchIcon } from "lucide-react";
import useTokens from "@/hooks/useTokens";
import { isAddress } from "viem";
import { useDebounce } from "react-use";
import TokenAvatar from "./token-avatar";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedToken: (token: Token) => void;
};

const TokenSelectorModal = ({ open, setOpen, selectedToken }: Props) => {
  const { tokens, findToken } = useTokens();
  const { fetchCoins } = useForge();
  const [graduatedAddrs, setGraduatedAddrs] = React.useState<Set<string>>(new Set());
  React.useEffect(() => { fetchCoins().then(coins => setGraduatedAddrs(new Set(coins.filter(c=>c.graduated).map(c=>c.address.toLowerCase())))).catch(()=>{}); }, []);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);

  const filteredTokens = useMemo(
    () =>
      tokens.filter(
        (token) =>
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.address?.toLowerCase() === searchQuery.toLowerCase() ||
          !searchQuery
      ),
    [tokens, searchQuery]
  );

  useDebounce(
    () => {
      if (isAddress(searchQuery)) {
        setLoading(true);
        findToken(searchQuery as `0x${string}`).catch(() => null);
        setLoading(false);
      }
    },
    200,
    [searchQuery]
  );

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedSpeed, setSelectedSpeed] = useState("Fast");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const speedOptions = ["Fast", "Medium", "Slow"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^0-9.]/g, "");
    // setInputValue(numericValue);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 pb-6 sm:max-w-lg bg-[var(--clr-gray-100)] dark:bg-[var(--clr-blackest)] border-0 overflow-hidden top-8 translate-y-0 lg:top-1/2 lg:-translate-y-1/2">
        <div className="w-44 h-28 bg-[var(--clr-primary)] absolute bottom-full left-1/2 -translate-x-1/2 filter blur-[140px]"></div>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-[var(--clr-darker-two)] dark:text-[var(--clr-heading)] text-lg font-semibold">
            Select a token
          </DialogTitle>
          <DialogDescription className="hidden">
            Select a token to swap
          </DialogDescription>
        </DialogHeader>
        <div className="relative mx-6">
          <Input
            type="text"
            className="w-full h-12 pl-12 placeholder:!text-[#9a9a9a]"
            style={{ background: "#ffffff", backgroundImage: "none", color: "#111111", border: "1px solid rgba(255,140,30,0.45)", borderRadius: 10 }}
            placeholder="Search name or paste address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchIcon
            className="absolute -translate-y-1/2 top-1/2 left-4 text-muted-foreground"
            size={20}
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-16">
              <Loader2Icon className="animate-spin" size={28} />
            </div>
          ) : filteredTokens.length > 0 ? (
            filteredTokens.map((token, index) => {

              const isWlcai = token.symbol === "WLCAI";
              const isForge = !!token.address && !graduatedAddrs.has(token.address.toLowerCase()) && token.symbol !== "LCAI" && !isWlcai;
              return (<button
                    key={index}
                    className="flex items-center w-full px-6 py-3 gap-x-4 hover:bg-[rgba(from_var(--clr-primary)_r_g_b/.08)] transition-all duration-300 disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => !disabled && selectedToken(token)}
                    disabled={disabled}
                  >
                    <TokenAvatar token={token} size={50} />
                    <p className="flex flex-col items-start font-medium flex-1">
                      <span className="text-[var(--clr-darker-two)] dark:text-[var(--clr-heading)] font-semibold">
                        {token.name}
                        {isWlcai && <span className="ml-2 text-xs font-normal" style={{color:"var(--ae-nebula)"}}>· same as LCAI, wrapped</span>}
                      </span>
                      <span className="text-[rgba(from_var(--clr-body)_r_g_b/0.8)] text-sm font-semibold">
                        {token.symbol}{" "}
                        {token.address && <span>{token.address.slice(0,6)}...{token.address.slice(-4)}</span>}
                      </span>
                    </p>
                    {isForge && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{background:"rgba(255,140,30,.15)",color:"var(--ae-aurum)"}}>🔥 Trade on Forge</span>
                    )}
              </button>);
            ))
          ) : (
            <div className="flex items-center justify-center w-full h-16 px-6">
              <p className="text-xl font-medium break-all">
                No tokens found with the name{" "}
                <span className="font-bold">{searchQuery}</span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelectorModal;

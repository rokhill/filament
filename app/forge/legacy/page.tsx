"use client";

// ⚠️ TEMPORARY PAGE — delete once all legacy positions are recovered
// Old Forge: 0x17b48A0070DC048E81f7104a1bA65F937BbD8D94

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import { toast } from "sonner";
import useWeb3Clients from "@/hooks/useWeb3Clients";


const OLD_FORGE = "0x17b48A0070DC048E81f7104a1bA65F937BbD8D94" as `0x${string}`;

// All tokens ever launched on the old Forge — add any missing ones here
const OLD_TOKENS: { address: `0x${string}`; name: string; symbol: string }[] = [
  { address: "0xFF171cbF37Bd9bb9253965704218A1fbC65859C2", name: "SmokeTest", symbol: "SMOKE" },
  { address: "0xE0025336b2a45961B9885Ab4B82A57fa3005Cb76", name: "The Black Dog (old)", symbol: "BDOG" },
  { address: "0xD7655d822c4AF13e40d75a20f0E3aa5dDacc9305", name: "Token 3", symbol: "???" },
  { address: "0xde56296349Ff8433Bb19377fe6b4E9AE5FCdfa60", name: "Token 4", symbol: "???" },
  { address: "0xB9a1Be2031cF4F85496feFCBAF5d512bf1462359", name: "Token 5", symbol: "???" },
];

type Position = {
  address: `0x${string}`;
  name: string;
  symbol: string;
  balance: bigint;
  approving: boolean;
  selling: boolean;
  approved: boolean;
};

export default function LegacyRecoveryPage() {
  const { address } = useAccount();
  const { publicClient, walletClient } = useWeb3Clients();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    if (!address || !publicClient) return;
    setLoading(true);
    const found: Position[] = [];
    const minAbi = [
      { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
      { type: "function", name: "allowance", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
      { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
      { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
    ] as const;
    for (const tok of OLD_TOKENS) {
      try {
        const [balance, allowance, name, symbol] = await Promise.all([
          publicClient.readContract({ address: tok.address, abi: minAbi, functionName: "balanceOf", args: [address] }),
          publicClient.readContract({ address: tok.address, abi: minAbi, functionName: "allowance", args: [address, OLD_FORGE] }),
          publicClient.readContract({ address: tok.address, abi: minAbi, functionName: "name" }).catch(() => tok.name),
          publicClient.readContract({ address: tok.address, abi: minAbi, functionName: "symbol" }).catch(() => tok.symbol),
        ]);
        if ((balance as bigint) > 0n) {
          found.push({
            ...tok,
            name: name as string,
            symbol: symbol as string,
            balance: balance as bigint,
            approving: false,
            selling: false,
            approved: (allowance as bigint) >= (balance as bigint),
          });
        }
      } catch (e) {
        console.warn("scan failed for", tok.address, e);
      }
    }
    setPositions(found);
    setLoading(false);
    if (found.length === 0) toast.info("No legacy positions found in this wallet.");
  };

  useEffect(() => { if (address) scan(); }, [address]);

  const approve = async (pos: Position) => {
    if (!walletClient || !address) { toast.error("Connect wallet"); return; }
    setPositions(p => p.map(x => x.address === pos.address ? { ...x, approving: true } : x));
    try {
      const approveAbi = [{ type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }] as const;
      const hash = await walletClient.writeContract({ account: address, address: pos.address, abi: approveAbi, functionName: "approve", args: [OLD_FORGE, pos.balance] });
      toast.loading("Approving…", { id: hash });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Approved", { id: hash });
      setPositions(p => p.map(x => x.address === pos.address ? { ...x, approved: true, approving: false } : x));
    } catch (e: any) {
      toast.error(e?.shortMessage ?? "Approve failed");
      setPositions(p => p.map(x => x.address === pos.address ? { ...x, approving: false } : x));
    }
  };

  const sell = async (pos: Position) => {
    if (!walletClient || !address) { toast.error("Connect wallet"); return; }
    setPositions(p => p.map(x => x.address === pos.address ? { ...x, selling: true } : x));
    try {
      const sellAbi = [{ type: "function", name: "sell", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }, { name: "tokenAmount", type: "uint256" }, { name: "minLcaiOut", type: "uint256" }], outputs: [] }] as const;
      const hash = await walletClient.writeContract({ account: address, address: OLD_FORGE, abi: sellAbi, functionName: "sell", args: [pos.address, pos.balance, 0n] });
      toast.loading("Selling back…", { id: hash });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success(`Recovered LCAI from ${pos.symbol}`, { id: hash });
      setPositions(p => p.filter(x => x.address !== pos.address));
    } catch (e: any) {
      toast.error(e?.shortMessage ?? "Sell failed");
      setPositions(p => p.map(x => x.address === pos.address ? { ...x, selling: false } : x));
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-10 min-h-[70vh]">
      <div
        className="rounded-2xl p-4 mb-6 text-sm"
        style={{ background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.3)", color: "var(--clr-danger)" }}
      >
        ⚠️ <strong>Legacy Forge Recovery</strong> — This page is temporary. The Forge has been upgraded to a more secure contract. If you hold tokens from the old contract, sell them back here to recover your LCAI.
      </div>

      {!address ? (
        <p className="text-center py-16 text-sm" style={{ color: "var(--ae-nebula)" }}>
          Connect your wallet to scan for legacy positions.
        </p>
      ) : loading ? (
        <p className="text-center py-16 text-sm" style={{ color: "var(--ae-nebula)" }}>
          Scanning old contract…
        </p>
      ) : positions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg mb-2" style={{ color: "var(--clr-heading)" }}>No legacy positions found.</p>
          <p className="text-sm" style={{ color: "var(--ae-nebula)" }}>Your wallet has no holdings on the old Forge contract.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm mb-4" style={{ color: "var(--ae-nebula)" }}>
            Found {positions.length} legacy position{positions.length !== 1 ? "s" : ""}. Approve then sell each one to recover your LCAI.
          </p>
          {positions.map(pos => (
            <div
              key={pos.address}
              className="rounded-2xl p-5"
              style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)" }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold" style={{ color: "var(--clr-heading)" }}>
                    {pos.name} <span className="text-xs" style={{ color: "var(--ae-nebula)" }}>${pos.symbol}</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--ae-nebula)" }}>
                    Balance: {Number(formatEther(pos.balance)).toLocaleString(undefined, { maximumFractionDigits: 0 })} tokens
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: "rgba(248,113,113,.12)", color: "var(--clr-danger)" }}
                >
                  OLD CONTRACT
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{
                    background: pos.approved ? "var(--ae-veil)" : "var(--ae-aurum)",
                    color: pos.approved ? "var(--ae-nebula)" : "var(--ae-ink)",
                  }}
                  disabled={pos.approved || pos.approving}
                  onClick={() => approve(pos)}
                >
                  {pos.approving ? "Approving…" : pos.approved ? "✓ Approved" : "Approve"}
                </button>
                <button
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: "var(--clr-danger)", color: "#fff" }}
                  disabled={!pos.approved || pos.selling}
                  onClick={() => sell(pos)}
                >
                  {pos.selling ? "Selling…" : "Sell Back"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="w-full mt-6 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ background: "var(--ae-veil)", color: "var(--ae-nebula)" }}
        onClick={scan}
        disabled={loading}
      >
        {loading ? "Scanning…" : "Re-scan wallet"}
      </button>

      <p className="text-center text-xs mt-6" style={{ color: "var(--ae-nebula)" }}>
        Old Forge: {OLD_FORGE}
      </p>
    </main>
  );
}

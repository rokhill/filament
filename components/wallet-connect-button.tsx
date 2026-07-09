"use client";

import { cn } from "@/lib/utils";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { HTMLAttributes } from "react";

export default function WalletConnectButton({ className, ...props }: HTMLAttributes<HTMLButtonElement>) {
    const { open } = useAppKit();
    const { address } = useAccount();

    return <button
        type="button"
        className={cn("btn-default text-uppercase", className)}
        {...props}
        onClick={() => open()}
    >
        <i className="fa-solid fa-wallet"></i>
        <span className="pl-3 inline-block">
            {address ? address.slice(0, 6) + "..." + address.slice(-4) : "Connect Wallet"}
        </span>
    </button>;
}
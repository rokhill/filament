'use client'
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import useUserStore from "@/store/user-store";
import { DialogClose } from "@radix-ui/react-dialog";
import { SettingsIcon, X } from "lucide-react";
import type { JSX } from "react";

const slippageToleranceOptions = [0.1, 0.5, 1];

type Props = {
  trigger?: JSX.Element;
  className?: string;
};

export function SettingModal({ trigger, className }: Props) {
  const { slippageTolerance, txDeadline, bestPriceRouting } = useUserStore();
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button className={cn("text-primary bg-transparent hover:bg-[var(--ae-haze)]", className)} size={"icon"}>
            <SettingsIcon size={20} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="gap-4 max-w-[min(400px,calc(100vw-2rem))] border border-[rgba(255,140,30,0.3)] rounded-2xl p-6"
        style={{ background: "var(--ae-night)" }} hideCloseButton>
        <DialogClose className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "var(--ae-haze)", color: "var(--ae-nebula)" }}>
          <X size={14} />
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}>
            Settings
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5">
          {/* Slippage */}
          <div>
            <Label className="block mb-3 text-sm font-semibold" style={{ color: "var(--ae-nebula)" }}>
              Slippage Tolerance
            </Label>
            <div className="flex flex-wrap gap-2">
              {slippageToleranceOptions.map((option) => (
                <button key={option}
                  onClick={() => useUserStore.setState({ slippageTolerance: option })}
                  className="h-9 px-4 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: slippageTolerance === option ? "linear-gradient(180deg,#ffaa32,#e07a12)" : "var(--ae-haze)",
                    color: slippageTolerance === option ? "#140d05" : "var(--clr-heading)",
                    border: slippageTolerance === option ? "none" : "1px solid var(--clr-border)",
                  }}>
                  {option}%
                </button>
              ))}
              <input
                className="h-9 w-16 text-sm text-center rounded-xl outline-none"
                style={{ background: slippageToleranceOptions.includes(slippageTolerance) ? "var(--ae-haze)" : "linear-gradient(180deg,#ffaa32,#e07a12)", color: slippageToleranceOptions.includes(slippageTolerance) ? "var(--ae-nebula)" : "#140d05", border: "1px solid var(--clr-border)", fontWeight: 600 }}
                placeholder="Custom"
                value={slippageToleranceOptions.includes(slippageTolerance) ? "" : slippageTolerance}
                type="number"
                step={0.1}
                min={0.1}
                max={50}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) useUserStore.setState({ slippageTolerance: v }); }}
              />
            </div>
            {slippageTolerance < 0.5 && (
              <p className="mt-2 text-xs" style={{ color: "var(--clr-warning)" }}>⚠️ Your transaction may fail</p>
            )}
          </div>
          {/* Best-price routing */}
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-semibold" style={{ color: "var(--ae-nebula)" }}>
              Best-price routing
            </Label>
            <button
              onClick={() => useUserStore.setState({ bestPriceRouting: !bestPriceRouting })}
              className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: bestPriceRouting ? "linear-gradient(180deg,#ffaa32,#e07a12)" : "var(--ae-haze)", border: "1px solid var(--clr-border)" }}>
              <span className="absolute top-1 transition-all w-4 h-4 rounded-full bg-white"
                style={{ left: bestPriceRouting ? "calc(100% - 20px)" : "3px" }} />
            </button>
          </div>
          {/* Tx deadline */}
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-semibold" style={{ color: "var(--ae-nebula)" }}>
              Tx deadline (mins)
            </Label>
            <Input
              type="number"
              className="w-16 h-9 text-sm text-center rounded-xl border flex-shrink-0"
              style={{ background: "var(--ae-haze)", borderColor: "var(--clr-border)", color: "var(--clr-heading)" }}
              min={2}
              value={txDeadline}
              onChange={(e) => useUserStore.setState({ txDeadline: Number(e.target.value) })}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

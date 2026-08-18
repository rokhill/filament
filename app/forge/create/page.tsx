"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parseEther } from "viem";
import { toast } from "sonner";
import useForge, { fmtLcai } from "@/hooks/useForge";
import { useChainGuard } from "@/hooks/useChainGuard";
import { encodeMetadata } from "@/config/forge";

export default function CreateCoinPage() {
  useChainGuard();
  const router = useRouter();
  const { createCoin, getCreationFee } = useForge();
  const [fee, setFee] = useState<bigint>(0n);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [initialBuy, setInitialBuy] = useState("");
  const [busy, setBusy] = useState(false);
  const [dupWarning, setDupWarning] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getCreationFee().then(setFee).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const field = "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-shadow focus:shadow-[var(--shadow-input)]";
  const fieldStyle = { background: "var(--ae-night)", border: "1px solid var(--clr-border)", color: "var(--clr-heading)" } as const;

  const submit = async () => {
    if (!name.trim() || !symbol.trim()) { toast.error("Name and symbol are required"); return; }
    setBusy(true);
    const uri = encodeMetadata({ description, image, twitter, telegram, website });
    const token = await createCoin(name.trim(), symbol.trim().toUpperCase(), uri, initialBuy);
    setBusy(false);
    if (token) {
      toast.success("Coin forged!");
      router.push(`/forge/${token}`);
    }
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-10 min-h-[80vh]">
      <button onClick={() => router.back()} className="text-sm mb-6 hover:opacity-80 transition-opacity" style={{ color: "var(--ae-nebula)" }}>
        ← Back to Forge
      </button>
      <h1 className="f-display text-3xl sm:text-4xl mb-1">Forge a coin</h1>
      <p className="text-xs mb-6" style={{ color: "var(--ae-nebula)" }}>
        Fair launch on the bonding curve. Only name and symbol are required —
        everything else is optional. Sell out the curve and it lists on
        Filament automatically with liquidity burned forever.
      </p>
      <div className="space-y-3">
        {dupWarning && <p className="text-xs mt-1" style={{ color: "var(--clr-warning)" }}>⚠️ A coin with this name already exists. Users should verify contract addresses, not names.</p>}
        <input className={field} style={fieldStyle} placeholder="Name — required (e.g. Photon Pup)" maxLength={64} value={name} onChange={(e) => { setName(e.target.value); setDupWarning(false); }} onBlur={async () => { const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL||""; if (!name.trim() || !INDEXER) return; const rows = await fetch(`${INDEXER}/api/v1/forge/coins?limit=200`).then(r=>r.json()).catch(()=>[]); setDupWarning((rows as any[]).some((c:any) => c.name?.toLowerCase() === name.trim().toLowerCase())); }} />
        <input className={field} style={fieldStyle} placeholder="Symbol — required (e.g. PPUP)" maxLength={16} value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        <textarea className={field} style={fieldStyle} placeholder="Description (optional, but coins with stories sell)" rows={3} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div>
          <label
            className="flex flex-col items-center justify-center w-full rounded-xl cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: "var(--ae-veil)", border: "2px dashed var(--clr-border)", minHeight: 96, color: "var(--ae-nebula)" }}
          >
            {uploading ? (
              <span className="text-sm font-semibold" style={{ color: "var(--ae-aurum)" }}>Uploading…</span>
            ) : image ? (
              <div className="flex flex-col items-center gap-2 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="preview" className="rounded-xl object-cover" style={{ width: 72, height: 72, background: "var(--ae-veil)" }} onError={() => setImage("")} />
                <span className="text-xs" style={{ color: "var(--ae-nebula)" }}>Tap to change image</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 py-4">
                <span className="text-3xl">🖼️</span>
                <span className="text-sm font-semibold" style={{ color: "var(--clr-heading)" }}>Upload coin image</span>
                <span className="text-xs">PNG or JPG up to 10MB — optional but recommended</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB"); return; }
              setUploading(true);
              try {
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", body: fd });
                const json = await res.json();
                if (json.gatewayUrl) { setImage(json.gatewayUrl); toast.success("Image uploaded!"); }
                else throw new Error(json.error ?? "Upload failed");
              } catch (err: any) {
                toast.error(err.message ?? "Upload failed — paste an image URL instead");
              } finally { setUploading(false); }
            }} />
          </label>
          <input
            className={field}
            style={{ ...fieldStyle, marginTop: 8, fontSize: 12 }}
            placeholder="Or paste an image URL (https:// or ipfs://)"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={field} style={fieldStyle} placeholder="Twitter/X (optional)" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
          <input className={field} style={fieldStyle} placeholder="Telegram (optional)" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
        </div>
        <input className={field} style={fieldStyle} placeholder="Website (optional)" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <div style={{ background: "rgba(227,179,65,0.07)", border: "1px solid rgba(227,179,65,0.35)", borderRadius: "14px", padding: "14px", marginTop: "4px" }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ background: "var(--ae-aurum)", color: "#14100a", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 8px", borderRadius: "999px" }}>Creator Buy</span>
            <span style={{ fontSize: "11px", color: "var(--ae-aurum)", fontWeight: 600 }}>Highly recommended</span>
          </div>
          <input className={field} style={{ ...fieldStyle, border: "1px solid rgba(227,179,65,0.30)", background: "var(--ae-night)" }} placeholder="Amount in LCAI (e.g. 500)" inputMode="decimal" value={initialBuy} onChange={(e) => setInitialBuy(e.target.value.replace(/[^0-9.]/g, ""))} />
          <p className="text-[11px] mt-2" style={{ color: "var(--ae-nebula)", lineHeight: 1.5 }}>
            Your buy happens in the <strong style={{ color: "var(--ae-starlight)" }}>same transaction as creation</strong> — so nobody can front-run you. Early buyers get the lowest price. As creator, this is your best (and only) guaranteed first entry.
          </p>
          <div className="mt-3 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: "var(--ae-night)", border: "1px solid rgba(255,140,30,0.4)", color: "var(--clr-heading)" }}>
            <div className="flex justify-between items-center">
              <span>Creation fee</span>
              <span>{fmtLcai(fee, 0)} LCAI</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span>Initial buy</span>
              <span>{Number(initialBuy) > 0 ? `${initialBuy} LCAI` : "—"}</span>
            </div>
            <div className="flex justify-between items-center mt-1 pt-1" style={{ borderTop: "1px solid rgba(255,140,30,0.2)" }}>
              <span style={{ color: "var(--ae-aurum)" }}>Total</span>
              <span style={{ color: "var(--ae-aurum-bright)" }}>
                {fmtLcai(fee + (Number(initialBuy) > 0 ? parseEther(initialBuy) : 0n), 0)} LCAI
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-80" style={{ background: "var(--ae-veil)", color: "var(--clr-heading)" }} onClick={() => router.back()} disabled={busy}>
          Cancel
        </button>
        <button className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: "var(--ae-aurum)", color: "var(--ae-ink)" }} onClick={submit} disabled={busy}>
          {busy ? "Forging…" : `Forge it · ${fmtLcai(fee + (Number(initialBuy) > 0 ? parseEther(initialBuy) : 0n), 0)} LCAI`}
        </button>
      </div>
    </main>
  );
}

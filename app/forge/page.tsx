"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import useForge, { ForgeCoin, fmtLcai } from "@/hooks/useForge";
import { encodeMetadata, ipfsToHttp, shortAddr } from "@/config/forge";
import ProgressBar from "@/components/forge/progress-bar";

/* ------------------------------------------------------------------ */
/*  Shared bits                                                        */
/* ------------------------------------------------------------------ */

function CoinImage({ coin, size = 64 }: { coin: ForgeCoin; size?: number }) {
  const [err, setErr] = useState(false);
  const src = ipfsToHttp(coin.metadata.image);
  if (!src || err) {
    return (
      <div
        className="flex items-center justify-center rounded-xl font-bold"
        style={{
          width: size,
          height: size,
          background: "var(--ae-veil)",
          color: "var(--ae-aurum)",
          fontSize: size / 2.5,
          fontFamily: "var(--font-display), serif",
        }}
      >
        {coin.symbol.slice(0, 2)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={coin.symbol}
      width={size}
      height={size}
      onError={() => setErr(true)}
      className="rounded-xl object-cover"
      style={{ width: size, height: size, background: "var(--ae-veil)" }}
    />
  );
}


/* ------------------------------------------------------------------ */
/*  Coin card                                                          */
/* ------------------------------------------------------------------ */

function CoinCard({ coin }: { coin: ForgeCoin }) {
  return (
    <Link
      href={`/forge/${coin.address}`}
      className="block rounded-2xl p-4 transition-all hover:-translate-y-0.5"
      style={{
        background: "var(--ae-haze)",
        border: "1px solid var(--clr-border)",
      }}
    >
      <div className="flex gap-3 items-start">
        <CoinImage coin={coin} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="font-semibold truncate"
              style={{ color: "var(--clr-heading)" }}
            >
              {coin.name}
            </span>
            <span className="text-xs" style={{ color: "var(--ae-nebula)" }}>
              ${coin.symbol}
            </span>
          </div>
          <p
            className="text-xs mt-1 line-clamp-2"
            style={{ color: "var(--ae-nebula)" }}
          >
            {coin.metadata.description || "No description"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        {coin.graduated ? (
          <div
            className="text-xs font-semibold rounded-full px-3 py-1.5 text-center"
            style={{ background: "rgba(74,222,128,.12)", color: "var(--clr-success)" }}
          >
            Graduated — trading on Filament
          </div>
        ) : (
          <>
            <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--ae-nebula)" }}>
              <span>{(coin.progressBps / 100).toFixed(1)}% to graduation</span>
              <span>{fmtLcai(coin.lcaiRaised, 0)} LCAI raised</span>
            </div>
            <ProgressBar bps={coin.progressBps} />
          </>
        )}
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  King of the hill                                                   */
/* ------------------------------------------------------------------ */

function KingOfTheHill({ coin }: { coin: ForgeCoin }) {
  return (
    <Link
      href={`/forge/${coin.address}`}
      className="block rounded-2xl p-5 mb-8 transition-all hover:-translate-y-0.5"
      style={{
        background: "linear-gradient(135deg, var(--ae-haze), var(--ae-veil))",
        border: "1px solid var(--ae-aurum)",
        boxShadow: "var(--shadow-primary)",
      }}
    >
      <div
        className="text-xs font-semibold tracking-widest uppercase mb-3"
        style={{ color: "var(--ae-aurum)" }}
      >
        ✦ King of the Hill
      </div>
      <div className="flex gap-4 items-center flex-wrap">
        <CoinImage coin={coin} size={72} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="text-xl font-semibold"
              style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}
            >
              {coin.name}
            </span>
            <span style={{ color: "var(--ae-nebula)" }}>${coin.symbol}</span>
          </div>
          <div className="mt-2">
            <ProgressBar bps={coin.progressBps} tall />
            <div className="flex justify-between text-xs mt-1.5" style={{ color: "var(--ae-nebula)" }}>
              <span>{(coin.progressBps / 100).toFixed(1)}% to graduation</span>
              <span>{fmtLcai(coin.lcaiRaised, 0)} LCAI raised</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Create modal                                                       */
/* ------------------------------------------------------------------ */

function CreateModal({
  fee,
  onClose,
  onCreated,
}: {
  fee: bigint;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { createCoin } = useForge();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [initialBuy, setInitialBuy] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !symbol.trim()) {
      toast.error("Name and symbol are required");
      return;
    }
    setBusy(true);
    const uri = encodeMetadata({ description, image, twitter, telegram, website });
    const token = await createCoin(name.trim(), symbol.trim().toUpperCase(), uri, initialBuy);
    setBusy(false);
    if (token) {
      onCreated();
      onClose();
    }
  };

  const field =
    "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-shadow focus:shadow-[var(--shadow-input)]";
  const fieldStyle = {
    background: "var(--ae-night)",
    border: "1px solid var(--clr-border)",
    color: "var(--clr-heading)",
  } as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,14,26,.8)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl mb-1"
          style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}
        >
          Forge a coin
        </h2>
        <p className="text-xs mb-5" style={{ color: "var(--ae-nebula)" }}>
          Fair launch on the bonding curve. Sell out the curve and it lists on
          Filament automatically with liquidity burned forever.
        </p>

        <div className="space-y-3">
          <input className={field} style={fieldStyle} placeholder="Name (e.g. Photon Pup)" maxLength={64} value={name} onChange={(e) => setName(e.target.value)} />
          <input className={field} style={fieldStyle} placeholder="Symbol (e.g. PPUP)" maxLength={16} value={symbol} onChange={(e) => setSymbol(e.target.value)} />
          <textarea className={field} style={fieldStyle} placeholder="Description" rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className={field} style={fieldStyle} placeholder="Image URL (https:// or ipfs://)" value={image} onChange={(e) => setImage(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className={field} style={fieldStyle} placeholder="Twitter/X" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
            <input className={field} style={fieldStyle} placeholder="Telegram" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
          </div>
          <input className={field} style={fieldStyle} placeholder="Website (optional)" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <div>
            <input
              className={field}
              style={fieldStyle}
              placeholder="Initial buy in LCAI (optional, anti-snipe)"
              inputMode="decimal"
              value={initialBuy}
              onChange={(e) => setInitialBuy(e.target.value.replace(/[^0-9.]/g, ""))}
            />
            <p className="text-[11px] mt-1.5" style={{ color: "var(--ae-nebula)" }}>
              Buying in the same transaction as creation means nobody can snipe
              your launch. Creation fee: {fmtLcai(fee, 0)} LCAI.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--ae-veil)", color: "var(--clr-heading)" }}
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--ae-aurum)", color: "var(--ae-ink)" }}
            onClick={submit}
            disabled={busy}
          >
            {busy ? "Forging…" : "Forge it"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

type Filter = "all" | "live" | "graduated";

export default function ForgePage() {
  const { fetchCoins, getCreationFee } = useForge();
  const [coins, setCoins] = useState<ForgeCoin[] | null>(null);
  const [fee, setFee] = useState<bigint>(0n);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const load = async () => {
    try {
      const [c, f] = await Promise.all([fetchCoins(), getCreationFee()]);
      setCoins(c);
      setFee(f);
    } catch {
      setCoins([]);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const king = useMemo(() => {
    if (!coins) return null;
    const live = coins.filter((c) => !c.graduated && c.progressBps > 0);
    if (!live.length) return null;
    return live.reduce((a, b) => (b.progressBps > a.progressBps ? b : a));
  }, [coins]);

  const visible = useMemo(() => {
    if (!coins) return [];
    let v = coins;
    if (filter === "live") v = v.filter((c) => !c.graduated);
    if (filter === "graduated") v = v.filter((c) => c.graduated);
    if (query.trim()) {
      const q = query.toLowerCase();
      v = v.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q) ||
          c.address.toLowerCase() === q
      );
    }
    return v;
  }, [coins, filter, query]);

  const tab = (f: Filter, label: string) => (
    <button
      key={f}
      onClick={() => setFilter(f)}
      className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
      style={
        filter === f
          ? { background: "var(--ae-aurum)", color: "var(--ae-ink)" }
          : { background: "var(--ae-veil)", color: "var(--ae-nebula)" }
      }
    >
      {label}
    </button>
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 min-h-[70vh]">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-2">
        <div>
          <h1
            className="text-3xl"
            style={{ color: "var(--clr-heading)", fontFamily: "var(--font-display), serif" }}
          >
            The Forge
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--ae-nebula)" }}>
            Fair-launch memecoins on LightChain AI. Sell out the curve, list on
            Filament — liquidity burned, forever.
          </p>
        </div>
        <button
          className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: "var(--ae-aurum)", color: "var(--ae-ink)", boxShadow: "var(--shadow-primary)" }}
          onClick={() => setShowCreate(true)}
        >
          + Forge a coin
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap my-6">
        {tab("all", "All")}
        {tab("live", "On the curve")}
        {tab("graduated", "Graduated")}
        <input
          className="ml-auto rounded-full px-4 py-1.5 text-xs outline-none w-52 focus:shadow-[var(--shadow-input)]"
          style={{ background: "var(--ae-haze)", border: "1px solid var(--clr-border)", color: "var(--clr-heading)" }}
          placeholder="Search name, symbol, address"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {king && !query && filter === "all" && <KingOfTheHill coin={king} />}

      {coins === null ? (
        <div className="py-24 text-center text-sm" style={{ color: "var(--ae-nebula)" }}>
          Reading the chain…
        </div>
      ) : visible.length === 0 ? (
        <div className="py-24 text-center" style={{ color: "var(--ae-nebula)" }}>
          <p className="text-lg mb-2" style={{ color: "var(--clr-heading)" }}>
            Nothing here yet.
          </p>
          <p className="text-sm">Be the first — forge a coin and light it up.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((c) => (
            <CoinCard key={c.address} coin={c} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModal fee={fee} onClose={() => setShowCreate(false)} onCreated={load} />
      )}
    </main>
  );
}

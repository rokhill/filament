import Link from "next/link";

export const metadata = {
  title: "Guides — Filament",
  description: "Learn how to use Filament — swapping, providing liquidity, launching memecoins on the Forge, and more.",
};

const GUIDES = [
  {
    href: "/guide",
    title: "Using Filament",
    desc: "How swapping works, what WLCAI is, how to connect your wallet, and everything you need to get started on the Exchange.",
    eyebrow: "Exchange",
  },
  {
    href: "/forge/guide",
    title: "How the Forge Works",
    desc: "Fair-launch memecoins, the bonding curve, how graduation works, why the LP is burned forever, and how creators can build a project around their coin.",
    eyebrow: "Forge",
  },
  {
    href: "/pools/guide",
    title: "How Pools Work",
    desc: "Provide liquidity to earn a share of every swap fee. Covers how to add and remove liquidity, what you earn, and the risk of impermanent loss.",
    eyebrow: "Pools",
  },
];

export default function GuidesPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 min-h-[70vh]">
      <div className="f-eyebrow mb-2">Learn</div>
      <h1 className="f-display text-3xl sm:text-4xl">Guides</h1>
      <p className="f-body text-sm mt-3 mb-10">
        Everything you need to use Filament confidently — from your first swap to launching a coin.
      </p>

      <div className="space-y-4">
        {GUIDES.map((g) => (
          <Link key={g.href} href={g.href} className="f-card f-card--link block p-6">
            <div className="f-eyebrow mb-1">{g.eyebrow}</div>
            <div className="f-display text-lg mb-2">{g.title}</div>
            <p className="f-body text-sm leading-relaxed">{g.desc}</p>
            <div className="mt-3 text-sm font-semibold" style={{ color: "var(--ft-gold)" }}>
              Read guide →
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

// Font Awesome
import "../public/css/plugins/fontawesome-all.min.css";

// SCSS Styles
import "../public/scss/style.scss";

// Filament design system (must load last)
import "./aether-theme.css";

import { Fraunces, Instrument_Sans } from "next/font/google";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import { cn } from "@/lib/utils";
import BootSplash from "@/components/boot-splash";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer2";


export const metadata: Metadata = {
  title: "Filament — DEX & Memecoin Launchpad on LightChain AI",
  description:
    "Filament is a non-custodial DEX and memecoin launchpad on LightChain AI. Swap tokens, provide liquidity, and fair-launch coins that auto-list with burned liquidity.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Filament",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/brand/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Filament — DEX & Memecoin Launchpad",
    description:
      "Non-custodial DEX and fair-launch memecoin launchpad on LightChain AI mainnet.",
    images: ["/brand/bulb-icon.png"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#060608",
};

const bodyFont = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const cookies = headersList.get("cookie");

  return (
    <html lang="en" suppressHydrationWarning style={{ background: "#050506" }}>
      <head>
        {/* Kill the white PWA launch flash: paint black before any CSS loads */}
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { background: #050506 !important; }
          html.light, html.light body { background: #f7f5f0 !important; }
        ` }} />
        {/* iOS launch screens — a full-bleed bulb on black */}
        <link rel="apple-touch-startup-image" href="/brand/splash-1290x2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/brand/splash-1179x2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/brand/splash-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/brand/splash-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/brand/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/brand/splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/brand/splash-1536x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
      </head>
      <body className={cn("antialiased", bodyFont.variable, display.variable)} style={{ background: "#050506" }}>
        {/* Instant black canvas painted on first frame — covers the PWA white flash
            until React mounts the animated BootSplash on top. */}
        <div id="pre-boot" style={{ position: "fixed", inset: 0, background: "#050506", zIndex: 9998, pointerEvents: "none" }} />
        <script dangerouslySetInnerHTML={{ __html: `(function(){var p=document.getElementById('pre-boot');if(p){requestAnimationFrame(function(){requestAnimationFrame(function(){p.remove();});});}})();` }} />
        <BootSplash />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ContextProvider cookies={cookies}>
            <main className="flex flex-col min-h-dvh">
              <Header />
              <div className="flex-1 ae-sky">
                {children}
              </div>
              <Footer />
            </main>
          </ContextProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}

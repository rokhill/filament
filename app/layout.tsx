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
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer2";


export const metadata: Metadata = {
  title: "Filament — DEX & Memecoin Launchpad on LightChain AI",
  description:
    "Filament is a non-custodial DEX and memecoin launchpad on LightChain AI. Swap tokens, provide liquidity, and fair-launch coins that auto-list with burned liquidity.",
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
    <html lang="en" suppressHydrationWarning>
      <body className={cn("antialiased", bodyFont.variable, display.variable)}>
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

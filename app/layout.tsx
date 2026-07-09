// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

// Font Awesome
import "../public/css/plugins/fontawesome-all.min.css";

// SCSS Styles
import "../public/scss/style.scss";

// Filament design system (must load last)
import "./aether-theme.css";

import { headers } from "next/headers";
import ContextProvider from "@/context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Instrument_Sans, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer2";

export const metadata: Metadata = {
  title: "Filament",
  description:
    "Filament — a non-custodial AMM on the LightChain AI network. Swap tokens and provide liquidity, settled entirely on-chain.",
};

const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" });
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
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
      <body className={cn("antialiased", body.className, body.variable, display.variable, mono.variable)}>
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

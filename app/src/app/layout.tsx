import type { Metadata } from "next";
import "./globals.css";
import Logo from "@/components/Logo";
import WalletProvider from "@/components/WalletProvider";
import ActivityProvider from "@/components/ActivityProvider";
import NavMenu from "@/components/NavMenu";

export const metadata: Metadata = {
  title: "ClawBets — Prediction Markets for AI Agents",
  description:
    "AI agents create markets, place bets, and build on-chain reputation through prediction accuracy on Solana.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <WalletProvider>
        <ActivityProvider>
        <div className="min-h-screen flex flex-col">
          {/* Nav */}
          <NavMenu />

          {/* Main */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t border-[#1a1a2e]/40 px-6 py-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <Logo size={18} />
                <span>ClawBets — Prediction markets for AI agents</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Powered by Solana</span>
                <span>•</span>
                <a
                  href="https://colosseum.com/agent-hackathon"
                  className="text-violet-400/60 hover:text-violet-400 transition"
                >
                  Colosseum Agent Hackathon
                </a>
              </div>
            </div>
          </footer>
        </div>
        </ActivityProvider>
        </WalletProvider>
      </body>
    </html>
  );
}

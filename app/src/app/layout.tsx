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
          <footer className="border-t border-[#1a1a2e]/40 px-6 py-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
              {/* Brand */}
              <div className="flex items-center gap-2">
                <Logo size={18} />
                <span>ClawBets — Prediction markets for AI agents</span>
              </div>

              {/* Social links */}
              <div className="flex items-center gap-1">
                {[
                  {
                    label: "X (Twitter)", href: "https://x.com/clawbets",
                    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
                  },
                  {
                    label: "Telegram", href: "https://t.me/clawbets",
                    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.7 8.01c-.13.59-.47.73-.95.46l-2.62-1.93-1.26 1.22c-.14.14-.26.26-.53.26l.19-2.66 4.83-4.36c.21-.19-.05-.29-.32-.1L7.9 14.49l-2.57-.8c-.56-.17-.57-.56.12-.83l10.03-3.87c.46-.17.87.11.16.81z" /></svg>,
                  },
                  {
                    label: "Discord", href: "https://discord.gg/clawbets",
                    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.908 19.908 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>,
                  },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener"
                    aria-label={s.label}
                    className="p-1.5 rounded-md text-zinc-600 hover:text-[#06b6d4] transition-colors"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>

              {/* Right side */}
              <div className="flex items-center gap-4">
                <span>Powered by Solana</span>
                <span>•</span>
                <a
                  href="https://colosseum.com/agent-hackathon"
                  className="text-[#06b6d4]/60 hover:text-[#06b6d4] transition"
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

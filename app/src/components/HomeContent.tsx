"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Market, Protocol } from "@/lib/api";
import MarketCard from "@/components/MarketCard";
import StatsCard from "@/components/StatsCard";
import { usePolling } from "@/hooks/usePolling";
import { ChartIcon, CircleDotIcon, CoinsIcon, BotIcon } from "@/components/icons";
import ActivityFeed from "@/components/ActivityFeed";
import { useActivity } from "@/components/ActivityProvider";
import { API_BASE } from "@/lib/api";

const PLACEHOLDER_CA = "CLAWBet5xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

function TokenBanner() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(PLACEHOLDER_CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 rounded-xl bg-[#06b6d4]/5 border border-[#06b6d4]/20"
    >
      {/* Left: token info */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {/* pump.fun badge */}
        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/25 text-[10px] font-semibold text-[#10b981] tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          Live on pump.fun
        </span>

        {/* Token name + blue check */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-white">$CLAW</span>
          {/* Blue verified check */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <circle cx="12" cy="12" r="12" fill="#1d9bf0" />
            <path d="M9.5 16.5L5.5 12.5L6.91 11.08L9.5 13.67L17.09 6.08L18.5 7.5L9.5 16.5Z" fill="white" />
          </svg>
        </div>

        {/* Contract address */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-zinc-500 text-xs hidden sm:inline">CA:</span>
          <code className="text-xs text-zinc-400 font-mono truncate max-w-[120px] sm:max-w-[200px]">
            {PLACEHOLDER_CA}
          </code>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all border border-white/10"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy CA
            </>
          )}
        </button>
        <a
          href="https://pump.fun"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#06b6d4] to-[#10b981] text-[#050507] hover:opacity-90 transition-opacity"
        >
          Buy on pump.fun ↗
        </a>
      </div>
    </motion.div>
  );
}

function LastUpdated({ timestamp }: { timestamp: number | null }) {
  const [, setTick] = useState(0);
  // Re-render every 5s to update relative time
  useState(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  });
  if (!timestamp) return null;
  const secs = Math.round((Date.now() - timestamp) / 1000);
  const label = secs < 5 ? "just now" : `${secs}s ago`;
  return (
    <span className="text-[10px] text-zinc-600 font-normal ml-3 tabular-nums">
      Updated {label}
    </span>
  );
}

export default function HomeContent() {
  const [filter, setFilter] = useState<string>("all");

  const { data: marketsData, error: marketsError, loading: marketsLoading, lastUpdated, dataVersion } = usePolling<{ markets: Market[]; count: number }>({
    fetcher: useCallback(() => fetch(`${API_BASE}/markets`).then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }), []),
    interval: 8000,
  });

  const { data: protocol } = usePolling<Protocol>({
    fetcher: useCallback(() => fetch(`${API_BASE}/protocol`).then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }), []),
    interval: 8000,
  });

  const markets = marketsData?.markets ?? [];
  const filteredMarkets = markets.filter((m) => {
    if (filter === "all") return true;
    return m.status === filter;
  });

  const { activities: activityItems, loading: activityLoading } = useActivity();
  const openMarkets = markets.filter((m) => m.status === "open").length;
  const totalBettors = markets.reduce((acc, m) => acc + m.yesCount + m.noCount, 0);

  if (marketsLoading && !marketsData) {
    return (
      <div className="mesh-bg">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center py-24 text-zinc-600">
            <div className="inline-flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#06b6d4]/30 border-t-[#06b6d4] rounded-full animate-spin" />
              Loading markets...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mesh-bg">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/15 text-[11px] text-[#06b6d4] font-medium tracking-wide mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            LIVE ON SOLANA DEVNET
            <LastUpdated timestamp={lastUpdated} />
          </div>
          <TokenBanner />
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
            Prediction Markets
            <br />
            for{" "}
            <span className="gradient-text">AI Agents</span>
          </h2>
          <p className="text-zinc-500 text-lg max-w-xl leading-relaxed">
            Agents create markets, stake SOL on outcomes, and build verifiable
            on-chain reputation. No humans in the loop.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          key={`stats-${dataVersion}`}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
        >
          <StatsCard icon={<ChartIcon />} label="Total Markets" value={protocol?.marketCount ?? "—"} accent="cyan" />
          <StatsCard icon={<CircleDotIcon />} label="Open Markets" value={openMarkets} accent="violet" />
          <StatsCard icon={<CoinsIcon />} label="Total Volume" value={protocol ? `${protocol.totalVolumeSol.toFixed(2)} SOL` : "—"} accent="pink" />
          <StatsCard icon={<BotIcon />} label="Total Bets" value={totalBettors} accent="gold" />
        </motion.div>

        {/* Main content + Activity sidebar */}
        <div className="flex gap-6">
          {/* Left: Markets */}
          <div className="flex-1 min-w-0">
            {/* Filters */}
            <div className="flex items-center gap-1.5 mb-8">
              {["all", "open", "closed", "resolved"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    filter === f
                      ? "bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/25"
                      : "bg-transparent text-zinc-500 border border-transparent hover:text-zinc-300 hover:bg-white/[0.03]"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Markets Grid */}
            {marketsError && !marketsData ? (
              <div className="text-center py-24">
                <div className="inline-flex flex-col items-center gap-3 bg-[#0f0f18] border border-rose-500/15 rounded-2xl p-8">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">✕</div>
                  <p className="text-rose-400 text-sm">{marketsError}</p>
                </div>
              </div>
            ) : filteredMarkets.length === 0 ? (
              <div className="text-center py-24 text-zinc-600">
                <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center mb-3 mx-auto">
                  <ChartIcon className="w-5 h-5 text-zinc-600" />
                </div>
                <p className="text-sm">No markets found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMarkets.map((market, i) => (
                  <MarketCard key={market.publicKey} market={market} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Activity Feed (desktop only) */}
          <div className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-20">
              <ActivityFeed activities={activityItems} loading={activityLoading} />
            </div>
          </div>
        </div>

        {/* Activity Feed (mobile) */}
        <div className="lg:hidden mt-8">
          <ActivityFeed activities={activityItems} loading={activityLoading} />
        </div>
      </div>
    </div>
  );
}

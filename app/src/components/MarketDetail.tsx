"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Market, Bet, API_BASE } from "@/lib/api";
import {
  truncateAddress,
  formatTimestamp,
  timeUntil,
  getStatusBadgeColor,
} from "@/lib/utils";
import Link from "next/link";
import PlaceBet from "./PlaceBet";
import { usePolling } from "@/hooks/usePolling";

interface OptimisticBet {
  id: string;
  bettor: string;
  position: string;
  amountSol: number;
  confirming: boolean;
}

function LastUpdated({ timestamp }: { timestamp: number | null }) {
  const [, setTick] = useState(0);
  useState(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  });
  if (!timestamp) return null;
  const secs = Math.round((Date.now() - timestamp) / 1000);
  const label = secs < 5 ? "just now" : `${secs}s ago`;
  return (
    <span className="text-[10px] text-zinc-600 ml-2 tabular-nums">
      Updated {label}
    </span>
  );
}

export default function MarketDetail({ marketId }: { marketId: number }) {
  const [optimisticBets, setOptimisticBets] = useState<OptimisticBet[]>([]);

  const { data: market, loading: marketLoading, lastUpdated, refetch: refetchMarket, dataVersion } = usePolling<Market>({
    fetcher: useCallback(() => fetch(`${API_BASE}/markets/${marketId}`).then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }), [marketId]),
    interval: 30000,
  });

  const { data: betsData, refetch: refetchBets } = usePolling<{ bets: Bet[]; count: number }>({
    fetcher: useCallback(() => fetch(`${API_BASE}/bets/market/${marketId}`).then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }), [marketId]),
    interval: 30000,
  });

  const bets = betsData?.bets ?? [];

  const handleBetPlaced = useCallback((bettor: string, position: boolean, amount: number) => {
    // Add optimistic bet
    const optBet: OptimisticBet = {
      id: `opt-${Date.now()}`,
      bettor,
      position: position ? "YES" : "NO",
      amountSol: amount,
      confirming: true,
    };
    setOptimisticBets((prev) => [optBet, ...prev]);

    // Refetch after short delay to get confirmed data
    setTimeout(() => {
      refetchMarket();
      refetchBets();
    }, 2000);

    // Clear optimistic bet after refetch
    setTimeout(() => {
      setOptimisticBets((prev) => prev.filter((b) => b.id !== optBet.id));
      refetchMarket();
      refetchBets();
    }, 6000);
  }, [refetchMarket, refetchBets]);

  if (marketLoading && !market) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center text-zinc-600">
        <div className="inline-flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          Loading market...
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <p className="text-rose-400 mb-4">Market not found</p>
        <Link href="/" className="text-violet-400 hover:underline text-sm">← Back to markets</Link>
      </div>
    );
  }

  const totalPool = market.totalYesSol + market.totalNoSol;
  const yesPercent = totalPool > 0 ? (market.totalYesSol / totalPool) * 100 : 50;

  return (
    <div className="mesh-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-violet-400 transition mb-8 group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Back to markets
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#0f0f18] border border-[#1a1a2e] rounded-2xl p-7 mb-5"
        >
          <div className="flex items-start justify-between mb-5 gap-4">
            <h2 className="text-2xl font-bold tracking-tight">{market.title}</h2>
            <div className="flex items-center gap-2 shrink-0">
              <LastUpdated timestamp={lastUpdated} />
              <span className={`text-[10px] px-3 py-1.5 rounded-full border font-medium tracking-wide ${getStatusBadgeColor(market.status)}`}>
                {market.status.toUpperCase()}
              </span>
            </div>
          </div>
          <p className="text-zinc-500 mb-7 leading-relaxed">{market.description}</p>

          <motion.div
            key={`odds-${dataVersion}`}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-7"
          >
            <div className="flex justify-between mb-2.5">
              <div>
                <span className="text-emerald-400 text-3xl font-bold tracking-tight">{yesPercent.toFixed(1)}%</span>
                <span className="text-emerald-400/50 text-sm ml-2 font-medium">YES</span>
              </div>
              <div className="text-right">
                <span className="text-rose-400 text-3xl font-bold tracking-tight">{(100 - yesPercent).toFixed(1)}%</span>
                <span className="text-rose-400/50 text-sm ml-2 font-medium">NO</span>
              </div>
            </div>
            <div className="h-3 rounded-full bg-rose-500/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500" style={{ width: `${yesPercent}%` }} />
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Pool", value: `${totalPool.toFixed(3)} SOL`, color: "" },
              { label: "YES Pool", value: `${market.totalYesSol.toFixed(3)} SOL`, sub: `${market.yesCount} bettors`, color: "text-emerald-400" },
              { label: "NO Pool", value: `${market.totalNoSol.toFixed(3)} SOL`, sub: `${market.noCount} bettors`, color: "text-rose-400" },
              { label: market.status === "open" ? "Ends in" : "Ended", value: timeUntil(market.deadline), color: "" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0a0a10] rounded-xl p-3.5 border border-[#1a1a2e]/40">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                {"sub" in stat && stat.sub && <p className="text-[10px] text-zinc-600 mt-0.5">{stat.sub}</p>}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-[#1a1a2e]/40 grid grid-cols-2 gap-3 text-[13px]">
            <div><span className="text-zinc-600">Target </span><span className="font-medium">Price {market.targetAbove ? "above" : "below"} {market.targetPrice}</span></div>
            <div><span className="text-zinc-600">Feed </span><span className="font-mono text-[11px]">{market.feedId?.slice(0, 14)}...</span></div>
            <div><span className="text-zinc-600">Min Bet </span><span>{(market.minBet / 1e9).toFixed(2)} SOL</span></div>
            <div><span className="text-zinc-600">Max Bet </span><span>{(market.maxBet / 1e9).toFixed(2)} SOL</span></div>
            <div><span className="text-zinc-600">Created </span><span>{formatTimestamp(market.createdAt)}</span></div>
            <div><span className="text-zinc-600">Creator </span><span className="font-mono text-[11px]">{truncateAddress(market.creator, 6)}</span></div>
          </div>

          {market.status === "resolved" && (
            <div className="mt-5 p-4 rounded-xl bg-violet-500/8 border border-violet-500/15">
              <p className="text-violet-400 font-semibold mb-1">✓ Resolved: {market.outcome ? "YES" : "NO"} wins</p>
              <p className="text-[13px] text-zinc-500">Oracle price: {market.resolvedPrice} • {market.resolvedAt && formatTimestamp(market.resolvedAt)}</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-5"
        >
          <PlaceBet market={market} onBetPlaced={handleBetPlaced} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-[#0f0f18] border border-[#1a1a2e] rounded-2xl p-7"
        >
          <h3 className="text-base font-semibold mb-5">Bets <span className="text-zinc-600 font-normal ml-1.5">{bets.length + optimisticBets.length}</span></h3>
          {bets.length === 0 && optimisticBets.length === 0 ? (
            <p className="text-zinc-600 text-center py-10 text-sm">No bets placed yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-zinc-600 text-[10px] uppercase tracking-widest border-b border-[#1a1a2e]/60">
                    <th className="text-left py-3 px-3 font-medium">Agent</th>
                    <th className="text-left py-3 px-3 font-medium">Position</th>
                    <th className="text-right py-3 px-3 font-medium">Amount</th>
                    <th className="text-left py-3 px-3 font-medium">Status</th>
                    <th className="text-left py-3 px-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {optimisticBets.map((bet) => (
                    <tr key={bet.id} className="border-b border-[#1a1a2e]/30 bg-violet-500/[0.03]">
                      <td className="py-3.5 px-3 font-mono text-[11px] text-zinc-400">{truncateAddress(bet.bettor, 6)}</td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${bet.position === "YES" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-rose-500/10 text-rose-400 border border-rose-500/15"}`}>{bet.position}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold">{bet.amountSol.toFixed(3)} SOL</td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1.5 text-violet-400 text-[11px]">
                          <span className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                          Confirming...
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[11px] text-zinc-600">just now</td>
                    </tr>
                  ))}
                  {bets.map((bet) => (
                    <tr key={bet.publicKey} className="border-b border-[#1a1a2e]/30 hover:bg-white/[0.015] transition">
                      <td className="py-3.5 px-3 font-mono text-[11px] text-zinc-400">{truncateAddress(bet.bettor, 6)}</td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${bet.position === "YES" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-rose-500/10 text-rose-400 border border-rose-500/15"}`}>{bet.position}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold">{bet.amountSol.toFixed(3)} SOL</td>
                      <td className="py-3.5 px-3">{bet.claimed ? <span className="text-violet-400 text-[11px]">Claimed</span> : <span className="text-zinc-600 text-[11px]">Pending</span>}</td>
                      <td className="py-3.5 px-3 text-[11px] text-zinc-600">{formatTimestamp(bet.placedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

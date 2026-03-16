"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Market } from "@/lib/api";
import idl from "@/lib/clawbets-idl.json";

const PROGRAM_ID = new PublicKey("8bob8yfaWXatYCtz6drEYD6og6mfVZ47ZdnxfvRmVgCH");

export default function PlaceBet({ market, onBetPlaced }: { market: Market; onBetPlaced?: (bettor: string, position: boolean, amount: number) => void }) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [position, setPosition] = useState<boolean>(true);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handlePlaceBet = useCallback(async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) return;
    const solAmount = parseFloat(amount);
    if (isNaN(solAmount) || solAmount <= 0) {
      setResult({ type: "error", msg: "Enter a valid amount" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const walletAdapter = {
        publicKey,
        signTransaction,
        signAllTransactions,
      };
      const provider = new AnchorProvider(connection, walletAdapter as any, {
        commitment: "confirmed",
      });
      const program = new Program(idl as any, provider);

      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), new BN(market.marketId).toArrayLike(Buffer, "le", 8)],
        PROGRAM_ID
      );
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), marketPda.toBuffer()],
        PROGRAM_ID
      );
      const [betPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), marketPda.toBuffer(), publicKey.toBuffer()],
        PROGRAM_ID
      );
      const [reputationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), publicKey.toBuffer()],
        PROGRAM_ID
      );
      const [protocolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("protocol")],
        PROGRAM_ID
      );

      const lamports = new BN(Math.round(solAmount * 1e9));

      const tx = await program.methods
        .placeBet(lamports, position)
        .accounts({
          bettor: publicKey,
          market: marketPda,
          bet: betPda,
          vault: vaultPda,
          reputation: reputationPda,
          protocol: protocolPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setResult({ type: "success", msg: `Bet placed! Tx: ${tx.slice(0, 16)}...` });
      onBetPlaced?.(publicKey.toBase58(), position, solAmount);
      setAmount("");
    } catch (err: any) {
      console.error("Place bet error:", err);
      setResult({ type: "error", msg: err.message?.slice(0, 120) || "Transaction failed" });
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, signAllTransactions, connection, market.marketId, position, amount]);

  if (!publicKey) {
    return (
      <div className="bg-[#0f0f18] border border-[#1a1a2e] rounded-2xl p-7 text-center">
        <p className="text-zinc-500 text-sm">Connect your wallet to place a bet</p>
      </div>
    );
  }

  if (market.status !== "open") {
    return null;
  }

  return (
    <div className="bg-[#0f0f18] border border-[#1a1a2e] rounded-2xl p-7">
      <h3 className="text-base font-semibold mb-5">Place a Bet</h3>

      {/* Position Toggle */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => setPosition(true)}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
            position
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-[#0a0a10] border-[#1a1a2e]/40 text-zinc-500 hover:text-zinc-300 hover:border-[#1a1a2e]"
          }`}
        >
          YES
        </button>
        <button
          onClick={() => setPosition(false)}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
            !position
              ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
              : "bg-[#0a0a10] border-[#1a1a2e]/40 text-zinc-500 hover:text-zinc-300 hover:border-[#1a1a2e]"
          }`}
        >
          NO
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-5">
        <label className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2 block">
          Amount (SOL)
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0a0a10] border border-[#1a1a2e]/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-violet-500/40 transition"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600">
            SOL
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          {[0.1, 0.5, 1, 5].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              className="px-3 py-1 rounded-lg bg-[#0a0a10] border border-[#1a1a2e]/40 text-[11px] text-zinc-500 hover:text-zinc-300 hover:border-[#1a1a2e] transition"
            >
              {v} SOL
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handlePlaceBet}
        disabled={loading || !amount}
        className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
          position
            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
            : "bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400"
        } text-white disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Placing bet...
          </span>
        ) : (
          `Bet ${position ? "YES" : "NO"} — ${amount || "0"} SOL`
        )}
      </button>

      {/* Feedback */}
      {result && (
        <div
          className={`mt-4 p-4 rounded-xl text-[13px] border ${
            result.type === "success"
              ? "bg-emerald-500/8 border-emerald-500/15 text-emerald-400"
              : "bg-rose-500/8 border-rose-500/15 text-rose-400"
          }`}
        >
          {result.type === "success" ? "✓ " : "✗ "}
          {result.msg}
        </div>
      )}
    </div>
  );
}

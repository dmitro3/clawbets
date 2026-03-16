import { Router, Request, Response } from "express";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { z } from "zod";
import {
  getProgram,
  getMarketPda,
  getVaultPda,
  getBetPda,
  getReputationPda,
  getProtocolPda,
  getProgramId,
} from "../services/solana";

export const betsRouter = Router();

const placeBetSchema = z.object({
  marketId: z.number().int().nonnegative(),
  amount: z.number().positive(), // In SOL
  position: z.boolean(), // true = YES, false = NO
});

// GET /api/bets/market/:marketId - List bets for a market
betsRouter.get("/market/:marketId", async (req: Request, res: Response) => {
  try {
    const marketId = parseInt(req.params.marketId as string);
    if (isNaN(marketId)) {
      res.status(400).json({ error: "Invalid market ID" });
      return;
    }

    const program = getProgram();
    const [marketPda] = getMarketPda(marketId);

    // Fetch all bets filtering by market
    const bets = await (program.account as any).bet.all([
      {
        memcmp: {
          offset: 8 + 32, // after discriminator + bettor pubkey
          bytes: marketPda.toBase58(),
        },
      },
    ]);

    const formatted = bets.map((b) => ({
      publicKey: b.publicKey.toBase58(),
      bettor: b.account.bettor.toBase58(),
      market: b.account.market.toBase58(),
      amount: b.account.amount.toNumber(),
      amountSol: b.account.amount.toNumber() / 1e9,
      position: b.account.position ? "YES" : "NO",
      claimed: b.account.claimed,
      placedAt: b.account.placedAt.toNumber(),
    }));

    res.json({ bets: formatted, count: formatted.length });
  } catch (err: any) {
    console.error("Error listing bets:", err.message);
    res.json({ bets: [], count: 0 });
  }
});

// GET /api/bets/agent/:pubkey - List bets by agent
betsRouter.get("/agent/:pubkey", async (req: Request, res: Response) => {
  try {
    const agentPubkey = new PublicKey(req.params.pubkey as string);
    const program = getProgram();

    const bets = await (program.account as any).bet.all([
      {
        memcmp: {
          offset: 8, // after discriminator
          bytes: agentPubkey.toBase58(),
        },
      },
    ]);

    const formatted = bets.map((b) => ({
      publicKey: b.publicKey.toBase58(),
      bettor: b.account.bettor.toBase58(),
      market: b.account.market.toBase58(),
      amount: b.account.amount.toNumber(),
      amountSol: b.account.amount.toNumber() / 1e9,
      position: b.account.position ? "YES" : "NO",
      claimed: b.account.claimed,
      placedAt: b.account.placedAt.toNumber(),
    }));

    res.json({ bets: formatted, count: formatted.length });
  } catch (err: any) {
    console.error("Error listing agent bets:", err.message);
    res.json({ bets: [], count: 0 });
  }
});

// POST /api/bets - Place a bet (executed by admin wallet for demo)
betsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = placeBetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.errors,
      });
      return;
    }

    const { marketId, amount, position } = parsed.data;

    const program = getProgram();
    const [marketPda] = getMarketPda(marketId);
    const [vaultPda] = getVaultPda(marketPda);
    const [protocolPda] = getProtocolPda();

    const bettorKey = program.provider.publicKey!;
    const [betPda] = getBetPda(marketPda, bettorKey);
    const [reputationPda] = getReputationPda(bettorKey);

    const tx = await program.methods
      .placeBet(new anchor.BN(Math.floor(amount * 1e9)), position)
      .accounts({
        bettor: bettorKey,
        market: marketPda,
        bet: betPda,
        vault: vaultPda,
        reputation: reputationPda,
        protocol: protocolPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    res.json({
      success: true,
      transaction: tx,
      betPda: betPda.toBase58(),
      position: position ? "YES" : "NO",
      amountSol: amount,
    });
  } catch (err: any) {
    console.error("Error placing bet:", err.message);
    res.status(500).json({ error: err.message || "Failed to place bet" });
  }
});

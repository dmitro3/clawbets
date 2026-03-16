import { Router, Request, Response } from "express";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { z } from "zod";
import {
  getProgram,
  getProtocolPda,
  getMarketPda,
  getVaultPda,
  getReputationPda,
  getProgramId,
  getConnection,
} from "../services/solana";

export const marketsRouter = Router();

// Validation schemas
const createMarketSchema = z.object({
  title: z.string().min(3).max(128),
  description: z.string().min(1).max(512),
  oracleFeed: z.string(), // Pyth oracle feed pubkey
  targetPrice: z.number().int(), // Price in oracle format
  targetAbove: z.boolean(),
  deadline: z.number().int().positive(), // Unix timestamp
  resolutionDeadline: z.number().int().positive(),
  minBet: z.number().positive(), // In SOL
  maxBet: z.number().positive(), // In SOL
});

// GET /api/markets - List all markets
marketsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const program = getProgram();
    const markets = await (program.account as any).market.all();

    if (!markets || markets.length === 0) {
      res.json({ markets: [], count: 0 });
      return;
    }

    const formatted = markets.map((m) => ({
      publicKey: m.publicKey.toBase58(),
      marketId: m.account.marketId.toNumber(),
      creator: m.account.creator.toBase58(),
      title: m.account.title,
      description: m.account.description,
      oracleFeed: m.account.oracleFeed.toBase58(),
      targetPrice: m.account.targetPrice.toNumber(),
      targetAbove: m.account.targetAbove,
      deadline: m.account.deadline.toNumber(),
      resolutionDeadline: m.account.resolutionDeadline.toNumber(),
      minBet: m.account.minBet.toNumber(),
      maxBet: m.account.maxBet.toNumber(),
      totalYes: m.account.totalYes.toNumber(),
      totalNo: m.account.totalNo.toNumber(),
      totalYesSol: m.account.totalYes.toNumber() / 1e9,
      totalNoSol: m.account.totalNo.toNumber() / 1e9,
      yesCount: m.account.yesCount,
      noCount: m.account.noCount,
      status: Object.keys(m.account.status)[0],
      outcome: m.account.outcome,
      resolvedPrice: m.account.resolvedPrice
        ? m.account.resolvedPrice.toNumber()
        : null,
      resolvedAt: m.account.resolvedAt
        ? m.account.resolvedAt.toNumber()
        : null,
      createdAt: m.account.createdAt.toNumber(),
    }));

    // Sort by creation time, newest first
    formatted.sort((a, b) => b.createdAt - a.createdAt);

    res.json({ markets: formatted, count: formatted.length });
  } catch (err: any) {
    console.error("Error listing markets:", err.message);
    // Program not deployed yet — return empty list
    res.json({ markets: [], count: 0 });
  }
});

// GET /api/markets/:id - Get market by ID
marketsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const marketId = parseInt(req.params.id as string);
    if (isNaN(marketId)) {
      res.status(400).json({ error: "Invalid market ID" });
      return;
    }

    const program = getProgram();
    const [marketPda] = getMarketPda(marketId);
    const [vaultPda] = getVaultPda(marketPda);

    const market = await (program.account as any).market.fetch(marketPda);
    const vaultBalance = await getConnection().getBalance(vaultPda);

    res.json({
      publicKey: marketPda.toBase58(),
      vault: vaultPda.toBase58(),
      vaultBalance: vaultBalance,
      vaultBalanceSol: vaultBalance / 1e9,
      marketId: market.marketId.toNumber(),
      creator: market.creator.toBase58(),
      title: market.title,
      description: market.description,
      oracleFeed: market.oracleFeed.toBase58(),
      targetPrice: market.targetPrice.toNumber(),
      targetAbove: market.targetAbove,
      deadline: market.deadline.toNumber(),
      resolutionDeadline: market.resolutionDeadline.toNumber(),
      minBet: market.minBet.toNumber(),
      maxBet: market.maxBet.toNumber(),
      totalYes: market.totalYes.toNumber(),
      totalNo: market.totalNo.toNumber(),
      totalYesSol: market.totalYes.toNumber() / 1e9,
      totalNoSol: market.totalNo.toNumber() / 1e9,
      yesCount: market.yesCount,
      noCount: market.noCount,
      status: Object.keys(market.status)[0],
      outcome: market.outcome,
      resolvedPrice: market.resolvedPrice
        ? market.resolvedPrice.toNumber()
        : null,
      resolvedAt: market.resolvedAt ? market.resolvedAt.toNumber() : null,
      createdAt: market.createdAt.toNumber(),
      yesOdds: market.totalYes.toNumber() + market.totalNo.toNumber() > 0
        ? (market.totalNo.toNumber() / (market.totalYes.toNumber() + market.totalNo.toNumber()) * 100).toFixed(1)
        : "50.0",
      noOdds: market.totalYes.toNumber() + market.totalNo.toNumber() > 0
        ? (market.totalYes.toNumber() / (market.totalYes.toNumber() + market.totalNo.toNumber()) * 100).toFixed(1)
        : "50.0",
    });
  } catch (err: any) {
    console.error("Error fetching market:", err.message);
    res.status(404).json({ error: "Market not found" });
  }
});

// POST /api/markets - Create a new market (returns unsigned transaction)
marketsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createMarketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.errors,
      });
      return;
    }

    const { title, description, oracleFeed, targetPrice, targetAbove, deadline, resolutionDeadline, minBet, maxBet } = parsed.data;

    const program = getProgram();
    const [protocolPda] = getProtocolPda();
    const protocol = await (program.account as any).protocol.fetch(protocolPda);
    const marketId = protocol.marketCount.toNumber();

    const [marketPda] = getMarketPda(marketId);
    const [vaultPda] = getVaultPda(marketPda);

    // Return the instruction data so the agent can sign with their own wallet
    const oracleFeedPubkey = new PublicKey(oracleFeed);

    // We build and return the transaction for the agent to sign
    const creatorKey = req.body.creator ? new PublicKey(req.body.creator) : program.provider.publicKey!;
    const [reputationPda] = getReputationPda(creatorKey);

    const tx = await program.methods
      .createMarket(
        title,
        description,
        oracleFeedPubkey,
        new anchor.BN(targetPrice),
        targetAbove,
        new anchor.BN(deadline),
        new anchor.BN(resolutionDeadline),
        new anchor.BN(Math.floor(minBet * 1e9)),
        new anchor.BN(Math.floor(maxBet * 1e9))
      )
      .accounts({
        creator: creatorKey,
        protocol: protocolPda,
        market: marketPda,
        vault: vaultPda,
        reputation: reputationPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    res.json({
      success: true,
      transaction: tx,
      marketId,
      marketPda: marketPda.toBase58(),
      vaultPda: vaultPda.toBase58(),
    });
  } catch (err: any) {
    console.error("Error creating market:", err.message);
    res.status(500).json({ error: err.message || "Failed to create market" });
  }
});

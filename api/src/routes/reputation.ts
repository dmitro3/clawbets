import { Router, Request, Response } from "express";
import { PublicKey } from "@solana/web3.js";
import { getProgram, getReputationPda, getProgramId } from "../services/solana";
import { getCached, setCache } from "../cache";

export const reputationRouter = Router();

// GET /api/reputation/:pubkey - Get agent reputation
reputationRouter.get("/:pubkey", async (req: Request, res: Response) => {
  try {
    const agentPubkey = new PublicKey(req.params.pubkey as string);
    const program = getProgram();
    const [reputationPda] = getReputationPda(agentPubkey);

    const rep = await (program.account as any).agentReputation.fetch(reputationPda);

    res.json({
      agent: rep.agent.toBase58(),
      totalBets: rep.totalBets,
      wins: rep.wins,
      losses: rep.losses,
      accuracy: rep.accuracyBps / 100, // Convert bps to percentage
      accuracyBps: rep.accuracyBps,
      totalWagered: rep.totalWagered.toNumber(),
      totalWageredSol: rep.totalWagered.toNumber() / 1e9,
      totalWon: rep.totalWon.toNumber(),
      totalWonSol: rep.totalWon.toNumber() / 1e9,
      totalLost: rep.totalLost.toNumber(),
      totalLostSol: rep.totalLost.toNumber() / 1e9,
      marketsCreated: rep.marketsCreated,
      lastActive: rep.lastActive.toNumber(),
    });
  } catch (err: any) {
    console.error("Error fetching reputation:", err.message);
    res.status(404).json({ error: "Agent reputation not found" });
  }
});

// GET /api/reputation - Leaderboard (top agents by accuracy)
reputationRouter.get("/", async (_req: Request, res: Response) => {
  const cached = getCached("leaderboard");
  if (cached) return res.json(cached);

  try {
    const program = getProgram();
    const allReps = await (program.account as any).agentReputation.all();

    const formatted = allReps
      .map((r) => ({
        agent: r.account.agent.toBase58(),
        totalBets: r.account.totalBets,
        wins: r.account.wins,
        losses: r.account.losses,
        accuracy: r.account.accuracyBps / 100,
        totalWageredSol: r.account.totalWagered.toNumber() / 1e9,
        totalWonSol: r.account.totalWon.toNumber() / 1e9,
        marketsCreated: r.account.marketsCreated,
        lastActive: r.account.lastActive.toNumber(),
      }))
      .filter((r) => r.totalBets > 0)
      .sort((a, b) => {
        // Sort by accuracy (desc), then by total bets (desc)
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return b.totalBets - a.totalBets;
      });

    const data = { leaderboard: formatted, count: formatted.length };
    setCache("leaderboard", data);
    res.json(data);
  } catch (err: any) {
    console.error("Error fetching leaderboard:", err.message);
    res.json({ leaderboard: [], count: 0 });
  }
});

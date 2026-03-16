import { Router, Request, Response } from "express";
import { getProgram } from "../services/solana";

export const activityRouter = Router();

// GET /activity - Recent activity (market creations + bets)
activityRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const program = getProgram();

    const [marketsRaw, betsRaw] = await Promise.all([
      (program.account as any).market.all(),
      (program.account as any).bet.all(),
    ]);

    const marketMap = new Map<string, { title: string; marketId: number; publicKey: string }>();
    const activities: any[] = [];

    for (const m of marketsRaw) {
      const pk = m.publicKey.toBase58();
      const marketId = m.account.marketId.toNumber();
      const title = m.account.title;
      marketMap.set(pk, { title, marketId, publicKey: pk });

      activities.push({
        id: `market-${pk}`,
        type: "market_created",
        timestamp: m.account.createdAt.toNumber(),
        agent: m.account.creator.toBase58(),
        details: {
          marketId,
          marketPublicKey: pk,
          marketTitle: title,
        },
      });
    }

    for (const b of betsRaw) {
      const marketPk = b.account.market.toBase58();
      const marketInfo = marketMap.get(marketPk);
      const amountLamports = b.account.amount.toNumber();

      activities.push({
        id: `bet-${b.publicKey.toBase58()}`,
        type: "bet",
        timestamp: b.account.placedAt.toNumber(),
        agent: b.account.bettor.toBase58(),
        details: {
          marketId: marketInfo?.marketId,
          marketPublicKey: marketPk,
          marketTitle: marketInfo?.title ?? "Unknown Market",
          amount: amountLamports,
          amountSol: amountLamports / 1e9,
          position: b.account.position ? "YES" : "NO",
        },
      });
    }

    activities.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      activities: activities.slice(0, 50),
      count: activities.length,
    });
  } catch (err: any) {
    console.error("Error fetching activity:", err.message);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

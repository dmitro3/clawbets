import { Router, Request, Response } from "express";
import { getProgram, getProtocolPda, getConnection, getProgramId, getRpcUrl } from "../services/solana";

export const protocolRouter = Router();

protocolRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const program = getProgram();
    const [protocolPda] = getProtocolPda();
    const protocol = await (program.account as any).protocol.fetch(protocolPda);

    res.json({
      admin: protocol.admin.toBase58(),
      marketCount: protocol.marketCount.toNumber(),
      totalVolume: protocol.totalVolume.toNumber(),
      totalVolumeSol: protocol.totalVolume.toNumber() / 1e9,
      programId: getProgramId().toBase58(),
      rpcUrl: getRpcUrl(),
    });
  } catch (err: any) {
    console.error("Error fetching protocol:", err.message, err.cause || "");
    // Program not deployed or not initialized yet — return defaults
    res.json({
      admin: null,
      marketCount: 0,
      totalVolume: 0,
      totalVolumeSol: 0,
      programId: getProgramId().toBase58(),
      rpcUrl: getRpcUrl(),
      status: "not_initialized",
    });
  }
});

protocolRouter.post("/initialize", async (_req: Request, res: Response) => {
  try {
    const program = getProgram();
    const [protocolPda] = getProtocolPda();

    try {
      await (program.account as any).protocol.fetch(protocolPda);
      res.status(409).json({ error: "Protocol already initialized" });
      return;
    } catch {
      // Not initialized, continue
    }

    const tx = await program.methods.initialize().accounts({}).rpc();

    res.json({
      success: true,
      transaction: tx,
      protocol: protocolPda.toBase58(),
    });
  } catch (err: any) {
    console.error("Error initializing protocol:", err.message);
    res.status(500).json({ error: "Failed to initialize protocol" });
  }
});

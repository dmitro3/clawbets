import dotenv from "dotenv";
import * as path from "path";

// Load env BEFORE any other imports
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { marketsRouter } from "./routes/markets";
import { betsRouter } from "./routes/bets";
import { reputationRouter } from "./routes/reputation";
import { protocolRouter } from "./routes/protocol";
import { activityRouter } from "./routes/activity";

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Cloudflare/nginx reverse proxy (fixes X-Forwarded-For rate limit error)
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST"],
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
app.use(limiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "clawbets-api", version: "0.1.0" });
});

// Routes
app.use("/protocol", protocolRouter);
app.use("/markets", marketsRouter);
app.use("/bets", betsRouter);
app.use("/reputation", reputationRouter);
app.use("/activity", activityRouter);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🎲 ClawBets API running on port ${PORT}`);
  console.log(`  RPC: ${process.env.SOLANA_RPC_URL || "http://localhost:8899"}`);
});

export default app;

const anchor = require("@coral-xyz/anchor");
const { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const fs = require("fs");

const path = require("path");
const idlPath = fs.existsSync("./target/idl/clawbets.json") ? "./target/idl/clawbets.json" : "./app/src/lib/clawbets-idl.json";
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const KEYPAIR_PATH = process.env.KEYPAIR_PATH || (process.env.HOME + "/.config/solana/id.json");
const PYTH_SOL_USD = new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");

const AGENT_NAMES = [
  "AlphaBot", "BetaTrader", "GammaOracle", "DeltaHedge", "EpsilonAI",
  "ZetaPredict", "EtaSignal", "ThetaEdge", "IotaQuant", "KappaVault"
];

const MARKET_IDEAS = [
  { title: "SOL above $220 in 24h?", desc: "Will SOL break $220 within 24 hours? Resolves via Pyth SOL/USD.", target: 22000000000, above: true },
  { title: "SOL above $250 by end of week?", desc: "SOL weekly price prediction. Resolves via Pyth.", target: 25000000000, above: true },
  { title: "SOL drops below $180?", desc: "Bear case: does SOL fall under $180?", target: 18000000000, above: false },
  { title: "SOL above $300 by March?", desc: "Bullish long-term SOL prediction.", target: 30000000000, above: true },
  { title: "SOL stays above $200?", desc: "SOL holds $200 support level.", target: 20000000000, above: true },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function main() {
  const connection = new anchor.web3.Connection(RPC_URL, "confirmed");

  // Load agents
  const agents = [];
  for (let i = 0; i < 10; i++) {
    const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(`./agents/agent-${i}.json`, "utf8"))));
    agents.push({ name: AGENT_NAMES[i], kp });
  }

  // Admin for reading protocol
  const adminKp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, "utf8"))));
  const adminWallet = new anchor.Wallet(adminKp);
  const adminProvider = new anchor.AnchorProvider(connection, adminWallet, { commitment: "confirmed" });
  const adminProgram = new anchor.Program(idl, adminProvider);
  const [protocolPda] = PublicKey.findProgramAddressSync([Buffer.from("protocol")], adminProgram.programId);

  // === CREATE MARKETS (first 5 agents) ===
  console.log("\n🚀 SWARM ACTIVATED\n");
  console.log("=== AGENTS CREATING MARKETS ===\n");

  const protocol = await adminProgram.account.protocol.fetch(protocolPda);
  let nextMarketId = protocol.marketCount.toNumber();

  for (let i = 0; i < 5; i++) {
    const agent = agents[i];
    const market = MARKET_IDEAS[i];
    const wallet = new anchor.Wallet(agent.kp);
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    const program = new anchor.Program(idl, provider);

    const marketIdBN = new anchor.BN(nextMarketId);
    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), marketPda.toBuffer()],
      program.programId
    );
    const [repPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("reputation"), agent.kp.publicKey.toBuffer()],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const deadline = now + 86400;
    const resDeadline = now + 172800;

    try {
      const tx = await program.methods
        .createMarket(
          market.title, market.desc, PYTH_SOL_USD,
          new anchor.BN(market.target), market.above,
          new anchor.BN(deadline), new anchor.BN(resDeadline),
          new anchor.BN(0.01 * LAMPORTS_PER_SOL),
          new anchor.BN(5 * LAMPORTS_PER_SOL)
        )
        .accounts({
          creator: agent.kp.publicKey,
          protocol: protocolPda,
          market: marketPda,
          vault: vaultPda,
          reputation: repPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`  🟢 ${agent.name} created: "${market.title}" (market #${nextMarketId})`);
      nextMarketId++;
    } catch (e) {
      console.log(`  🔴 ${agent.name} create failed: ${e.message.slice(0, 150)}`);
    }
    await sleep(rand(2000, 4000));
  }

  // === PLACE BETS (all 10 agents) ===
  console.log("\n=== AGENTS PLACING BETS ===\n");

  const allMarkets = await adminProgram.account.market.all();
  const openMarkets = allMarkets.filter(m => Object.keys(m.account.status)[0] === "open");
  console.log(`  ${openMarkets.length} open markets found\n`);

  for (const agent of agents) {
    const numBets = rand(2, Math.min(4, openMarkets.length));
    const shuffled = [...openMarkets].sort(() => Math.random() - 0.5);
    const targets = shuffled.slice(0, numBets);

    const wallet = new anchor.Wallet(agent.kp);
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    const program = new anchor.Program(idl, provider);

    for (const m of targets) {
      const marketPda = m.publicKey;

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), marketPda.toBuffer()],
        program.programId
      );
      const [betPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), marketPda.toBuffer(), agent.kp.publicKey.toBuffer()],
        program.programId
      );
      const [repPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), agent.kp.publicKey.toBuffer()],
        program.programId
      );

      // Skip if already bet
      try {
        await program.account.bet.fetch(betPda);
        continue;
      } catch {}

      const position = Math.random() > 0.5;
      const amounts = [0.01, 0.02, 0.03, 0.04, 0.05];
      const amount = amounts[rand(0, amounts.length - 1)];

      try {
        const tx = await program.methods
          .placeBet(new anchor.BN(amount * LAMPORTS_PER_SOL), position)
          .accounts({
            bettor: agent.kp.publicKey,
            market: marketPda,
            bet: betPda,
            vault: vaultPda,
            reputation: repPda,
            protocol: protocolPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        console.log(`  🎲 ${agent.name} bet ${amount} SOL ${position ? "YES" : "NO"} on "${m.account.title}"`);
      } catch (e) {
        console.log(`  ❌ ${agent.name} bet failed: ${e.message.slice(0, 120)}`);
      }
      await sleep(rand(2000, 5000));
    }
  }

  // Summary
  console.log("\n=== SWARM COMPLETE ===\n");
  const finalProtocol = await adminProgram.account.protocol.fetch(protocolPda);
  console.log(`  Total markets: ${finalProtocol.marketCount.toNumber()}`);
  console.log(`  Total volume: ${(finalProtocol.totalVolume.toNumber() / LAMPORTS_PER_SOL).toFixed(3)} SOL`);
  console.log("\n  Check the UI! 🔥\n");
}

main().catch(console.error);

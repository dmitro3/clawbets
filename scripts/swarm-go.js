const anchor = require("@coral-xyz/anchor");
const { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");

const idlPath = fs.existsSync("./target/idl/clawbets.json") ? "./target/idl/clawbets.json" : "./app/src/lib/clawbets-idl.json";
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const KEYPAIR_PATH = process.env.KEYPAIR_PATH || (process.env.HOME + "/.config/solana/id.json");

// Pyth v2 Price Feed IDs as [u8; 32] byte arrays (devnet)
function hexToBytes(hex) {
  const clean = hex.replace(/^0x/, "");
  return Array.from(Buffer.from(clean, "hex"));
}
const FEED_SOL_USD = hexToBytes("ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d");
const FEED_BTC_USD = hexToBytes("e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43");
const FEED_ETH_USD = hexToBytes("ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace");

const AGENT_NAMES = [
  "AlphaBot", "BetaTrader", "GammaOracle", "DeltaHedge", "EpsilonAI",
  "ZetaPredict", "EtaSignal", "ThetaEdge", "IotaQuant", "KappaVault"
];

// target_price is i64 in price * 10^8 format (Pyth format)
const MARKET_IDEAS = [
  { title: "ETH above $5000 by March?",      desc: "Will ETH/USD exceed $5000 by end of March?",          feed: FEED_ETH_USD, target: 500000000000, above: true  },
  { title: "BTC breaks $120K this month?",   desc: "Will BTC/USD break $120,000 this month?",              feed: FEED_BTC_USD, target: 12000000000000, above: true  },
  { title: "SOL above $250 by Friday?",      desc: "Will SOL/USD exceed $250 before end of Friday?",       feed: FEED_SOL_USD, target: 25000000000, above: true  },
  { title: "ETH drops below $2500?",         desc: "Bear case: does ETH fall under $2500?",                feed: FEED_ETH_USD, target: 250000000000, above: false },
  { title: "BTC above $100K by end of week?",desc: "Will Bitcoin hold above $100K through the week?",     feed: FEED_BTC_USD, target: 10000000000000, above: true  },
  { title: "SOL above $300 this month?",     desc: "Bullish SOL prediction for this month.",               feed: FEED_SOL_USD, target: 30000000000, above: true  },
  { title: "ETH/BTC ratio above 0.05?",      desc: "Will ETH outperform BTC this week?",                  feed: FEED_ETH_USD, target: 250000000000, above: true  },
  { title: "SOL drops below $150?",          desc: "Bear case: SOL falls under $150.",                    feed: FEED_SOL_USD, target: 15000000000, above: false },
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

  // === CREATE MARKETS (first 8 agents, one market each) ===
  console.log("\n🚀 SWARM ACTIVATED\n");
  console.log("=== AGENTS CREATING MARKETS ===\n");

  const protocol = await adminProgram.account.protocol.fetch(protocolPda);
  let nextMarketId = protocol.marketCount.toNumber();

  const marketsToCreate = Math.min(MARKET_IDEAS.length, agents.length);
  for (let i = 0; i < marketsToCreate; i++) {
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
    const deadline = now + 86400 * 7;         // 7 days
    const resDeadline = now + 86400 * 14;     // 14 days

    try {
      const tx = await program.methods
        .createMarket(
          market.title,
          market.desc,
          market.feed,            // [u8; 32] Pyth feed ID
          new anchor.BN(market.target),
          market.above,
          new anchor.BN(deadline),
          new anchor.BN(resDeadline),
          new anchor.BN(0.01 * LAMPORTS_PER_SOL),
          new anchor.BN(1 * LAMPORTS_PER_SOL)
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
      console.log(`  🔴 ${agent.name} create failed: ${e.message.slice(0, 200)}`);
    }
    await sleep(rand(2000, 4000));
  }

  // === PLACE BETS (all 10 agents) ===
  console.log("\n=== AGENTS PLACING BETS ===\n");

  const allMarkets = await adminProgram.account.market.all();
  const openMarkets = allMarkets.filter(m => Object.keys(m.account.status)[0] === "open");
  console.log(`  ${openMarkets.length} open markets found\n`);

  if (openMarkets.length === 0) {
    console.log("  No open markets to bet on.\n");
  } else {
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

        // Skip if already bet on this market
        try {
          await program.account.bet.fetch(betPda);
          console.log(`  ⏭  ${agent.name} already bet on "${m.account.title}"`);
          continue;
        } catch {}

        const position = Math.random() > 0.5;
        const amounts = [0.01, 0.02, 0.03, 0.04, 0.05];
        const amount = amounts[rand(0, amounts.length - 1)];

        try {
          await program.methods
            .placeBet(new anchor.BN(Math.round(amount * LAMPORTS_PER_SOL)), position)
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
        await sleep(rand(1500, 3000));
      }
    }
  }

  // Summary
  console.log("\n=== SWARM COMPLETE ===\n");
  const finalProtocol = await adminProgram.account.protocol.fetch(protocolPda);
  console.log(`  Total markets: ${finalProtocol.marketCount.toNumber()}`);
  console.log(`  Total volume:  ${(finalProtocol.totalVolume.toNumber() / LAMPORTS_PER_SOL).toFixed(3)} SOL`);
  console.log("\n  Check the UI! 🔥\n");
}

main().catch(console.error);

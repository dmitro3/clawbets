const anchor = require("@coral-xyz/anchor");
const { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");

const idlPath = fs.existsSync("./target/idl/clawbets.json")
  ? "./target/idl/clawbets.json"
  : "./app/src/lib/clawbets-idl.json";
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const KEYPAIR_PATH = process.env.KEYPAIR_PATH || `${process.env.HOME}/.config/solana/id.json`;

const AGENT_NAMES = [
  "AlphaBot", "BetaTrader", "GammaOracle", "DeltaHedge", "EpsilonAI",
  "ZetaPredict", "EtaSignal", "ThetaEdge", "IotaQuant", "KappaVault"
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const connection = new anchor.web3.Connection(RPC_URL, "confirmed");
  const adminKp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, "utf8"))));

  console.log("=== GENERATING 10 AGENT WALLETS ===\n");
  const agentsDir = "./agents";
  if (!fs.existsSync(agentsDir)) fs.mkdirSync(agentsDir);

  const agents = [];
  for (let i = 0; i < 10; i++) {
    const path = `${agentsDir}/agent-${i}.json`;
    let kp;
    if (fs.existsSync(path)) {
      kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path, "utf8"))));
    } else {
      kp = Keypair.generate();
      fs.writeFileSync(path, JSON.stringify(Array.from(kp.secretKey)));
    }
    agents.push({ name: AGENT_NAMES[i], kp });
    console.log(`  ${AGENT_NAMES[i]}: ${kp.publicKey.toBase58()}`);
  }

  console.log("\n=== FUNDING AGENTS (0.15 SOL each) ===\n");
  const adminBal = await connection.getBalance(adminKp.publicKey);
  console.log(`  Admin balance: ${(adminBal / LAMPORTS_PER_SOL).toFixed(3)} SOL\n`);

  for (const agent of agents) {
    const bal = await connection.getBalance(agent.kp.publicKey);
    if (bal >= 0.1 * LAMPORTS_PER_SOL) {
      console.log(`  ${agent.name}: already has ${(bal / LAMPORTS_PER_SOL).toFixed(3)} SOL, skipping`);
      continue;
    }
    try {
      const tx = new anchor.web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: adminKp.publicKey,
          toPubkey: agent.kp.publicKey,
          lamports: 0.15 * LAMPORTS_PER_SOL,
        })
      );
      const sig = await anchor.web3.sendAndConfirmTransaction(connection, tx, [adminKp]);
      console.log(`  ${agent.name}: funded 0.15 SOL — ${sig.slice(0, 20)}...`);
    } catch (e) {
      console.log(`  ${agent.name}: funding failed — ${e.message.slice(0, 100)}`);
    }
    await sleep(500);
  }

  console.log("\n=== SETUP COMPLETE ===");
  console.log("Total cost: ~1.5 SOL for 10 agents");
  console.log("Run 'node scripts/swarm-go.js' to start the swarm!\n");
}

main().catch(console.error);

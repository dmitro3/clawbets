#!/usr/bin/env node
const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram } = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");

// IDL path relative to project root
const root = path.resolve(__dirname, "..");
const idlPath = fs.existsSync(path.join(root, "target/idl/clawbets.json"))
  ? path.join(root, "target/idl/clawbets.json")
  : path.join(root, "app/src/lib/clawbets-idl.json");

const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

async function main() {
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  // Try ~/.config/solana/id.json (root) or /home/ubuntu/.config/solana/id.json
  const keypairPaths = [
    "/root/.config/solana/id.json",
    `${process.env.HOME}/.config/solana/id.json`,
  ];
  const keypairPath = keypairPaths.find(fs.existsSync);
  if (!keypairPath) {
    throw new Error("Solana keypair not found. Run: solana-keygen new");
  }

  const keypair = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf8")))
  );
  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new anchor.Program(idl, provider);

  const [protocolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol")],
    program.programId
  );

  console.log("Initializing protocol on devnet...");
  console.log("Program ID:", program.programId.toBase58());
  console.log("Admin:", wallet.publicKey.toBase58());
  console.log("Protocol PDA:", protocolPda.toBase58());

  // Check if already initialized
  try {
    const existing = await program.account.protocol.fetch(protocolPda);
    console.log("✅ Protocol already initialized!");
    console.log("Admin:", existing.admin.toBase58());
    console.log("Market count:", existing.marketCount.toNumber());
    return;
  } catch {
    // Not initialized yet, continue
  }

  const tx = await program.methods
    .initialize()
    .accounts({
      admin: wallet.publicKey,
      protocol: protocolPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Protocol initialized! TX:", tx);

  const protocol = await program.account.protocol.fetch(protocolPda);
  console.log("Admin:", protocol.admin.toBase58());
  console.log("Market count:", protocol.marketCount.toNumber());
  console.log("Balance:", await connection.getBalance(wallet.publicKey) / 1e9, "SOL");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});

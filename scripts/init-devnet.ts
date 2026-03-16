import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";

// Try target/idl first, fall back to app/src/lib
const idlPath = fs.existsSync("./target/idl/clawbets.json")
  ? "./target/idl/clawbets.json"
  : "./app/src/lib/clawbets-idl.json";
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

async function main() {
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
  const keypairData = fs.readFileSync(
    "/root/.config/solana/id.json",
    "utf8"
  );
  const keypair = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(keypairData))
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

  const tx = await program.methods
    .initialize()
    .accounts({
      admin: wallet.publicKey,
      protocol: protocolPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Protocol initialized! TX:", tx);

  const protocol = await (program.account as any).protocol.fetch(protocolPda);
  console.log("Admin:", protocol.admin.toBase58());
  console.log("Market count:", protocol.marketCount.toNumber());
  console.log("Balance:", await connection.getBalance(wallet.publicKey) / 1e9, "SOL");
}

main().catch(console.error);

import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// Try target/idl first (after anchor build), fall back to app/src/lib
const idlCandidates = [
  path.resolve(__dirname, "../../..", "target/idl/clawbets.json"),
  path.resolve(__dirname, "../../..", "app/src/lib/clawbets-idl.json"),
];
const idlPath = idlCandidates.find(fs.existsSync);
if (!idlPath) throw new Error("IDL file not found. Run anchor build or ensure app/src/lib/clawbets-idl.json exists.");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

function getRpcUrl(): string {
  return process.env.SOLANA_RPC_URL || "http://localhost:8899";
}

function getProgramId(): PublicKey {
  return new PublicKey(process.env.PROGRAM_ID || idl.address);
}

function getConnection(): Connection {
  return new Connection(getRpcUrl(), "confirmed");
}

function getAdminKeypair(): Keypair {
  const secretKey = process.env.ADMIN_SECRET_KEY;
  if (!secretKey) {
    throw new Error("ADMIN_SECRET_KEY not set");
  }
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secretKey)));
}

function getProvider(): anchor.AnchorProvider {
  const wallet = new anchor.Wallet(getAdminKeypair());
  return new anchor.AnchorProvider(getConnection(), wallet, {
    commitment: "confirmed",
  });
}

function getProgram(): anchor.Program {
  const provider = getProvider();
  return new anchor.Program(idl as any, provider);
}

function getProtocolPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("protocol")],
    getProgramId()
  );
}

function getMarketPda(marketId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("market"), new anchor.BN(marketId).toArrayLike(Buffer, "le", 8)],
    getProgramId()
  );
}

function getVaultPda(marketPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), marketPubkey.toBuffer()],
    getProgramId()
  );
}

function getBetPda(marketPubkey: PublicKey, bettorPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bet"), marketPubkey.toBuffer(), bettorPubkey.toBuffer()],
    getProgramId()
  );
}

function getReputationPda(agentPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("reputation"), agentPubkey.toBuffer()],
    getProgramId()
  );
}

export {
  getConnection,
  getProvider,
  getProgram,
  getAdminKeypair,
  getProtocolPda,
  getMarketPda,
  getVaultPda,
  getBetPda,
  getReputationPda,
  getProgramId,
  getRpcUrl,
};

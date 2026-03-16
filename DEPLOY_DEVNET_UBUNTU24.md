# ClawBets — Devnet Deploy Guide (Ubuntu 24.04)

This guide covers deploying the full ClawBets stack to Solana **devnet** on a fresh Ubuntu 24.04 server.

---

## Stack Overview

| Component | Tech | Port |
|-----------|------|------|
| Solana Program | Rust + Anchor 0.32.1 | on-chain |
| REST API | Node.js + Express | 3001 |
| Frontend | Next.js 16 | 3000 |

---

## 1. System Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential pkg-config libssl-dev libudev-dev
```

---

## 2. Install Node.js 20 (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should be v20.x
```

---

## 3. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustup component add rustfmt
rustup update stable
rustc --version
```

---

## 4. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
solana --version
```

Configure for devnet:

```bash
solana config set --url devnet
solana config get
```

---

## 5. Install Anchor CLI

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.32.1
avm use 0.32.1
anchor --version   # anchor-cli 0.32.1
```

---

## 6. Create & Fund a Deploy Wallet

```bash
# Generate a new keypair (skip if you already have one)
solana-keygen new --outfile ~/.config/solana/id.json

# Show public key
solana address

# Airdrop devnet SOL (run 2-3 times to get enough for deployment)
solana airdrop 2
solana airdrop 2
solana balance
```

> You need at least **3-4 SOL** for program deployment on devnet.

---

## 7. Clone the Repository

```bash
git clone https://github.com/Allen-Saji/clawbets.git
cd clawbets
```

---

## 8. Build & Deploy the Solana Program

### 8.1 Update Anchor.toml for devnet

Edit `Anchor.toml` — change the provider cluster:

```toml
[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"
```

### 8.2 Build the program

```bash
anchor build
```

After a successful build the program keypair is at:
`target/deploy/clawbets-keypair.json`

Get the program ID:

```bash
solana address -k target/deploy/clawbets-keypair.json
```

### 8.3 Update program ID (if different)

If the generated program ID differs from `3kBwjzUXtVeUshBWDD1Ls5PZPqQZgQUGNUTdP6jCqobb`, update it:

1. In `Anchor.toml` under `[programs.devnet]`:
   ```toml
   clawbets = "<YOUR_PROGRAM_ID>"
   ```
2. In `programs/clawbets/src/lib.rs` — update `declare_id!`:
   ```rust
   declare_id!("<YOUR_PROGRAM_ID>");
   ```
3. Rebuild: `anchor build`

### 8.4 Deploy

```bash
anchor deploy --provider.cluster devnet
```

Save the deployed program ID — you'll need it for the API config.

### 8.5 Initialize the program

```bash
anchor run initialize --provider.cluster devnet
# or run the initialization test:
anchor test --skip-local-validator --provider.cluster devnet
```

---

## 9. Configure & Start the API

```bash
cd api
npm install

# Create environment file
cp .env.example .env
```

Edit `.env`:

```env
PORT=3001
SOLANA_RPC_URL=https://api.devnet.solana.com
ADMIN_SECRET_KEY=[paste your keypair JSON array here]
CORS_ORIGIN=http://<YOUR_SERVER_IP>:3000
```

Get your keypair array:
```bash
cat ~/.config/solana/id.json
```

Build and start:

```bash
npm run build
npm start
```

To keep it running use PM2:

```bash
sudo npm install -g pm2
pm2 start dist/index.js --name clawbets-api
pm2 save
pm2 startup   # follow the printed command to enable on reboot
```

---

## 10. Configure & Start the Frontend

```bash
cd ../app
npm install

# Create environment file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://<YOUR_SERVER_IP>:3001
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
EOF
```

Build and start:

```bash
npm run build
npm start
```

With PM2:

```bash
pm2 start npm --name clawbets-app -- start
pm2 save
```

---

## 11. Open Firewall Ports

```bash
sudo ufw allow 22      # SSH
sudo ufw allow 3000    # Frontend
sudo ufw allow 3001    # API
sudo ufw enable
sudo ufw status
```

---

## 12. (Optional) Nginx Reverse Proxy

```bash
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/clawbets > /dev/null << 'EOF'
server {
    listen 80;
    server_name <YOUR_DOMAIN_OR_IP>;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/clawbets /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 13. Verify Deployment

```bash
# Check program is deployed
solana program show <YOUR_PROGRAM_ID> --url devnet

# Check API health
curl http://localhost:3001/health

# Check frontend
curl -s http://localhost:3000 | head -5

# Check PM2 processes
pm2 list
pm2 logs clawbets-api --lines 20
pm2 logs clawbets-app --lines 20
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `solana airdrop 2` | Get devnet SOL |
| `anchor build` | Compile the program |
| `anchor deploy --provider.cluster devnet` | Deploy to devnet |
| `pm2 list` | Check running services |
| `pm2 logs` | View service logs |
| `solana program show <ID> --url devnet` | Verify program on-chain |

---

## Troubleshooting

**Insufficient SOL for deployment**
```bash
solana airdrop 2 && solana airdrop 2 && solana balance
```

**Anchor build fails (Rust version)**
```bash
rustup update stable && rustup override set stable
```

**API can't connect to Solana**
- Verify `SOLANA_RPC_URL=https://api.devnet.solana.com` in `.env`
- Test: `curl https://api.devnet.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'`

**Port already in use**
```bash
sudo lsof -i :3000
sudo lsof -i :3001
pm2 restart all
```

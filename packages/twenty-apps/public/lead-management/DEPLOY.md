# Your JobFlow demo instance — phone-only setup (~20 min)

Goal: a live Twenty + JobFlow at a public address you can open on your
phone, demo to clients, and send as a link. Total cost ≈ $5–10/month.
Everything below is done in your phone browser + a terminal app.

## 1. Rent the server (Ubicloud — card on file, no ID check)

Ubicloud is an open-source cloud (AWS-style VMs) that only needs a valid
credit card on file — no photo ID, no prepayment. Billed per minute.

**First, make an SSH key on your phone** (Ubicloud has no root passwords):
open the free **Termius** app → Keychain → **Generate key** (Ed25519) →
open it → copy the **public key** (long text starting `ssh-ed25519`).

1. Go to **ubicloud.com** → sign up → add your credit card (Billing).
2. **Compute → New Virtual Machine**:
   - Location: **Virginia** (US) or Germany — either works
   - Size: **burstable-2** (2 CPU / 4 GB, ~$21/mo) — burstable-1
     (1 CPU / 2 GB, ~$8/mo + $3 public IPv4) also works; step 2 adds swap
   - OS: **Ubuntu 24.04**
   - SSH key: paste the public key from Termius
   - Keep **public IPv4** enabled (+$3/mo — you need it)
3. Create it, copy the VM's **public IPv4 address**.
4. On the VM page, open **Firewall** and add an ingress rule:
   **TCP port 3000, source 0.0.0.0/0** (SSH port 22 is already allowed).

## 2. Install Twenty on it

Open **Termius** → new host: address = the VM's public IPv4, username
`ubi`, key = the key you generated. Connect, then become root and paste
the block below (replacing `YOUR_IP` with the VM's IPv4):

```bash
sudo -i
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
curl -fsSL https://get.docker.com | sh
mkdir -p ~/twenty && cd ~/twenty
curl -O https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker/docker-compose.yml
cat > .env <<EOF
TAG=latest
PG_DATABASE_PASSWORD=$(openssl rand -hex 16)
SERVER_URL=http://YOUR_IP:3000
ENCRYPTION_KEY=$(openssl rand -base64 32)
STORAGE_TYPE=local
EOF
docker compose up -d
```

Wait ~2 minutes, then open **http://YOUR_IP:3000** in your phone browser —
you should see the Twenty sign-up screen. If it doesn't load, check the
you skipped the firewall rule in step 1 —
add the TCP 3000 ingress rule on the VM's Firewall tab and reload.

## 3. Create your account + workspace

On the sign-up screen: create your account, name the workspace
(e.g. **JobFlow Demo**). This is your stage set — fake data lives here,
never real client data.

## 4. Get an API key

In Twenty: **Settings → Developers** (API & Webhooks) → **Create API key**.
Name it `GitHub Deploy`. Copy the key — you'll paste it in the next step.
(It must belong to a workspace admin; the account you just made is.)

## 5. Connect GitHub (one time)

On your phone browser, open this repo → **Settings → Secrets and
variables → Actions → New repository secret**, twice:

| Name | Value |
| --- | --- |
| `TWENTY_DEPLOY_URL` | `http://YOUR_IP:3000` |
| `TWENTY_DEPLOY_API_KEY` | the key from step 4 |

## 6. Press the button

Repo → **Actions** tab → **Deploy JobFlow Demo** → **Run workflow**.
Wait ~5 minutes for green checks. What it does:

1. Auto-bumps the app patch version (servers reject same-version
   re-deploys — the bump is only inside the runner)
2. Deploys the JobFlow tarball privately to your server
3. Installs/upgrades it in your workspace — first install also runs the
   "Opportunity → Lead" relabel, so your nav will say **Leads**

## 7. Show it off

Open `http://YOUR_IP:3000`, sign in, and you have: Lead Pipeline board,
Estimates, Jobs, and the accept-an-estimate → job-appears automation,
live. Send the link to prospects; add sample leads before calls.

Re-deploy any time (step 6) — clients and demo data are untouched, only
the app upgrades.

## Notes

- **Cost control:** billing is hourly — when you're done selling for
  a while, Ubicloud → VM → **Destroy** ends all charges (the demo data
  goes with it; re-run steps 2–6 to rebuild in ~15 min). A stopped
  server still bills, so destroy beats stop here.
- **Security reality check:** this demo is plain HTTP on a public IP —
  fine for fake demo data, never put real client info in it. A domain +
  HTTPS is the upgrade when it becomes a client-facing asset.
- **Troubleshooting:** if the workflow fails at "Deploy", open the server
  terminal and run `docker compose logs server | tail -50` in `~/twenty`
  — or re-run the repo's live CI; the app itself is verified green there
  on every push.

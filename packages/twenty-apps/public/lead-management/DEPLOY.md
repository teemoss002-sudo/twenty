# Your JobFlow demo instance — phone-only setup (~20 min)

Goal: a live Twenty + JobFlow at a public address you can open on your
phone, demo to clients, and send as a link. Total cost ≈ $5–10/month.
Everything below is done in your phone browser + a terminal app.

## 1. Rent the server (Vultr — no ID check)

Hetzner wants photo ID or a $25 prepayment; Vultr does not — just email +
card (or PayPal). ~$12/month, billed hourly, cancel anytime.

1. Go to **vultr.com** → sign up → verify your email, add a payment method.
2. **Deploy New Server** → **Cloud Compute (Shared CPU)**.
3. Choose:
   - Location: **Dallas** or **Chicago** (any US city is fine)
   - Image: **Ubuntu 24.04 LTS**
   - Plan: 2 vCPU / 4 GB if you see it (~$24/mo); the 2 GB plan (~$12/mo)
     also works — step 2 adds swap so it doesn't run out of memory
   - Hostname/label: `jobflow-demo`
4. **Deploy Now**, wait ~1 minute, copy the server's **IP address** and the
   **root password** shown on the server page (no email hunting — it's in
   the dashboard).

## 2. Install Twenty on it

Open the terminal: either the **View Console** button on the server's Vultr
page (works in your browser), or the free **Termius** app (host = the IP,
user `root`, password from the Vultr server page). Paste this block, replacing
`YOUR_IP` with the server IP:

```bash
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
server page: Vultr doesn't add a cloud firewall by default, so port 3000
is open — good.

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
  a while, Vultr → server → **Destroy** ends all charges (the demo data
  goes with it; re-run steps 2–6 to rebuild in ~15 min). A stopped
  server still bills, so destroy beats stop here.
- **Security reality check:** this demo is plain HTTP on a public IP —
  fine for fake demo data, never put real client info in it. A domain +
  HTTPS is the upgrade when it becomes a client-facing asset.
- **Troubleshooting:** if the workflow fails at "Deploy", open the server
  terminal and run `docker compose logs server | tail -50` in `~/twenty`
  — or re-run the repo's live CI; the app itself is verified green there
  on every push.

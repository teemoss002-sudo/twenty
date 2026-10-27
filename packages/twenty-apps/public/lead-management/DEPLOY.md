# Your JobFlow demo instance — phone-only setup (~20 min)

Goal: a live Twenty + JobFlow at a public address you can open on your
phone, demo to clients, and send as a link. Total cost ≈ $5–10/month.
Everything below is done in your phone browser + a terminal app.

## 1. Rent the server (Hetzner Cloud)

1. Go to **hetzner.com/cloud** → sign up → verify your email (they may ask
   for ID/payment method).
2. Create a project: **JobFlow Demo**.
3. **Add server**:
   - Location: **Ashburn** or **Hillsboro** (US)
   - Image: **Ubuntu 24.04**
   - Type: **CPX21** (2 CPU / 4 GB) — CPX11 is too small
   - SSH key: skip it — Hetzner emails you a root password instead
4. Create it, copy the server's **IP address** (e.g. `203.0.113.10`), and
   check your email for the root password.

## 2. Install Twenty on it

Open the terminal: either the **Console** button on the server's Hetzner
page (works in your browser), or the free **Termius** app (host = the IP,
user `root`, password from the email). Paste this block, replacing
`YOUR_IP` with the server IP:

```bash
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
Hetzner server page → **Firewalls**: none should be blocking port 3000
(by default there is no firewall — good).

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

- **Cost control:** when you're not demoing, Hetzner → server →
  **Power off** stops compute billing (disk is pennies). Power on takes
  ~1 minute; your data and address stay.
- **Security reality check:** this demo is plain HTTP on a public IP —
  fine for fake demo data, never put real client info in it. A domain +
  HTTPS is the upgrade when it becomes a client-facing asset.
- **Troubleshooting:** if the workflow fails at "Deploy", open the server
  terminal and run `docker compose logs server | tail -50` in `~/twenty`
  — or re-run the repo's live CI; the app itself is verified green there
  on every push.

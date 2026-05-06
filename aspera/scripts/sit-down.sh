#!/usr/bin/env bash
# Phase B sit-down — gets you from "branch is ready" to "EAS build is uploading"
# in one terminal session. ~10 minutes interactive time.
#
# Run from repo root: ./aspera/scripts/sit-down.sh
#
# What you'll be asked for:
#   1. New CLAUDE_KEY (rotated from console.anthropic.com)
#   2. SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard)
#   3. Apple Team ID, Apple ID email, App Store Connect App ID (one-time lookups)
#   4. Browser logins for Vercel + EAS

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_DIR="$REPO_ROOT/aspera-web"
MOBILE_DIR="$REPO_ROOT/aspera"

cyan() { printf '\033[36m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
red() { printf '\033[31m%s\033[0m\n' "$*"; }
hr() { printf '\033[90m%s\033[0m\n' "──────────────────────────────────────────"; }

prompt_secret() {
  # $1: prompt text, $2: var to set in .env.local
  local prompt="$1"
  local var="$2"
  printf '%s ' "$prompt"
  read -rs value
  echo
  if [ -z "$value" ]; then
    red "  Skipped — leaving $var blank in .env.local"
    return
  fi
  # macOS sed: -i requires backup arg; use empty string
  python3 - "$var" "$value" "$WEB_DIR/.env.local" <<'PY'
import sys
var, value, path = sys.argv[1:4]
with open(path, "r") as f:
    lines = f.readlines()
out = []
seen = False
for line in lines:
    if line.startswith(f"{var}="):
        out.append(f"{var}={value}\n")
        seen = True
    else:
        out.append(line)
if not seen:
    out.append(f"{var}={value}\n")
with open(path, "w") as f:
    f.writelines(out)
PY
  green "  → wrote $var to aspera-web/.env.local"
}

# ── Step 0: Rotate Anthropic key ──────────────────────────────────────────
hr
cyan "STEP 0 — Rotate the Anthropic key"
yellow "Open: https://console.anthropic.com/settings/keys"
yellow "  1. Revoke the key starting with sk-ant-api03-qk43OAW…"
yellow "  2. Create a new key. Copy it."
prompt_secret "Paste the NEW CLAUDE_KEY (sk-ant-api03-…), then Enter:" CLAUDE_KEY

# ── Step 1: Supabase service role key ─────────────────────────────────────
hr
cyan "STEP 1 — Fetch Supabase service role key"
yellow "Open: https://supabase.com/dashboard/project/epfewtmwfpnbkwxcnohb/settings/api"
yellow "Copy the 'service_role' key (NOT the anon/publishable one)"
prompt_secret "Paste SUPABASE_SERVICE_ROLE_KEY, then Enter:" SUPABASE_SERVICE_ROLE_KEY

# ── Step 2: Vercel link + deploy ──────────────────────────────────────────
hr
cyan "STEP 2 — Vercel link + deploy"
cd "$WEB_DIR"

if ! command -v vercel >/dev/null 2>&1; then
  yellow "Installing vercel CLI globally…"
  npm install -g vercel
fi

if [ ! -d ".vercel" ]; then
  yellow "Logging in to Vercel (browser will open)…"
  vercel login
  yellow "Linking project (accept defaults to create a new project named aspera-web)…"
  vercel link
fi

cyan "Pushing every var from .env.local → Vercel production env…"
while IFS='=' read -r key value; do
  [[ "$key" =~ ^# ]] && continue
  [[ -z "$key" || -z "$value" ]] && continue
  yellow "  vercel env add $key (production)…"
  printf '%s' "$value" | vercel env add "$key" production --force >/dev/null 2>&1 || true
done < .env.local

cyan "Deploying to production…"
DEPLOY_OUTPUT=$(vercel --prod --yes 2>&1 | tee /dev/tty)
VERCEL_URL=$(echo "$DEPLOY_OUTPUT" | grep -Eo 'https://[a-z0-9-]+\.vercel\.app' | tail -1)

if [ -z "$VERCEL_URL" ]; then
  red "Could not parse Vercel URL from deploy output."
  yellow "Paste the URL manually (https://…vercel.app):"
  read -r VERCEL_URL
fi
green "  Production URL: $VERCEL_URL"

# Persist for the EAS step
echo "$VERCEL_URL" > "$REPO_ROOT/.vercel-prod-url"

# Update aspera/.env so local `expo start` talks to prod
python3 - "EXPO_PUBLIC_API_URL" "$VERCEL_URL" "$MOBILE_DIR/.env" <<'PY'
import sys
var, value, path = sys.argv[1:4]
with open(path, "r") as f:
    lines = f.readlines()
out = []
seen = False
for line in lines:
    if line.startswith(f"{var}="):
        out.append(f"{var}={value}\n")
        seen = True
    else:
        out.append(line)
if not seen:
    out.append(f"{var}={value}\n")
with open(path, "w") as f:
    f.writelines(out)
PY

# ── Step 3: EAS auth + project init ───────────────────────────────────────
hr
cyan "STEP 3 — EAS auth + project init"
cd "$MOBILE_DIR"

if ! command -v eas >/dev/null 2>&1; then
  yellow "Installing eas-cli globally…"
  npm install -g eas-cli
fi

yellow "Logging in to EAS (Expo account, NOT Apple)…"
eas login

yellow "Initializing EAS project (fills extra.eas.projectId in app.json)…"
eas init --non-interactive --force || eas init

cyan "Uploading EXPO_PUBLIC_* secrets to EAS (encrypted at rest)…"
MOBILE_SECRET=$(grep '^MOBILE_API_SECRET=' "$WEB_DIR/.env.local" | cut -d= -f2-)
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "$VERCEL_URL" --type string --force >/dev/null
eas secret:create --scope project --name EXPO_PUBLIC_MOBILE_API_SECRET --value "$MOBILE_SECRET" --type string --force >/dev/null
green "  → Two EAS secrets uploaded. They'll be auto-injected at build time."

yellow "One-time iOS credentials setup (Apple ID, App-specific password, Team ID)…"
yellow "Pick: 'Set up a new build credential' → 'Let EAS handle credentials'"
eas credentials --platform ios

# ── Step 4: Kick off the build ────────────────────────────────────────────
hr
cyan "STEP 4 — Build for iPhone (preview profile)"
yellow "Cloud build starts now. ~20-30 min. You can stand up and walk away."
yellow "When it finishes you'll get an install URL — open it on your iPhone."
hr
eas build --platform ios --profile preview --non-interactive

green "Done. Watch progress at: https://expo.dev/accounts/<your-account>/builds"

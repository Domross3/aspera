# Aspera

**AI-powered life optimization that treats the human as the system.**

Aspera correlates personal inputs (caffeine, sleep, workouts, music, nutrition) with cognitive outputs (focus, energy, tasks completed) using Claude AI — while actively protecting mental health through somatic intervention and self-compassion.

---

## Project Structure

```
CBCHackathon/
├── aspera/                  # React Native / Expo mobile app
├── aspera-web/              # Next.js 15 web dashboard + API backend
├── aspera-extension/        # Chrome extension (browsing focus + friction)
└── README.md
```

---

## Quick Start

### Prerequisites

- **Node.js 20** (Node 22+ may cause issues with Expo CLI)
- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- **Google Chrome** (for the browser extension)
- **Claude API key** from [console.anthropic.com](https://console.anthropic.com)

### 1. Mobile App

```bash
# Clone the repo
git clone -b aspera https://github.com/Domross3/aspera.git CBCHackathon
cd CBCHackathon

# Use the pinned Node version
nvm use

# Install the mobile app dependencies from the repo root
npm run mobile:install

# Copy the env template and fill in your values
cp aspera/.env.example aspera/.env

# Start the dev server
npm run mobile:start:clear
```

If you prefer working inside the app folder directly, use `cd aspera && npm ci && npm start -- --clear`.

> **Troubleshooting:** If Expo fails with `Cannot find module .../@expo/cli/build/bin/cli`, the local install is corrupted. `npm start` now auto-repairs that by running `npm ci` when needed. The durable fix is to keep this repo outside iCloud-synced folders like `~/Documents`; iCloud can evict pieces of `node_modules` and cause this exact error. Moving the repo to a non-synced folder such as `~/Developer/CBCHackathon` is the permanent solution.

Scan the QR code with **Expo Go** (iOS: Camera app, Android: Expo Go app).

The app ships with 7 days of mock data so you can explore immediately without logging anything first.

### 2. Web Dashboard

```bash
cd aspera-web
npm install

# Copy the env template and fill in your Claude key
cp .env.local.example .env.local

npm run dev   # → http://localhost:3000
```

The web dashboard mirrors the mobile app's Today/Insights/Mood tabs and exposes the API routes used by the Chrome extension and push notification cron jobs.

### 3. Chrome Extension

```bash
# No build step required — plain JS
```

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `aspera-extension/` folder
5. The Aspera Focus icon appears in your toolbar

The extension immediately begins tracking browsing activity and POSTs telemetry to the Next.js backend every 30 seconds. Click the icon to see your focus score.

---

## TestFlight Distribution

The mobile app uses [EAS Build](https://docs.expo.dev/build/introduction/) for iOS distribution.

### First-time setup

```bash
# Install EAS CLI
npm install -g eas-cli

# Authenticate with your Expo account
eas login

# Inside aspera/ — links project to EAS, writes eas.json + sets projectId
cd aspera
eas build:configure
# Copy the projectId UUID it prints → paste into app.json extra.eas.projectId
```

### Build + submit to TestFlight

```bash
# Production build (~15 min on EAS cloud)
eas build --platform ios --profile production

# Submit to TestFlight (authenticates via your Apple ID)
eas submit --platform ios
```

After submit: App Store Connect → TestFlight → Add internal testers → send invite link.

For a development build with hot-reload on real device:

```bash
eas build --platform ios --profile development
npx expo start --dev-client
```

---

## Push Notifications

Bedtime log reminders and morning mood check-ins are delivered via Expo's push infrastructure, triggered by Vercel cron jobs.

| Notification         | Cron (UTC)   | Local (EST) |
| -------------------- | ------------ | ----------- |
| Morning check-in     | `0 12 * * *` | 8:00 AM     |
| Evening log reminder | `0 1 * * *`  | 9:00 PM     |

**Architecture:**

```
iPhone app              Next.js backend (Vercel)       Expo Push Service
────────────────        ────────────────────────       ─────────────────
First launch:
 requestPermissions()
 getExpoPushToken()  →  POST /api/push/register
                        saves token to /tmp

Vercel cron (2×/day):   GET /api/push/cron?type=…  →  expo.sendPushNotificationsAsync()
                        reads stored tokens               delivers to device
```

Toggle morning/evening notifications in **Settings → Notifications**.

---

## Features

### Mobile App (5 tabs)

**Today** — Dashboard with AI recommendation, weekly trend lines, peak day callout, integration cards (Spotify, Browsing Focus, Screen Time), streak counter with emergency reserves

**Log** — Daily self-report: Big Rocks (priorities), sleep, daylight, caffeine, workout + intensity, music genres, nutrition, alcohol, focus/energy/tasks ratings, custom metrics, tags

**Insights** — Claude AI analyzes 7 days of multi-source data and returns structured correlations with confidence levels, keystone habit detection, and personalized recommendations. Three coaching personalities: Analytical, Unserious, Stoic

**Mood** — Multi-capture mood/energy/stress tracking with emoji scales, 14-day trends, time-of-day curve analysis

**Settings** — Integration status hub, notification toggles, API key management, data controls

### Chrome Extension

- **Focus Score** (0-100) computed from productive vs. distracting browsing time
- **Site categorization** — 24 productive sites, 20 distracting sites, everything else neutral
- **Big Rock mode** — Set your #1 priority from the popup
- **Deep Work friction** — When enabled, distracting sites show a 15-second countdown with your priority reminder. "Continue anyway" button respects user autonomy
- **Backend sync** — Browsing telemetry pushed every 30 seconds to `/api/browsing` for cross-device intelligence

### AI Features (requires Claude API key)

- **Daily recommendations** — Context-aware, one-sentence actionable suggestions
- **Weekly insights** — 3-5 input-to-output correlations with confidence levels
- **Keystone habit detection** — Identifies the ONE habit that cascades across multiple outputs
- **Self-compassion layer** — Auto-activates during rough weeks, shifts tone from optimization to kindness
- **Somatic Interceptor** — Detects idle periods, guides breathing + affect labeling, generates Claude-powered cognitive reappraisal
- **Coaching personalities** — Analytical (data-driven), Unserious (witty), Stoic (Marcus Aurelius energy)

### Web Dashboard (`aspera-web/`)

- Today / Insights / Mood views built with Next.js 15 + Recharts
- Server-side Claude proxy (`/api/insights`, `/api/search`)
- Chrome extension relay (`/api/browsing`) — receives extension POSTs, serves data to mobile
- Push notification endpoints (`/api/push/register`, `/api/push/cron`)

---

## Tech Stack

| Layer        | Technology                                                  |
| ------------ | ----------------------------------------------------------- |
| Mobile       | React Native 0.81, Expo SDK 54, expo-router v6              |
| Web          | Next.js 15, React 19, Recharts, Tailwind CSS                |
| AI           | Claude Sonnet (claude-sonnet-4-6) via @anthropic-ai/sdk     |
| Storage      | AsyncStorage (mobile, local-first) · localStorage (web)     |
| Push         | Expo Push API + expo-server-sdk, Vercel cron                |
| Extension    | Chrome Manifest V3, service worker                          |
| Distribution | EAS Build + TestFlight                                      |
| Design       | Dark theme (#090C14), haptic feedback, animated transitions |

---

## Environment Variables

### Mobile (`aspera/.env`)

Copy `aspera/.env.example` and fill in your values:

```
EXPO_PUBLIC_CLAUDE_KEY=sk-ant-api03-your-key-here
EXPO_PUBLIC_API_URL=https://your-app.vercel.app
```

- `EXPO_PUBLIC_CLAUDE_KEY` — enables AI recommendations and insights. The app works without it (mock data populates automatically).
- `EXPO_PUBLIC_API_URL` — points the mobile app at your deployed Next.js backend for browsing sync and push token registration. Use `http://localhost:3000` during local development.

### Web (`aspera-web/.env.local`)

Copy `aspera-web/.env.local.example` and fill in your values:

```
CLAUDE_KEY=sk-ant-api03-your-key-here
```

---

## Testing Checklist

- [ ] **Today tab**: Shows weekly trends, peak day card, integration cards, streak counter
- [ ] **Log tab**: Fill all fields, tap Save — green confirmation appears
- [ ] **Insights tab**: Select a personality, tap Generate — correlations render with keystone highlight
- [ ] **Mood tab**: Log a check-in with emoji scales — trends update
- [ ] **Settings tab**: Enter API key, toggle notification reminders, see integration status cards
- [ ] **Extension popup**: Shows focus score and top sites after browsing
- [ ] **Deep Work mode**: Set a Big Rock, enable Deep Work, visit reddit.com — friction overlay appears
- [ ] **Somatic Interceptor**: On Today tab, long-press the invisible area next to "Today" header (top-right) for 0.5s — breathing modal appears
- [ ] **Web dashboard**: `cd aspera-web && npm run dev` → localhost:3000 loads Today/Insights/Mood
- [ ] **Push token**: First launch on real device → iOS "Allow Notifications" prompt → Vercel logs show `POST /api/push/register`
- [ ] **Manual cron test**: `curl https://your-app.vercel.app/api/push/cron?type=evening` → notification arrives on device

---

## Architecture Highlights

**Local-first privacy**: All user data stays on-device. Only outbound calls are to Claude (insights) and the Next.js backend (browsing sync + push tokens).

**Multi-source context fusion**: Every AI call includes data from 8 streams (Spotify, HealthKit, Calendar, Tasks, Browsing, Screen Time, Mood, Self-report) for holistic pattern detection.

**Emergency Reserves**: 2 guilt-free skip days per week. Streak continues. Resets Monday.

**Cohort telemetry**: Anonymized social proof ("3,247 others also missed a Big Rock today") normalizes struggle without surveillance.

---

## Team

Built at CBC Hackathon 2026. Powered by Claude.

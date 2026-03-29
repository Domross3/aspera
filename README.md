# Aspera

**AI-powered life optimization that treats the human as the system.**

Aspera correlates personal inputs (caffeine, sleep, workouts, music, nutrition) with cognitive outputs (focus, energy, tasks completed) using Claude AI — while actively protecting mental health through somatic intervention and self-compassion.

---

## Project Structure

```
CBCHackathon/
├── aspera/                  # React Native / Expo mobile app
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
git clone -b aspera https://github.com/Domross3/aspera.git
cd aspera/aspera

# Install dependencies (use Node 20 — run `node -v` to verify)
npm install

# (Optional) Create environment file with your Claude API key
# AI features work without this — the app loads mock data automatically
echo "EXPO_PUBLIC_CLAUDE_KEY=your-api-key-here" > .env

# Start the dev server
npx expo start
```

> **Troubleshooting:** If `npx expo start` fails, verify you're on Node 20 (`node -v`). Install via `brew install node@20 && brew link --overwrite node@20` on macOS or use [nvm](https://github.com/nvm-sh/nvm).

Scan the QR code with **Expo Go** (iOS: Camera app, Android: Expo Go app).

The app ships with 7 days of mock data so you can explore immediately without logging anything first.

### 2. Chrome Extension

```bash
# No build step required — plain JS
```

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `aspera-extension/` folder
5. The Aspera Focus icon appears in your toolbar

The extension immediately begins tracking browsing activity. Click the icon to see your focus score.

### 3. Firebase Bridge (Optional)

The extension syncs browsing data to Firebase so the mobile app can display live stats. This works out of the box with our hosted database — no setup required.

To verify the connection: browse a few sites for 30+ seconds, then check the Browsing Focus card on the app's Today tab. A green **LIVE** badge means real data is flowing.

---

## Features

### Mobile App (5 tabs)

**Today** — Dashboard with AI recommendation, weekly trend lines, peak day callout, integration cards (Spotify, Browsing Focus, Screen Time), streak counter with emergency reserves

**Log** — Daily self-report: Big Rocks (priorities), sleep, daylight, caffeine, workout + intensity, music genres, nutrition, alcohol, focus/energy/tasks ratings, custom metrics, tags

**Insights** — Claude AI analyzes 7 days of multi-source data and returns structured correlations with confidence levels, keystone habit detection, and personalized recommendations. Three coaching personalities: Analytical, Unserious, Stoic

**Mood** — Multi-capture mood/energy/stress tracking with emoji scales, 14-day trends, time-of-day curve analysis

**Settings** — Integration status hub, API key management, data controls

### Chrome Extension

- **Focus Score** (0-100) computed from productive vs. distracting browsing time
- **Site categorization** — 24 productive sites, 20 distracting sites, everything else neutral
- **Big Rock mode** — Set your #1 priority from the popup
- **Deep Work friction** — When enabled, distracting sites show a 15-second countdown with your priority reminder. "Continue anyway" button respects user autonomy
- **Firebase sync** — Browsing telemetry pushed every 30 seconds for cross-device intelligence

### AI Features (requires Claude API key)

- **Daily recommendations** — Context-aware, one-sentence actionable suggestions
- **Weekly insights** — 3-5 input-to-output correlations with confidence levels
- **Keystone habit detection** — Identifies the ONE habit that cascades across multiple outputs
- **Self-compassion layer** — Auto-activates during rough weeks, shifts tone from optimization to kindness
- **Somatic Interceptor** — Detects idle periods, guides breathing + affect labeling, generates Claude-powered cognitive reappraisal
- **Coaching personalities** — Analytical (data-driven), Unserious (witty), Stoic (Marcus Aurelius energy)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.81, Expo SDK 54, expo-router v6 |
| AI | Claude Sonnet (claude-sonnet-4-6) via @anthropic-ai/sdk |
| Storage | AsyncStorage (local-first, per-day keys) |
| Sync | Firebase Realtime Database (REST API, no SDK) |
| Extension | Chrome Manifest V3, service worker |
| Design | Dark theme (#090C14), haptic feedback, animated transitions |

---

## Environment Variables

Create `aspera/.env`:

```
EXPO_PUBLIC_CLAUDE_KEY=sk-ant-api03-your-key-here
```

The app works without an API key — mock data populates automatically and all non-AI features function normally. The API key enables AI recommendations, insights generation, and the Somatic Interceptor's reappraisal feature.

---

## Testing Checklist

- [ ] **Today tab**: Shows weekly trends, peak day card, integration cards, streak counter
- [ ] **Log tab**: Fill all fields, tap Save — green confirmation appears
- [ ] **Insights tab**: Select a personality, tap Generate — correlations render with keystone highlight
- [ ] **Mood tab**: Log a check-in with emoji scales — trends update
- [ ] **Settings tab**: Enter API key, see integration status cards
- [ ] **Extension popup**: Shows focus score and top sites after browsing
- [ ] **Deep Work mode**: Set a Big Rock, enable Deep Work, visit reddit.com — friction overlay appears
- [ ] **Somatic Interceptor**: On Today tab, long-press the invisible area next to "Today" header (top-right) for 0.5s — breathing modal appears

---

## Architecture Highlights

**Local-first privacy**: All data stays on-device. Only outbound calls are to Claude (insights) and Firebase (extension sync).

**Multi-source context fusion**: Every AI call includes data from 8 streams (Spotify, HealthKit, Calendar, Tasks, Browsing, Screen Time, Mood, Self-report) for holistic pattern detection.

**Emergency Reserves**: 2 guilt-free skip days per week. Streak continues. Resets Monday.

**Cohort telemetry**: Anonymized social proof ("3,247 others also missed a Big Rock today") normalizes struggle without surveillance.

---

## Team

Built at CBC Hackathon 2026. Powered by Claude.

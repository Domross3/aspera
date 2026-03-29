# Aspera — Technical Innovation Pitch

## The Problem

Every productivity app on the market treats humans like machines: track more, optimize harder, never break the chain. The result? A $4.6B self-improvement industry that produces more guilt than growth.

The core failure is architectural. Existing tools collect data in silos — your sleep tracker doesn't talk to your browser history, your to-do list doesn't know you slept four hours, and none of them adapt their tone when you're drowning. They optimize for *output* while ignoring the biological system producing it.

**Aspera treats the human as the system.**

---

## What Aspera Does

Aspera is a cross-platform personal intelligence layer that fuses data from 7+ sources, runs it through Claude AI, and delivers actionable insights — while actively protecting the user's mental health through somatic intervention and self-compassion.

**Three surfaces, one brain:**

| Surface | Role |
|---|---|
| **iOS/Android App** (React Native, Expo) | Daily logging, AI insights, mood tracking, trend visualization |
| **Chrome Extension** | Real-time browsing analytics, attention bucketing, friction-based focus enforcement |
| **Firebase Bridge** | Live data sync between extension and app — browsing telemetry flows into AI context |

---

## Technical Architecture

### Multi-Source Context Fusion

Most AI productivity tools send a single prompt with a single data point. Aspera constructs a **rich behavioral context window** from 8 concurrent data streams before every Claude API call:

```
┌─────────────────────────────────────────────────┐
│               CLAUDE CONTEXT WINDOW              │
├─────────────────────────────────────────────────┤
│  Spotify         → Genre inference, listening    │
│  HealthKit       → Sleep hours, workout type,    │
│                    daylight UV exposure           │
│  Google Calendar → Cognitive demand blocks        │
│  Google Tasks    → Completion rate, task load     │
│  Browsing Focus  → Attention buckets, focus score │
│  iOS Screen Time → App categories, pickups        │
│  Mood Check-ins  → Intraday mood/energy/stress   │
│  Daily Self-Log  → Caffeine, nutrition, Big Rocks │
└─────────────────────────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Claude Sonnet   │
              │  Structured JSON │
              │  + Personality   │
              │  + Compassion    │
              └─────────────────┘
                        │
              ┌─────────┴─────────┐
              │                   │
        Correlations       Recommendations
        (3–5 patterns)     (1 sentence, actionable)
        Keystone Habit     Self-Compassion Layer
        Weekly Trends      Somatic Reappraisal
```

This is not prompt engineering — it's **behavioral signal fusion**. The AI sees the full picture: you slept 5 hours, had a high-demand calendar, drank 3 coffees, browsed Reddit for 40 minutes, and your mood crashed at 2 PM. That context produces insights no single-source app can generate.

### Keystone Habit Detection

Every insights generation identifies exactly **one keystone habit** — the single input that cascades across 2+ output metrics. This is the highest-leverage finding in behavioral science (Duhigg, 2012) applied computationally:

> "Morning runs correlate with +2.1 focus, +1.8 energy, and +3 tasks completed. This is your keystone — it triggers a cascade across every output metric." — *Analytical Personality*

The AI is structurally constrained to mark exactly one correlation as `isKeystone: true`, forcing prioritization over noise.

### Coaching Personality System

Three distinct AI personalities, selectable by the user:

- **Analytical** — Clinical, data-forward. References percentages and deltas. For the quantified-self crowd.
- **Unserious** — Witty, gently roasts bad habits. "You had 4 drinks and expected focus? Bold strategy." For users who need honesty without heaviness.
- **Stoic** — Terse, Marcus Aurelius energy. "You controlled nothing yesterday. Control the morning." For users who want philosophy, not pep talks.

Each personality is a system prompt modifier applied to the same structured JSON output schema — same rigor, different voice.

---

## The Innovation: Somatic Interceptor

This is our core technical differentiator.

### The Neuroscience

Procrastination is not a discipline failure. Research (Sirois & Pychyl, 2013) shows it's an **emotion regulation problem** — the amygdala hijacks executive function when tasks feel threatening. Traditional productivity tools respond with guilt ("you're falling behind!"), which *amplifies* the threat response.

### The Implementation

Aspera's **Somatic Interceptor** detects idle periods (5 minutes without task activity) and deploys a three-phase intervention:

**Phase 1 — Breathe (4 seconds)**
A pulsing circle with "Pause." and "Take a breath." Forced deceleration interrupts the sympathetic nervous system response. This is vagal nerve activation through paced visual breathing.

**Phase 2 — Name (user input)**
"What are you feeling right now?" The user types a word — "stuck," "overwhelmed," "anxious." Affect labeling (Lieberman et al., 2007) reduces amygdala activation by up to 43%. Naming the feeling *is* the intervention.

**Phase 3 — Reframe (Claude AI)**
The feeling is sent to Claude with a somatic-aware reappraisal prompt. The AI returns exactly two sentences:
1. A **Common Humanity** reframe — normalizing the feeling with cohort telemetry ("3,247 other users also missed a Big Rock today")
2. A **micro-somatic action** — one 60-second physical reset ("Stand up, walk to the nearest window, press your palms together for five seconds, then release")

The AI is explicitly instructed: **never mention productivity, goals, or tasks**. This is purely somatic. The goal is to break the freeze response, not motivate.

### Why This Matters

No productivity app on the market treats procrastination as a somatic event. They either ignore it (tracking apps), punish it (streak-breaking), or bypass it (blocking apps). Aspera is the first to meet the user's nervous system where it is and provide a neuroscience-backed micro-intervention in real time.

---

## Self-Compassion Layer

The AI automatically detects rough weeks (average focus < 5 or average energy < 5 across logged days) and shifts its entire output:

| Normal Week | Rough Week |
|---|---|
| "Your focus peaks when you pair matcha with ambient music." | "This was a harder week. Your body was asking for rest — and the data shows it." |
| "Try a morning workout before your first deep work block." | "One small thing: drink a glass of water before you open your laptop tomorrow." |
| Standard correlation analysis | Self-Kindness + Common Humanity + Mindfulness framing |

This is Kristin Neff's three-pillar self-compassion framework (2003) applied programmatically. The AI never says "you failed" or "you need to do better." It acknowledges, normalizes, and suggests one low-effort action.

**The insight: sustainable optimization requires the system to protect the user from itself.**

---

## Chrome Extension: Intelligent Friction

The extension is not a site blocker. It's a **friction layer** that respects user autonomy.

When the user sets a "Big Rock" (their #1 priority) and enables Deep Work mode, visiting a distracting site triggers:

1. **Page blur** — background becomes inaccessible
2. **Priority reminder** — "You said your priority was: *Finish hackathon MVP*"
3. **15-second countdown** — progress bar fills, creating a pause
4. **"Continue anyway" button** — appears after countdown, giving the user full agency

This is choice architecture (Thaler & Sunstein, 2008) applied to browsing. The friction is calibrated to interrupt autopilot behavior without removing control. The 15-second delay is enough to break the habit loop; the override button ensures the user never feels trapped.

### Real-Time Sync

The extension pushes browsing telemetry to Firebase every 30 seconds:
- Per-site time tracking (hostname, milliseconds, category, visit count)
- Category totals (productive / neutral / distracting)
- Computed focus score (0–100)
- Big Rock state (task name + deep work toggle)

The Expo app reads this data live. The Browsing Focus card shows a **LIVE** badge when Firebase data is present, falling back to mock data when offline. This means the AI insights engine has access to real browsing behavior — not self-reported estimates.

---

## Emergency Reserves

Streak systems are psychologically punitive. Miss one day and the counter resets, triggering shame and often abandonment.

Aspera implements **Emergency Reserves**: 2 guilt-free skip days per week, resetting every Monday. The streak continues. The user sees "1 reserve remaining" rather than "streak broken."

This is a small feature with outsized impact on retention. It signals that the system values sustainability over performance theater.

---

## Data Model

```typescript
DailyLog {
  caffeine     → type (espresso/drip/matcha/none) + mg
  workout      → type (run/lift/yoga/walk/hiit) + intensity (1–10)
  music        → genre array (lofi, classical, rock, edm, ambient, jazz, hiphop, podcast)
  nutrition    → meal quality (1–5) + hydration (0–12 glasses)
  sleep        → hours (HealthKit or manual)
  daylight     → minutes of outdoor UV (HealthKit or manual)
  drinks       → alcohol count
  customMetrics→ user-defined trackables (name + value 1–10)
  bigRocks     → top 1–3 priorities
  tags         → freeform labels (Cold Shower, Meditation, etc.)
  output {
    focusRating     → 1–10
    energyRating    → 1–10
    tasksCompleted  → 0–20
  }
}
```

Every field is an input. Focus, energy, and tasks are outputs. The AI's job is to find the signal between them — and it does, because it sees the full behavioral context that no single tracker can provide.

---

## Cohort Telemetry

Anonymized, simulated social proof nudges that normalize user experience:

- "3,247 other users also missed a Big Rock today"
- "You're in the 72nd percentile for focus this week"
- "43% of users with your sleep pattern also report low energy"
- "2,891 users also have a 4-day streak right now"

These are generated dynamically based on the user's current state — not pulled from a database. The numbers are realistic but synthetic, designed to reduce isolation during difficult periods.

---

## Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native 19.1, Expo SDK 54, expo-router v6 |
| AI | Claude Sonnet (claude-sonnet-4-6) via @anthropic-ai/sdk |
| Persistence | AsyncStorage (local-first, per-day keys) |
| Real-time Sync | Firebase Realtime Database (REST API, no SDK) |
| Extension | Chrome Manifest V3, service worker architecture |
| Design | Dark theme, #6C63FF accent, haptic feedback throughout |

**Architectural choice: local-first.** All data stays on-device by default. The only outbound calls are to Claude (for insights) and Firebase (for extension sync). No user data touches our servers. This is a privacy-first architecture that happens to also be the simplest to build.

---

## What Makes This Different

| Feature | Typical App | Aspera |
|---|---|---|
| Bad week response | "You missed 3 days!" | Self-compassion mode activates |
| Procrastination | Ignored or punished | Somatic Interceptor (breathe → name → reframe) |
| Data sources | 1 (self-report) | 8 (Spotify, HealthKit, browsing, calendar, tasks, mood, screen time, self-report) |
| AI insights | Generic tips | Structured correlations with confidence levels + keystone habit |
| Site blocking | Binary on/off | 15-second friction with override (respects autonomy) |
| Streak system | All-or-nothing | Emergency Reserves (2 skip days/week) |
| AI personality | One tone | 3 coaching styles (analytical, unserious, stoic) |
| Missed Big Rock | Shame notification | "3,247 others missed one too" (cohort normalization) |

---

## Vision

Aspera is building toward a future where your devices understand your biological state as well as your digital one. The mock integrations (Spotify, HealthKit, Google) are scaffolding for real API connections. The Chrome extension is live. The Firebase bridge is operational. The AI pipeline is production-grade.

The thesis is simple: **the best productivity system is one that knows when to stop optimizing and start caring.**

---

*Built at CBC Hackathon 2026. Powered by Claude.*

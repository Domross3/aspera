# Aspera

## Working style

- **Think first**: state assumptions before coding. If a request has multiple readings, or a simpler path exists, say so — don't silently pick one.
- **Simplicity**: write the minimum that solves the problem. No speculative features, no abstractions for single-use code, no error handling for impossible cases.
- **Surgical edits**: touch only what the request needs. Don't refactor or reformat adjacent code. Only remove orphans your own change created; flag unrelated dead code, don't delete it.
- **Verify, don't assume done**: turn each task into a concrete check (`npm run mobile:typecheck`, observed device behavior, a failing-then-passing repro) and loop until it passes.

## Project structure

Three codebases in one repo:

- `aspera/` — React Native app (Expo SDK 54, expo-router v6, TypeScript)
- `aspera-web/` — Next.js 15 web dashboard + API backend (Vercel)
- `aspera-extension/` — Chrome extension (Manifest V3, vanilla JS)

They share a single Supabase project for auth + per-user data. The mobile app calls `aspera-web` (`/api/mobile/claude`) for Claude proxying; the extension POSTs browsing telemetry to `aspera-web` (`/api/browsing`).

## Product spine (set during the Phase B-3 design grill)

The strategic frame these decisions hang off — refer here when in doubt about what "in character" means for Aspera.

- **Target user**: A primary — Quantified Self burnout (Whoop/Oura/Apple Watch refugees who want signal without anxiety theater). E secondary halo — wellness-curious who tried Calm/Headspace and want more agency.
- **Killer feature**: the AI cross-source synthesizer + behavioral intervention engine. Aspera is a _technological relationship manager_, not a tracker.
- **Self-binding philosophy**: users set their own limits. Aspera is the lock, not the warden. Default friction (Tier 2) is on; users can opt into harder contract tiers (3/4) per-contract. Aspera never coerces the user — the user coerces themselves through Aspera.
- **Home model — Living Briefing**: Today tab opens with 2–3 sentences in Aspera's voice that reference real data. Below that, today's Big Rocks. Cards below as supporting evidence.
- **Daily rhythm — Bookended Day**: morning Big Rocks → optional quick captures → evening reflection (outcomes + tomorrow note). Two anchors. Reserves applied liberally (no streak shame).
- **Voice**: single consistent Aspera character — warm but reserved, specific over generic, "I noticed" not "you should." Models the Inner Coach research pattern. No personality picker. Intensity modulates via the self-compassion prefix when the user's week looks rough.
- **Privacy posture**: deliberately undecided publicly. Mechanics are Phase B-2 (Supabase RLS, encrypted at rest, per-user scoping). No marketing claims either direction yet — preserves business-model optionality.

## Running the app

Use the repo-root wrappers when possible:

`npm run mobile:start`

Direct app-folder commands still work:

`cd aspera && npm start`

The Chrome extension is loaded manually via chrome://extensions (developer mode, load unpacked).

## Stack

- React Native 19.1 / Expo SDK 54 / expo-router v6
- Claude Sonnet (claude-sonnet-4-6) via the `/api/mobile/claude` proxy on aspera-web
- Supabase Postgres + Auth — per-user data is cloud-backed, scoped via RLS (migrations 002 + 003)
- AsyncStorage as a write-through cache for offline support
- Apple Sign In for mobile auth
- Dark theme, #6C63FF accent
- `expo-updates` for OTA JS shipping (`eas update --branch preview`)

## Key constraints

- **Storage**: per-user cloud-backed via Supabase, server-encrypted, scoped via RLS. AsyncStorage acts as a write-through cache (Phase B-2). Mobile reads cloud first, falls back to cache on network failure; writes go to both.
- **API keys**: never bundled into the mobile binary. Claude calls go through aspera-web's `/api/mobile/claude` proxy with a bearer secret (`EXPO_PUBLIC_MOBILE_API_SECRET`). Anthropic key only lives server-side on Vercel.
- **Mocks**: `src/lib/mockData.ts` and mock-backed integrations are dev-only scaffolding. They render only when `__DEV__` is true. Production builds start empty until real integrations land.
- **Native Screen Time work**: `aspera/ios/` is committed state. Do not run `expo prebuild --clean` for Screen Controls work; edit native files directly and use full EAS/native builds because Family Controls, DeviceActivity, ManagedSettings, App Groups, and extensions cannot ship over OTA. Phase 8d-B implementation details live in `aspera/docs/phase-8d-b-screen-controls.md`.

## AI layer (`src/api/claude.ts`)

- **One Aspera voice** — `ASPERA_VOICE` constant. Warm but reserved, cites real numbers, "I noticed" not "you should." Inner Coach pattern.
- **Self-compassion prefix** auto-engages when weekly focus or energy averages < 5 (`detectBadWeek`). Modulates intensity, not identity.
- **Living Briefing** — `getMorningBriefing(log, recentLogs)` returns 2–3 sentences for Today's header card.
- **Insights** — `generateInsights(logs)` returns the `InsightsResponse` JSON shape. The retry/parse pipeline tolerates malformed model output. Exactly one correlation must be marked `isKeystone: true`.
- **Somatic Interceptor** (`src/components/interceptor/SomaticInterceptor.tsx`) — never mention productivity/goals/tasks in reappraisal prompts. Currently orphaned in the codebase pending rewire as the "Reset" intervention.

## Code style

- Functional components with hooks, no class components
- All types in `src/types/index.ts`
- Storage helpers in `src/storage/storage.ts`
- Integration normalization in `src/lib/integrations.ts`
- Tab screens in `app/(tabs)/`; modal/standalone routes in `app/` root

## Validation

No test suite. Verify changes with:
`npm run mobile:typecheck`

After UI changes, ship via OTA (`cd aspera && eas update --branch preview`), kill + reopen the installed app, and verify on device. EAS Build is only needed when adding native modules.

## Extension changes

The Chrome extension is vanilla JS. After edits, reload the extension in chrome://extensions and verify the popup + background script behavior manually.

## Out of scope for now

- **Real HealthKit integration** (Phase B-4): native module + Apple Sign In coordination. Replaces the recently removed "Apple Health" badges with actual data.
- **Type 5 + Type 2 contracts** (Phase B-5): daily-commitment + Big-Rock-bound interventions. Mobile + extension surfaces.
- **Demo-first onboarding** (Phase B-6): 90-sec sample-day demo + constrained setup.
- **iOS Family Controls / Tier 3/4 hard blocking** (Phase B-7): requires native rebuild + Apple approval.
- **N-of-1 experiments UI** (Phase B-8).
- **Real Spotify + Google Calendar integrations** (Phase B-9).

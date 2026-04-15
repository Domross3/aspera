# Aspera

## Project structure

Two codebases in one repo:

- `aspera/` — React Native app (Expo SDK 54, expo-router v6, TypeScript)
- `aspera-extension/` — Chrome extension (Manifest V3, vanilla JS)
- They communicate via Firebase Realtime Database (REST API, no SDK)

## Running the app

Use the repo-root wrappers when possible:

`npm run mobile:start`

Direct app-folder commands still work:

`cd aspera && npm start`

The Chrome extension is loaded manually via chrome://extensions (developer mode, load unpacked).

## Stack

- React Native 19.1 / Expo SDK 54 / expo-router v6
- Claude Sonnet (claude-sonnet-4-6) via @anthropic-ai/sdk
- AsyncStorage for persistence (local-first, per-day keys)
- Firebase Realtime Database for extension ↔ app sync
- Dark theme, #6C63FF accent

## Key constraints

- **Local-first**: all user data stays on-device. Only outbound calls are to Claude (insights) and Firebase (extension sync). Never add server-side storage.
- **Privacy**: never log, store, or transmit user data beyond what's explicitly in the existing Firebase bridge and Claude API calls.
- **API key**: loaded from `EXPO_PUBLIC_CLAUDE_KEY` env var or `DEMO_API_KEY` in `src/constants/config.ts`. Never hardcode keys.
- **Mock data is intentional**: `src/lib/mockData.ts` and mock-backed integrations are scaffolding for real API connections (Spotify, HealthKit, Google). Don't remove mocks — they're the demo path.

## AI layer (`src/api/claude.ts`)

- Three coaching personalities (analytical, unserious, stoic) — each is a system prompt modifier on the same JSON schema
- Self-compassion layer auto-activates when weekly focus or energy averages < 5
- Somatic Interceptor (`src/components/interceptor/SomaticInterceptor.tsx`) — never mention productivity/goals/tasks in reappraisal prompts
- Claude responses must be valid JSON matching `InsightsResponse` type — the app has retry logic and robust parsing but the schema is strict
- Exactly one correlation must be marked `isKeystone: true`

## Code style

- Functional components with hooks, no class components
- All types in `src/types/index.ts`
- Storage helpers in `src/storage/storage.ts`
- Integration normalization in `src/lib/integrations.ts`
- Tab screens in `app/(tabs)/`

## Validation

No test suite. Verify changes with:
`npm run mobile:typecheck`

After UI changes, run `npm run mobile:start` and verify in the Expo Go client.

## Extension changes

The Chrome extension is vanilla JS. After edits, reload the extension in chrome://extensions and verify the popup + background script behavior manually.

# Design Reskin Codex Review Notes

## Scope

This pass continues the `feat/design-reskin` branch from the warm-neutral token
foundation. It stays OTA-safe: no `eas build` was run. The app icon/splash files
are updated assets and will only appear in installed native shells after the
owner's next build.

## What Changed

- Fonts load at the app root: Hanken Grotesk, Quicksand, and Geist Mono.
- Shared motifs were added:
  - `src/components/common/BreathingOrb.tsx`
  - `src/components/common/PaperGrain.tsx`
  - `src/components/common/useFadeUp.ts`
  - `src/components/common/Wordmark.tsx`
- Breath pause now uses the breathing orb, grain, 9-second prompt cycling, and
  the warm-neutral button treatment while preserving AppState pause-on-leave and
  `onUnlock` completion wiring.
- Today now has the instrument header (`Today` + `dd.MM · HH:mm`), a time-aware
  greeting, and a mood check-in row that navigates to the Mood tab.
- The confidence-gated agent card was reframed as the spare "Pattern /
  tentative" panel while keeping `useAgentInsights` intact.
- Mood now includes `MoodPad`, a 2D mood × energy capture surface wired to the
  existing `MoodCheckIn` storage and cloud-sync path.
- Settings uses the compact wordmark and includes a persisted light/dark theme
  toggle.
- App icon, Android icon layers, favicon, and splash artwork were regenerated
  from the warm-neutral orb direction.

## Behavior Preserved

- Existing Today logging, Big Rocks, recommendation, quick-log, pattern, and
  somatic-interceptor flows remain in place.
- Mood trends, moments, promotion suggestions, and recent captures remain in
  place.
- The mood pad stores through `saveMoodCheckIn`; `{x,y}` maps to the existing
  1-5 mood/energy scale, with stress fixed at neutral `3`.
- Screen Time restriction CRUD and cheat code flow remain wired.

## Delay Caveat

The branch now includes the safety fix for delay restrictions: active delay
rules no longer call `applyShield()` directly, because Apple's default
ManagedSettings shield is a hard lockout and cannot display the React Native
breath-pause UI. True app-open delay still requires a future native
`ManagedSettingsUI` Shield Action extension.

## Verification

- `npm run mobile:typecheck` passes.
- Added tests for `aspMoodWord`, mood-pad 0..1 to 1..5 mapping, and delay
  hard-shield prevention.
- `npx jest --clearCache` and focused `npx jest --runTestsByPath ...` both
  hung silently in this worktree before printing diagnostics; the processes were
  killed cleanly and no Jest result should be inferred from this pass.

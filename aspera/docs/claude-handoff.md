# Aspera Claude Handoff

## Product Direction

Aspera is no longer just a daily log plus AI summaries. The product is moving toward an AI personal operating system that combines:

- manual daily inputs
- mood captures over time
- passive/connected data from integrations
- AI pattern detection across all of the above

The key new concept is **attention**: where time and cognitive energy actually went.

## Recent UX Changes

### Today Tab

- The Today tab now emphasizes **weekly metrics** instead of only today's metrics.
- Focus and Energy each have their own trendline card with an average line.
- The old 7-day overview / bar trend section was removed.
- Peak Day This Week is still present.
- Today's Inputs were moved lower in the layout and are treated more like collection inputs than the hero content.
- The streak card was moved to the bottom and now emphasizes **reserves remaining** instead of reserves used.
- A genre insight card now appears under music when today's logged genres have enough history.

Files:

- `/Users/dominicross/Documents/EECS/CBCHackathon/aspera/app/(tabs)/index.tsx`
- `/Users/dominicross/Documents/EECS/CBCHackathon/aspera/src/components/common/TrendLineCard.tsx`
- `/Users/dominicross/Documents/EECS/CBCHackathon/aspera/src/components/today/StreakCounter.tsx`
- `/Users/dominicross/Documents/EECS/CBCHackathon/aspera/src/components/today/MusicGenreInsight.tsx`

### Mood Tab

- Mood is now framed as **data over time**, not primarily as a log form.
- The tab shows trend cards for Mood, Energy, and Stress using aggregated daily averages.
- Recent captures are shown as context.
- Quick Capture was pushed to the bottom so it feeds the timeline rather than defining the whole page.

File:

- `/Users/dominicross/Documents/EECS/CBCHackathon/aspera/app/(tabs)/mood.tsx`

## New Integration Scaffolding

We introduced a normalized integration layer so the app can graduate from raw mocks to real connectors.

### New Shared Types

Added integration and attention types in:

- `/Users/dominicross/Documents/EECS/CBCHackathon/aspera/src/types/index.ts`

Important additions:

- `IntegrationConnection`
- `AttentionSummary`
- `AttentionBucketStat`
- `DailyIntegrationSummary`
- new storage keys for integration connections and integration summaries

### New Normalization Layer

Added:

- `/Users/dominicross/Documents/EECS/CBCHackathon/aspera/src/lib/integrations.ts`

This file:

- converts raw browsing data into normalized attention summaries
- infers music genres from Spotify tracks
- builds connector-level defaults for Settings
- assembles daily integration summaries that combine browsing, sleep, workouts, calendar, tasks, mood, and music

### Storage / Hooks

Added integration persistence helpers to:

- `/Users/dominicross/Documents/EECS/CBCHackathon/aspera/src/storage/storage.ts`

Added hook:

- `/Users/dominicross/Documents/EECS/CBCHackathon/aspera/src/hooks/useIntegrations.ts`

This is currently mock-backed scaffolding, but it gives the app a stable shape for future native and cloud sync work.

### Settings

Settings now has an Integrations section that exposes:

- normalized attention snapshot
- connector status cards
- planned iOS Screen Time integration
- mock refresh action

File:

- `/Users/dominicross/Documents/EECS/CBCHackathon/aspera/app/(tabs)/settings.tsx`

## AI Layer Changes

Claude prompts now include normalized integration summaries in addition to raw mock data.

File:

- `/Users/dominicross/Documents/EECS/CBCHackathon/aspera/src/api/claude.ts`

This means future insight generation can reason about:

- productive vs neutral vs distracting time
- attention fragmentation
- cross-source patterns between logs and integrations

## Recommended Next Build Steps

1. Add an `Attention Mix` or `Holistic Time Spent` card to the Today tab using `AttentionSummary`.
2. Feed `DailyIntegrationSummary` into the Insights UI directly, not just the Claude prompt.
3. Move from Expo Go assumptions to an Expo development build path for native modules.
4. Build an iOS Screen Time module using FamilyControls + DeviceActivity and normalize it into the existing `AttentionSummary` shape.
5. Upgrade Settings from status-only cards to actual connection/auth flows.
6. Replace mock connectors one by one without changing the normalized domain layer.

## Current Constraint

iOS Screen Time is still **planned**, not implemented. The normalized data model was added first so native Screen Time can slot into the same architecture later without redesigning the whole app.

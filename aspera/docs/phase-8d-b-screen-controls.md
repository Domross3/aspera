# Phase 8d-B: Live Screen Controls Native Build

## Summary

Phase 8d-B turns the 8d-A draft restriction UI into live iOS Screen Time enforcement. It ships as a native `1.2.0` build because Apple app selection, DeviceActivity monitoring, ManagedSettings shields, App Groups, and extension targets cannot be delivered over OTA.

This phase enables:

- Apple `FamilyActivityPicker` app/category selection.
- Time-window shielding.
- Per-app daily caps.
- A deliberate-friction cheat-code bypass.
- Native cleanup when restrictions are disabled or deleted.

Screen Time data ingestion/reporting is present only as a guarded
DeviceActivityReport spike. Enforcement is the preserved value path; report
totals must be proven on device before they power user-visible insights.

## Entry Conditions

- 8d-A is committed, pushed, and OTA-published to the `preview` channel for runtime `1.1.0`.
- On the installed `1.1.0` phone build, verify:
  - Tech tab opens without crashing.
  - Draft restriction create, edit, and delete work.
  - The disabled app-picker row copy is understandable.
  - No Apple picker opens and no app is shielded yet.

## Runtime And Build

- Bump app version/runtime from `1.1.0` to `1.2.0`.
- Build both native variants:
  - `EAS_SKIP_AUTO_FINGERPRINT=1 eas build --profile development --platform ios`
  - `EAS_SKIP_AUTO_FINGERPRINT=1 eas build --profile preview --platform ios`
- Because `runtimeVersion.policy = appVersion`, installed `1.1.0` builds stop receiving `1.2.0` OTAs until the new native build is installed.

## Native Checkpoint 1: Empty Extension

Add the `DeviceActivityMonitorExtension` target before enforcement logic:

- Deployment target `16.0`.
- Family Controls entitlement.
- App Group entitlement: `group.com.dominicross.aspera`.
- Embedded, signed, installed, and launchable inside a development build.

This checkpoint isolates Xcode target/signing problems from DeviceActivity logic.

## Native Checkpoint 2: Picker And Enforcement

Implement the native module bridge:

- `presentPicker(id)`
  - Presents `FamilyActivityPicker`.
  - Stores encoded `FamilyActivitySelection` at `selection:<id>` in the App Group.
  - Returns only counts to JS: `{ selectedAppCount, selectedCategoryCount, cancelled }`.
- `startMonitoring(config)`
  - JS passes a normalized `NativeRestrictionConfig`.
  - Native writes `config:<id>` to the App Group.
  - Native schedules the DeviceActivity monitor.
- `stopMonitoring(id)`
  - Stops window, cap, and cheat-rearm activities for the restriction.
- `applyShield(id)` / `clearShield(id)`
  - Uses one named `ManagedSettingsStore` per restriction.
- `grantCheat(id, minutes)`
  - Clears only the hit restriction.
  - Starts `restriction-cheat-rearm-<id>`.
  - Re-arm checks that the restriction is still active and applicable before shielding again.

`config:<id>` is written in one place: native, from the JS-provided `NativeRestrictionConfig`.

## Restriction UI

- Enable the app-selection row in `RestrictionEditor`.
- Add an `Active` toggle.
- New restrictions still default inactive.
- Active daily caps require at least one selected app.
- Active time windows require at least one selected app or selected category.
- Disable/delete cleanup order:
  1. Native `stopMonitoring(id)`.
  2. Native `clearShield(id)`.
  3. Native App Group state cleanup.
  4. Supabase update/delete.

## Cheat Flow

Cheats are not one-tap unlocks. The v1 default Apple shield cannot host custom cheat UI, so the product copy must clearly say: "Open Aspera to use a cheat."

Flow:

1. User confirms they are spending `1 of N` weekly cheats.
2. Aspera reveals a hidden random string.
3. User copies the string.
4. User pastes it back into Aspera.
5. Only an exact valid paste calls `grantCheat(id, 30)`.

The 30-minute lift is OS-driven through DeviceActivity, not a JS timer.

## Test Plan

Pure logic:

- Restrictions
  - Active daily caps reject zero selected apps.
  - Active time windows reject zero selected apps/categories.
  - Inactive drafts can save without selection.
  - Native config normalization matches `NativeRestrictionConfig`.
- Cheat policy
  - Weekly reset on new ISO week.
  - Spending increments `spentThisWeek`.
  - Spending beyond `weeklyCap` is blocked.
  - Lowering cap applies immediately.
  - Raising cap sets `pendingCap` for next week.
  - Random-code unlock rejects partial, wrong, and expired codes.

Hook/bridge tests:

- Mock `modules/screen-time/src`; avoid RN render tests.
- Picker result updates selected counts.
- Active save calls `startMonitoring(config)`.
- Inactive save calls `stopMonitoring(id)` and `clearShield(id)`.
- Delete calls native cleanup before Supabase delete.
- Native-unavailable builds do not crash.

Required local checks:

- `npm run mobile:typecheck`
- `npm test -- --runInBand`
- `pod install`
- `plutil -lint` on the app/extension plists and Xcode project
- targeted Swift typecheck for touched extension files
- Native build checkpoint after the empty extension target.
- Native build checkpoint after enforcement logic.

Manual device acceptance:

- Install `1.2.0` preview build on a physical iPhone.
- Picker opens from restriction editor and selected counts persist.
- Time-window limit shields a test app at the boundary.
- Toggle inactive clears shield.
- Daily `1 min/app` cap shields only the selected app; allow for iOS DeviceActivity reporting lag of several minutes.
- Delete clears shield and does not re-shield after relaunch.
- Cheat flow requires confirm, reveal code, copy/paste, then unlock.
- Cheat expires after 30 minutes and re-arms only if the restriction still applies.
- Weekly cheat cap blocks extra bypasses.
- Force-quit Aspera and verify OS-driven enforcement still runs.

## Assumptions

- No `expo prebuild --clean`.
- Physical iPhone only for native acceptance testing; simulators do not support real Screen Time flows.
- Preview build is the live user build; development build is for native debugging.

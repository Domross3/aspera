# Gratification delay → custom shield (ManagedSettingsUI)

## The problem this fixes
A delay rule used to call `applyShield()`, which sets Apple's **default**
`ManagedSettings` shield — a hard, indefinite block with no "wait then continue"
path. So a "30-second delay" became a permanent lockout (Codex's flag).

The JS half of the fix already shipped: `src/lib/restrictionBridge.ts` now only
shields a delay when `native.supportsDelayShield` is true, and otherwise leaves
the app unblocked. **`supportsDelayShield` is false on every build that lacks the
extension below**, so delay is currently inert (annoying but not a lockout). This
doc is the native half that makes delay actually delay.

## Why a custom extension is required (Apple constraints — read first)
- The system shield is **declarative and system-rendered**. You get
  `ShieldConfiguration` (background, icon `UIImage`, title, subtitle, two button
  labels) — **no custom views, no animation, no live countdown.**
- A `ShieldActionDelegate` handles button taps and must return **quickly** with
  `.close` / `.defer` / `.none`. **You cannot run a timer and cannot launch the
  host app** from it. So Aspera's animated `BreathPauseSheet` (RN) can NOT render
  over a blocked app — the shield can only *approximate* it statically.
- Therefore "friction → timed access" is done entirely on the shield: tap → wait
  → tap again to enter. No smooth ticking timer; show "~Ns, tap to continue".

## Two new app-extension targets
Both need entitlements `com.apple.developer.family-controls` +
`com.apple.security.application-groups: ["group.com.dominicross.aspera"]`, and
`deploymentTarget` 16.0. (Mirror the existing `DeviceActivityReportExtension`.)

1. **`AsperaShieldConfiguration`** — point id `com.apple.ManagedSettingsUI.shield-configuration-service`, principal class `ShieldConfigurationProvider`.
2. **`AsperaShieldAction`** — point id `com.apple.ManagedSettings.shield-action-service`, principal class `ShieldActionDelegate`.

### App-Group contract (new keys; mirror in JS constants)
- `delaySeconds:<id>` — already persisted by `startMonitoring` when the bridge
  calls it for a delay rule (extend the native `startRestrictionMonitoring` to
  accept `mode == "delay"` and just store the config — no DeviceActivity schedule).
- `delayUnlockAt:<id>` (epoch seconds) — written by the action extension when the
  user starts the wait; cleared on entry or "Not now".
- Post-wait access window reuses the existing `grantCheat`/`cheatExpiry` machinery.

### Pure decision function (unit-testable, no extension runtime)
```swift
enum ShieldVariant: Equatable { case breathe; case waiting(Int); case ready }

struct DelayState { var delaySeconds: Int; var unlockAt: Date? }

enum ShieldDecision {
  static func variant(_ s: DelayState, now: Date) -> ShieldVariant {
    guard let u = s.unlockAt else { return .breathe }
    let remaining = Int(u.timeIntervalSince(now).rounded(.up))
    return remaining > 0 ? .waiting(remaining) : .ready
  }
  // returns (response, newUnlockAt) — newUnlockAt == nil means "clear it"
  static func onPrimary(_ s: DelayState, now: Date) -> (ShieldActionResponse, Date?) {
    switch variant(s, now: now) {
    case .breathe: return (.defer, now.addingTimeInterval(TimeInterval(s.delaySeconds)))
    case .waiting: return (.defer, s.unlockAt)         // keep waiting
    case .ready:   return (.close, nil)                // caller grants the cheat window, then clears
    }
  }
}
```

### ShieldConfigurationProvider (static render of the variant)
```swift
import ManagedSettings; import ManagedSettingsUI; import UIKit
class ShieldConfigurationProvider: ShieldConfigurationDataSource {
  override func configuration(shielding app: Application) -> ShieldConfiguration {
    make(appName: app.localizedDisplayName ?? "this app", id: /* resolve from store */ "")
  }
  // + category / web-domain overloads → same make(...)
  private func make(appName: String, id: String) -> ShieldConfiguration {
    let s = readDelayState(id)                 // from App Group
    let (title, subtitle, primary): (String, String, String)
    switch ShieldDecision.variant(s, now: Date()) {
    case .breathe:        (title, subtitle, primary) = ("A pause", randomPrompt(), "I'll wait \(s.delaySeconds)s")
    case .waiting(let r): (title, subtitle, primary) = ("Breathe", "~\(r)s left — tap to check", "Still waiting")
    case .ready:          (title, subtitle, primary) = ("Okay.", "You waited. Open \(appName)?", "Open \(appName)")
    }
    return ShieldConfiguration(
      backgroundBlurStyle: .systemUltraThinMaterialDark,
      backgroundColor: UIColor(red: 10/255, green: 10/255, blue: 9/255, alpha: 1), // #0a0a09
      icon: UIImage(named: "ShieldOrb"),       // small static orb asset in the ext bundle
      title: .init(text: title, color: UIColor(red: 242/255, green: 239/255, blue: 232/255, alpha: 1)),
      subtitle: .init(text: subtitle, color: UIColor(red: 180/255, green: 175/255, blue: 165/255, alpha: 1)),
      primaryButtonLabel: .init(text: primary, color: UIColor(red: 10/255, green: 10/255, blue: 9/255, alpha: 1)),
      primaryButtonBackgroundColor: UIColor(red: 215/255, green: 210/255, blue: 198/255, alpha: 1), // glow
      secondaryButtonLabel: .init(text: "Not now", color: UIColor(white: 0.6, alpha: 1)))
  }
}
```
`randomPrompt()` = the 5 verbatim prompts from the breath-pause spec.

### ShieldActionDelegate
```swift
import ManagedSettings
class ShieldActionDelegate: ManagedSettings.ShieldActionDelegate {
  override func handle(action: ShieldAction, for app: ApplicationToken,
                       completionHandler: @escaping (ShieldActionResponse) -> Void) {
    completionHandler(resolve(action, id: /* resolve */ ""))
  }
  // + category / web overloads
  private func resolve(_ action: ShieldAction, id: String) -> ShieldActionResponse {
    var s = readDelayState(id); let now = Date()
    switch action {
    case .primaryButtonPressed:
      let (resp, unlock) = ShieldDecision.onPrimary(s, now: now)
      if case .ready = ShieldDecision.variant(s, now: now) {
        grantCheatWindow(id)                  // clears shield for N min (existing mechanism)
        writeUnlockAt(id, nil)
      } else { writeUnlockAt(id, unlock) }
      return resp
    case .secondaryButtonPressed: writeUnlockAt(id, nil); return .close
    @unknown default: return .none
    }
  }
}
```
**Note** on resolving `id` from a token: map the shielded token back to the
restriction id via the per-rule `ManagedSettingsStore` name you shield under
(`shieldStoreName(id)`), or shield each rule in its own store and key state by store.

## app.json (add when the targets exist — NOT before, or EAS credential setup breaks)
```jsonc
// extra.eas.build.experimental.ios.appExtensions  (append two entries)
{ "targetName": "AsperaShieldConfiguration",
  "bundleIdentifier": "com.dominicross.aspera.AsperaShieldConfiguration",
  "entitlements": { "com.apple.developer.family-controls": true,
    "com.apple.security.application-groups": ["group.com.dominicross.aspera"] } },
{ "targetName": "AsperaShieldAction",
  "bundleIdentifier": "com.dominicross.aspera.AsperaShieldAction",
  "entitlements": { "com.apple.developer.family-controls": true,
    "com.apple.security.application-groups": ["group.com.dominicross.aspera"] } }
```

## Native module flip (the bridge auto-enables when this is true)
In `modules/screen-time/ios/ScreenTimeModule.swift`: (1) make
`startRestrictionMonitoring` accept `mode == "delay"` (persist config only); (2)
expose the capability the JS reads:
```swift
Property("supportsDelayShield") { true }   // only in the build that includes the extensions
```

## Xcode wiring (the one step that must be done in Xcode — don't hand-edit .pbxproj)
1. Open `ios/Aspera.xcworkspace`. **File ▸ New ▸ Target ▸ Shield Configuration**
   (iOS) → name `AsperaShieldConfiguration`. Repeat with **Shield Action** →
   `AsperaShieldAction`.
2. For each: set the App Group + Family Controls capabilities, embed in the
   Aspera app, set deployment target 16.0, and add the Swift files above + the
   `ShieldOrb` image asset.
3. Add the two `appExtensions` entries to `app.json`, flip `supportsDelayShield`.
4. `eas build` (this is build-gated — Family Controls can't ship OTA), install,
   then verify on device.

## Test cases
**Swift (XCTest on the pure decision fns — inject `now` + a fake App-Group dict):**
- `variant`: no `unlockAt` → `.breathe`; `unlockAt = now+30` → `.waiting(≈30)`; `unlockAt = now-1` → `.ready`.
- `onPrimary`: `.breathe` → `(.defer, now+delay)`; `.waiting` → `(.defer, unchanged)`; `.ready` → `(.close, nil)`.
- secondary → clears `unlockAt`, `.close`.

**JS (already added, `src/lib/restrictionBridge.test.ts`):**
- delay + `supportsDelayShield:false` → **no `applyShield`**, calls `clearShield` (no lockout). ✅
- delay + `supportsDelayShield:true` → `startMonitoring(mode:"delay")` then `applyShield`. ✅

**On-device (after the build):** open a delayed app → Aspera "A pause" shield →
tap "I'll wait" → wait → tap "Open {app}" → app opens for the cheat window → re-arms.
"Not now" backs out. Confirm it never permanently locks.

// Handles taps on Aspera's custom shield (see ShieldConfigurationExtension).
//
// iOS only lets a shield action return .close / .defer / .none — it can't hold
// the app open for N seconds. So the pause is two-tap:
//
//   1st tap  → record the start time, keep the shield up (.defer)
//   tap before the pause is up → keep waiting (.defer)
//   tap after → lift the shield and let the app through (.close)
//
// Failure mode matters here: an earlier version of gratification delay could
// lock the user out permanently. This one always fails OPEN — any unexpected
// state clears the shield rather than trapping the user behind it.

import ManagedSettings

enum DelayActionConstants {
  static let appGroupId = "group.com.dominicross.aspera"

  static let activeIdKey = "delay:activeId"
  static let secondsKey = "delay:seconds"
  static let startedAtKey = "delay:startedAt"
  // When the shield was lifted. The app re-arms on next foreground; until then
  // the app stays open. Fails open by design.
  static let grantedAtKey = "delay:grantedAt"

  static var sharedDefaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }

  // Mirrors ScreenTimeConstants.shieldStoreName.
  static func shieldStoreName(_ id: String) -> String { "restriction-\(id)" }
}

class ShieldActionExtension: ShieldActionDelegate {
  /// Lift the shield for whichever restriction is currently in delay mode.
  private func liftShield() {
    let defaults = DelayActionConstants.sharedDefaults
    guard let id = defaults?.string(forKey: DelayActionConstants.activeIdKey),
          !id.isEmpty
    else {
      return
    }
    let store = ManagedSettingsStore(
      named: ManagedSettingsStore.Name(DelayActionConstants.shieldStoreName(id))
    )
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    defaults?.set(Date().timeIntervalSince1970, forKey: DelayActionConstants.grantedAtKey)
    defaults?.removeObject(forKey: DelayActionConstants.startedAtKey)
  }

  private func resolve(_ action: ShieldAction) -> ShieldActionResponse {
    let defaults = DelayActionConstants.sharedDefaults

    switch action {
    case .secondaryButtonPressed:
      // "Not now" — abandon the pause and go back to the home screen. Reset so
      // the next attempt starts a fresh countdown.
      defaults?.removeObject(forKey: DelayActionConstants.startedAtKey)
      return .close

    case .primaryButtonPressed:
      let configured = defaults?.integer(forKey: DelayActionConstants.secondsKey) ?? 0
      let seconds = configured > 0 ? configured : 30
      let startedAt = defaults?.double(forKey: DelayActionConstants.startedAtKey) ?? 0

      if startedAt <= 0 {
        // First tap: begin the pause, keep the shield up.
        defaults?.set(Date().timeIntervalSince1970, forKey: DelayActionConstants.startedAtKey)
        return .defer
      }

      let elapsed = Date().timeIntervalSince1970 - startedAt
      if elapsed >= Double(seconds) {
        liftShield()
        return .close
      }
      // Still waiting — redraw the shield with the updated countdown.
      return .defer

    @unknown default:
      // Unknown action: fail open rather than risk trapping the user.
      liftShield()
      return .close
    }
  }

  override func handle(
    action: ShieldAction,
    for application: ApplicationToken,
    completionHandler: @escaping (ShieldActionResponse) -> Void
  ) {
    completionHandler(resolve(action))
  }

  override func handle(
    action: ShieldAction,
    for webDomain: WebDomainToken,
    completionHandler: @escaping (ShieldActionResponse) -> Void
  ) {
    completionHandler(resolve(action))
  }

  override func handle(
    action: ShieldAction,
    for category: ActivityCategoryToken,
    completionHandler: @escaping (ShieldActionResponse) -> Void
  ) {
    completionHandler(resolve(action))
  }
}

import Foundation

// Mirror of aspera/src/lib/screenTime/constants.ts. MUST stay in sync with
// the JS constants AND the App Group capability on all three targets
// (main app, DeviceActivityMonitor, DeviceActivityReport). Drift silently
// breaks cross-process reads.
enum ScreenTimeConstants {
  static let appGroupId = "group.com.dominicross.aspera"

  static func selectionKey(_ id: String) -> String { "selection:\(id)" }
  static func configKey(_ id: String) -> String { "config:\(id)" }
  static func activeKey(_ id: String) -> String { "activeRestriction:\(id)" }
  static func cheatExpiryKey(_ id: String) -> String { "cheatExpiry:\(id)" }
  static func lastAppliedReasonKey(_ id: String) -> String { "lastAppliedReason:\(id)" }
  static let dailyTotalsKey = "dailyTotals"

  static func windowActivity(_ id: String) -> String { "restriction-window-\(id)" }
  static func capActivity(_ id: String) -> String { "restriction-cap-\(id)" }
  static func capEvent(_ id: String, appIndex: Int) -> String {
    "restriction-cap-\(id)-app-\(appIndex)"
  }
  static func capEventTokenKey(_ id: String, eventName: String) -> String {
    "capEventToken:\(id):\(eventName)"
  }
  static func capEventNamesKey(_ id: String) -> String { "capEventNames:\(id)" }
  static func capHitTokensKey(_ id: String) -> String { "capHitTokens:\(id)" }
  static func capHitDayKey(_ id: String) -> String { "capHitDay:\(id)" }
  static func cheatRearmActivity(_ id: String) -> String { "restriction-cheat-rearm-\(id)" }

  static func shieldStoreName(_ id: String) -> String { "restriction-\(id)" }

  static var sharedDefaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }
}

import Foundation

// Mirror of aspera/src/lib/screenTime/constants.ts. MUST stay in sync with
// the JS constants AND the App Group capability on all three targets
// (main app, DeviceActivityMonitor, DeviceActivityReport). Drift silently
// breaks cross-process reads.
enum ScreenTimeConstants {
  static let appGroupId = "group.com.dominicross.aspera"

  static func selectionKey(_ id: String) -> String { "selection:\(id)" }
  static func activeKey(_ id: String) -> String { "activeRestriction:\(id)" }
  static func cheatExpiryKey(_ id: String) -> String { "cheatExpiry:\(id)" }
  static func lastAppliedReasonKey(_ id: String) -> String { "lastAppliedReason:\(id)" }
  static let dailyTotalsKey = "dailyTotals"

  static func windowActivity(_ id: String) -> String { "restriction-window-\(id)" }
  static func capActivity(_ id: String) -> String { "restriction-cap-\(id)" }
  static func cheatRearmActivity(_ id: String) -> String { "restriction-cheat-rearm-\(id)" }

  static func shieldStoreName(_ id: String) -> String { "restriction-\(id)" }

  static var sharedDefaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }
}

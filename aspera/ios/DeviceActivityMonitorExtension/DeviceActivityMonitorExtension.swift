import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings

private enum STConstants {
  static let appGroupId = "group.com.dominicross.aspera"

  static func selectionKey(_ id: String) -> String { "selection:\(id)" }
  static func configKey(_ id: String) -> String { "config:\(id)" }
  static func activeKey(_ id: String) -> String { "activeRestriction:\(id)" }
  static func cheatExpiryKey(_ id: String) -> String { "cheatExpiry:\(id)" }
  static func lastAppliedReasonKey(_ id: String) -> String { "lastAppliedReason:\(id)" }
  static func capEventTokenKey(_ id: String, eventName: String) -> String {
    "capEventToken:\(id):\(eventName)"
  }
  static func capHitTokensKey(_ id: String) -> String { "capHitTokens:\(id)" }
  static func capHitDayKey(_ id: String) -> String { "capHitDay:\(id)" }
  static func windowActivity(_ id: String) -> String { "restriction-window-\(id)" }
  static func capActivity(_ id: String) -> String { "restriction-cap-\(id)" }
  static func cheatRearmActivity(_ id: String) -> String { "restriction-cheat-rearm-\(id)" }
  static func shieldStoreName(_ id: String) -> String { "restriction-\(id)" }

  static let windowPrefix = "restriction-window-"
  static let capPrefix = "restriction-cap-"
  static let cheatPrefix = "restriction-cheat-rearm-"

  static var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }
}

private struct NativeRestrictionConfig {
  let id: String
  let active: Bool
  let mode: String
  let weekdays: [Int]
  let windowStart: String?
  let windowEnd: String?

  init?(_ dictionary: [String: Any]) {
    guard
      let id = dictionary["id"] as? String,
      let mode = dictionary["mode"] as? String
    else {
      return nil
    }
    self.id = id
    self.active = (dictionary["active"] as? Bool) ?? false
    self.mode = mode
    self.weekdays = (dictionary["weekdays"] as? [Int]) ?? [0, 1, 2, 3, 4, 5, 6]
    self.windowStart = dictionary["windowStart"] as? String
    self.windowEnd = dictionary["windowEnd"] as? String
  }
}

final class DeviceActivityMonitorExtension: DeviceActivityMonitor {
  override func intervalDidStart(for activity: DeviceActivityName) {
    super.intervalDidStart(for: activity)
    let raw = activity.rawValue

    if let id = raw.droppingPrefix(STConstants.windowPrefix),
       let config = loadConfig(id),
       config.active,
       config.mode == "time_window",
       appliesToday(config),
       !isCheatActive(id) {
      applySelectionShield(id, reason: "window")
      return
    }

    if let id = raw.droppingPrefix(STConstants.capPrefix),
       let config = loadConfig(id),
       config.active,
       config.mode == "daily_limit" {
      clearCapHits(id)
      clearShield(id)
    }
  }

  override func intervalDidEnd(for activity: DeviceActivityName) {
    super.intervalDidEnd(for: activity)
    let raw = activity.rawValue

    if let id = raw.droppingPrefix(STConstants.windowPrefix) {
      clearShield(id)
      return
    }

    if let id = raw.droppingPrefix(STConstants.capPrefix) {
      clearCapHits(id)
      clearShield(id)
      return
    }

    if let id = raw.droppingPrefix(STConstants.cheatPrefix) {
      rearmAfterCheatIfNeeded(id)
    }
  }

  override func eventDidReachThreshold(
    _ event: DeviceActivityEvent.Name,
    activity: DeviceActivityName
  ) {
    super.eventDidReachThreshold(event, activity: activity)
    guard
      let id = activity.rawValue.droppingPrefix(STConstants.capPrefix),
      let config = loadConfig(id),
      config.active,
      config.mode == "daily_limit",
      appliesToday(config),
      !isCheatActive(id),
      let tokenData = STConstants.defaults?.data(
        forKey: STConstants.capEventTokenKey(id, eventName: event.rawValue)
      )
    else {
      return
    }

    addCapHit(id, tokenData: tokenData)
    applyCapHitShield(id, reason: "cap")
  }
}

private func loadConfig(_ id: String) -> NativeRestrictionConfig? {
  guard
    let dictionary = STConstants.defaults?.dictionary(forKey: STConstants.configKey(id))
  else {
    return nil
  }
  return NativeRestrictionConfig(dictionary)
}

private func loadSelection(_ id: String) -> FamilyActivitySelection? {
  guard let data = STConstants.defaults?.data(forKey: STConstants.selectionKey(id)) else {
    return nil
  }
  return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
}

private func applySelectionShield(_ id: String, reason: String) {
  guard let selection = loadSelection(id) else { return }
  let store = ManagedSettingsStore(named: ManagedSettingsStore.Name(STConstants.shieldStoreName(id)))
  store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
  store.shield.applicationCategories = selection.categoryTokens.isEmpty
    ? nil
    : .specific(selection.categoryTokens)
  STConstants.defaults?.set(true, forKey: STConstants.activeKey(id))
  STConstants.defaults?.set(reason, forKey: STConstants.lastAppliedReasonKey(id))
}

private func applyCapHitShield(_ id: String, reason: String) {
  let tokenDatas = STConstants.defaults?.array(forKey: STConstants.capHitTokensKey(id)) as? [Data] ?? []
  let tokens = Set(tokenDatas.compactMap {
    try? JSONDecoder().decode(ApplicationToken.self, from: $0)
  })
  guard !tokens.isEmpty else { return }

  let store = ManagedSettingsStore(named: ManagedSettingsStore.Name(STConstants.shieldStoreName(id)))
  store.shield.applications = tokens
  STConstants.defaults?.set(true, forKey: STConstants.activeKey(id))
  STConstants.defaults?.set(reason, forKey: STConstants.lastAppliedReasonKey(id))
}

private func clearShield(_ id: String) {
  let store = ManagedSettingsStore(named: ManagedSettingsStore.Name(STConstants.shieldStoreName(id)))
  store.shield.applications = nil
  store.shield.applicationCategories = nil
  STConstants.defaults?.set(false, forKey: STConstants.activeKey(id))
  STConstants.defaults?.removeObject(forKey: STConstants.lastAppliedReasonKey(id))
}

private func addCapHit(_ id: String, tokenData: Data) {
  var tokenDatas = STConstants.defaults?.array(forKey: STConstants.capHitTokensKey(id)) as? [Data] ?? []
  if !tokenDatas.contains(tokenData) {
    tokenDatas.append(tokenData)
  }
  STConstants.defaults?.set(tokenDatas, forKey: STConstants.capHitTokensKey(id))
  STConstants.defaults?.set(todayString(), forKey: STConstants.capHitDayKey(id))
}

private func clearCapHits(_ id: String) {
  STConstants.defaults?.removeObject(forKey: STConstants.capHitTokensKey(id))
  STConstants.defaults?.removeObject(forKey: STConstants.capHitDayKey(id))
}

private func rearmAfterCheatIfNeeded(_ id: String) {
  STConstants.defaults?.removeObject(forKey: STConstants.cheatExpiryKey(id))
  guard
    let config = loadConfig(id),
    config.active,
    appliesToday(config)
  else {
    clearShield(id)
    return
  }

  if config.mode == "time_window" {
    if isWithinWindow(config) {
      applySelectionShield(id, reason: "cheat-rearm")
    }
    return
  }

  if config.mode == "daily_limit",
     STConstants.defaults?.string(forKey: STConstants.capHitDayKey(id)) == todayString() {
    applyCapHitShield(id, reason: "cheat-rearm")
  }
}

private func isCheatActive(_ id: String) -> Bool {
  let expiry = STConstants.defaults?.double(forKey: STConstants.cheatExpiryKey(id)) ?? 0
  return expiry > Date().timeIntervalSince1970
}

private func appliesToday(_ config: NativeRestrictionConfig) -> Bool {
  config.weekdays.contains(Calendar.current.component(.weekday, from: Date()) - 1)
}

private func isWithinWindow(_ config: NativeRestrictionConfig) -> Bool {
  guard
    let start = config.windowStart.flatMap(minutesFromHHMM),
    let end = config.windowEnd.flatMap(minutesFromHHMM)
  else {
    return false
  }
  let components = Calendar.current.dateComponents([.hour, .minute], from: Date())
  let now = (components.hour ?? 0) * 60 + (components.minute ?? 0)
  if start < end {
    return now >= start && now < end
  }
  return now >= start || now < end
}

private func minutesFromHHMM(_ value: String) -> Int? {
  let parts = value.split(separator: ":").compactMap { Int($0) }
  guard parts.count == 2 else { return nil }
  return parts[0] * 60 + parts[1]
}

private func todayString() -> String {
  let formatter = DateFormatter()
  formatter.calendar = Calendar(identifier: .gregorian)
  formatter.locale = Locale(identifier: "en_US_POSIX")
  formatter.dateFormat = "yyyy-MM-dd"
  return formatter.string(from: Date())
}

private extension String {
  func droppingPrefix(_ prefix: String) -> String? {
    guard hasPrefix(prefix) else { return nil }
    return String(dropFirst(prefix.count))
  }
}

import ExpoModulesCore
import DeviceActivity
import FamilyControls
import ManagedSettings
import SwiftUI
import UIKit

private func mapStatus(_ status: AuthorizationStatus) -> String {
  switch status {
  case .notDetermined: return "notDetermined"
  case .denied: return "denied"
  case .approved: return "approved"
  @unknown default: return "notDetermined"
  }
}

public class ScreenTimeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ScreenTime")

    Function("getAuthorizationStatus") { () -> String in
      if #available(iOS 16.0, *) {
        return mapStatus(AuthorizationCenter.shared.authorizationStatus)
      }
      return "unavailable"
    }

    AsyncFunction("requestAuthorization") { () async throws -> String in
      guard #available(iOS 16.0, *) else { return "unavailable" }
      // `.individual` = self-restriction (no guardian/child pairing).
      try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
      return mapStatus(AuthorizationCenter.shared.authorizationStatus)
    }

    // ── Enforcement surface — bodies land in 8d / cheat / 8b ──────────────

    AsyncFunction("presentPicker") { (_ restrictionId: String) async throws -> [String: Any] in
      guard #available(iOS 16.0, *) else {
        return ["selectedAppCount": 0, "selectedCategoryCount": 0, "cancelled": true]
      }
      return try await presentFamilyActivityPicker(restrictionId: restrictionId)
    }

    AsyncFunction("applyShield") { (_ restrictionId: String) async throws in
      guard #available(iOS 16.0, *) else { return }
      try applySelectionShield(restrictionId: restrictionId, reason: "manual")
    }

    AsyncFunction("clearShield") { (_ restrictionId: String) async throws in
      guard #available(iOS 16.0, *) else { return }
      clearRestrictionShield(restrictionId: restrictionId)
    }

    AsyncFunction("startMonitoring") { (_ config: [String: Any]) async throws in
      guard #available(iOS 16.0, *) else { return }
      try startRestrictionMonitoring(config: config)
    }

    AsyncFunction("stopMonitoring") { (_ restrictionId: String) async throws in
      guard #available(iOS 16.0, *) else { return }
      stopRestrictionMonitoring(restrictionId: restrictionId)
    }

    AsyncFunction("clearRestrictionState") { (_ restrictionId: String) async throws in
      guard #available(iOS 16.0, *) else { return }
      clearRestrictionState(restrictionId: restrictionId)
    }

    AsyncFunction("grantCheat") { (_ restrictionId: String, _ minutes: Int) async throws in
      guard #available(iOS 16.0, *) else { return }
      try grantRestrictionCheat(restrictionId: restrictionId, minutes: minutes)
    }

    AsyncFunction("refreshDailyTotals") { () async throws -> [[String: Any]] in
      guard #available(iOS 16.0, *) else { return [] }
      try await presentScreenTimeReport()
      return readStoredDailyTotals()
    }

    AsyncFunction("readDailyTotals") { () async throws -> [[String: Any]] in
      return readStoredDailyTotals()
    }
  }
}

@available(iOS 16.0, *)
extension DeviceActivityReport.Context {
  static let asperaDailyTotals = Self("Aspera Daily Totals")
}

@available(iOS 16.0, *)
private struct PickerHostView: View {
  @State var selection: FamilyActivitySelection
  let onCancel: () -> Void
  let onDone: (FamilyActivitySelection) -> Void

  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Choose Apps")
        .toolbar {
          ToolbarItem(placement: .cancellationAction) {
            Button("Cancel", action: onCancel)
          }
          ToolbarItem(placement: .confirmationAction) {
            Button("Done") {
              onDone(selection)
            }
          }
        }
    }
  }
}

@available(iOS 16.0, *)
private struct ScreenTimeReportHostView: View {
  let onDone: () -> Void

  var body: some View {
    NavigationView {
      VStack(spacing: 16) {
        Text("Aspera reads aggregate Screen Time categories only. App names stay inside Apple's picker and report sandbox.")
          .font(.footnote)
          .foregroundStyle(.secondary)
          .multilineTextAlignment(.center)
          .padding(.horizontal)

        DeviceActivityReport(.asperaDailyTotals, filter: screenTimeReportFilter())
          .frame(minHeight: 180)
      }
      .padding(.vertical, 20)
      .navigationTitle("Screen Time")
      .toolbar {
        ToolbarItem(placement: .confirmationAction) {
          Button("Done", action: onDone)
        }
      }
    }
  }
}

@available(iOS 16.0, *)
private func screenTimeReportFilter() -> DeviceActivityFilter {
  let calendar = Calendar.current
  let todayStart = calendar.startOfDay(for: Date())
  let start = calendar.date(
    byAdding: .day,
    value: -(ScreenTimeConstants.reportLookbackDays - 1),
    to: todayStart
  ) ?? todayStart
  let end = calendar.date(byAdding: .day, value: 1, to: todayStart) ?? Date()
  return DeviceActivityFilter(
    segment: .daily(during: DateInterval(start: start, end: end)),
    users: .all,
    devices: .all
  )
}

@available(iOS 16.0, *)
private func presentScreenTimeReport() async throws {
  try await withCheckedThrowingContinuation { continuation in
    Task { @MainActor in
      guard let presenter = topViewController() else {
        continuation.resume(throwing: ScreenTimeException("Could not present Screen Time report."))
        return
      }

      var hostingController: UIHostingController<ScreenTimeReportHostView>?
      let view = ScreenTimeReportHostView(
        onDone: {
          hostingController?.dismiss(animated: true) {
            continuation.resume()
          }
        }
      )
      hostingController = UIHostingController(rootView: view)
      hostingController?.isModalInPresentation = true
      presenter.present(hostingController!, animated: true)
    }
  }
}

private func readStoredDailyTotals() -> [[String: Any]] {
  guard
    let json = ScreenTimeConstants.sharedDefaults?.string(
      forKey: ScreenTimeConstants.dailyTotalsKey
    ),
    let data = json.data(using: .utf8),
    let object = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
  else {
    return []
  }
  return object
}

@available(iOS 16.0, *)
private func presentFamilyActivityPicker(restrictionId: String) async throws -> [String: Any] {
  try await withCheckedThrowingContinuation { continuation in
    Task { @MainActor in
      guard let presenter = topViewController() else {
        continuation.resume(throwing: ScreenTimeException("Could not present app picker."))
        return
      }

      let initialSelection = loadSelection(restrictionId: restrictionId) ?? FamilyActivitySelection()
      var hostingController: UIHostingController<PickerHostView>?
      let view = PickerHostView(
        selection: initialSelection,
        onCancel: {
          hostingController?.dismiss(animated: true) {
            continuation.resume(returning: [
              "selectedAppCount": initialSelection.applicationTokens.count,
              "selectedCategoryCount": initialSelection.categoryTokens.count,
              "cancelled": true,
            ])
          }
        },
        onDone: { selection in
          do {
            try saveSelection(selection, restrictionId: restrictionId)
            hostingController?.dismiss(animated: true) {
              continuation.resume(returning: [
                "selectedAppCount": selection.applicationTokens.count,
                "selectedCategoryCount": selection.categoryTokens.count,
                "cancelled": false,
              ])
            }
          } catch {
            hostingController?.dismiss(animated: true) {
              continuation.resume(throwing: error)
            }
          }
        }
      )
      hostingController = UIHostingController(rootView: view)
      hostingController?.isModalInPresentation = true
      presenter.present(hostingController!, animated: true)
    }
  }
}

@MainActor
private func topViewController() -> UIViewController? {
  let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
  let root = scenes
    .flatMap { $0.windows }
    .first { $0.isKeyWindow }?
    .rootViewController
  var top = root
  while let presented = top?.presentedViewController {
    top = presented
  }
  return top
}

@available(iOS 16.0, *)
private func loadSelection(restrictionId: String) -> FamilyActivitySelection? {
  guard
    let data = ScreenTimeConstants.sharedDefaults?.data(
      forKey: ScreenTimeConstants.selectionKey(restrictionId)
    )
  else {
    return nil
  }
  return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
}

@available(iOS 16.0, *)
private func saveSelection(_ selection: FamilyActivitySelection, restrictionId: String) throws {
  let data = try JSONEncoder().encode(selection)
  ScreenTimeConstants.sharedDefaults?.set(
    data,
    forKey: ScreenTimeConstants.selectionKey(restrictionId)
  )
}

@available(iOS 16.0, *)
private func applySelectionShield(restrictionId: String, reason: String) throws {
  guard let selection = loadSelection(restrictionId: restrictionId) else {
    throw ScreenTimeException("Choose at least one app before activating.")
  }

  let store = ManagedSettingsStore(
    named: ManagedSettingsStore.Name(ScreenTimeConstants.shieldStoreName(restrictionId))
  )
  store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
  store.shield.applicationCategories = selection.categoryTokens.isEmpty
    ? nil
    : .specific(selection.categoryTokens)

  let defaults = ScreenTimeConstants.sharedDefaults
  defaults?.set(true, forKey: ScreenTimeConstants.activeKey(restrictionId))
  defaults?.set(reason, forKey: ScreenTimeConstants.lastAppliedReasonKey(restrictionId))
}

@available(iOS 16.0, *)
private func clearRestrictionShield(restrictionId: String) {
  let store = ManagedSettingsStore(
    named: ManagedSettingsStore.Name(ScreenTimeConstants.shieldStoreName(restrictionId))
  )
  store.shield.applications = nil
  store.shield.applicationCategories = nil
  let defaults = ScreenTimeConstants.sharedDefaults
  defaults?.set(false, forKey: ScreenTimeConstants.activeKey(restrictionId))
  defaults?.removeObject(forKey: ScreenTimeConstants.lastAppliedReasonKey(restrictionId))
}

@available(iOS 16.0, *)
private func startRestrictionMonitoring(config: [String: Any]) throws {
  guard let restrictionId = config["id"] as? String else {
    throw ScreenTimeException("Missing restriction id.")
  }
  guard let mode = config["mode"] as? String else {
    throw ScreenTimeException("Missing restriction mode.")
  }

  let defaults = ScreenTimeConstants.sharedDefaults
  defaults?.set(config, forKey: ScreenTimeConstants.configKey(restrictionId))
  stopRestrictionMonitoring(restrictionId: restrictionId)

  guard (config["active"] as? Bool) == true else {
    clearRestrictionShield(restrictionId: restrictionId)
    return
  }

  if mode == "time_window" {
    guard
      let start = config["windowStart"] as? String,
      let end = config["windowEnd"] as? String
    else {
      throw ScreenTimeException("Missing time window.")
    }
    let schedule = DeviceActivitySchedule(
      intervalStart: try dateComponents(fromHHMM: start),
      intervalEnd: try dateComponents(fromHHMM: end),
      repeats: true
    )
    try DeviceActivityCenter().startMonitoring(
      DeviceActivityName(ScreenTimeConstants.windowActivity(restrictionId)),
      during: schedule
    )
    return
  }

  guard mode == "daily_limit" else {
    throw ScreenTimeException("Unknown restriction mode.")
  }
  guard let selection = loadSelection(restrictionId: restrictionId) else {
    throw ScreenTimeException("Choose at least one app before activating.")
  }
  let dailyLimitMin = max(1, config["dailyLimitMin"] as? Int ?? 1)
  var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [:]
  var eventNames: [String] = []

  for (index, token) in Array(selection.applicationTokens).enumerated() {
    let rawName = ScreenTimeConstants.capEvent(restrictionId, appIndex: index)
    let eventName = DeviceActivityEvent.Name(rawName)
    events[eventName] = DeviceActivityEvent(
      applications: [token],
      threshold: DateComponents(minute: dailyLimitMin)
    )
    eventNames.append(rawName)
    if let data = try? JSONEncoder().encode(token) {
      defaults?.set(
        data,
        forKey: ScreenTimeConstants.capEventTokenKey(restrictionId, eventName: rawName)
      )
    }
  }

  guard !events.isEmpty else {
    throw ScreenTimeException("Daily caps require at least one selected app.")
  }

  defaults?.set(eventNames, forKey: ScreenTimeConstants.capEventNamesKey(restrictionId))
  let schedule = DeviceActivitySchedule(
    intervalStart: DateComponents(hour: 0, minute: 0),
    intervalEnd: DateComponents(hour: 23, minute: 59),
    repeats: true
  )
  try DeviceActivityCenter().startMonitoring(
    DeviceActivityName(ScreenTimeConstants.capActivity(restrictionId)),
    during: schedule,
    events: events
  )
}

@available(iOS 16.0, *)
private func stopRestrictionMonitoring(restrictionId: String) {
  DeviceActivityCenter().stopMonitoring([
    DeviceActivityName(ScreenTimeConstants.windowActivity(restrictionId)),
    DeviceActivityName(ScreenTimeConstants.capActivity(restrictionId)),
    DeviceActivityName(ScreenTimeConstants.cheatRearmActivity(restrictionId)),
  ])
}

@available(iOS 16.0, *)
private func clearRestrictionState(restrictionId: String) {
  let defaults = ScreenTimeConstants.sharedDefaults
  let eventNames = defaults?.stringArray(
    forKey: ScreenTimeConstants.capEventNamesKey(restrictionId)
  ) ?? []
  for eventName in eventNames {
    defaults?.removeObject(
      forKey: ScreenTimeConstants.capEventTokenKey(restrictionId, eventName: eventName)
    )
  }
  [
    ScreenTimeConstants.selectionKey(restrictionId),
    ScreenTimeConstants.configKey(restrictionId),
    ScreenTimeConstants.activeKey(restrictionId),
    ScreenTimeConstants.cheatExpiryKey(restrictionId),
    ScreenTimeConstants.lastAppliedReasonKey(restrictionId),
    ScreenTimeConstants.capEventNamesKey(restrictionId),
    ScreenTimeConstants.capHitTokensKey(restrictionId),
    ScreenTimeConstants.capHitDayKey(restrictionId),
  ].forEach { defaults?.removeObject(forKey: $0) }
}

@available(iOS 16.0, *)
private func grantRestrictionCheat(restrictionId: String, minutes: Int) throws {
  clearRestrictionShield(restrictionId: restrictionId)
  let now = Date()
  let expiry = Calendar.current.date(
    byAdding: .minute,
    value: max(1, minutes),
    to: now
  ) ?? now.addingTimeInterval(TimeInterval(max(1, minutes) * 60))
  ScreenTimeConstants.sharedDefaults?.set(
    expiry.timeIntervalSince1970,
    forKey: ScreenTimeConstants.cheatExpiryKey(restrictionId)
  )

  let calendar = Calendar.current
  let schedule = DeviceActivitySchedule(
    intervalStart: calendar.dateComponents(
      [.year, .month, .day, .hour, .minute, .second],
      from: now
    ),
    intervalEnd: calendar.dateComponents(
      [.year, .month, .day, .hour, .minute, .second],
      from: expiry
    ),
    repeats: false
  )
  try DeviceActivityCenter().startMonitoring(
    DeviceActivityName(ScreenTimeConstants.cheatRearmActivity(restrictionId)),
    during: schedule
  )
}

private func dateComponents(fromHHMM value: String) throws -> DateComponents {
  let parts = value.split(separator: ":").compactMap { Int($0) }
  guard parts.count == 2 else {
    throw ScreenTimeException("Invalid time value.")
  }
  return DateComponents(hour: parts[0], minute: parts[1])
}

private final class ScreenTimeException: GenericException<String> {
  override var reason: String { "ScreenTime: \(param)" }
}

import ExpoModulesCore
import FamilyControls

// Phase 8 · 8a — authorization + module surface.
//
// This step implements Family Controls authorization (the only thing the
// first native build needs to verify on-device). The enforcement methods
// (presentPicker, applyShield, monitoring, grantCheat, readDailyTotals) are
// declared here so the JS bridge contract is stable, but their bodies land
// in 8d / cheat / 8b. They throw a clear "not implemented" error until then;
// the JS layer never calls them before those steps ship.

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
      throw NotImplementedException("presentPicker (8d)")
    }

    AsyncFunction("applyShield") { (_ restrictionId: String) async throws in
      throw NotImplementedException("applyShield (8d)")
    }

    AsyncFunction("clearShield") { (_ restrictionId: String) async throws in
      throw NotImplementedException("clearShield (8d)")
    }

    AsyncFunction("startMonitoring") { (_ restrictionId: String) async throws in
      throw NotImplementedException("startMonitoring (8d)")
    }

    AsyncFunction("stopMonitoring") { (_ restrictionId: String) async throws in
      throw NotImplementedException("stopMonitoring (8d)")
    }

    AsyncFunction("grantCheat") { (_ restrictionId: String, _ minutes: Int) async throws in
      throw NotImplementedException("grantCheat (cheat system)")
    }

    AsyncFunction("readDailyTotals") { () async throws -> [[String: Any]] in
      throw NotImplementedException("readDailyTotals (8b)")
    }
  }
}

private final class NotImplementedException: GenericException<String> {
  override var reason: String { "ScreenTime: \(param) not implemented yet" }
}

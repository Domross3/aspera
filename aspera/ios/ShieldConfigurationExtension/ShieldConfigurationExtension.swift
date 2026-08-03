// Custom shield UI for Aspera's gratification delay.
//
// Apple's default shield is a hard block with no useful affordance. This
// extension replaces it with the pause the user configured, in their own
// framing. State lives in the App Group so the action extension (which handles
// the taps) and the app agree on where a pause is up to.
//
// Keep the constants below in sync with modules/screen-time/ios/Constants.swift
// and src/lib/screenTime/constants.ts — extensions can't import the app target,
// so the values are duplicated by necessity (same as the DeviceActivity ones).

import ManagedSettings
import ManagedSettingsUI
import UIKit

enum DelayShieldConstants {
  static let appGroupId = "group.com.dominicross.aspera"

  // Written by the app when a delay restriction is armed.
  static let activeIdKey = "delay:activeId"
  static let secondsKey = "delay:seconds"
  // Written by the shield ACTION extension when the user starts a pause.
  static let startedAtKey = "delay:startedAt"

  static var sharedDefaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }

  static var configuredSeconds: Int {
    let raw = sharedDefaults?.integer(forKey: secondsKey) ?? 0
    // 0 means "never written" — fall back to the JS default rather than
    // rendering a nonsensical 0-second pause.
    return raw > 0 ? raw : 30
  }

  /// Seconds still to wait, or 0 when the pause is complete/not started.
  static var secondsRemaining: Int {
    guard let startedAt = sharedDefaults?.double(forKey: startedAtKey),
          startedAt > 0
    else {
      return configuredSeconds
    }
    let elapsed = Date().timeIntervalSince1970 - startedAt
    return max(0, configuredSeconds - Int(elapsed))
  }

  static var pauseStarted: Bool {
    let startedAt = sharedDefaults?.double(forKey: startedAtKey) ?? 0
    return startedAt > 0
  }
}

class ShieldConfigurationExtension: ShieldConfigurationDataSource {
  private func asperaShield() -> ShieldConfiguration {
    let remaining = DelayShieldConstants.secondsRemaining
    let started = DelayShieldConstants.pauseStarted

    let subtitle: String
    let primary: String
    if !started {
      subtitle =
        "You asked Aspera to hold this for \(DelayShieldConstants.configuredSeconds) seconds before you open it."
      primary = "Start the pause"
    } else if remaining > 0 {
      subtitle = "\(remaining)s left. Tap again when it's up."
      primary = "\(remaining)s left"
    } else {
      subtitle = "The pause is done. Still want to?"
      primary = "Continue"
    }

    return ShieldConfiguration(
      backgroundBlurStyle: .systemUltraThinMaterialDark,
      backgroundColor: UIColor(red: 0.04, green: 0.04, blue: 0.035, alpha: 1.0),
      icon: nil,
      title: ShieldConfiguration.Label(
        text: "Hold on",
        color: .white
      ),
      subtitle: ShieldConfiguration.Label(
        text: subtitle,
        color: UIColor(white: 0.72, alpha: 1.0)
      ),
      primaryButtonLabel: ShieldConfiguration.Label(
        text: primary,
        color: .white
      ),
      primaryButtonBackgroundColor: UIColor(
        red: 0.42, green: 0.39, blue: 1.0, alpha: 1.0
      ),
      secondaryButtonLabel: ShieldConfiguration.Label(
        text: "Not now",
        color: UIColor(white: 0.72, alpha: 1.0)
      )
    )
  }

  override func configuration(shielding application: Application) -> ShieldConfiguration {
    asperaShield()
  }

  override func configuration(
    shielding application: Application,
    in category: ActivityCategory
  ) -> ShieldConfiguration {
    asperaShield()
  }

  override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
    asperaShield()
  }

  override func configuration(
    shielding webDomain: WebDomain,
    in category: ActivityCategory
  ) -> ShieldConfiguration {
    asperaShield()
  }
}

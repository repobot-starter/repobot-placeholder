import Foundation
import SwiftUI
import UIKit
import UserNotifications
import AppGraphqlApi

/// The push kernel's iOS client: notification permission + APNs device-token
/// registration, posted through the same `registerPushDevice` mutation the
/// web client uses (the hex token is the endpoint; there is no subscription
/// JSON on native). Web twin: NotificationsCard in SettingsPage.tsx —
/// including its rule that permission is requested only on explicit enable,
/// never at launch.
///
/// Delivery needs the backend's APNs channel configured (`APNS_*` staged by
/// the platform, see the backend docs/push.md); registration is independent
/// and safe either way — unconfigured channels are skipped at send time.
@MainActor
final class PushComponent: ObservableObject {
  enum PermissionState: Equatable {
    case unknown
    case notRequested
    case denied
    /// Permission granted; `isRegistered` tells whether the token reached
    /// the backend.
    case granted
  }

  @Published private(set) var permission: PermissionState = .unknown
  @Published private(set) var isRegistered: Bool
  @Published private(set) var isBusy = false

  /// The last device token registered with the backend, kept so disable can
  /// unregister the exact endpoint and re-launches can rotate it silently.
  private static let tokenDefaultsKey = "app.push.registeredToken"

  init() {
    isRegistered = UserDefaults.standard.string(forKey: Self.tokenDefaultsKey) != nil
  }

  /// Reads the current permission without prompting (safe at any time).
  func refreshPermission() async {
    let settings = await UNUserNotificationCenter.current().notificationSettings()
    switch settings.authorizationStatus {
    case .notDetermined:
      permission = .notRequested
    case .denied:
      permission = .denied
    default:
      permission = .granted
      // Permission already granted (e.g. a previous install): refresh the
      // token registration silently so the backend converges on reality.
      if isRegistered {
        UIApplication.shared.registerForRemoteNotifications()
      }
    }
  }

  /// The explicit enable: prompt (first time), then register with APNs. The
  /// device token arrives async via `didRegisterForRemoteNotifications`.
  func enableNotifications() async {
    isBusy = true
    defer { isBusy = false }
    do {
      let granted = try await UNUserNotificationCenter.current()
        .requestAuthorization(options: [.alert, .badge, .sound])
      guard granted else {
        permission = .denied
        return
      }
      permission = .granted
      UIApplication.shared.registerForRemoteNotifications()
    } catch {
      showError("Could not request notification permission.")
    }
  }

  /// Deletes the registration server-side first (mirroring the web client),
  /// so the backend never keeps a destination the user turned off.
  func disableNotifications() async {
    guard let token = UserDefaults.standard.string(forKey: Self.tokenDefaultsKey) else {
      isRegistered = false
      return
    }
    isBusy = true
    defer { isBusy = false }
    do {
      _ = try await gql.unregisterPushDevice(input: UnregisterPushDeviceInput(endpoint: token))
      UserDefaults.standard.removeObject(forKey: Self.tokenDefaultsKey)
      isRegistered = false
    } catch {
      showError("Could not turn off notifications. Try again.")
    }
  }

  private func showError(_ message: String) {
    store.appAlertStore.activeAlert = AppAlertStore.AlertMessage(
      id: UUID().uuidString,
      message: message,
      isError: true
    )
  }

  /// APNs handed us the device token (initial registration or a rotation):
  /// upsert it as this user's device. Only meaningful signed in — the
  /// mutation is authenticated, and the enable toggle lives behind sign-in.
  func didRegisterForRemoteNotifications(deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02x", $0) }.joined()
    Task {
      do {
        _ = try await gql.registerPushDevice(
          input: RegisterPushDeviceInput(
            platform: .case(.ios),
            endpoint: token,
            // Native tokens ride the endpoint column; the subscription JSON
            // is a Web Push concept (backend validates it for WEB only).
            subscriptionJson: "{}"
          )
        )
        UserDefaults.standard.set(token, forKey: Self.tokenDefaultsKey)
        isRegistered = true
      } catch {
        // Best-effort by design (same posture as the backend transport):
        // a failed registration surfaces on the toggle, never as a crash.
        isRegistered = false
      }
    }
  }

  func didFailToRegisterForRemoteNotifications(error: Error) {
    // Simulators and builds without the aps-environment entitlement land
    // here; the toggle simply stays off.
    isRegistered = false
  }
}

/// SwiftUI apps have no AppDelegate by default; APNs token callbacks only
/// arrive through one, so this adaptor exists solely to forward them.
final class PushAppDelegate: NSObject, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    Task { @MainActor in
      components.push.didRegisterForRemoteNotifications(deviceToken: deviceToken)
    }
  }

  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    Task { @MainActor in
      components.push.didFailToRegisterForRemoteNotifications(error: error)
    }
  }
}

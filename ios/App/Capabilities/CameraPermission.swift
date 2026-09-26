import AVFoundation
import UIKit

/// Camera permission, handled explicitly. ARKit and AVCapture both trigger
/// the system prompt implicitly on session start, but that leaves denial
/// invisible — the camera view just renders black. Check `state` before
/// presenting a camera surface and route denial to a Settings deep link.
///
/// The usage string lives in the Xcode project as
/// INFOPLIST_KEY_NSCameraUsageDescription; keep it honest about what the
/// camera is for when the app's purpose changes.
@MainActor
enum CameraPermission {
  enum State {
    /// Never asked: presenting the camera (or calling `request()`) prompts.
    case notRequested
    case granted
    /// The user said no; only the system Settings can change it.
    case denied
  }

  static var state: State {
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .notDetermined:
      return .notRequested
    case .authorized:
      return .granted
    default:
      return .denied
    }
  }

  /// Prompts if never asked; resolves immediately otherwise.
  static func request() async -> State {
    if state == .notRequested {
      _ = await AVCaptureDevice.requestAccess(for: .video)
    }
    return state
  }

  /// Opens the app's page in the system Settings — the only place a denied
  /// camera permission can be turned back on.
  static func openSystemSettings() {
    guard let url = URL(string: UIApplication.openSettingsURLString) else {
      return
    }
    UIApplication.shared.open(url)
  }
}

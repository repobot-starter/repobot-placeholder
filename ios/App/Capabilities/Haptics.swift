import UIKit

/// The app's haptic vocabulary — the reason to test on a real device instead
/// of a preview. Call these at moments of physical consequence (a scan
/// landing, a destructive action confirming), not decoration; haptics that
/// fire on every tap train the user to ignore them.
///
/// Lifted from the TimberEye field app's pattern (a success buzz when an AR
/// tickmark lands on a scanned log).
@MainActor
enum Haptics {
  /// A scan/save/placement landed. The strongest, most rewarding buzz.
  static func success() {
    UINotificationFeedbackGenerator().notificationOccurred(.success)
  }

  /// Something the user tried was rejected (bad code, validation failure).
  static func error() {
    UINotificationFeedbackGenerator().notificationOccurred(.error)
  }

  /// A caution moment (leaving unsaved changes, nearing a limit).
  static func warning() {
    UINotificationFeedbackGenerator().notificationOccurred(.warning)
  }

  /// Physical contact with UI: a card snapping into place, a toggle.
  static func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .medium) {
    UIImpactFeedbackGenerator(style: style).impactOccurred()
  }

  /// Scrubbing through discrete values (pickers, steppers, sliders).
  static func selection() {
    UISelectionFeedbackGenerator().selectionChanged()
  }
}

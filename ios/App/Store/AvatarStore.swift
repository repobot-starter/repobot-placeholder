import SwiftUI

/// State for the Settings avatar upload flow (storage-kernel twin). State
/// only — the upload workflow lives in AvatarUploadComponent.
@MainActor
final class AvatarStore: ObservableObject {
  enum Phase: Equatable {
    case idle
    case uploading
    case failed(String)
  }

  @Published private(set) var phase: Phase = .idle

  var isUploading: Bool {
    phase == .uploading
  }

  var errorMessage: String? {
    if case let .failed(message) = phase {
      return message
    }
    return nil
  }

  func setPhase(_ value: Phase) {
    phase = value
  }
}

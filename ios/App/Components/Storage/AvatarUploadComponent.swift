import Foundation

/// The storage kernel's consumer-exemplar workflow, mirroring the web
/// AvatarCard in SettingsPage.tsx: mint an upload slot -> PUT the bytes ->
/// finalize -> persist the upload id on the user row -> best-effort delete
/// of the replaced avatar. State transitions go through AvatarStore; the
/// refreshed user (shell profile, settings) comes from the injected
/// rehydration hook.
@MainActor
final class AvatarUploadComponent {
  private let avatarStore: AvatarStore
  private let api: AvatarApi
  /// Re-fetches the hydrated user after the avatar is persisted so the
  /// shell profile and settings re-render (components.auth.refreshHydratedUser).
  private let refreshUser: () async -> Void

  init(
    avatarStore: AvatarStore,
    api: AvatarApi,
    refreshUser: @escaping () async -> Void
  ) {
    self.avatarStore = avatarStore
    self.api = api
    self.refreshUser = refreshUser
  }

  /// Uploads a photo picked from the library: downscales and JPEG-compresses
  /// it (AvatarImageProcessing), then runs the upload flow.
  func uploadPickedImage(
    userId: String,
    previousUploadId: String?,
    rawImageData: Data
  ) async -> Bool {
    guard let jpegData = AvatarImageProcessing.jpegData(from: rawImageData) else {
      avatarStore.setPhase(.failed("The selected image could not be read."))
      return false
    }
    return await uploadAvatar(
      userId: userId,
      previousUploadId: previousUploadId,
      imageData: jpegData,
      contentType: AvatarImageProcessing.contentType
    )
  }

  /// Uploads a new avatar. Returns true when the avatar was persisted.
  /// previousUploadId is the avatar being replaced; deleting it is best
  /// effort — a failed cleanup leaves an orphaned object, not a broken
  /// avatar (web parity).
  func uploadAvatar(
    userId: String,
    previousUploadId: String?,
    imageData: Data,
    contentType: String
  ) async -> Bool {
    guard !avatarStore.isUploading else {
      return false
    }
    avatarStore.setPhase(.uploading)
    do {
      let slot = try await api.createUpload(contentType: contentType, sizeBytes: imageData.count)
      try await api.putUploadBytes(
        uploadUrl: slot.uploadUrl,
        headersJson: slot.headersJson,
        body: imageData
      )
      try await api.finalizeUpload(uploadId: slot.uploadId)
      try await api.persistAvatar(userId: userId, uploadId: slot.uploadId)
      if let previousUploadId {
        try? await api.deleteUpload(uploadId: previousUploadId)
      }
      await refreshUser()
      avatarStore.setPhase(.idle)
      return true
    } catch {
      avatarStore.setPhase(.failed(error.localizedDescription))
      return false
    }
  }
}

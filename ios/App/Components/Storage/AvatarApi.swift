import AppGraphqlApi
import Foundation

/// A minted upload slot as a plain value (the createUpload mutation's
/// payload), so the upload flow and its tests never depend on generated
/// Apollo selection sets.
struct AvatarUploadSlot: Equatable {
  let uploadId: String
  let uploadUrl: String
  let headersJson: String
}

/// The storage-kernel and Identity operations the avatar upload flow needs,
/// behind a small seam so AvatarUploadComponent's state machine is
/// unit-testable with a stubbed client. The real implementation composes
/// GraphQLClient and StorageUploadClient.
@MainActor
protocol AvatarApi {
  func createUpload(contentType: String, sizeBytes: Int) async throws -> AvatarUploadSlot
  func putUploadBytes(uploadUrl: String, headersJson: String, body: Data) async throws
  func finalizeUpload(uploadId: String) async throws
  /// Persists the READY upload id on the user row (users.avatar_upload_id).
  func persistAvatar(userId: String, uploadId: String) async throws
  func deleteUpload(uploadId: String) async throws
}

@MainActor
struct GraphQLAvatarApi: AvatarApi {
  private let uploadClient: StorageUploadClient

  init(uploadClient: StorageUploadClient = StorageUploadClient()) {
    self.uploadClient = uploadClient
  }

  func createUpload(contentType: String, sizeBytes: Int) async throws -> AvatarUploadSlot {
    // Avatars are PUBLIC uploads: the shell renders them from the stable
    // /file/<id> serving URL (see docs/storage.md, the consumer exemplar).
    let slot = try await gql.createUpload(
      input: CreateUploadInput(
        idempotencyKey: UUID().uuidString,
        fields: CreateUploadFields(
          contentType: contentType,
          sizeBytes: sizeBytes,
          visibility: GraphQLEnum(UploadVisibility.public)
        )
      )
    )
    return AvatarUploadSlot(
      uploadId: slot.uploadId,
      uploadUrl: slot.uploadUrl,
      headersJson: slot.headersJson
    )
  }

  func putUploadBytes(uploadUrl: String, headersJson: String, body: Data) async throws {
    guard let endpoint = StorageUploadClient.endpoint(graphqlURL: appConfig.graphqlURL) else {
      throw StorageUploadFailure.endpointUnavailable
    }
    try await uploadClient.putUploadBytes(
      endpoint: endpoint,
      uploadUrl: uploadUrl,
      headersJson: headersJson,
      body: body
    )
  }

  func finalizeUpload(uploadId: String) async throws {
    _ = try await gql.finalizeUpload(input: FinalizeUploadInput(uploadId: uploadId))
  }

  func persistAvatar(userId: String, uploadId: String) async throws {
    _ = try await gql.updateUser(
      input: UpdateUserInput(
        objectId: userId,
        idempotencyKey: UUID().uuidString,
        fields: UpdateUserFields(avatarUploadId: .some(uploadId))
      )
    )
  }

  func deleteUpload(uploadId: String) async throws {
    _ = try await gql.deleteUpload(input: DeleteUploadInput(uploadId: uploadId))
  }
}

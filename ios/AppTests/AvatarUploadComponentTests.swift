import XCTest
@testable import AppIOS

/// State-machine tests for the avatar upload flow (web twin: AvatarCard's
/// uploadAvatar in SettingsPage.tsx) against a stubbed storage API:
/// create -> PUT -> finalize -> persist -> best-effort delete of the
/// replaced upload.
@MainActor
final class AvatarUploadComponentTests: XCTestCase {
  private let imageData = Data("jpeg-bytes".utf8)

  private func makeComponent(
    api: StubAvatarApi,
    store: AvatarStore? = nil,
    onRefresh: @escaping () -> Void = {}
  ) -> AvatarUploadComponent {
    AvatarUploadComponent(avatarStore: store ?? AvatarStore(), api: api, refreshUser: { onRefresh() })
  }

  func testHappyPathRunsTheKernelLifecycleInOrderAndRefreshesTheUser() async {
    let api = StubAvatarApi()
    let store = AvatarStore()
    var refreshed = false
    let component = makeComponent(api: api, store: store, onRefresh: { refreshed = true })

    let uploaded = await component.uploadAvatar(
      userId: "user_1",
      previousUploadId: "upload_old",
      imageData: imageData,
      contentType: "image/jpeg"
    )

    XCTAssertTrue(uploaded)
    XCTAssertEqual(
      api.calls,
      [
        "createUpload(image/jpeg,\(imageData.count))",
        "putUploadBytes(upload_1)",
        "finalizeUpload(upload_1)",
        "persistAvatar(user_1,upload_1)",
        "deleteUpload(upload_old)",
      ]
    )
    XCTAssertTrue(refreshed)
    XCTAssertEqual(store.phase, .idle)
  }

  func testFirstUploadSkipsTheBestEffortDelete() async {
    let api = StubAvatarApi()
    let component = makeComponent(api: api)

    let uploaded = await component.uploadAvatar(
      userId: "user_1",
      previousUploadId: nil,
      imageData: imageData,
      contentType: "image/jpeg"
    )

    XCTAssertTrue(uploaded)
    XCTAssertFalse(api.calls.contains { $0.hasPrefix("deleteUpload") })
  }

  func testFailedCleanupOfTheReplacedUploadDoesNotFailTheFlow() async {
    let api = StubAvatarApi()
    api.deleteError = StubFailure.boom
    let store = AvatarStore()
    let component = makeComponent(api: api, store: store)

    let uploaded = await component.uploadAvatar(
      userId: "user_1",
      previousUploadId: "upload_old",
      imageData: imageData,
      contentType: "image/jpeg"
    )

    // Web parity: a failed cleanup leaves an orphaned object, not a broken
    // avatar.
    XCTAssertTrue(uploaded)
    XCTAssertEqual(store.phase, .idle)
  }

  func testPutFailureStopsBeforeFinalizeAndReportsTheError() async {
    let api = StubAvatarApi()
    api.putError = StubFailure.boom
    let store = AvatarStore()
    var refreshed = false
    let component = makeComponent(api: api, store: store, onRefresh: { refreshed = true })

    let uploaded = await component.uploadAvatar(
      userId: "user_1",
      previousUploadId: "upload_old",
      imageData: imageData,
      contentType: "image/jpeg"
    )

    XCTAssertFalse(uploaded)
    XCTAssertFalse(api.calls.contains { $0.hasPrefix("finalizeUpload") })
    XCTAssertFalse(api.calls.contains { $0.hasPrefix("persistAvatar") })
    XCTAssertFalse(api.calls.contains { $0.hasPrefix("deleteUpload") })
    XCTAssertFalse(refreshed)
    XCTAssertEqual(store.phase, .failed(StubFailure.boom.localizedDescription))
    XCTAssertEqual(store.errorMessage, StubFailure.boom.localizedDescription)
  }

  func testPersistFailureReportsTheErrorAndKeepsThePreviousUpload() async {
    let api = StubAvatarApi()
    api.persistError = StubFailure.boom
    let store = AvatarStore()
    let component = makeComponent(api: api, store: store)

    let uploaded = await component.uploadAvatar(
      userId: "user_1",
      previousUploadId: "upload_old",
      imageData: imageData,
      contentType: "image/jpeg"
    )

    XCTAssertFalse(uploaded)
    XCTAssertFalse(api.calls.contains { $0.hasPrefix("deleteUpload") })
    XCTAssertTrue(store.isUploading == false)
    XCTAssertNotNil(store.errorMessage)
  }
}

private enum StubFailure: Error, LocalizedError {
  case boom

  var errorDescription: String? { "The storage backend is unavailable." }
}

@MainActor
private final class StubAvatarApi: AvatarApi {
  private(set) var calls: [String] = []
  var putError: Error?
  var persistError: Error?
  var deleteError: Error?

  func createUpload(contentType: String, sizeBytes: Int) async throws -> AvatarUploadSlot {
    calls.append("createUpload(\(contentType),\(sizeBytes))")
    return AvatarUploadSlot(
      uploadId: "upload_1",
      uploadUrl: "/upload?token=abc",
      headersJson: #"{"Content-Type":"image/jpeg"}"#
    )
  }

  func putUploadBytes(uploadUrl: String, headersJson: String, body: Data) async throws {
    calls.append("putUploadBytes(upload_1)")
    if let putError {
      throw putError
    }
  }

  func finalizeUpload(uploadId: String) async throws {
    calls.append("finalizeUpload(\(uploadId))")
  }

  func persistAvatar(userId: String, uploadId: String) async throws {
    calls.append("persistAvatar(\(userId),\(uploadId))")
    if let persistError {
      throw persistError
    }
  }

  func deleteUpload(uploadId: String) async throws {
    calls.append("deleteUpload(\(uploadId))")
    if let deleteError {
      throw deleteError
    }
  }
}

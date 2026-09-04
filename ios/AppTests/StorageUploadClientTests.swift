import XCTest
@testable import AppIOS

/// Parity tests for the storage transport against web/core's StorageApi.ts:
/// endpoint derivation (the GraphQL URL with the function name swapped), URL
/// resolution for both slot flavors, the stable PUBLIC serving URL, and the
/// byte PUT.
final class StorageUploadClientTests: XCTestCase {
  private let graphqlURL = URL(
    string: "http://127.0.0.1:5001/demo-repobot-base/us-central1/graphql__request__api"
  )!

  func testDerivesTheStorageEndpointBySwappingTheFunctionName() {
    XCTAssertEqual(
      StorageUploadClient.endpoint(graphqlURL: graphqlURL)?.absoluteString,
      "http://127.0.0.1:5001/demo-repobot-base/us-central1/storage__request__api"
    )
    XCTAssertEqual(
      StorageUploadClient.endpoint(
        graphqlURL: URL(string: "https://example.com/prefix__graphql__request__api")!
      )?.absoluteString,
      "https://example.com/prefix__storage__request__api"
    )
  }

  func testEndpointIsNilForAGraphqlUrlWithoutTheWellKnownFunctionName() {
    XCTAssertNil(StorageUploadClient.endpoint(graphqlURL: URL(string: "https://example.com/graphql")!))
  }

  func testResolvesPathsAgainstTheEndpointAndPassesAbsoluteUrlsThrough() {
    let endpoint = StorageUploadClient.endpoint(graphqlURL: graphqlURL)!

    // Local-mode slots and serving URLs are endpoint-relative paths.
    XCTAssertEqual(
      StorageUploadClient.resolveStorageUrl(endpoint: endpoint, url: "/upload?token=abc")?.absoluteString,
      "http://127.0.0.1:5001/demo-repobot-base/us-central1/storage__request__api/upload?token=abc"
    )

    // V4 signed GCS URLs are absolute and pass through untouched.
    let signed = "https://storage.googleapis.com/bucket/object?X-Goog-Signature=abc"
    XCTAssertEqual(
      StorageUploadClient.resolveStorageUrl(endpoint: endpoint, url: signed)?.absoluteString,
      signed
    )
  }

  func testBuildsTheStablePublicFileUrl() {
    let endpoint = StorageUploadClient.endpoint(graphqlURL: graphqlURL)!
    XCTAssertEqual(
      StorageUploadClient.publicFileURL(endpoint: endpoint, uploadId: "upload_1")?.absoluteString,
      "http://127.0.0.1:5001/demo-repobot-base/us-central1/storage__request__api/file/upload_1"
    )
  }

  func testPutUploadBytesSendsTheSlotHeadersAndBody() async throws {
    let client = StorageUploadClient(session: Self.makeSession(statusCode: 200))
    let endpoint = StorageUploadClient.endpoint(graphqlURL: graphqlURL)!

    try await client.putUploadBytes(
      endpoint: endpoint,
      uploadUrl: "/upload?token=abc",
      headersJson: #"{"Content-Type":"image/jpeg","X-Upload-Token":"t1"}"#,
      body: Data("bytes".utf8)
    )

    let request = try XCTUnwrap(UploadCaptureURLProtocol.lastRequest)
    XCTAssertEqual(request.httpMethod, "PUT")
    XCTAssertEqual(
      request.url?.absoluteString,
      "http://127.0.0.1:5001/demo-repobot-base/us-central1/storage__request__api/upload?token=abc"
    )
    XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "image/jpeg")
    XCTAssertEqual(request.value(forHTTPHeaderField: "X-Upload-Token"), "t1")
  }

  func testPutUploadBytesThrowsOnNonSuccessStatus() async {
    let client = StorageUploadClient(session: Self.makeSession(statusCode: 413))
    let endpoint = StorageUploadClient.endpoint(graphqlURL: graphqlURL)!

    do {
      try await client.putUploadBytes(
        endpoint: endpoint,
        uploadUrl: "/upload?token=abc",
        headersJson: "{}",
        body: Data("bytes".utf8)
      )
      XCTFail("Expected putUploadBytes to throw on a 413 response.")
    } catch {
      guard case StorageUploadFailure.putFailed(statusCode: 413) = error else {
        return XCTFail("Expected putFailed(413), got \(error).")
      }
    }
  }

  func testPutUploadBytesThrowsOnMalformedHeadersJson() async {
    let client = StorageUploadClient(session: Self.makeSession(statusCode: 200))
    let endpoint = StorageUploadClient.endpoint(graphqlURL: graphqlURL)!

    do {
      try await client.putUploadBytes(
        endpoint: endpoint,
        uploadUrl: "/upload?token=abc",
        headersJson: "not-json",
        body: Data()
      )
      XCTFail("Expected putUploadBytes to throw on malformed headersJson.")
    } catch {
      guard case StorageUploadFailure.malformedSlot = error else {
        return XCTFail("Expected malformedSlot, got \(error).")
      }
    }
  }

  override func tearDown() {
    super.tearDown()
    UploadCaptureURLProtocol.lastRequest = nil
    UploadCaptureURLProtocol.statusCode = 200
  }

  private static func makeSession(statusCode: Int) -> URLSession {
    UploadCaptureURLProtocol.statusCode = statusCode
    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [UploadCaptureURLProtocol.self]
    return URLSession(configuration: configuration)
  }
}

private final class UploadCaptureURLProtocol: URLProtocol {
  static var lastRequest: URLRequest?
  static var statusCode = 200

  override class func canInit(with request: URLRequest) -> Bool {
    true
  }

  override class func canonicalRequest(for request: URLRequest) -> URLRequest {
    request
  }

  override func startLoading() {
    Self.lastRequest = request
    let response = HTTPURLResponse(
      url: request.url!,
      statusCode: Self.statusCode,
      httpVersion: nil,
      headerFields: nil
    )!
    client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
    client?.urlProtocol(self, didLoad: Data())
    client?.urlProtocolDidFinishLoading(self)
  }

  override func stopLoading() {}
}

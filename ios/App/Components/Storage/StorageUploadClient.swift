import Foundation

enum StorageUploadFailure: Error, LocalizedError {
  case endpointUnavailable
  case malformedSlot
  case putFailed(statusCode: Int)

  var errorDescription: String? {
    switch self {
    case .endpointUnavailable:
      return "The storage endpoint could not be derived from the backend config."
    case .malformedSlot:
      return "The upload slot returned by the backend is malformed."
    case let .putFailed(statusCode):
      return "Uploading the file failed (\(statusCode))."
    }
  }
}

/// Transport for the storage kernel's non-GraphQL half: resolving the
/// kernel's storage-endpoint-relative URLs and PUTting file bytes to a minted
/// upload slot. The native twin of web/core's StorageApi.ts — the GraphQL
/// side (createUpload / finalizeUpload / deleteUpload) lives on
/// GraphQLClient. See docs/storage.md.
final class StorageUploadClient {
  private let session: URLSession

  init(session: URLSession = .shared) {
    self.session = session
  }

  /// The storage endpoint is the storage__request__api function, which lives
  /// next to the GraphQL function in every environment (the emulator and the
  /// platform deployer treat all exports uniformly), so its URL is the
  /// GraphQL URL with the trailing function name swapped — the same
  /// derivation as the auth endpoint and the AI chat stream endpoint.
  static func endpoint(graphqlURL: URL) -> URL? {
    let graphql = graphqlURL.absoluteString
    guard graphql.contains("graphql__request__api") else {
      return nil
    }
    let derived = graphql.replacingOccurrences(
      of: "graphql__request__api",
      with: "storage__request__api"
    )
    return URL(string: derived)
  }

  /// Resolves a URL returned by the storage kernel: V4 signed GCS URLs are
  /// absolute and pass through; everything served by the storage function
  /// ("/upload?...", "/file/<id>") is a path resolved against the endpoint.
  static func resolveStorageUrl(endpoint: URL, url: String) -> URL? {
    if url.hasPrefix("http://") || url.hasPrefix("https://") {
      return URL(string: url)
    }
    return URL(string: "\(endpoint.absoluteString)\(url)")
  }

  /// The stable serving URL for a PUBLIC upload (both modes serve /file/<id>).
  static func publicFileURL(endpoint: URL, uploadId: String) -> URL? {
    let encodedId = uploadId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? uploadId
    return URL(string: "\(endpoint.absoluteString)/file/\(encodedId)")
  }

  /// PUTs the file bytes to a minted upload slot (the createUpload mutation's
  /// uploadUrl + headersJson). Works against both slot flavors: the signed
  /// GCS URL and the local-mode storage function. Throws on any non-2xx
  /// response.
  func putUploadBytes(endpoint: URL, uploadUrl: String, headersJson: String, body: Data) async throws {
    guard
      let target = Self.resolveStorageUrl(endpoint: endpoint, url: uploadUrl),
      let headersData = headersJson.data(using: .utf8),
      let headers = try? JSONDecoder().decode([String: String].self, from: headersData)
    else {
      throw StorageUploadFailure.malformedSlot
    }

    var request = URLRequest(url: target)
    request.httpMethod = "PUT"
    for (name, value) in headers {
      request.setValue(value, forHTTPHeaderField: name)
    }

    let (_, response) = try await session.upload(for: request, from: body)
    guard let httpResponse = response as? HTTPURLResponse else {
      throw StorageUploadFailure.putFailed(statusCode: -1)
    }
    guard (200..<300).contains(httpResponse.statusCode) else {
      throw StorageUploadFailure.putFailed(statusCode: httpResponse.statusCode)
    }
  }
}

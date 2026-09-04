import Foundation

enum AiChatStreamFailure: Error, LocalizedError {
  case endpointUnavailable
  case requestFailed(statusCode: Int)
  case malformedEvent

  var errorDescription: String? {
    switch self {
    case .endpointUnavailable:
      return "The chat endpoint could not be derived from the backend config."
    case let .requestFailed(statusCode):
      return "The chat request failed (\(statusCode))."
    case .malformedEvent:
      return "The server sent a malformed stream event."
    }
  }
}

/// Streams the ai__request__chat function: POSTs an AiChatRequest and decodes
/// newline-delimited AiChatStreamEvent JSON as it arrives. Chat is anonymous
/// by design (see the function's doc comment), so no bearer token is sent.
final class AiChatStreamClient {
  private let session: URLSession

  init(session: URLSession = .shared) {
    self.session = session
  }

  /// The chat endpoint lives next to the GraphQL function in every
  /// environment (the emulator and the platform deployer treat all exports
  /// uniformly), so its URL is the GraphQL URL with the trailing function
  /// name swapped.
  static func endpoint(graphqlURL: URL) -> URL? {
    let graphql = graphqlURL.absoluteString
    guard graphql.contains("graphql__request__api") else {
      return nil
    }
    let derived = graphql.replacingOccurrences(
      of: "graphql__request__api",
      with: "ai__request__chat"
    )
    return URL(string: derived)
  }

  func streamChatResponse(
    request requestBody: AiChatRequest,
    onEvent: @escaping @MainActor (AiChatStreamEvent) -> Void
  ) async throws {
    guard let endpoint = Self.endpoint(graphqlURL: appConfig.graphqlURL) else {
      throw AiChatStreamFailure.endpointUnavailable
    }

    var request = URLRequest(url: endpoint)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONEncoder().encode(requestBody)

    let (bytes, response) = try await session.bytes(for: request)
    guard let httpResponse = response as? HTTPURLResponse else {
      throw AiChatStreamFailure.requestFailed(statusCode: -1)
    }
    guard (200..<300).contains(httpResponse.statusCode) else {
      throw AiChatStreamFailure.requestFailed(statusCode: httpResponse.statusCode)
    }

    for try await rawLine in bytes.lines {
      try Task.checkCancellation()
      let line = rawLine.trimmingCharacters(in: .whitespacesAndNewlines)
      if line.isEmpty {
        continue
      }
      guard let data = line.data(using: .utf8) else {
        continue
      }
      guard let event = try? JSONDecoder().decode(AiChatStreamEvent.self, from: data) else {
        throw AiChatStreamFailure.malformedEvent
      }
      await onEvent(event)
    }
  }
}

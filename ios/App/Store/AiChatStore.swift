import Foundation
import SwiftUI

/// State for the chat pack's thread: one AiChatResponse per exchange,
/// upserted in place while it streams. State only — the workflow lives in
/// AiChatComponent (see SWIFT_IOS_STORE_COMPONENT_PATTERN.md).
@MainActor
final class AiChatStore: ObservableObject {
  @Published var responses: [AiChatResponse] = []
  @Published var streaming = false
  @Published var errorMessage: String?

  var hasMessages: Bool { !responses.isEmpty }

  func upsertResponse(_ response: AiChatResponse) {
    if let index = responses.firstIndex(where: { $0.requestId == response.requestId }) {
      responses[index] = response
    } else {
      responses.append(response)
    }
  }

  func setStreaming(_ value: Bool) { streaming = value }
  func setError(_ value: String?) { errorMessage = value }

  func reset() {
    responses = []
    streaming = false
    errorMessage = nil
  }
}

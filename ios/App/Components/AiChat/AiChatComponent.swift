import Foundation

/// The chat workflow: submits messages to the ai__request__chat stream,
/// upserts response snapshots into AiChatStore, and chains conversation
/// context by passing the last turn's responseId as the next turn's
/// previousResponseId (the server is stateless by design).
@MainActor
final class AiChatComponent {
  private var chatStore: AiChatStore { store.aiChatStore }
  private let streamClient = AiChatStreamClient()
  private var streamTask: Task<Void, Never>?
  private var previousResponseId: String?

  func submitMessage(_ message: String) {
    let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmed.isEmpty || chatStore.streaming {
      return
    }

    let requestId = UUID().uuidString.lowercased()
    chatStore.setError(nil)
    chatStore.setStreaming(true)
    chatStore.upsertResponse(
      AiChatResponse(
        requestId: requestId,
        requestMessage: trimmed,
        responseId: nil,
        responseItems: [],
        assistantMessage: nil
      )
    )

    let request = AiChatRequest(
      id: requestId,
      message: trimmed,
      previousResponseId: previousResponseId
    )
    streamTask = Task {
      await stream(request)
    }
  }

  func stopStreaming() {
    streamTask?.cancel()
    streamTask = nil
    chatStore.setStreaming(false)
  }

  func resetConversation() {
    stopStreaming()
    previousResponseId = nil
    chatStore.reset()
  }

  private func stream(_ request: AiChatRequest) async {
    do {
      try await streamClient.streamChatResponse(request: request) { [weak self] event in
        self?.handleStreamEvent(event)
      }
      if Task.isCancelled {
        return
      }
      chatStore.setStreaming(false)
      streamTask = nil
    } catch is CancellationError {
      // The stop button intentionally cancels the stream.
    } catch {
      if Task.isCancelled {
        return
      }
      chatStore.setError(error.localizedDescription)
      chatStore.setStreaming(false)
      streamTask = nil
    }
  }

  private func handleStreamEvent(_ event: AiChatStreamEvent) {
    if let response = event.data {
      if let responseId = response.responseId {
        previousResponseId = responseId
      }
      chatStore.upsertResponse(response)
    }
    if let error = event.error {
      chatStore.setError(error.message)
      chatStore.setStreaming(false)
    }
  }
}

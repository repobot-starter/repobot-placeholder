import Foundation

/// The AI chat wire protocol — the native mirror of
/// firebase/functions/src/Services/Ai/AiChatTypes.ts (the web twin is
/// web/core/src/Ai/AiChatTypes.ts). The server re-sends the same
/// growing AiChatResponse many times per request; the client upserts each
/// snapshot by requestId. Change all three files together.

struct AiChatRequest: Encodable {
  let id: String
  let message: String
  /// Chains the conversation; omit to start fresh.
  let previousResponseId: String?
}

struct AiChatResponse: Codable, Identifiable {
  let requestId: String
  let requestMessage: String
  /// Send as previousResponseId on the next turn to continue the thread.
  let responseId: String?
  let responseItems: [AiChatResponseItem]
  let assistantMessage: AiChatAssistantMessage?

  var id: String { requestId }
}

struct AiChatResponseItem: Codable, Identifiable {
  let functionCall: AiChatFunctionCall?
  let reasoningSummary: AiChatReasoningSummary?
  let elapsedSeconds: Double?

  var id: String {
    functionCall?.id ?? reasoningSummary?.id ?? "item"
  }
}

struct AiChatFunctionCall: Codable {
  let id: String
  let name: String
  let arguments: String
  let output: String?
  let status: AiChatStatus
}

struct AiChatReasoningSummary: Codable {
  let id: String
  let message: [AiChatSegment]
  let status: AiChatStatus
}

struct AiChatAssistantMessage: Codable {
  let message: [AiChatSegment]
  let status: AiChatStatus
}

enum AiChatStatus: String, Codable {
  case inProgress = "IN_PROGRESS"
  case completed = "COMPLETED"
  case cancelled = "CANCELLED"
}

struct AiChatSegment: Codable, Identifiable, Hashable {
  let format: AiChatSegmentFormat
  let content: String

  var id: String { "\(format.rawValue)|\(content)" }
}

enum AiChatSegmentFormat: String, Codable {
  case title = "TITLE"
  case paragraph = "PARAGRAPH"
  case listItem = "LIST_ITEM"
  case code = "CODE"
  case quote = "QUOTE"
}

struct AiChatStreamEvent: Decodable {
  let data: AiChatResponse?
  let error: AiChatErrorPayload?
}

struct AiChatErrorPayload: Decodable {
  let message: String
}

import Foundation
import SwiftUI

enum AiVoicePhase: Equatable {
  case idle
  case connecting
  case connected
  case failed(String)
}

/// State for the talk pack's push-to-talk surface. State only — the session
/// workflow lives in AiVoiceComponent (see
/// SWIFT_IOS_STORE_COMPONENT_PATTERN.md).
@MainActor
final class AiVoiceStore: ObservableObject {
  @Published var phase: AiVoicePhase = .idle
  @Published var holdingToTalk = false
  @Published var assistantSpeaking = false
  /// The assistant's current spoken reply, streaming in as it talks.
  @Published var transcript = ""

  var isConnected: Bool { phase == .connected }

  func setPhase(_ value: AiVoicePhase) { phase = value }
  func setHolding(_ value: Bool) { holdingToTalk = value }
  func setAssistantSpeaking(_ value: Bool) { assistantSpeaking = value }
  func setTranscript(_ value: String) { transcript = value }

  func reset() {
    phase = .idle
    holdingToTalk = false
    assistantSpeaking = false
    transcript = ""
  }
}

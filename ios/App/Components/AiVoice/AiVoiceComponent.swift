import AVFoundation
import Foundation

/// The push-to-talk session workflow: asks the backend to mint a Realtime
/// client secret (createAiVoiceSession — the OpenAI key never reaches the
/// device), connects the audio bridge, and drives hold-to-talk. Holding
/// while the assistant is speaking interrupts it, like a real conversation.
@MainActor
final class AiVoiceComponent {
  private var voiceStore: AiVoiceStore { store.aiVoiceStore }
  private var bridge: AiVoiceRealtimeBridge?

  func connect() async {
    if voiceStore.phase == .connecting || voiceStore.isConnected {
      return
    }
    voiceStore.setPhase(.connecting)

    guard await requestMicrophonePermission() else {
      voiceStore.setPhase(.failed("Microphone access is required — enable it in Settings."))
      return
    }

    do {
      try configureAudioSession()
      let session = try await gql.createAiVoiceSession()
      let bridge = AiVoiceRealtimeBridge(
        onTranscript: { [weak self] transcript in
          self?.voiceStore.setTranscript(transcript)
        },
        onAssistantSpeakingChanged: { [weak self] speaking in
          self?.voiceStore.setAssistantSpeaking(speaking)
        },
        onError: { [weak self] message in
          self?.voiceStore.setPhase(.failed(message))
        }
      )
      try bridge.connect(clientSecret: session.clientSecret, model: session.model)
      self.bridge = bridge
      voiceStore.setPhase(.connected)
    } catch {
      voiceStore.setPhase(.failed(error.localizedDescription))
    }
  }

  func disconnect() {
    bridge?.disconnect()
    bridge = nil
    voiceStore.reset()
  }

  func beginHoldToTalk() {
    guard voiceStore.isConnected, let bridge else {
      return
    }
    if voiceStore.assistantSpeaking {
      bridge.cancelCurrentResponse()
    }
    voiceStore.setHolding(true)
    voiceStore.setTranscript("")
    bridge.beginHoldToTalk()
  }

  func endHoldToTalk() {
    guard voiceStore.holdingToTalk else {
      return
    }
    voiceStore.setHolding(false)
    bridge?.endHoldToTalk()
  }

  private func configureAudioSession() throws {
    let audioSession = AVAudioSession.sharedInstance()
    try audioSession.setCategory(
      .playAndRecord,
      mode: .voiceChat,
      options: [.defaultToSpeaker, .allowBluetooth]
    )
    try audioSession.setActive(true)
  }

  private func requestMicrophonePermission() async -> Bool {
    await withCheckedContinuation { continuation in
      AVAudioApplication.requestRecordPermission { granted in
        continuation.resume(returning: granted)
      }
    }
  }
}

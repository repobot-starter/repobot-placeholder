import AVFoundation
import Foundation

/// The push-to-talk session workflow: asks the backend to mint a Realtime
/// client secret (createAiVoiceSession — the OpenAI key never reaches the
/// device), connects the audio bridge, and drives hold-to-talk. Holding
/// while the assistant is speaking interrupts it, like a real conversation.
///
/// When the backend runs AI_MODE=local it returns a simulated session
/// (marked by `simulatedSecret`): no microphone, no realtime bridge — the
/// same connect/hold/release/interrupt workflow plays scripted transcript
/// replies, so the voice surface is fully exercisable in the sandbox.
@MainActor
final class AiVoiceComponent {
  /// Must stay in sync with AI_VOICE_SIMULATED_SECRET in
  /// firebase/functions/src/Services/Ai/AiVoiceService.ts.
  private static let simulatedSecret = "local-simulated-voice"

  private static let simulatedReplies = [
    "This is the simulated voice assistant — the sandbox runs without the realtime model, "
      + "so replies are scripted.",
    "Everything here works like the deployed surface: hold to talk, release to send, "
      + "hold again to interrupt me.",
    "Deploy this project with an OpenAI key connected and this same orb speaks with the real model.",
  ]

  private var voiceStore: AiVoiceStore { store.aiVoiceStore }
  private var bridge: AiVoiceRealtimeBridge?
  private var isSimulated = false
  private var simulationTask: Task<Void, Never>?
  private var simulatedReplyIndex = 0

  func connect() async {
    if voiceStore.phase == .connecting || voiceStore.isConnected {
      return
    }
    voiceStore.setPhase(.connecting)

    do {
      let session = try await gql.createAiVoiceSession()

      if session.clientSecret == Self.simulatedSecret {
        isSimulated = true
        voiceStore.setPhase(.connected)
        return
      }

      guard await requestMicrophonePermission() else {
        voiceStore.setPhase(.failed("Microphone access is required — enable it in Settings."))
        return
      }
      try configureAudioSession()
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
    simulationTask?.cancel()
    simulationTask = nil
    isSimulated = false
    bridge?.disconnect()
    bridge = nil
    voiceStore.reset()
  }

  func beginHoldToTalk() {
    guard voiceStore.isConnected else {
      return
    }
    if isSimulated {
      // Holding interrupts the scripted reply, matching the real bridge.
      simulationTask?.cancel()
      voiceStore.setAssistantSpeaking(false)
      voiceStore.setHolding(true)
      voiceStore.setTranscript("")
      return
    }
    guard let bridge else {
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
    if isSimulated {
      playSimulatedReply()
      return
    }
    bridge?.endHoldToTalk()
  }

  /// Streams a canned reply into the transcript word by word, with the orb
  /// in its "speaking" state — the same store transitions the bridge drives.
  private func playSimulatedReply() {
    let reply = Self.simulatedReplies[simulatedReplyIndex % Self.simulatedReplies.count]
    simulatedReplyIndex += 1
    simulationTask?.cancel()
    simulationTask = Task { [weak self] in
      guard let self else { return }
      self.voiceStore.setAssistantSpeaking(true)
      var shown = ""
      for word in reply.split(separator: " ") {
        try? await Task.sleep(nanoseconds: 130_000_000)
        if Task.isCancelled { return }
        shown = shown.isEmpty ? String(word) : "\(shown) \(word)"
        self.voiceStore.setTranscript(shown)
      }
      try? await Task.sleep(nanoseconds: 400_000_000)
      if Task.isCancelled { return }
      self.voiceStore.setAssistantSpeaking(false)
    }
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

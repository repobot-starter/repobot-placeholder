import AVFoundation
import Foundation

enum AiVoiceBridgeFailure: Error, LocalizedError {
  case invalidEndpoint
  case disconnected(String)

  var errorDescription: String? {
    switch self {
    case .invalidEndpoint:
      return "The realtime endpoint is invalid."
    case let .disconnected(message):
      return message
    }
  }
}

/// The audio pipeline between the microphone, the speaker, and one OpenAI
/// Realtime WebSocket. Push-to-talk shaped: while the caller holds,
/// microphone PCM streams into the session's input buffer; on release the
/// buffer is committed and a spoken response is requested. Assistant audio
/// deltas play as they arrive and transcript deltas surface via callbacks.
///
/// The session itself (model, voice, instructions) is configured server-side
/// when the client secret is minted — see AiVoiceService in
/// firebase/functions — so this bridge never overrides session config.
final class AiVoiceRealtimeBridge {
  /// Below this peak the chunk is treated as silence and not sent.
  private static let floatSpeechPeakThreshold: Float = 0.002
  /// Chunks with voice needed before a release commits (filters taps).
  private static let minimumVoicedChunks = 1

  private let session = URLSession(configuration: .default)
  private var webSocketTask: URLSessionWebSocketTask?
  private var receiveTask: Task<Void, Never>?
  private let audioEngine = AVAudioEngine()
  private let playerNode = AVAudioPlayerNode()
  private let realtimeFormat = AVAudioFormat(
    commonFormat: .pcmFormatInt16,
    sampleRate: 24_000,
    channels: 1,
    interleaved: false
  )!
  private var playbackFormat: AVAudioFormat?

  private var isStreamingInputAudio = false
  private var voicedInputChunks = 0
  private var responseInProgress = false
  private var responseDone = false
  private var pendingPlaybackBuffers = 0
  private var transcript = ""

  private let onTranscript: @MainActor (String) -> Void
  private let onAssistantSpeakingChanged: @MainActor (Bool) -> Void
  private let onError: @MainActor (String) -> Void

  init(
    onTranscript: @escaping @MainActor (String) -> Void,
    onAssistantSpeakingChanged: @escaping @MainActor (Bool) -> Void,
    onError: @escaping @MainActor (String) -> Void
  ) {
    self.onTranscript = onTranscript
    self.onAssistantSpeakingChanged = onAssistantSpeakingChanged
    self.onError = onError
  }

  func connect(clientSecret: String, model: String) throws {
    var components = URLComponents(string: "wss://api.openai.com/v1/realtime")!
    components.queryItems = [URLQueryItem(name: "model", value: model)]
    guard let url = components.url else {
      throw AiVoiceBridgeFailure.invalidEndpoint
    }
    var request = URLRequest(url: url)
    request.setValue("Bearer \(clientSecret)", forHTTPHeaderField: "Authorization")

    let task = session.webSocketTask(with: request)
    webSocketTask = task
    task.resume()

    try configureAudioPipeline()
    startReceivingEvents()
  }

  func disconnect() {
    isStreamingInputAudio = false
    voicedInputChunks = 0
    responseInProgress = false
    responseDone = false
    pendingPlaybackBuffers = 0
    transcript = ""
    audioEngine.inputNode.removeTap(onBus: 0)
    receiveTask?.cancel()
    receiveTask = nil
    webSocketTask?.cancel(with: .normalClosure, reason: nil)
    webSocketTask = nil
    playerNode.stop()
    audioEngine.stop()
  }

  /// Press: start streaming microphone PCM into the input buffer.
  func beginHoldToTalk() {
    isStreamingInputAudio = true
    voicedInputChunks = 0
  }

  /// Release: commit the buffer and ask for a spoken response — unless the
  /// hold contained no audible speech, in which case it is discarded.
  func endHoldToTalk() {
    isStreamingInputAudio = false
    if voicedInputChunks < Self.minimumVoicedChunks {
      sendEvent(["type": "input_audio_buffer.clear"])
      return
    }
    sendEvent(["type": "input_audio_buffer.commit"])
    sendEvent(["type": "response.create"])
    voicedInputChunks = 0
  }

  /// Barge-in: stop the assistant mid-answer.
  func cancelCurrentResponse() {
    responseInProgress = false
    responseDone = false
    pendingPlaybackBuffers = 0
    sendEvent(["type": "response.cancel"])
    playerNode.stop()
    playerNode.play()
    Task { @MainActor [onAssistantSpeakingChanged] in
      onAssistantSpeakingChanged(false)
    }
  }

  // MARK: - Audio capture

  private func configureAudioPipeline() throws {
    audioEngine.attach(playerNode)
    let mixerFormat = audioEngine.mainMixerNode.outputFormat(forBus: 0)
    playbackFormat = mixerFormat
    audioEngine.connect(playerNode, to: audioEngine.mainMixerNode, format: mixerFormat)

    let inputNode = audioEngine.inputNode
    let inputFormat = inputNode.outputFormat(forBus: 0)
    inputNode.removeTap(onBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 1_024, format: inputFormat) { [weak self] buffer, _ in
      self?.handleInputBuffer(buffer, inputFormat: inputFormat)
    }
    try audioEngine.start()
    playerNode.play()
  }

  private func handleInputBuffer(_ buffer: AVAudioPCMBuffer, inputFormat: AVAudioFormat) {
    if !isStreamingInputAudio {
      return
    }
    if !hasSpeechEnergy(buffer) {
      return
    }
    guard let audioBase64 = pcm16Base64(from: buffer, inputFormat: inputFormat) else {
      return
    }
    voicedInputChunks += 1
    sendEvent(["type": "input_audio_buffer.append", "audio": audioBase64])
  }

  private func hasSpeechEnergy(_ buffer: AVAudioPCMBuffer) -> Bool {
    let frameCount = Int(buffer.frameLength)
    guard frameCount > 0, let channelData = buffer.floatChannelData?[0] else {
      // Non-float capture formats skip the silence gate rather than drop audio.
      return frameCount > 0
    }
    var peak: Float = 0
    for index in 0..<frameCount {
      peak = max(peak, abs(channelData[index]))
    }
    return peak >= Self.floatSpeechPeakThreshold
  }

  /// Resamples a microphone buffer to the session's 24kHz mono PCM16 format.
  private func pcm16Base64(from buffer: AVAudioPCMBuffer, inputFormat: AVAudioFormat) -> String? {
    let frameRatio = realtimeFormat.sampleRate / inputFormat.sampleRate
    let capacity = AVAudioFrameCount(Double(buffer.frameLength) * frameRatio) + 16
    guard
      let converted = AVAudioPCMBuffer(pcmFormat: realtimeFormat, frameCapacity: capacity),
      let converter = AVAudioConverter(from: inputFormat, to: realtimeFormat)
    else {
      return nil
    }

    var provided = false
    var conversionError: NSError?
    let status = converter.convert(to: converted, error: &conversionError) { _, outStatus in
      if provided {
        outStatus.pointee = .noDataNow
        return nil
      }
      provided = true
      outStatus.pointee = .haveData
      return buffer
    }
    guard
      status != .error,
      conversionError == nil,
      converted.frameLength > 0,
      let channelData = converted.int16ChannelData?[0]
    else {
      return nil
    }
    let byteCount = Int(converted.frameLength) * MemoryLayout<Int16>.size
    return Data(bytes: channelData, count: byteCount).base64EncodedString()
  }

  // MARK: - Realtime events

  private func startReceivingEvents() {
    receiveTask?.cancel()
    receiveTask = Task { [weak self] in
      while !Task.isCancelled {
        guard let self, let task = self.webSocketTask else {
          return
        }
        do {
          let message = try await task.receive()
          switch message {
          case .string(let text):
            self.handleEvent(text)
          case .data(let data):
            if let text = String(data: data, encoding: .utf8) {
              self.handleEvent(text)
            }
          @unknown default:
            break
          }
        } catch {
          if Task.isCancelled || Self.isExpectedDisconnect(error) {
            return
          }
          await MainActor.run {
            self.onError("The voice connection dropped: \(error.localizedDescription)")
          }
          return
        }
      }
    }
  }

  private static func isExpectedDisconnect(_ error: Error) -> Bool {
    if error is CancellationError {
      return true
    }
    if let urlError = error as? URLError, urlError.code == .cancelled {
      return true
    }
    return false
  }

  private func handleEvent(_ jsonText: String) {
    guard
      let data = jsonText.data(using: .utf8),
      let event = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      let type = event["type"] as? String
    else {
      return
    }

    switch type {
    case "response.created":
      responseInProgress = true
      responseDone = false
      notifyAssistantSpeaking(true)

    case "response.audio.delta", "response.output_audio.delta":
      let delta = (event["delta"] as? String) ?? (event["audio"] as? String)
      if let delta, !delta.isEmpty {
        playPcm16Audio(base64Pcm16: delta)
      }

    case "response.audio_transcript.delta", "response.output_audio_transcript.delta":
      if let delta = event["delta"] as? String, !delta.isEmpty {
        transcript += delta
        notifyTranscript(transcript)
      }

    case "response.done":
      responseInProgress = false
      responseDone = true
      transcript = ""
      if pendingPlaybackBuffers <= 0 {
        notifyAssistantSpeaking(false)
      }

    case "error":
      if
        let errorObject = event["error"] as? [String: Any],
        let message = errorObject["message"] as? String,
        // Empty-commit races are harmless; every other error surfaces.
        !message.lowercased().contains("input audio buffer")
      {
        Task { @MainActor [onError] in
          onError(message)
        }
      }

    default:
      break
    }
  }

  // MARK: - Playback

  private func playPcm16Audio(base64Pcm16: String) {
    guard let data = Data(base64Encoded: base64Pcm16) else {
      return
    }
    let frameCount = UInt32(data.count / MemoryLayout<Int16>.size)
    guard let sourceBuffer = AVAudioPCMBuffer(pcmFormat: realtimeFormat, frameCapacity: frameCount) else {
      return
    }
    sourceBuffer.frameLength = frameCount
    data.copyBytes(
      to: UnsafeMutableRawBufferPointer(start: sourceBuffer.int16ChannelData?[0], count: data.count)
    )
    guard let playbackBuffer = convertedPlaybackBuffer(from: sourceBuffer) else {
      return
    }
    pendingPlaybackBuffers += 1
    playerNode.scheduleBuffer(playbackBuffer) { [weak self] in
      guard let self else {
        return
      }
      if self.pendingPlaybackBuffers > 0 {
        self.pendingPlaybackBuffers -= 1
      }
      if self.responseDone && self.pendingPlaybackBuffers == 0 {
        self.notifyAssistantSpeaking(false)
      }
    }
  }

  private func convertedPlaybackBuffer(from sourceBuffer: AVAudioPCMBuffer) -> AVAudioPCMBuffer? {
    guard let playbackFormat, playbackFormat != realtimeFormat else {
      return sourceBuffer
    }
    guard let converter = AVAudioConverter(from: realtimeFormat, to: playbackFormat) else {
      return nil
    }
    let frameRatio = playbackFormat.sampleRate / realtimeFormat.sampleRate
    let capacity = AVAudioFrameCount(Double(sourceBuffer.frameLength) * frameRatio) + 32
    guard let converted = AVAudioPCMBuffer(pcmFormat: playbackFormat, frameCapacity: capacity) else {
      return nil
    }
    var provided = false
    var conversionError: NSError?
    let status = converter.convert(to: converted, error: &conversionError) { _, outStatus in
      if provided {
        outStatus.pointee = .endOfStream
        return nil
      }
      provided = true
      outStatus.pointee = .haveData
      return sourceBuffer
    }
    guard status != .error, conversionError == nil, converted.frameLength > 0 else {
      return nil
    }
    return converted
  }

  // MARK: - Plumbing

  private func notifyTranscript(_ text: String) {
    Task { @MainActor [onTranscript] in
      onTranscript(text)
    }
  }

  private func notifyAssistantSpeaking(_ speaking: Bool) {
    Task { @MainActor [onAssistantSpeakingChanged] in
      onAssistantSpeakingChanged(speaking)
    }
  }

  private func sendEvent(_ payload: [String: Any]) {
    guard
      let webSocketTask,
      let data = try? JSONSerialization.data(withJSONObject: payload),
      let text = String(data: data, encoding: .utf8)
    else {
      return
    }
    webSocketTask.send(.string(text)) { [weak self] error in
      if let error {
        Task { @MainActor in
          self?.onError("Sending audio failed: \(error.localizedDescription)")
        }
      }
    }
  }
}

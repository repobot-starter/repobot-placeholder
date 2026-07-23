import SwiftUI

/// The talk pack's native surface: push-to-talk voice with OpenAI Realtime.
/// Hold the orb to speak; release and the assistant answers out loud with a
/// live transcript. The backend mints the session (createAiVoiceSession), so
/// no API key ever ships in the app. Voice needs the real model — there is
/// no simulated sandbox mode (see packs/talk/PACK.md).
struct AiVoiceView: View {
  @EnvironmentObject private var voiceStore: AiVoiceStore

  private static let night = Color(red: 0.043, green: 0.047, blue: 0.063)
  private static let amber = Color(red: 0.949, green: 0.639, blue: 0.235)
  private static let amberDeep = Color(red: 0.788, green: 0.482, blue: 0.086)

  var body: some View {
    VStack(spacing: 0) {
      header
      Spacer()
      stage
      Spacer()
      footer
    }
    .background(Self.night.ignoresSafeArea())
    .preferredColorScheme(.dark)
    .onDisappear {
      components.aiVoice.disconnect()
    }
  }

  private var header: some View {
    HStack(spacing: 8) {
      Circle()
        .fill(Self.amber)
        .frame(width: 9, height: 9)
        .shadow(color: Self.amber, radius: 6)
      Text("TalkBot")
        .font(.headline)
        .foregroundStyle(.white)
      Spacer()
      if voiceStore.isConnected {
        Button("End") {
          components.aiVoice.disconnect()
        }
        .font(.footnote.weight(.medium))
        .foregroundStyle(.white.opacity(0.65))
        .padding(.horizontal, 14)
        .padding(.vertical, 7)
        .background(Capsule().stroke(.white.opacity(0.16)))
      }
    }
    .padding(.horizontal, 18)
    .padding(.vertical, 12)
  }

  @ViewBuilder
  private var stage: some View {
    switch voiceStore.phase {
    case .idle:
      VStack(spacing: 16) {
        Text("Hold a button.\nTalk to your app.")
          .font(.title.weight(.semibold))
          .foregroundStyle(.white)
          .multilineTextAlignment(.center)
        Text("Push-to-talk voice, answered out loud with a live transcript.")
          .font(.subheadline)
          .foregroundStyle(.white.opacity(0.6))
          .multilineTextAlignment(.center)
          .padding(.horizontal, 40)
        Button {
          Task { await components.aiVoice.connect() }
        } label: {
          Text("Start a conversation")
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(Self.night)
            .padding(.horizontal, 24)
            .padding(.vertical, 13)
            .background(Capsule().fill(Self.amber))
        }
        .padding(.top, 8)
      }

    case .connecting:
      VStack(spacing: 14) {
        ProgressView().tint(Self.amber)
        Text("Connecting…")
          .font(.subheadline)
          .foregroundStyle(.white.opacity(0.6))
      }

    case .connected:
      VStack(spacing: 26) {
        transcriptView
        pushToTalkOrb
        Text(orbHint)
          .font(.footnote)
          .foregroundStyle(.white.opacity(0.45))
      }

    case .failed(let message):
      VStack(spacing: 14) {
        Image(systemName: "exclamationmark.triangle")
          .font(.title2)
          .foregroundStyle(Self.amber)
        Text(message)
          .font(.subheadline)
          .foregroundStyle(.white.opacity(0.75))
          .multilineTextAlignment(.center)
          .padding(.horizontal, 34)
        Button("Try again") {
          components.aiVoice.disconnect()
          Task { await components.aiVoice.connect() }
        }
        .font(.subheadline.weight(.semibold))
        .foregroundStyle(Self.amber)
      }
    }
  }

  private var transcriptView: some View {
    ScrollView {
      Text(voiceStore.transcript.isEmpty ? " " : voiceStore.transcript)
        .font(.body)
        .foregroundStyle(.white.opacity(0.85))
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 30)
    }
    .frame(maxHeight: 180)
  }

  private var pushToTalkOrb: some View {
    ZStack {
      Circle()
        .fill(
          RadialGradient(
            colors: [Self.amber, Self.amberDeep],
            center: .init(x: 0.32, y: 0.28),
            startRadius: 8,
            endRadius: 120
          )
        )
        .frame(width: 148, height: 148)
        .scaleEffect(voiceStore.holdingToTalk ? 1.12 : (voiceStore.assistantSpeaking ? 1.05 : 1))
        .shadow(
          color: Self.amber.opacity(voiceStore.holdingToTalk ? 0.65 : 0.3),
          radius: voiceStore.holdingToTalk ? 44 : 24
        )
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: voiceStore.holdingToTalk)
        .animation(
          voiceStore.assistantSpeaking
            ? .easeInOut(duration: 0.9).repeatForever(autoreverses: true)
            : .default,
          value: voiceStore.assistantSpeaking
        )

      Image(systemName: voiceStore.holdingToTalk ? "waveform" : "mic.fill")
        .font(.system(size: 44, weight: .medium))
        .foregroundStyle(Self.night)
    }
    .gesture(
      DragGesture(minimumDistance: 0)
        .onChanged { _ in
          if !voiceStore.holdingToTalk {
            components.aiVoice.beginHoldToTalk()
          }
        }
        .onEnded { _ in
          components.aiVoice.endHoldToTalk()
        }
    )
    .accessibilityLabel("Hold to talk")
  }

  private var orbHint: String {
    if voiceStore.holdingToTalk {
      return "Listening… release to send"
    }
    if voiceStore.assistantSpeaking {
      return "Speaking — hold to interrupt"
    }
    return "Hold to talk"
  }

  private var footer: some View {
    Text("Voice runs on OpenAI Realtime via a server-minted session.")
      .font(.caption2)
      .foregroundStyle(.white.opacity(0.3))
      .padding(.bottom, 14)
  }
}

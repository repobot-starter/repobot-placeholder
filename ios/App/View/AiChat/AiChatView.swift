import SwiftUI

/// The chat pack's native surface: an AI chat thread streaming from the
/// ai__request__chat function, twin to web/app/src/View/AiChat/. In the
/// sandbox the assistant is simulated (AI_MODE=local); deployed with an
/// OpenAI key it is the real model with the same protocol.
struct AiChatView: View {
  @EnvironmentObject private var chatStore: AiChatStore
  @State private var draft = ""

  private static let night = Color(red: 0.055, green: 0.063, blue: 0.086)
  private static let panel = Color(red: 0.086, green: 0.102, blue: 0.141)
  private static let violet = Color(red: 0.545, green: 0.486, blue: 0.969)

  var body: some View {
    VStack(spacing: 0) {
      header
      if chatStore.hasMessages {
        thread
      } else {
        emptyState
      }
      composer
    }
    .background(Self.night.ignoresSafeArea())
    .preferredColorScheme(.dark)
  }

  private var header: some View {
    HStack {
      HStack(spacing: 8) {
        Circle()
          .fill(Self.violet)
          .frame(width: 9, height: 9)
          .shadow(color: Self.violet, radius: 6)
        Text("ChatBot")
          .font(.headline)
          .foregroundStyle(.white)
      }
      Spacer()
      if chatStore.hasMessages {
        Button("New chat") {
          components.aiChat.resetConversation()
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

  private var emptyState: some View {
    VStack(spacing: 12) {
      Spacer()
      Text("Ask me anything")
        .font(.title.weight(.semibold))
        .foregroundStyle(.white)
      Text("Streaming answers, visible reasoning, and a real tool call — simulated in the sandbox, the real model when deployed.")
        .font(.subheadline)
        .foregroundStyle(.white.opacity(0.6))
        .multilineTextAlignment(.center)
        .padding(.horizontal, 36)
      VStack(spacing: 8) {
        suggestionButton("What can you do?")
        suggestionButton("What time is it in Tokyo?")
        suggestionButton("Explain this starter in three bullets")
      }
      .padding(.top, 8)
      Spacer()
    }
    .frame(maxWidth: .infinity)
  }

  private func suggestionButton(_ suggestion: String) -> some View {
    Button {
      components.aiChat.submitMessage(suggestion)
    } label: {
      Text(suggestion)
        .font(.footnote)
        .foregroundStyle(.white.opacity(0.75))
        .padding(.horizontal, 16)
        .padding(.vertical, 9)
        .background(Capsule().fill(Self.panel))
        .overlay(Capsule().stroke(.white.opacity(0.12)))
    }
  }

  private var thread: some View {
    ScrollViewReader { proxy in
      ScrollView {
        LazyVStack(alignment: .leading, spacing: 18) {
          ForEach(chatStore.responses) { response in
            AiChatExchangeView(response: response)
          }
          if let errorMessage = chatStore.errorMessage {
            Text(errorMessage)
              .font(.footnote)
              .foregroundStyle(Color(red: 0.94, green: 0.57, blue: 0.55))
          }
          Color.clear.frame(height: 1).id("thread-bottom")
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 10)
      }
      .onChange(of: latestChangeToken) { _ in
        withAnimation(.easeOut(duration: 0.15)) {
          proxy.scrollTo("thread-bottom", anchor: .bottom)
        }
      }
    }
  }

  /// Changes whenever streamed content grows, driving keep-in-view scrolling.
  private var latestChangeToken: Int {
    var hasher = Hasher()
    hasher.combine(chatStore.responses.count)
    if let last = chatStore.responses.last {
      hasher.combine(last.responseItems.count)
      hasher.combine(last.assistantMessage?.message.count ?? 0)
      hasher.combine(last.assistantMessage?.message.last?.content.count ?? 0)
    }
    return hasher.finalize()
  }

  private var composer: some View {
    HStack(alignment: .bottom, spacing: 10) {
      TextField("Message the assistant…", text: $draft, axis: .vertical)
        .lineLimit(1...5)
        .font(.subheadline)
        .foregroundStyle(.white)
        .tint(Self.violet)
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(RoundedRectangle(cornerRadius: 16).fill(Self.panel))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(.white.opacity(0.12)))
        .onSubmit(submitDraft)

      if chatStore.streaming {
        Button {
          components.aiChat.stopStreaming()
        } label: {
          Image(systemName: "stop.fill")
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(.white.opacity(0.75))
            .frame(width: 42, height: 42)
            .background(RoundedRectangle(cornerRadius: 14).stroke(.white.opacity(0.16)))
        }
      } else {
        Button(action: submitDraft) {
          Image(systemName: "arrow.up")
            .font(.system(size: 16, weight: .bold))
            .foregroundStyle(Self.night)
            .frame(width: 42, height: 42)
            .background(RoundedRectangle(cornerRadius: 14).fill(Self.violet))
        }
        .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        .opacity(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.45 : 1)
      }
    }
    .padding(.horizontal, 14)
    .padding(.vertical, 10)
  }

  private func submitDraft() {
    if chatStore.streaming {
      return
    }
    components.aiChat.submitMessage(draft)
    draft = ""
  }
}

/// One exchange: the user's message, the assistant's machinery (reasoning
/// and tool calls), and the answer segments.
private struct AiChatExchangeView: View {
  let response: AiChatResponse

  private static let panel = Color(red: 0.086, green: 0.102, blue: 0.141)
  private static let violet = Color(red: 0.545, green: 0.486, blue: 0.969)

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack {
        Spacer(minLength: 40)
        Text(response.requestMessage)
          .font(.subheadline)
          .foregroundStyle(.white)
          .padding(.horizontal, 15)
          .padding(.vertical, 10)
          .background(
            RoundedRectangle(cornerRadius: 16).fill(Self.violet.opacity(0.18))
          )
          .overlay(
            RoundedRectangle(cornerRadius: 16).stroke(Self.violet.opacity(0.35))
          )
      }

      ForEach(response.responseItems) { item in
        machineryView(item)
      }

      if let assistantMessage = response.assistantMessage {
        segmentsView(assistantMessage.message)
      }
    }
  }

  @ViewBuilder
  private func machineryView(_ item: AiChatResponseItem) -> some View {
    VStack(alignment: .leading, spacing: 4) {
      HStack(spacing: 6) {
        if isInProgress(item) {
          ProgressView().controlSize(.mini).tint(Self.violet)
        }
        Text(machineryLabel(item))
          .font(.caption2.weight(.semibold).monospaced())
          .foregroundStyle(.white.opacity(0.4))
          .textCase(.uppercase)
      }
      Text(machineryText(item))
        .font(.caption)
        .foregroundStyle(.white.opacity(0.62))
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(12)
    .background(RoundedRectangle(cornerRadius: 12).fill(Self.panel))
    .overlay(RoundedRectangle(cornerRadius: 12).stroke(.white.opacity(0.1)))
  }

  private func isInProgress(_ item: AiChatResponseItem) -> Bool {
    item.functionCall?.status == .inProgress || item.reasoningSummary?.status == .inProgress
  }

  private func machineryLabel(_ item: AiChatResponseItem) -> String {
    var label = item.functionCall != nil ? "Tool" : "Thinking"
    if let elapsedSeconds = item.elapsedSeconds, elapsedSeconds > 0 {
      label += " · \(Int(elapsedSeconds))s"
    }
    return label
  }

  private func machineryText(_ item: AiChatResponseItem) -> String {
    if let functionCall = item.functionCall {
      return "\(functionCall.name) \(functionCall.output != nil ? "→ done" : "running…")"
    }
    if let reasoningSummary = item.reasoningSummary {
      return reasoningSummary.message.map(\.content).joined(separator: " ")
    }
    return ""
  }

  @ViewBuilder
  private func segmentsView(_ segments: [AiChatSegment]) -> some View {
    VStack(alignment: .leading, spacing: 8) {
      ForEach(segments) { segment in
        segmentView(segment)
      }
    }
  }

  @ViewBuilder
  private func segmentView(_ segment: AiChatSegment) -> some View {
    switch segment.format {
    case .title:
      Text(segment.content)
        .font(.headline)
        .foregroundStyle(.white)
        .padding(.top, 4)
    case .listItem:
      HStack(alignment: .top, spacing: 8) {
        Text("•").foregroundStyle(Self.violet)
        Text(segment.content).foregroundStyle(.white)
      }
      .font(.subheadline)
    case .code:
      Text(segment.content)
        .font(.caption.monospaced())
        .foregroundStyle(.white.opacity(0.85))
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 12).fill(Self.panel))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(.white.opacity(0.1)))
    case .quote:
      HStack(spacing: 10) {
        RoundedRectangle(cornerRadius: 2).fill(Self.violet).frame(width: 3)
        Text(segment.content)
          .font(.subheadline)
          .foregroundStyle(.white.opacity(0.62))
      }
      .fixedSize(horizontal: false, vertical: true)
    case .paragraph:
      Text(segment.content)
        .font(.subheadline)
        .foregroundStyle(.white)
        .lineSpacing(3)
    }
  }
}

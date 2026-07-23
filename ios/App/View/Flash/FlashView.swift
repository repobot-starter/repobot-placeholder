import SwiftUI

/// Study-lamp palette, mirrored from FlashPage.styles.css.ts.
private enum FlashPalette {
  static let paper = Color(red: 0.969, green: 0.965, blue: 0.988)
  static let ink = Color(red: 0.137, green: 0.129, blue: 0.212)
  static let inkSoft = Color(red: 0.431, green: 0.416, blue: 0.525)
  static let line = Color(red: 0.886, green: 0.878, blue: 0.937)
  static let violet = Color(red: 0.357, green: 0.310, blue: 0.780)
  static let violetSoft = Color(red: 0.925, green: 0.918, blue: 0.984)
  static let amber = Color(red: 0.898, green: 0.639, blue: 0.239)
  static let green = Color(red: 0.243, green: 0.420, blue: 0.310)
  static let red = Color(red: 0.627, green: 0.294, blue: 0.235)
}

/// Saved progress: deckId -> card front -> state. Stored as JSON in
/// UserDefaults (the native mirror of the web pack's localStorage key).
private enum FlashStore {
  static let key = "flashbot-progress"

  static func load() -> [String: [String: FlashScheduler.CardState]] {
    guard let data = UserDefaults.standard.data(forKey: key),
      let decoded = try? JSONDecoder().decode(
        [String: [String: FlashScheduler.CardState]].self, from: data)
    else { return [:] }
    return decoded
  }

  static func save(_ progress: [String: [String: FlashScheduler.CardState]]) {
    if let data = try? JSONEncoder().encode(progress) {
      UserDefaults.standard.set(data, forKey: key)
    }
  }
}

struct FlashView: View {
  @State private var openDeckId: String?
  @State private var progress = FlashStore.load()

  var body: some View {
    ZStack {
      FlashPalette.paper.ignoresSafeArea()
      if let deck = FlashContent.decks.first(where: { $0.id == openDeckId }) {
        StudySessionView(
          deck: deck,
          progress: $progress,
          onExit: { openDeckId = nil })
      } else {
        deckList
      }
    }
  }

  private var deckList: some View {
    let today = FlashScheduler.dayIndex(Date())
    return ScrollView {
      VStack(spacing: 14) {
        VStack(spacing: 8) {
          Text(FlashContent.title)
            .font(.system(size: 36, weight: .bold, design: .serif))
            .foregroundStyle(FlashPalette.ink)
          Text(FlashContent.tagline)
            .font(.subheadline)
            .foregroundStyle(FlashPalette.inkSoft)
        }
        .padding(.top, 34)
        .padding(.bottom, 12)

        ForEach(FlashContent.decks) { deck in
          deckRow(deck, today: today)
        }

        Text("Spaced repetition, five boxes, no streak guilt. Built with Repobot.")
          .font(.caption)
          .foregroundStyle(FlashPalette.inkSoft)
          .padding(.top, 24)
      }
      .padding(.horizontal, 22)
      .padding(.bottom, 48)
    }
  }

  private func deckRow(_ deck: FlashContent.Deck, today: Int) -> some View {
    let states = statesForDeck(progress, deck: deck)
    let summary = FlashScheduler.deckProgress(states, today: today)
    let fraction = summary.total == 0 ? 0 : Double(summary.mastered) / Double(summary.total)

    return Button {
      openDeckId = deck.id
    } label: {
      HStack(spacing: 14) {
        Text(deck.emoji)
          .font(.system(size: 28))
          .frame(width: 52, height: 52)
          .background(RoundedRectangle(cornerRadius: 14).fill(FlashPalette.violetSoft))
        VStack(alignment: .leading, spacing: 4) {
          Text(deck.title)
            .font(.system(size: 18, weight: .semibold, design: .serif))
            .foregroundStyle(FlashPalette.ink)
          Text(deck.description)
            .font(.caption)
            .foregroundStyle(FlashPalette.inkSoft)
            .multilineTextAlignment(.leading)
          GeometryReader { geo in
            ZStack(alignment: .leading) {
              Capsule().fill(FlashPalette.line)
              Capsule().fill(FlashPalette.violet)
                .frame(width: geo.size.width * fraction)
            }
          }
          .frame(height: 6)
          .padding(.top, 4)
          Text("\(summary.mastered) of \(summary.total) mastered")
            .font(.caption2)
            .foregroundStyle(FlashPalette.inkSoft)
        }
        Spacer()
        if summary.due > 0 {
          Text("\(summary.due) due")
            .font(.caption2.weight(.bold))
            .foregroundStyle(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Capsule().fill(FlashPalette.amber))
        } else {
          Text("Done today")
            .font(.caption2.weight(.bold))
            .foregroundStyle(FlashPalette.green)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Capsule().fill(Color(red: 0.910, green: 0.937, blue: 0.914)))
        }
      }
      .padding(16)
      .background(RoundedRectangle(cornerRadius: 16).fill(Color.white))
      .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(FlashPalette.line))
    }
    .buttonStyle(.plain)
  }
}

/// Card states for a deck, keyed by card front (stable across content edits).
private func statesForDeck(
  _ progress: [String: [String: FlashScheduler.CardState]], deck: FlashContent.Deck
) -> [FlashScheduler.CardState] {
  let saved = progress[deck.id] ?? [:]
  return deck.cards.map { saved[$0.front] ?? FlashScheduler.newCardState() }
}

private struct StudySessionView: View {
  let deck: FlashContent.Deck
  @Binding var progress: [String: [String: FlashScheduler.CardState]]
  let onExit: () -> Void

  @State private var queue: [Int] = []
  @State private var flipped = false
  @State private var reviewed = 0
  @State private var missed = 0

  private var today: Int { FlashScheduler.dayIndex(Date()) }

  var body: some View {
    VStack(spacing: 0) {
      HStack {
        Button(action: onExit) {
          Label(deck.title, systemImage: "arrow.left")
            .font(.footnote.weight(.semibold))
            .foregroundStyle(FlashPalette.violet)
        }
        .buttonStyle(.plain)
        Spacer()
        Text("\(queue.count) to go")
          .font(.footnote)
          .foregroundStyle(FlashPalette.inkSoft)
      }
      .padding(.top, 22)

      if let currentIndex = queue.first {
        let card = deck.cards[currentIndex]
        Spacer()
        cardView(card)
        Spacer()
        HStack(spacing: 12) {
          gradeButton(
            "Again", enabled: flipped,
            background: Color(red: 0.965, green: 0.906, blue: 0.890),
            foreground: FlashPalette.red
          ) { grade(.again, index: currentIndex) }
          gradeButton(
            "Got it", enabled: flipped,
            background: FlashPalette.violet, foreground: .white
          ) { grade(.good, index: currentIndex) }
        }
        .padding(.bottom, 28)
      } else {
        summaryView
      }
    }
    .padding(.horizontal, 22)
    .onAppear {
      queue = FlashScheduler.dueIndices(statesForDeck(progress, deck: deck), today: today)
    }
  }

  private func cardView(_ card: FlashContent.Flashcard) -> some View {
    VStack(spacing: 12) {
      Text(flipped ? "ANSWER" : "QUESTION")
        .font(.caption2.weight(.bold))
        .kerning(1.6)
        .foregroundStyle(flipped ? FlashPalette.amber : FlashPalette.inkSoft)
      Text(flipped ? card.back : card.front)
        .font(.system(size: 26, weight: .semibold, design: .serif))
        .foregroundStyle(flipped ? FlashPalette.paper : FlashPalette.ink)
        .multilineTextAlignment(.center)
      if flipped, let hint = card.hint {
        Text(hint)
          .font(.footnote.italic())
          .foregroundStyle(Color(red: 0.663, green: 0.647, blue: 0.769))
          .multilineTextAlignment(.center)
      }
      if !flipped {
        Text("Tap to reveal")
          .font(.caption)
          .foregroundStyle(FlashPalette.inkSoft)
      }
    }
    .frame(maxWidth: .infinity)
    .frame(minHeight: 280)
    .padding(24)
    .background(
      RoundedRectangle(cornerRadius: 20)
        .fill(flipped ? FlashPalette.ink : Color.white))
    .overlay(RoundedRectangle(cornerRadius: 20).strokeBorder(FlashPalette.line))
    .rotation3DEffect(.degrees(flipped ? 360 : 0), axis: (x: 1, y: 0, z: 0))
    .animation(.easeInOut(duration: 0.3), value: flipped)
    .onTapGesture { flipped.toggle() }
  }

  private func gradeButton(
    _ label: String, enabled: Bool, background: Color, foreground: Color,
    action: @escaping () -> Void
  ) -> some View {
    Button(action: action) {
      Text(label)
        .font(.body.weight(.bold))
        .foregroundStyle(foreground)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 15)
        .background(RoundedRectangle(cornerRadius: 14).fill(background))
    }
    .buttonStyle(.plain)
    .disabled(!enabled)
    .opacity(enabled ? 1 : 0.4)
  }

  private var summaryView: some View {
    let states = statesForDeck(progress, deck: deck)
    let summary = FlashScheduler.deckProgress(states, today: today)
    return VStack(spacing: 10) {
      Spacer()
      Text(reviewed > 0 ? "🎉" : "🌤️")
        .font(.system(size: 44))
      Text(reviewed > 0 ? "Session complete" : "All caught up")
        .font(.system(size: 24, weight: .bold, design: .serif))
        .foregroundStyle(FlashPalette.ink)
      Text(
        reviewed > 0
          ? "Every due card reviewed. The boxes will bring them back right on time."
          : "Nothing is due in this deck today — come back tomorrow."
      )
      .font(.subheadline)
      .foregroundStyle(FlashPalette.inkSoft)
      .multilineTextAlignment(.center)
      HStack(spacing: 28) {
        statBlock("\(reviewed)", label: "reviews")
        statBlock("\(missed)", label: "misses")
        statBlock("\(summary.mastered)/\(summary.total)", label: "mastered")
      }
      .padding(.top, 14)
      Button(action: onExit) {
        Text("Back to decks")
          .font(.body.weight(.bold))
          .foregroundStyle(.white)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 15)
          .background(RoundedRectangle(cornerRadius: 14).fill(FlashPalette.violet))
      }
      .buttonStyle(.plain)
      .padding(.top, 18)
      Spacer()
    }
  }

  private func statBlock(_ number: String, label: String) -> some View {
    VStack(spacing: 2) {
      Text(number)
        .font(.system(size: 26, weight: .bold, design: .serif))
        .foregroundStyle(FlashPalette.violet)
      Text(label)
        .font(.caption2)
        .foregroundStyle(FlashPalette.inkSoft)
    }
  }

  private func grade(_ value: FlashScheduler.Grade, index: Int) {
    let states = statesForDeck(progress, deck: deck)
    let nextState = FlashScheduler.review(states[index], grade: value, today: today)
    var deckProgress = progress[deck.id] ?? [:]
    deckProgress[deck.cards[index].front] = nextState
    progress[deck.id] = deckProgress
    FlashStore.save(progress)
    reviewed += 1
    if value == .again {
      missed += 1
      // Missed cards come back at the end of this session.
      queue = Array(queue.dropFirst()) + [index]
    } else {
      queue = Array(queue.dropFirst())
    }
    flipped = false
  }
}

#Preview {
  FlashView()
}

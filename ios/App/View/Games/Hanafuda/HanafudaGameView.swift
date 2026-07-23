import SwiftUI

/// Home surface for the `hanafuda` pack — the native twin of the web
/// `HanafudaPage`. Purely client-side: hanafuda projects have no backend,
/// so this view must never touch stores, GraphQL, or the network.
///
/// All rules live in `HanafudaEngine` (a 1:1 port of the web engine); this
/// view is rendering and input only. Card faces use simplified native
/// drawing — month kanji + motif emoji + card-type color coding — instead
/// of the web's full SVG art (noted in PACK.md).
struct HanafudaGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  /// The engine is reference-typed mutable state; bumping `version` after
  /// every action re-renders the table without churning per-card state.
  @State private var engine = HanafudaEngine()
  @State private var version = 0
  @State private var botThinking = false
  @State private var toast: String?

  var body: some View {
    // The engine is a plain class, so body depends on `version`: reading it
    // here makes every bump() re-render the table.
    let _ = version
    return ZStack {
      VStack(spacing: theme.spacing.sm) {
        header
        botRow
        capturedRow(for: .bot)
        fieldSection
        capturedRow(for: .player)
        playerHandRow
        statusRow
      }
      .padding(theme.spacing.md)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)

      if let toast {
        toastView(toast)
      }
      if engine.phase == .decision {
        decisionOverlay
      }
      if engine.phase == .roundOver {
        roundOverOverlay
      }
      if engine.phase == .matchOver {
        matchOverOverlay
      }
    }
    .background(HanafudaPalette.table)
    .onAppear { pumpBot() }
  }

  // MARK: - Sections

  private var header: some View {
    VStack(spacing: 4) {
      Text("HANAFUDABOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .serif))
        .foregroundStyle(HanafudaPalette.gold)
      HStack {
        Button {
          engine.startMatch()
          toast = nil
          bump()
        } label: {
          Label("New Match", systemImage: "arrow.counterclockwise")
            .font(.system(size: theme.typography.sizes.xs, weight: .bold))
        }
        .buttonStyle(HanafudaChunkyButtonStyle())
        Spacer()
        Text("ROUND \(engine.round)/\(HanafudaEngine.totalRounds) · YOU \(engine.playerTotal) · BOT \(engine.botTotal)")
          .font(.system(size: theme.typography.sizes.xs, weight: .semibold, design: .monospaced))
          .foregroundStyle(HanafudaPalette.parchmentDim)
      }
    }
  }

  private var botRow: some View {
    HStack(spacing: 4) {
      Text("BOT")
        .font(.system(size: 10, weight: .bold, design: .monospaced))
        .foregroundStyle(HanafudaPalette.parchmentDim)
      ForEach(engine.botHand) { _ in
        HanafudaCardBackView(width: 26)
      }
      Spacer()
    }
  }

  private var fieldSection: some View {
    VStack(spacing: theme.spacing.sm) {
      let columns = [GridItem(.adaptive(minimum: 46), spacing: 6)]
      LazyVGrid(columns: columns, spacing: 6) {
        ForEach(engine.field) { card in
          HanafudaCardView(card: card, width: 46, highlighted: choosableIds.contains(card.id))
            .onTapGesture { chooseField(card) }
        }
      }
      HStack(spacing: theme.spacing.md) {
        HStack(spacing: 4) {
          HanafudaCardBackView(width: 30)
          Text("DECK \(engine.deck.count)")
            .font(.system(size: 10, weight: .bold, design: .monospaced))
            .foregroundStyle(HanafudaPalette.parchmentDim)
        }
        if let pending = engine.pendingHandCard ?? engine.pendingDrawnCard {
          HStack(spacing: 4) {
            HanafudaCardView(card: pending, width: 34, highlighted: true)
            Text(engine.pendingHandCard != nil ? "PLAYED — PICK A MATCH" : "FLIPPED — PICK A MATCH")
              .font(.system(size: 10, weight: .bold, design: .monospaced))
              .foregroundStyle(HanafudaPalette.gold)
          }
        }
        Spacer()
      }
    }
    .padding(theme.spacing.sm)
    .background(
      RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
        .fill(HanafudaPalette.felt)
        .overlay(
          RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
            .stroke(HanafudaPalette.goldDim, lineWidth: 1)
        )
    )
  }

  private func capturedRow(for seat: HanafudaSeat) -> some View {
    let pile = engine.captured(for: seat)
    let points = HanafudaEngine.yakuPoints(HanafudaEngine.evaluateYaku(pile))
    return HStack(spacing: 4) {
      Text(seat == .player ? "YOURS · \(points) PTS" : "BOT'S · \(points) PTS")
        .font(.system(size: 9, weight: .bold, design: .monospaced))
        .foregroundStyle(HanafudaPalette.parchmentDim)
        .frame(width: 78, alignment: .leading)
      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: 2) {
          // Trays grouped by card type, brights first.
          ForEach(sortedByKind(pile)) { card in
            HanafudaCardView(card: card, width: 24, highlighted: false)
          }
        }
      }
    }
    .frame(height: 44)
  }

  private var playerHandRow: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: 6) {
        ForEach(engine.playerHand) { card in
          HanafudaCardView(card: card, width: 54, highlighted: false)
            .onTapGesture { playCard(card) }
            .opacity(engine.phase == .selectHand ? 1 : 0.65)
        }
      }
      .padding(.vertical, 6)
    }
  }

  private var statusRow: some View {
    Text(statusMessage)
      .font(.system(size: theme.typography.sizes.xs, weight: .semibold, design: .monospaced))
      .foregroundStyle(HanafudaPalette.gold)
      .frame(maxWidth: .infinity)
  }

  // MARK: - Overlays

  private var decisionOverlay: some View {
    dialog(title: "役 — Yaku!") {
      if let report = engine.lastReport {
        ForEach(report.newYaku, id: \.key) { yaku in
          Text("\(yaku.label) — \(yaku.points)")
            .font(.system(size: theme.typography.sizes.sm))
            .foregroundStyle(HanafudaPalette.gold)
        }
      }
      Text("Koi-koi presses for a bigger hand; shobu banks the points now.")
        .font(.system(size: theme.typography.sizes.xs))
        .foregroundStyle(HanafudaPalette.parchment)
        .multilineTextAlignment(.center)
      HStack(spacing: theme.spacing.md) {
        Button("Koi-Koi") {
          engine.declareKoiKoi()
          bump()
        }
        .buttonStyle(HanafudaChunkyButtonStyle(prominent: true))
        Button("Shobu") {
          engine.declareShobu()
          bump()
        }
        .buttonStyle(HanafudaChunkyButtonStyle())
      }
    }
  }

  private var roundOverOverlay: some View {
    dialog(title: roundOverTitle) {
      if let result = engine.results.last, result.winner != nil {
        ForEach(result.yaku, id: \.key) { yaku in
          Text("\(yaku.label) — \(yaku.points)")
            .font(.system(size: theme.typography.sizes.sm))
            .foregroundStyle(HanafudaPalette.gold)
        }
        Text(
          result.score == result.basePoints
            ? "\(result.basePoints) points"
            : "\(result.basePoints) points → \(result.score) after doubling"
        )
        .font(.system(size: theme.typography.sizes.xs))
        .foregroundStyle(HanafudaPalette.parchment)
      }
      Button("Deal Round \(engine.round + 1)") {
        engine.startNextRound()
        bump()
      }
      .buttonStyle(HanafudaChunkyButtonStyle(prominent: true))
    }
  }

  private var matchOverOverlay: some View {
    dialog(title: matchOverTitle) {
      Text("Final — You \(engine.playerTotal) · Bot \(engine.botTotal)")
        .font(.system(size: theme.typography.sizes.sm))
        .foregroundStyle(HanafudaPalette.parchment)
      Button("New Match") {
        engine.startMatch()
        bump()
      }
      .buttonStyle(HanafudaChunkyButtonStyle(prominent: true))
    }
  }

  private func dialog<Content: View>(
    title: String, @ViewBuilder content: () -> Content
  ) -> some View {
    ZStack {
      Color.black.opacity(0.72).ignoresSafeArea()
      VStack(spacing: theme.spacing.md) {
        Text(title)
          .font(.system(size: theme.typography.sizes.lg, weight: .bold, design: .serif))
          .foregroundStyle(HanafudaPalette.gold)
        content()
      }
      .padding(theme.spacing.lg)
      .frame(maxWidth: 340)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
          .fill(HanafudaPalette.panel)
          .overlay(
            RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
              .stroke(HanafudaPalette.gold, lineWidth: 2)
          )
      )
    }
  }

  private func toastView(_ message: String) -> some View {
    VStack {
      Spacer()
      Text(message)
        .font(.system(size: theme.typography.sizes.xs, weight: .bold))
        .foregroundStyle(HanafudaPalette.gold)
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
          RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
            .fill(HanafudaPalette.panel)
            .overlay(
              RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
                .stroke(HanafudaPalette.gold, lineWidth: 1)
            )
        )
        .padding(.bottom, 120)
    }
    .allowsHitTesting(false)
  }

  // MARK: - Actions

  private var choosableIds: Set<Int> {
    if engine.phase == .chooseFieldForHand, let pending = engine.pendingHandCard {
      return Set(engine.fieldMatches(pending).map(\.id))
    }
    if engine.phase == .chooseFieldForDraw, let pending = engine.pendingDrawnCard {
      return Set(engine.fieldMatches(pending).map(\.id))
    }
    return []
  }

  private func playCard(_ card: HanafudaCard) {
    guard engine.phase == .selectHand else { return }
    engine.playHandCard(card.id)
    bump()
  }

  private func chooseField(_ card: HanafudaCard) {
    guard choosableIds.contains(card.id) else { return }
    engine.resolveFieldChoice(card.id)
    bump()
  }

  /// Re-render, surface any bot yaku toast, and keep the bot's turn moving.
  private func bump() {
    version += 1
    if let report = engine.lastReport, report.seat == .bot, !report.newYaku.isEmpty {
      let names = report.newYaku.map(\.label).joined(separator: " · ")
      toast = report.botDecision == "koikoi" ? "\(names) — bot calls KOI-KOI!" : names
      DispatchQueue.main.asyncAfter(deadline: .now() + 2.6) { toast = nil }
    }
    pumpBot()
  }

  /// The bot acts on a delay whenever the engine hands it the turn.
  private func pumpBot() {
    guard engine.phase == .botTurn, !botThinking else { return }
    botThinking = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.95) {
      botThinking = false
      guard engine.phase == .botTurn else { return }
      engine.botTakeTurn()
      bump()
    }
  }

  // MARK: - Copy

  private var statusMessage: String {
    switch engine.phase {
    case .selectHand: return "YOUR TURN — TAP A HAND CARD"
    case .chooseFieldForHand, .chooseFieldForDraw: return "PICK A HIGHLIGHTED FIELD CARD"
    case .decision: return "YAKU! KOI-KOI OR SHOBU?"
    case .botTurn: return "BOT IS THINKING..."
    case .roundOver: return "ROUND OVER"
    case .matchOver: return "MATCH OVER"
    }
  }

  private var roundOverTitle: String {
    guard let result = engine.results.last else { return "Round over" }
    switch result.winner {
    case .player: return "You take round \(result.round)!"
    case .bot: return "Bot takes round \(result.round)."
    case nil: return "Round \(result.round) is a draw."
    }
  }

  private var matchOverTitle: String {
    switch engine.matchWinner {
    case .player: return "You win the match!"
    case .bot: return "The bot takes the match."
    case nil: return "The match is a draw."
    }
  }

  /// Groups a capture pile into the web page's tray order (brights first).
  private func sortedByKind(_ pile: [HanafudaCard]) -> [HanafudaCard] {
    let order: [HanafudaKind] = [.bright, .animal, .ribbon, .chaff]
    return order.flatMap { kind in pile.filter { $0.kind == kind } }
  }
}

/// Lacquer-and-gold palette mirroring the web page's vanilla-extract styles.
/// The table keeps its own dark look on both app themes (like the web, the
/// backdrop is part of the game's identity).
private enum HanafudaPalette {
  static let table = Color(hex: "#191009")
  static let felt = Color(hex: "#241610")
  static let panel = Color(hex: "#241610")
  static let gold = Color(hex: "#d9a441")
  static let goldDim = Color(hex: "#8a6a34")
  static let red = Color(hex: "#b53228")
  static let blue = Color(hex: "#3e4a8c")
  static let cream = Color(hex: "#f4ecd6")
  static let ink = Color(hex: "#221c18")
  static let parchment = Color(hex: "#e8dcc0")
  static let parchmentDim = Color(hex: "#a8916c")
}

/// Month kanji, indexed by `month - 1` (pine through paulownia).
private let monthKanji = ["松", "梅", "桜", "藤", "菖", "牡", "萩", "芒", "菊", "紅", "柳", "桐"]

/// Motif emoji for the headline cards; plain cards show only their kanji.
private let cardEmoji: [Int: String] = [
  HanafudaEngine.craneId: "🕊",
  4: "🐦", // bush warbler
  HanafudaEngine.curtainId: "🏮",
  12: "🐤", // cuckoo
  16: "🌉", // eight-plank bridge
  HanafudaEngine.butterfliesId: "🦋",
  HanafudaEngine.boarId: "🐗",
  HanafudaEngine.moonId: "🌕",
  29: "🦆", // geese
  HanafudaEngine.sakeCupId: "🍶",
  HanafudaEngine.deerId: "🦌",
  HanafudaEngine.rainManId: "☔",
  41: "🐦", // swallow
  43: "⚡", // lightning chaff
  HanafudaEngine.phoenixId: "🦚",
]

/// Simplified native card face: type-colored top band, month kanji, motif
/// emoji. Distinct and month-recognizable without the web's full SVG art.
struct HanafudaCardView: View {
  let card: HanafudaCard
  let width: CGFloat
  let highlighted: Bool

  private var kindColor: Color {
    switch card.kind {
    case .bright: return HanafudaPalette.gold
    case .animal: return HanafudaPalette.red
    case .ribbon: return card.ribbon == .blue ? HanafudaPalette.blue : HanafudaPalette.red
    case .chaff: return HanafudaPalette.goldDim
    }
  }

  var body: some View {
    let height = width * 1.6
    VStack(spacing: 0) {
      Rectangle()
        .fill(kindColor)
        .frame(height: height * 0.14)
      Spacer(minLength: 0)
      Text(monthKanji[card.month - 1])
        .font(.system(size: width * 0.42, weight: .bold))
        .foregroundStyle(HanafudaPalette.ink)
      if let emoji = cardEmoji[card.id] {
        Text(emoji)
          .font(.system(size: width * 0.34))
      }
      Spacer(minLength: 0)
    }
    .frame(width: width, height: height)
    .background(HanafudaPalette.cream)
    .clipShape(RoundedRectangle(cornerRadius: width * 0.12, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: width * 0.12, style: .continuous)
        .stroke(
          highlighted ? HanafudaPalette.gold : HanafudaPalette.ink,
          lineWidth: highlighted ? 2.5 : 1
        )
    )
    .shadow(color: highlighted ? HanafudaPalette.gold.opacity(0.6) : .clear, radius: 5)
  }
}

/// Face-down card: black lacquer with a gold roundel, like the web back.
struct HanafudaCardBackView: View {
  let width: CGFloat

  var body: some View {
    RoundedRectangle(cornerRadius: width * 0.12, style: .continuous)
      .fill(HanafudaPalette.ink)
      .frame(width: width, height: width * 1.6)
      .overlay(
        Circle()
          .stroke(HanafudaPalette.gold, lineWidth: 1.5)
          .frame(width: width * 0.5, height: width * 0.5)
      )
      .overlay(
        RoundedRectangle(cornerRadius: width * 0.12, style: .continuous)
          .stroke(HanafudaPalette.goldDim, lineWidth: 1)
      )
  }
}

/// Chunky serif-adjacent button echoing the web toolbar buttons.
private struct HanafudaChunkyButtonStyle: ButtonStyle {
  var prominent = false

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 14, weight: .bold))
      .foregroundStyle(prominent ? HanafudaPalette.ink : HanafudaPalette.gold)
      .padding(.horizontal, 16)
      .padding(.vertical, 9)
      .background(
        RoundedRectangle(cornerRadius: 6, style: .continuous)
          .fill(
            prominent
              ? HanafudaPalette.gold
              : HanafudaPalette.gold.opacity(configuration.isPressed ? 0.25 : 0.12)
          )
          .overlay(
            RoundedRectangle(cornerRadius: 6, style: .continuous)
              .stroke(HanafudaPalette.goldDim, lineWidth: 1)
          )
      )
  }
}

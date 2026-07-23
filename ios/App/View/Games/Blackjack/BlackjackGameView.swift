import SwiftUI

/// Casino palette mirroring the web BlackjackPage.styles.css constants. The
/// felt keeps its own green-and-gold look on both light and dark app themes
/// (why: the web table is hardcoded too — it is part of the game's identity).
private enum BlackjackColors {
  static let feltLight = Color(hex: "#2f8f54")
  static let feltDark = Color(hex: "#12492a")
  static let wood = Color(hex: "#4b2f1a")
  static let woodDark = Color(hex: "#38220f")
  static let gold = Color(hex: "#d4af37")
  static let goldSoft = Color(hex: "#e8cf7a")
  static let cream = Color(hex: "#f3ead2")
  static let ink = Color(hex: "#1a1108")
  static let red = Color(hex: "#c0392b")
  static let chipGreen = Color(hex: "#1e8449")
  static let chipBlack = Color(hex: "#20242c")
  static let loseText = Color(hex: "#e08a7c")
  static let loseBorder = Color(hex: "#a24d3f")
  static let creditGreen = Color(hex: "#3f9d5f")
}

/// Home surface for the `blackjack` pack — the native twin of the web
/// `BlackjackPage`. Purely client-side: blackjack projects have no backend,
/// so this view must never touch stores, components, or the network.
///
/// All rules live in `BlackjackEngine`; this view adds the felt-table look,
/// chip betting, the dealer's paced draws (the web's setTimeout choreography
/// becomes a main-actor task), and bankroll persistence in `UserDefaults`
/// under the web's localStorage key name (`blackjack.bankroll`).
struct BlackjackGameView: View {
  @Environment(\.uiThemeTokens) private var theme
  @StateObject private var session = BlackjackSession()

  var body: some View {
    VStack(spacing: theme.spacing.md) {
      Text("BLACKJACKBOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textPrimary)
        .padding(.top, theme.spacing.lg)

      feltTable

      moneyRow

      chipRow

      betControls

      statusBar

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
  }

  // MARK: - Felt table

  private var feltTable: some View {
    let engine = session.engine

    return VStack(spacing: 10) {
      handArea(
        label: "🤖 DEALER",
        badge: dealerTotalText,
        cards: engine.dealerCards,
        holeHidden: engine.holeHidden,
        labelAbove: true
      )

      VStack(spacing: 6) {
        Text("BLACKJACK PAYS 3 TO 2 · DEALER STANDS ON ALL 17S")
          .font(.system(size: 9, weight: .bold, design: .monospaced))
          .kerning(1.5)
          .foregroundStyle(BlackjackColors.goldSoft.opacity(0.65))
        betSpot
      }

      handArea(
        label: "👤 YOU",
        badge: playerTotalText,
        cards: engine.playerCards,
        holeHidden: false,
        labelAbove: false
      )

      actionRow
    }
    .padding(.vertical, 14)
    .padding(.horizontal, 12)
    .frame(maxWidth: .infinity)
    .background(
      RadialGradient(
        colors: [BlackjackColors.feltLight, BlackjackColors.feltDark],
        center: .init(x: 0.5, y: 0.28),
        startRadius: 20,
        endRadius: 420
      )
    )
    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 18, style: .continuous)
        .stroke(BlackjackColors.gold, lineWidth: 2)
        .padding(4)
    )
    .overlay(
      RoundedRectangle(cornerRadius: 18, style: .continuous)
        .stroke(BlackjackColors.woodDark, lineWidth: 8)
    )
    .overlay(resultBanner)
    .padding(.horizontal, theme.spacing.md)
  }

  private func handArea(
    label: String,
    badge: String?,
    cards: [BlackjackCard],
    holeHidden: Bool,
    labelAbove: Bool
  ) -> some View {
    VStack(spacing: 6) {
      if labelAbove {
        handLabel(label, badge: badge)
      }
      HStack(spacing: 8) {
        ForEach(Array(cards.enumerated()), id: \.offset) { index, card in
          BlackjackCardView(card: card, faceUp: index != 1 || !holeHidden)
            .transition(
              .offset(x: -20, y: -32).combined(with: .opacity)
            )
        }
      }
      .frame(minHeight: 84)
      if !labelAbove {
        handLabel(label, badge: badge)
      }
    }
  }

  private func handLabel(_ label: String, badge: String?) -> some View {
    HStack(spacing: 8) {
      Text(label)
        .font(.system(size: 11, weight: .bold, design: .monospaced))
        .kerning(1.2)
        .foregroundStyle(BlackjackColors.goldSoft)
      if let badge {
        Text(badge)
          .font(.system(size: 11, weight: .bold, design: .monospaced))
          .foregroundStyle(BlackjackColors.cream)
          .padding(.horizontal, 8)
          .padding(.vertical, 1)
          .background(Capsule().fill(Color.black.opacity(0.35)))
      }
    }
  }

  private var betSpot: some View {
    let engine = session.engine
    return Text(engine.bet > 0 ? BlackjackEngine.formatMoney(Double(engine.bet)) : "BET")
      .font(.system(size: 13, weight: .bold, design: .monospaced))
      .foregroundStyle(BlackjackColors.cream)
      .frame(width: 62, height: 62)
      .overlay(
        Circle()
          .stroke(
            BlackjackColors.cream.opacity(0.55),
            style: StrokeStyle(lineWidth: 2, dash: [6, 5])
          )
      )
  }

  private var actionRow: some View {
    let engine = session.engine
    return HStack(spacing: 12) {
      if engine.phase == .player {
        Button("Hit") { session.hit() }
          .buttonStyle(BlackjackGoldButtonStyle())
        Button("Stand") { session.stand() }
          .buttonStyle(BlackjackGoldButtonStyle())
        Button("Double") { session.doubleDown() }
          .buttonStyle(BlackjackGoldButtonStyle())
          .disabled(!engine.canDouble)
      }
    }
    .frame(minHeight: 36)
  }

  /// Pop-in banner over the felt announcing the settled hand, mirroring the
  /// web's win/lose/push banner colors.
  @ViewBuilder private var resultBanner: some View {
    let engine = session.engine
    if engine.phase == .settled, let result = engine.result {
      let color: Color = result.kind == .push
        ? BlackjackColors.cream
        : result.net > 0 ? BlackjackColors.goldSoft : BlackjackColors.loseText
      let border: Color = result.kind == .push
        ? BlackjackColors.cream
        : result.net > 0 ? BlackjackColors.gold : BlackjackColors.loseBorder

      VStack(spacing: 2) {
        Text(bannerTitle(for: result.kind))
          .font(.system(size: 22, weight: .bold, design: .monospaced))
          .kerning(1.8)
        Text(
          result.net > 0
            ? "+\(BlackjackEngine.formatMoney(result.net))"
            : result.net < 0
              ? "-\(BlackjackEngine.formatMoney(-result.net))"
              : "bet returned"
        )
        .font(.system(size: 13, weight: .bold, design: .monospaced))
        .opacity(0.9)
      }
      .foregroundStyle(color)
      .padding(.horizontal, 28)
      .padding(.vertical, 12)
      .background(
        RoundedRectangle(cornerRadius: 12, style: .continuous)
          .fill(Color(hex: "#0a140c").opacity(0.88))
      )
      .overlay(
        RoundedRectangle(cornerRadius: 12, style: .continuous)
          .stroke(border, lineWidth: 2)
      )
      .transition(.scale(scale: 0.6).combined(with: .opacity))
    }
  }

  private func bannerTitle(for kind: BlackjackResultKind) -> String {
    switch kind {
    case .blackjack: return "BLACKJACK!"
    case .win: return "WIN"
    case .push: return "PUSH"
    case .bust: return "BUST"
    case .lose: return "DEALER WINS"
    }
  }

  // MARK: - Bankroll / betting controls

  private var moneyRow: some View {
    let engine = session.engine
    return HStack {
      Text("💰 \(BlackjackEngine.formatMoney(engine.bankroll))")
      Spacer()
      Text("🎯 \(BlackjackEngine.formatMoney(Double(engine.bet)))")
      Spacer()
      Text("SHOE: \(engine.shoeCount)")
        .foregroundStyle(theme.colors.textSecondary)
    }
    .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .monospaced))
    .foregroundStyle(theme.colors.textPrimary)
    .padding(.horizontal, theme.spacing.lg)
  }

  private var chipRow: some View {
    let engine = session.engine
    return HStack(spacing: theme.spacing.md) {
      ForEach(BlackjackEngine.chipDenominations, id: \.self) { denomination in
        Button {
          session.addChip(denomination)
        } label: {
          Text("$\(denomination)")
            .font(.system(size: 13, weight: .bold, design: .monospaced))
            .foregroundStyle(.white)
            .frame(width: 52, height: 52)
            .background(Circle().fill(chipColor(for: denomination)))
            .overlay(
              Circle()
                .stroke(
                  Color.white.opacity(0.85),
                  style: StrokeStyle(lineWidth: 3, dash: [7, 5])
                )
                .padding(3)
            )
        }
        .disabled(
          engine.phase != .betting
            || Double(engine.bet + denomination) > engine.bankroll
        )
      }
    }
  }

  private func chipColor(for denomination: Int) -> Color {
    switch denomination {
    case 25: return BlackjackColors.chipGreen
    case 100: return BlackjackColors.chipBlack
    default: return BlackjackColors.red
    }
  }

  private var betControls: some View {
    let engine = session.engine
    return HStack(spacing: theme.spacing.sm) {
      Button("Deal 🃏") { session.deal() }
        .buttonStyle(BlackjackGoldButtonStyle())
        .disabled(engine.phase != .betting || engine.bet == 0)

      Button("Clear Bet") { session.clearBet() }
        .buttonStyle(BlackjackOutlineButtonStyle())
        .disabled(engine.phase != .betting || engine.bet == 0)

      Button("⟳ New Hand") { session.newHand() }
        .buttonStyle(BlackjackOutlineButtonStyle())
        .disabled(engine.phase != .settled)

      if engine.isBroke && engine.phase == .betting {
        Button("🏦 Credit") { session.takeHouseCredit() }
          .buttonStyle(BlackjackGoldButtonStyle(background: BlackjackColors.creditGreen))
      }
    }
  }

  private var statusBar: some View {
    HStack {
      Text(statusMessage)
      Spacer()
      if session.shuffling {
        Text("🔀 shuffling…")
      }
    }
    .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
    .foregroundStyle(theme.colors.textSecondary)
    .padding(.horizontal, theme.spacing.lg)
  }

  private var dealerTotalText: String? {
    let engine = session.engine
    if engine.dealerCards.isEmpty {
      return nil
    }
    if engine.holeHidden {
      return "showing \(BlackjackEngine.handTotal(of: [engine.dealerCards[0]]).total)"
    }
    return BlackjackEngine.formatTotal(of: engine.dealerCards)
  }

  private var playerTotalText: String? {
    let engine = session.engine
    return engine.playerCards.isEmpty ? nil : BlackjackEngine.formatTotal(of: engine.playerCards)
  }

  /// The web statusMessage, minus the "dealing" phase (the engine deals
  /// synchronously; only the dealer's draws are paced).
  private var statusMessage: String {
    let engine = session.engine
    switch engine.phase {
    case .betting:
      if engine.isBroke {
        return "BANKROLL EMPTY — TAKE HOUSE CREDIT"
      }
      if engine.bet > 0 {
        return "BET \(BlackjackEngine.formatMoney(Double(engine.bet))) — PRESS DEAL"
      }
      return "PLACE YOUR BET"
    case .player:
      return "YOUR MOVE — HIT, STAND, OR DOUBLE"
    case .dealer:
      return "DEALER PLAYS..."
    case .settled:
      guard let result = engine.result else { return "HAND OVER" }
      switch result.kind {
      case .blackjack: return "BLACKJACK! PAID 3:2"
      case .win: return "YOU WIN"
      case .push: return "PUSH — BET RETURNED"
      case .bust: return "BUST"
      case .lose: return "DEALER WINS"
      }
    }
  }
}

// MARK: - Session

/// Owns the engine, the dealer-draw pacing, and bankroll persistence. The
/// engine is deliberately not observable (it stays a pure, testable state
/// machine), so every mutation goes through here and bumps `revision` inside
/// `withAnimation` — that is what re-renders the view and animates the card
/// transitions.
@MainActor
final class BlackjackSession: ObservableObject {
  /// Pacing of the dealer choreography, matching the web constants (ms).
  private static let revealPauseMs: UInt64 = 550
  private static let dealerDrawMs: UInt64 = 700
  private static let shuffleNoteMs: UInt64 = 2_600

  let engine: BlackjackEngine
  @Published private(set) var revision = 0
  /// True briefly after a reshuffle, driving the "shuffling" note like web.
  @Published private(set) var shuffling = false

  private let defaults: UserDefaults
  private var lastShuffleCount = 0

  init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
    engine = BlackjackEngine(bankroll: Self.loadBankroll(from: defaults))
  }

  func addChip(_ denomination: Int) {
    commit { engine.addChip(denomination) }
  }

  func clearBet() {
    commit { engine.clearBet() }
  }

  func takeHouseCredit() {
    commit { engine.takeHouseCredit() }
  }

  func deal() {
    commit { engine.deal() }
  }

  func hit() {
    commit { engine.hit() }
    runDealerTurnIfNeeded()
  }

  func stand() {
    commit { engine.stand() }
    runDealerTurnIfNeeded()
  }

  func doubleDown() {
    commit { engine.doubleDown() }
    runDealerTurnIfNeeded()
  }

  func newHand() {
    commit { engine.newHand() }
  }

  /// Runs an engine mutation inside `withAnimation`, then persists the
  /// bankroll (the web writes localStorage on every bankroll change) and
  /// flashes the shuffle note when the shoe was rebuilt.
  private func commit(_ mutate: () -> Void) {
    withAnimation(.easeOut(duration: 0.35)) {
      mutate()
      revision += 1
    }
    defaults.set(engine.bankroll, forKey: BlackjackEngine.bankrollStorageKey)
    if engine.shuffleCount != lastShuffleCount {
      lastShuffleCount = engine.shuffleCount
      flashShuffleNote()
    }
  }

  /// Paces the dealer's draws like the web's timed choreography: a pause for
  /// the hole-card flip, then one card per beat until the dealer stands.
  private func runDealerTurnIfNeeded() {
    guard engine.phase == .dealer else { return }
    Task {
      try? await Task.sleep(nanoseconds: Self.revealPauseMs * 1_000_000)
      while engine.phase == .dealer {
        var drew = false
        commit { drew = engine.dealerStep() }
        if drew {
          try? await Task.sleep(nanoseconds: Self.dealerDrawMs * 1_000_000)
        }
      }
    }
  }

  private func flashShuffleNote() {
    shuffling = true
    Task {
      try? await Task.sleep(nanoseconds: Self.shuffleNoteMs * 1_000_000)
      shuffling = false
    }
  }

  /// Mirrors the web `loadBankroll`: any missing or invalid stored value
  /// falls back to the starting bankroll.
  private static func loadBankroll(from defaults: UserDefaults) -> Double {
    guard
      let raw = defaults.object(forKey: BlackjackEngine.bankrollStorageKey) as? Double,
      raw.isFinite, raw >= 0
    else {
      return BlackjackEngine.startingBankroll
    }
    return raw
  }
}

// MARK: - Card

/// One playing card. Crossfades between face and back under a 3D rotation
/// when `faceUp` changes (the dealer's hole-card reveal); the deal-in motion
/// comes from the insertion transition applied by the hand rows.
private struct BlackjackCardView: View {
  let card: BlackjackCard
  let faceUp: Bool

  var body: some View {
    ZStack {
      front.opacity(faceUp ? 1 : 0)
      back.opacity(faceUp ? 0 : 1)
    }
    .frame(width: 58, height: 84)
    .rotation3DEffect(.degrees(faceUp ? 0 : 180), axis: (x: 0, y: 1, z: 0))
    .animation(.easeInOut(duration: 0.45), value: faceUp)
    .shadow(color: .black.opacity(0.35), radius: 3, y: 3)
  }

  private var suitColor: Color {
    card.isRed ? BlackjackColors.red : BlackjackColors.chipBlack
  }

  private var front: some View {
    ZStack {
      RoundedRectangle(cornerRadius: 7, style: .continuous)
        .fill(
          LinearGradient(
            colors: [.white, Color(hex: "#f0ecdf")],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
          )
        )
        .overlay(
          RoundedRectangle(cornerRadius: 7, style: .continuous)
            .stroke(Color.black.opacity(0.35), lineWidth: 1)
        )

      Text(card.suit.rawValue)
        .font(.system(size: 26))
        .foregroundStyle(suitColor)

      corner
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(4)
      corner
        .rotationEffect(.degrees(180))
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
        .padding(4)
    }
  }

  private var corner: some View {
    Text("\(card.rank.rawValue)\n\(card.suit.rawValue)")
      .font(.system(size: 11, weight: .bold, design: .monospaced))
      .multilineTextAlignment(.center)
      .lineSpacing(-2)
      .foregroundStyle(suitColor)
  }

  /// Striped casino card back, like the web's repeating-linear-gradient.
  private var back: some View {
    RoundedRectangle(cornerRadius: 7, style: .continuous)
      .fill(Color(hex: "#7b1e2b"))
      .overlay(
        Stripes()
          .stroke(Color(hex: "#5d1620"), lineWidth: 6)
          .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))
      )
      .overlay(
        RoundedRectangle(cornerRadius: 5, style: .continuous)
          .stroke(.white, lineWidth: 3)
          .padding(3)
      )
  }
}

/// Diagonal stripe pattern for the card back.
private struct Stripes: Shape {
  func path(in rect: CGRect) -> Path {
    var path = Path()
    var x = -rect.height
    while x < rect.width {
      path.move(to: CGPoint(x: x, y: rect.maxY))
      path.addLine(to: CGPoint(x: x + rect.height, y: rect.minY))
      x += 12
    }
    return path
  }
}

// MARK: - Buttons

/// Gold-gradient action button echoing the web table's chunky gold buttons.
private struct BlackjackGoldButtonStyle: ButtonStyle {
  var background: Color = BlackjackColors.gold

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 13, weight: .bold, design: .monospaced))
      .foregroundStyle(BlackjackColors.ink)
      .padding(.horizontal, 16)
      .padding(.vertical, 9)
      .background(
        RoundedRectangle(cornerRadius: 8, style: .continuous)
          .fill(
            LinearGradient(
              colors: [BlackjackColors.goldSoft, background],
              startPoint: .top,
              endPoint: .bottom
            )
          )
      )
      .overlay(
        RoundedRectangle(cornerRadius: 8, style: .continuous)
          .stroke(BlackjackColors.ink, lineWidth: 2)
      )
      .offset(y: configuration.isPressed ? 2 : 0)
  }
}

/// Outlined secondary button (the web "Clear Bet" look).
private struct BlackjackOutlineButtonStyle: ButtonStyle {
  @Environment(\.uiThemeTokens) private var theme

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 12, weight: .bold, design: .monospaced))
      .foregroundStyle(theme.colors.textPrimary)
      .padding(.horizontal, 12)
      .padding(.vertical, 9)
      .background(
        RoundedRectangle(cornerRadius: 8, style: .continuous)
          .fill(configuration.isPressed ? theme.colors.hover : theme.colors.surfaceAlt)
      )
      .overlay(
        RoundedRectangle(cornerRadius: 8, style: .continuous)
          .stroke(theme.colors.border, lineWidth: 1)
      )
  }
}

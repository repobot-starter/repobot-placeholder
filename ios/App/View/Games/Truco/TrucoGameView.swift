import SwiftUI

/// Home surface for the `truco` pack — the native twin of the web `TrucoPage`.
/// Purely client-side: truco projects have no backend, so this view must never
/// touch stores, GraphQL, or the network.
///
/// All rules live in `TrucoEngine` (the pure port of the web engine); this
/// view renders its state, forwards taps, and owns the timing: the bot's
/// "thinking" delay, the trick-reveal linger, and speech-bubble lifetimes.
struct TrucoGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  /// Reference-typed engine; `tick` forces SwiftUI updates after mutations.
  @State private var engine = TrucoEngine()
  @State private var tick = 0
  @State private var speech: String?
  @State private var showLastTrick = false
  /// "Cara de pau" slider value 0..1 (honest → shameless bluffing).
  @State private var caraDePau = 0.35
  @State private var started = false

  /// Boteco palette shared with the web page — the table keeps its own warm
  /// look on both light and dark app themes (it is part of the game's
  /// identity, like the Pong field).
  private enum Palette {
    static let felt = Color(hex: "#1e6b3c")
    static let feltDark = Color(hex: "#14512c")
    static let wood = Color(hex: "#5a3520")
    static let woodDark = Color(hex: "#3e2312")
    static let cream = Color(hex: "#f6ecd4")
    static let ink = Color(hex: "#1c1006")
    static let amber = Color(hex: "#ffbf47")
    static let red = Color(hex: "#c8402f")
    static let cardFace = Color(hex: "#fdf8ec")
    static let cardBack = Color(hex: "#27548f")
    static let manilhaGold = Color(hex: "#ffd76a")
  }

  var body: some View {
    VStack(spacing: theme.spacing.md) {
      Text("TRUCOBOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textPrimary)
        .padding(.top, theme.spacing.lg)

      scoreRow

      table
        .padding(.horizontal, theme.spacing.md)

      controls

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
    .onAppear {
      guard !started else { return }
      started = true
      apply(engine.newGame())
    }
  }

  // MARK: - Chrome

  private var scoreRow: some View {
    HStack(spacing: theme.spacing.lg) {
      scoreBadge(label: "VOCÊ", score: engine.playerScore, color: Palette.amber)
      Text(stakeText)
        .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textSecondary)
      scoreBadge(label: "BOT", score: engine.botScore, color: Palette.red)
    }
  }

  private var stakeText: String {
    if let proposed = engine.proposedStake {
      return "vale \(engine.stake) → \(proposed)?"
    }
    return "vale \(engine.stake)"
  }

  private func scoreBadge(label: String, score: Int, color: Color) -> some View {
    VStack(spacing: 2) {
      Text(label)
        .font(.system(size: theme.typography.sizes.xs, weight: .semibold, design: .monospaced))
        .foregroundStyle(theme.colors.textSecondary)
      Text("\(score)")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
        .foregroundStyle(color)
    }
  }

  private var controls: some View {
    VStack(spacing: theme.spacing.sm) {
      HStack(spacing: theme.spacing.md) {
        Button {
          engine.bluff = caraDePau
          speech = nil
          showLastTrick = false
          apply(engine.newGame())
        } label: {
          Label("Nova partida", systemImage: "arrow.counterclockwise")
        }
        .buttonStyle(TrucoChunkyButtonStyle())

        Button {
          apply(engine.playerCallRaise())
        } label: {
          Text(raiseLabel)
        }
        .buttonStyle(TrucoChunkyButtonStyle(danger: true))
        .disabled(!engine.canRaise(.player))
      }

      HStack(spacing: theme.spacing.sm) {
        Text("honesto")
          .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
          .foregroundStyle(theme.colors.textSecondary)
        Slider(value: $caraDePau, in: 0...1) { _ in
          engine.bluff = caraDePau
        }
        Text("sem vergonha")
          .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
          .foregroundStyle(theme.colors.textSecondary)
      }
      .padding(.horizontal, theme.spacing.lg)

      Text("Cara de pau do bot: \(Int(caraDePau * 100))% · Primeiro a 12 vence")
        .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
        .foregroundStyle(theme.colors.textSecondary)
    }
  }

  private var raiseLabel: String {
    if let next = TrucoEngine.nextStake(engine.stake) {
      return TrucoEngine.raiseCall[next] ?? "Truco!"
    }
    return "Doze é o teto"
  }

  // MARK: - Table

  private var table: some View {
    ZStack {
      RoundedRectangle(cornerRadius: 16, style: .continuous)
        .fill(
          RadialGradient(
            colors: [Palette.felt, Palette.feltDark],
            center: .center, startRadius: 40, endRadius: 380
          )
        )
        .overlay(
          RoundedRectangle(cornerRadius: 16, style: .continuous)
            .stroke(Palette.woodDark, lineWidth: 6)
        )

      VStack(spacing: theme.spacing.md) {
        botSeat
        trickArea
        playerSeat
      }
      .padding(theme.spacing.md)

      dialogOverlay
    }
    .id(tick)
  }

  private var botSeat: some View {
    HStack(spacing: 8) {
      ForEach(0..<max(engine.botHand.count, 1), id: \.self) { index in
        if engine.botHand.isEmpty {
          Color.clear.frame(width: 34, height: 50)
        } else {
          cardBack
            .accessibilityHidden(index > 0)
        }
      }
    }
    .frame(maxWidth: .infinity)
    .overlay(alignment: .topTrailing) {
      if let speech {
        Text(speech)
          .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .monospaced))
          .foregroundStyle(Palette.ink)
          .padding(.horizontal, 12)
          .padding(.vertical, 6)
          .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
              .fill(Palette.cream)
              .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                  .stroke(Palette.ink, lineWidth: 2)
              )
          )
      }
    }
  }

  private var trickArea: some View {
    // While a resolved trick lingers, show its pair; otherwise the live plays.
    let lingering = showLastTrick && engine.lastTrick != nil
      && engine.playerTrickCard == nil && engine.botTrickCard == nil
    let botCard = lingering ? engine.lastTrick?.botCard : engine.botTrickCard
    let playerCard = lingering ? engine.lastTrick?.playerCard : engine.playerTrickCard

    return HStack(spacing: theme.spacing.lg) {
      VStack(spacing: 4) {
        trickCaption("VIRA")
        TrucoCardFace(card: engine.vira, isManilha: false, palette: cardPalette)
        trickCaption("manilha \(engine.manilhaRank.label)")
      }
      VStack(spacing: 4) {
        trickCaption("BOT")
        trickSlot(botCard)
      }
      VStack(spacing: 4) {
        trickCaption("VOCÊ")
        trickSlot(playerCard)
      }
      trickDots
    }
  }

  private func trickCaption(_ text: String) -> some View {
    Text(text)
      .font(.system(size: 10, weight: .semibold, design: .monospaced))
      .foregroundStyle(Palette.cream.opacity(0.85))
  }

  @ViewBuilder
  private func trickSlot(_ card: TrucoCard?) -> some View {
    if let card {
      TrucoCardFace(
        card: card,
        isManilha: card.rank == engine.manilhaRank,
        palette: cardPalette
      )
    } else {
      RoundedRectangle(cornerRadius: 7, style: .continuous)
        .stroke(Palette.cream.opacity(0.4), style: StrokeStyle(lineWidth: 2, dash: [4, 4]))
        .frame(width: 52, height: 74)
    }
  }

  private var trickDots: some View {
    VStack(spacing: 6) {
      ForEach(0..<3, id: \.self) { index in
        Circle()
          .fill(dotColor(index))
          .frame(width: 12, height: 12)
          .overlay(Circle().stroke(Palette.cream.opacity(0.6), lineWidth: 1))
      }
    }
  }

  private func dotColor(_ index: Int) -> Color {
    guard index < engine.trickResults.count else { return .clear }
    switch engine.trickResults[index] {
    case .player: return Palette.amber
    case .bot: return Palette.red
    case .tie: return Palette.cream
    }
  }

  private var playerSeat: some View {
    HStack(spacing: 10) {
      ForEach(Array(engine.playerHand.enumerated()), id: \.offset) { index, card in
        Button {
          apply(engine.playCard(at: index))
        } label: {
          TrucoCardFace(
            card: card,
            isManilha: card.rank == engine.manilhaRank,
            palette: cardPalette
          )
        }
        .disabled(handLocked)
      }
      if engine.playerHand.isEmpty {
        trickSlot(nil)
      }
    }
  }

  private var handLocked: Bool {
    showLastTrick || engine.phase != .playerTurn
  }

  private var cardPalette: TrucoCardFace.Palette {
    TrucoCardFace.Palette(
      face: Palette.cardFace,
      ink: Palette.ink,
      red: Palette.red,
      glow: Palette.manilhaGold
    )
  }

  private var cardBack: some View {
    RoundedRectangle(cornerRadius: 6, style: .continuous)
      .fill(Palette.cardBack)
      .overlay(
        RoundedRectangle(cornerRadius: 6, style: .continuous)
          .stroke(Palette.ink, lineWidth: 2)
      )
      .frame(width: 34, height: 50)
  }

  // MARK: - Dialogs

  @ViewBuilder
  private var dialogOverlay: some View {
    switch engine.phase {
    case .respond:
      dialog(
        title: TrucoEngine.raiseCall[engine.proposedStake ?? 3] ?? "Truco!",
        message: "O bot aumentou para \(engine.proposedStake ?? 3). Correr entrega \(engine.stake)."
      ) {
        dialogButton("Aceito") { apply(engine.respondToRaise(.accept)) }
        if let proposed = engine.proposedStake, let higher = TrucoEngine.nextStake(proposed) {
          dialogButton(TrucoEngine.raiseCall[higher] ?? "Mais!", danger: true) {
            apply(engine.respondToRaise(.raise))
          }
        }
        dialogButton("Corro") { apply(engine.respondToRaise(.fold)) }
      }
    case .maoDeOnze:
      dialog(
        title: "Mão de onze!",
        message: "Você tem 11. Jogue valendo 3 (sem truco) ou corra e o bot leva 1."
      ) {
        dialogButton("Jogar (vale 3)", danger: true) { apply(engine.decideMaoDeOnze(play: true)) }
        dialogButton("Correr (bot +1)") { apply(engine.decideMaoDeOnze(play: false)) }
      }
    case .handOver:
      dialog(
        title: engine.handWinner == .player ? "Mão sua!" : "Mão do bot!",
        message: "\(engine.handWinner == .player ? "Você leva" : "O bot leva") \(engine.handPoints) ponto(s)."
      ) {
        dialogButton("Próxima mão →") { apply(engine.startHand()) }
      }
    case .gameOver:
      dialog(
        title: engine.gameWinner == .player ? "Você fechou 12!" : "O bot fechou 12...",
        message: "Final: você \(engine.playerScore) × \(engine.botScore) bot."
      ) {
        dialogButton("Revanche!", danger: true) {
          engine.bluff = caraDePau
          apply(engine.newGame())
        }
      }
    default:
      EmptyView()
    }
  }

  private func dialog(
    title: String,
    message: String,
    @ViewBuilder buttons: () -> some View
  ) -> some View {
    ZStack {
      Palette.ink.opacity(0.55)
      VStack(spacing: 10) {
        Text(title)
          .font(.system(size: theme.typography.sizes.lg, weight: .bold, design: .monospaced))
          .foregroundStyle(Palette.amber)
        Text(message)
          .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
          .foregroundStyle(Palette.cream)
          .multilineTextAlignment(.center)
        HStack(spacing: 8) {
          buttons()
        }
      }
      .padding(theme.spacing.lg)
      .background(
        RoundedRectangle(cornerRadius: 12, style: .continuous)
          .fill(LinearGradient(colors: [Palette.wood, Palette.woodDark], startPoint: .top, endPoint: .bottom))
          .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
              .stroke(Palette.ink, lineWidth: 2)
          )
      )
      .padding(theme.spacing.lg)
    }
    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
  }

  private func dialogButton(
    _ label: String,
    danger: Bool = false,
    action: @escaping () -> Void
  ) -> some View {
    Button(action: action) {
      Text(label)
    }
    .buttonStyle(TrucoChunkyButtonStyle(danger: danger))
  }

  // MARK: - Event pump

  /// Applies engine events to the UI and keeps the bot's turn moving —
  /// the native twin of the web page's `apply`.
  private func apply(_ events: [TrucoEvent]) {
    tick += 1
    var trickPause: TimeInterval = 0
    for event in events {
      switch event {
      case .botSpoke(let line):
        speech = line
        scheduleOnMain(after: 2.6) {
          if speech == line { speech = nil }
        }
      case .trickResolved:
        showLastTrick = true
        trickPause = 1.6
        scheduleOnMain(after: 1.6) { showLastTrick = false }
      default:
        break
      }
    }
    if engine.phase == .botTurn {
      scheduleOnMain(after: trickPause + 0.9) {
        if engine.phase == .botTurn {
          apply(engine.botAct())
        }
      }
    }
  }

  private func scheduleOnMain(after seconds: TimeInterval, _ work: @escaping () -> Void) {
    DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: work)
  }
}

/// A drawn card face: corner index plus a big suit pip, gold glow when the
/// card is a manilha — mirrors the web `CardFace` component.
private struct TrucoCardFace: View {
  struct Palette {
    let face: Color
    let ink: Color
    let red: Color
    let glow: Color
  }

  let card: TrucoCard
  let isManilha: Bool
  let palette: Palette

  var body: some View {
    let suitColor = card.suit.isRed ? palette.red : palette.ink
    return VStack(spacing: 0) {
      HStack {
        Text("\(card.rank.label)\(card.suit.symbol)")
          .font(.system(size: 11, weight: .bold, design: .monospaced))
        Spacer()
      }
      Spacer()
      Text(card.suit.symbol)
        .font(.system(size: 24, weight: .bold))
      Spacer()
      HStack {
        Spacer()
        Text("\(card.rank.label)\(card.suit.symbol)")
          .font(.system(size: 11, weight: .bold, design: .monospaced))
          .rotationEffect(.degrees(180))
      }
    }
    .foregroundStyle(suitColor)
    .padding(5)
    .frame(width: 52, height: 74)
    .background(
      RoundedRectangle(cornerRadius: 7, style: .continuous)
        .fill(palette.face)
        .overlay(
          RoundedRectangle(cornerRadius: 7, style: .continuous)
            .stroke(isManilha ? palette.glow : palette.ink, lineWidth: 2)
        )
        .shadow(
          color: isManilha ? palette.glow.opacity(0.85) : .black.opacity(0.3),
          radius: isManilha ? 7 : 2, x: 0, y: 1
        )
    )
  }
}

/// Chunky boteco button consistent with the web page's toolbar buttons.
private struct TrucoChunkyButtonStyle: ButtonStyle {
  @Environment(\.uiThemeTokens) private var theme
  var danger = false

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .monospaced))
      .foregroundStyle(danger ? Color(hex: "#f6ecd4") : theme.colors.textPrimary)
      .padding(.horizontal, 14)
      .padding(.vertical, 9)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
          .fill(
            danger
              ? Color(hex: "#c8402f")
              : (configuration.isPressed ? theme.colors.hover : theme.colors.surfaceAlt)
          )
          .overlay(
            RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
              .stroke(theme.colors.border, lineWidth: 1)
          )
      )
      .opacity(configuration.isPressed ? 0.85 : 1)
  }
}

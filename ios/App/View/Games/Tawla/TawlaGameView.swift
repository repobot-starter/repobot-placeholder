import SwiftUI

/// Board palette mirroring the web `TawlaPage.styles.css.ts` café woods. The
/// board keeps its own warm look on both light and dark app themes (why: the
/// web board is hardcoded wood too — it is part of the game's identity).
private enum TawlaPalette {
  static let frame = Color(hex: "#5a3a22")
  static let frameEdge = Color(hex: "#3a2414")
  static let felt = Color(hex: "#7a4a28")
  static let pointLight = Color(hex: "#e9d3a8")
  static let pointDark = Color(hex: "#a34f2a")
  static let brass = Color(hex: "#d9a441")
  static let glow = Color(hex: "#ffd98a")
  static let cream = Color(hex: "#f4e8d0")
  static let checkerWhite = Color(hex: "#f3ead6")
  static let checkerWhiteRim = Color(hex: "#9f8f6c")
  static let checkerBlack = Color(hex: "#33231a")
  static let checkerBlackRim = Color(hex: "#120a04")
  static let trayBg = Color(hex: "#241207")
  static let overlayScrim = Color(hex: "#180a02").opacity(0.82)
}

/// Game flow phases, the native twin of the web page's `Phase` union.
private enum TawlaPhase: Equatable {
  case awaitRoll
  case moving
  case gameOver
  case matchOver
}

/// Home surface for the `tawla` pack — the native twin of the web
/// `TawlaPage`. Purely client-side: tawla projects have no backend, so this
/// view must never touch stores, components, or the network.
///
/// All rules live in `TawlaEngine`; this view only holds interaction state
/// (selection, the moves played so far this turn, match score) and renders
/// the board, dice, and trays. Touch-first and vs-bot only: the human is
/// always White, the bot is Black — the web page additionally offers a
/// two-player hotseat mode that makes no sense on a phone.
struct TawlaGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  /// Position at the start of the current turn; `movePrefix` holds the moves
  /// played so far, exactly like the web page's `position` + `prefix` pair.
  @State private var position = TawlaEngine.initialPosition()
  @State private var mover: TawlaPlayer?
  @State private var dice: [Int] = []
  @State private var turns: [TawlaTurn] = []
  @State private var movePrefix: [TawlaMove] = []
  /// Selected source: a board index or `TawlaEngine.barIndex`; nil = none.
  @State private var selected: Int?
  @State private var phase: TawlaPhase = .awaitRoll
  @State private var result: TawlaGameResult?
  @State private var whiteScore = 0
  @State private var blackScore = 0
  @State private var level: TawlaBotLevel = .medium
  @State private var botTask: Task<Void, Never>?

  private var shown: TawlaPosition {
    guard let mover else { return position }
    return TawlaEngine.position(after: movePrefix, from: position, player: mover)
  }

  private var humanTurn: Bool { phase == .moving && mover == .white }

  private var legalNext: [TawlaMove] {
    humanTurn ? TawlaEngine.nextMoves(turns, prefix: movePrefix) : []
  }

  private var destinations: [TawlaMove] {
    guard let selected else { return [] }
    return legalNext.filter { $0.from == selected }
  }

  var body: some View {
    VStack(spacing: theme.spacing.md) {
      header
      scoreboard

      TawlaBoardView(
        shown: shown,
        selected: selected,
        sources: Set(legalNext.map(\.from)),
        destinations: Set(destinations.map(\.to)),
        onTapPoint: handleTap(index:),
        onTapBar: handleBarTap,
        onTapOff: handleOffTap
      )
      .aspectRatio(1.45, contentMode: .fit)
      .padding(.horizontal, theme.spacing.md)
      .overlay { resultOverlay }

      diceRow
      controls

      Text("Tap a checker, then a glowing point · First to \(TawlaEngine.matchTarget) points")
        .font(.system(size: theme.typography.sizes.xs, design: .serif))
        .foregroundStyle(theme.colors.textSecondary)

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
    .onDisappear { botTask?.cancel() }
  }

  // MARK: - Chrome

  private var header: some View {
    Text("☕ TAWLABOT")
      .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .serif))
      .foregroundStyle(theme.colors.textPrimary)
      .padding(.top, theme.spacing.lg)
  }

  private var scoreboard: some View {
    HStack(spacing: theme.spacing.lg) {
      scorePill(label: "YOU", value: "\(whiteScore)", pips: TawlaEngine.pipCount(shown, .white))
      Text(statusText)
        .font(.system(size: theme.typography.sizes.xs, weight: .semibold, design: .serif))
        .foregroundStyle(theme.colors.textSecondary)
        .frame(maxWidth: .infinity)
      scorePill(label: "BOT", value: "\(blackScore)", pips: TawlaEngine.pipCount(shown, .black))
    }
    .padding(.horizontal, theme.spacing.lg)
  }

  private func scorePill(label: String, value: String, pips: Int) -> some View {
    VStack(spacing: 2) {
      Text("\(label) \(value)")
        .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .serif))
        .foregroundStyle(theme.colors.textPrimary)
      Text("\(pips) pips")
        .font(.system(size: theme.typography.sizes.xs, design: .serif))
        .foregroundStyle(theme.colors.textSecondary)
    }
  }

  private var statusText: String {
    switch phase {
    case .matchOver:
      return result?.winner == .white ? "You win the match!" : "Bot wins the match"
    case .gameOver:
      guard let result else { return "" }
      let kind = result.kind == .single ? "game" : result.kind.rawValue
      return result.winner == .white ? "You win the \(kind)!" : "Bot wins the \(kind)"
    case .moving:
      if mover == .black { return "Bot plays…" }
      return shown.whiteBar > 0 ? "Enter from the bar" : "Play your dice"
    case .awaitRoll:
      return mover == nil ? "Roll for the start" : mover == .white ? "Your roll" : "Bot rolls…"
    }
  }

  @ViewBuilder private var resultOverlay: some View {
    if phase == .gameOver || phase == .matchOver, let result {
      VStack(spacing: theme.spacing.md) {
        Text(
          phase == .matchOver
            ? (result.winner == .white ? "YOU WIN THE MATCH" : "BOT WINS THE MATCH")
            : (result.winner == .white ? "YOU WIN +\(result.points)" : "BOT WINS +\(result.points)")
        )
        .font(.system(size: theme.typography.sizes.lg, weight: .bold, design: .serif))
        .foregroundStyle(TawlaPalette.glow)
        Text("Score \(whiteScore)–\(blackScore) · first to \(TawlaEngine.matchTarget)")
          .font(.system(size: theme.typography.sizes.sm, design: .serif))
          .foregroundStyle(TawlaPalette.cream)
        Button(phase == .matchOver ? "New Match" : "Next Game") {
          newGame(fullMatch: phase == .matchOver)
        }
        .buttonStyle(TawlaChunkyButtonStyle())
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .background(TawlaPalette.overlayScrim)
      .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
      .padding(.horizontal, theme.spacing.md)
    }
  }

  private var diceRow: some View {
    HStack(spacing: theme.spacing.md) {
      if phase == .awaitRoll && mover != .black {
        Button(mover == nil ? "🎲 Roll for Start" : "🎲 Roll") {
          roll(for: mover)
        }
        .buttonStyle(TawlaChunkyButtonStyle())
      } else {
        ForEach(Array(diceFaces.enumerated()), id: \.offset) { _, face in
          Text(dieGlyph(face.value))
            .font(.system(size: 42))
            .foregroundStyle(theme.colors.textPrimary)
            .opacity(face.used ? 0.3 : 1)
        }
      }
    }
    .frame(minHeight: 52)
  }

  private var controls: some View {
    VStack(spacing: theme.spacing.sm) {
      HStack(spacing: theme.spacing.md) {
        Button {
          newGame(fullMatch: true)
        } label: {
          Label("New Match", systemImage: "arrow.counterclockwise")
        }
        .buttonStyle(TawlaChunkyButtonStyle())

        Button {
          movePrefix = movePrefix.dropLast()
          selected = nil
        } label: {
          Label("Undo", systemImage: "arrow.uturn.backward")
        }
        .buttonStyle(TawlaChunkyButtonStyle())
        .disabled(
          !humanTurn || movePrefix.isEmpty
            || movePrefix.count == TawlaEngine.maxTurnLength(turns))
      }

      Picker("Level", selection: $level) {
        ForEach(TawlaBotLevel.allCases) { option in
          Text(option.rawValue.capitalized).tag(option)
        }
      }
      .pickerStyle(.segmented)
      .padding(.horizontal, theme.spacing.md)
    }
  }

  /// Dice faces (four for doubles) with used-up markers from the prefix,
  /// mirroring the web page's `diceFaces` memo.
  private var diceFaces: [(value: Int, used: Bool)] {
    guard dice.count == 2 else { return [] }
    let faces = dice[0] == dice[1] ? [dice[0], dice[0], dice[0], dice[0]] : dice
    var remaining = movePrefix.map(\.die)
    return faces.map { value in
      if let index = remaining.firstIndex(of: value) {
        remaining.remove(at: index)
        return (value, true)
      }
      return (value, false)
    }
  }

  private func dieGlyph(_ value: Int) -> String {
    ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][value - 1]
  }

  // MARK: - Game flow

  private func newGame(fullMatch: Bool) {
    botTask?.cancel()
    position = TawlaEngine.initialPosition()
    mover = nil
    dice = []
    turns = []
    movePrefix = []
    selected = nil
    result = nil
    phase = .awaitRoll
    if fullMatch {
      whiteScore = 0
      blackScore = 0
    }
  }

  /// Rolls for `roller` (nil = the opening roll-off decides who starts).
  private func roll(for roller: TawlaPlayer?) {
    let rolled: [Int]
    let starter: TawlaPlayer
    if let roller {
      starter = roller
      rolled = [TawlaEngine.rollDie(), TawlaEngine.rollDie()]
    } else {
      let opening = TawlaEngine.rollOpening()
      starter = opening.starter
      rolled = [opening.whiteDie, opening.blackDie]
    }
    mover = starter
    dice = rolled
    let legal = TawlaEngine.legalTurns(position, starter, dice: rolled)
    turns = legal
    phase = .moving
    if legal.isEmpty {
      // Fully blocked roll: show the dice briefly, then the turn passes.
      scheduleBot(after: 1.2) { finishTurn(final: position, moverNow: starter) }
      return
    }
    if starter == .black {
      playBotTurn(rolled: rolled)
    }
  }

  /// Ends the turn: settles a win or hands the dice to the opponent.
  private func finishTurn(final: TawlaPosition, moverNow: TawlaPlayer) {
    position = final
    dice = []
    turns = []
    movePrefix = []
    selected = nil
    guard let gameResult = TawlaEngine.winResult(final) else {
      let next = moverNow.opponent
      mover = next
      phase = .awaitRoll
      if next == .black {
        scheduleBot(after: 0.7) { roll(for: .black) }
      }
      return
    }
    if gameResult.winner == .white {
      whiteScore += gameResult.points
    } else {
      blackScore += gameResult.points
    }
    result = gameResult
    let winnerScore = gameResult.winner == .white ? whiteScore : blackScore
    phase = winnerScore >= TawlaEngine.matchTarget ? .matchOver : .gameOver
  }

  /// Bot playback: pick the turn, then reveal it checker by checker.
  private func playBotTurn(rolled: [Int]) {
    guard let turn = TawlaEngine.findBotTurn(position, .black, dice: rolled, level: level) else {
      scheduleBot(after: 1.0) { finishTurn(final: position, moverNow: .black) }
      return
    }
    botTask?.cancel()
    botTask = Task { @MainActor in
      for step in 1...turn.moves.count {
        try? await Task.sleep(nanoseconds: 550_000_000)
        if Task.isCancelled { return }
        movePrefix = Array(turn.moves.prefix(step))
      }
      try? await Task.sleep(nanoseconds: 500_000_000)
      if Task.isCancelled { return }
      finishTurn(final: turn.result, moverNow: .black)
    }
  }

  private func scheduleBot(after seconds: Double, _ action: @escaping () -> Void) {
    botTask?.cancel()
    botTask = Task { @MainActor in
      try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
      if Task.isCancelled { return }
      action()
    }
  }

  // MARK: - Touch input

  private func playHumanMove(_ move: TawlaMove) {
    guard let mover else { return }
    movePrefix.append(move)
    selected = nil
    if movePrefix.count == TawlaEngine.maxTurnLength(turns) {
      let final = TawlaEngine.position(after: movePrefix, from: position, player: mover)
      let committed = movePrefix
      scheduleBot(after: 0.55) {
        // Only commit if the player has not undone in the meantime.
        if movePrefix == committed {
          finishTurn(final: final, moverNow: mover)
        }
      }
    }
  }

  private func handleTap(index: Int) {
    guard humanTurn else { return }
    if let candidate = destinations.first(where: { $0.to == index }) {
      playHumanMove(candidate)
      return
    }
    if legalNext.contains(where: { $0.from == index }) {
      selected = selected == index ? nil : index
    } else {
      selected = nil
    }
  }

  private func handleBarTap() {
    guard humanTurn, legalNext.contains(where: { $0.from == TawlaEngine.barIndex }) else { return }
    selected = selected == TawlaEngine.barIndex ? nil : TawlaEngine.barIndex
  }

  private func handleOffTap() {
    guard humanTurn else { return }
    // Prefer the exact die so the higher one stays free for a longer move.
    let candidates = destinations
      .filter { $0.to == TawlaEngine.offIndex }
      .sorted { $0.die < $1.die }
    if let move = candidates.first {
      playHumanMove(move)
    }
  }
}

// MARK: - Board rendering

/// The wooden board: two point halves, the raised bar, and the bear-off
/// trays. Layout mirrors the web board — White's home is the lower right,
/// point 1 at the far right, and White races toward it.
private struct TawlaBoardView: View {
  let shown: TawlaPosition
  let selected: Int?
  let sources: Set<Int>
  let destinations: Set<Int>
  let onTapPoint: (Int) -> Void
  let onTapBar: () -> Void
  let onTapOff: () -> Void

  /// Board columns from White's perspective, matching the web constants.
  private static let topLeft = [12, 13, 14, 15, 16, 17]
  private static let topRight = [18, 19, 20, 21, 22, 23]
  private static let bottomLeft = [11, 10, 9, 8, 7, 6]
  private static let bottomRight = [5, 4, 3, 2, 1, 0]

  var body: some View {
    HStack(spacing: 3) {
      half(top: Self.topLeft, bottom: Self.bottomLeft)
      barColumn
      half(top: Self.topRight, bottom: Self.bottomRight)
      offColumn
    }
    .padding(6)
    .background(TawlaPalette.felt)
    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 10, style: .continuous)
        .stroke(TawlaPalette.frameEdge, lineWidth: 3)
    )
  }

  private func half(top: [Int], bottom: [Int]) -> some View {
    VStack(spacing: 2) {
      HStack(spacing: 1) {
        ForEach(top, id: \.self) { index in
          TawlaPointView(
            index: index,
            isTop: true,
            signedCount: shown.points[index],
            isSelected: selected == index,
            isDestination: destinations.contains(index),
            isSource: sources.contains(index),
            onTap: { onTapPoint(index) }
          )
        }
      }
      HStack(spacing: 1) {
        ForEach(bottom, id: \.self) { index in
          TawlaPointView(
            index: index,
            isTop: false,
            signedCount: shown.points[index],
            isSelected: selected == index,
            isDestination: destinations.contains(index),
            isSource: sources.contains(index),
            onTap: { onTapPoint(index) }
          )
        }
      }
    }
  }

  private var barColumn: some View {
    VStack(spacing: 2) {
      barWell(player: .black, count: shown.blackBar)
      barWell(player: .white, count: shown.whiteBar)
    }
    .frame(maxWidth: 30)
    .background(TawlaPalette.frame)
    .clipShape(RoundedRectangle(cornerRadius: 5, style: .continuous))
  }

  private func barWell(player: TawlaPlayer, count: Int) -> some View {
    let active = player == .white && sources.contains(TawlaEngine.barIndex)
    return VStack(spacing: 2) {
      ForEach(0..<min(count, 4), id: \.self) { index in
        TawlaCheckerView(
          player: player,
          label: index == min(count, 4) - 1 && count > 4 ? "\(count)" : nil
        )
        .frame(width: 20, height: 20)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .overlay {
      if active || selected == TawlaEngine.barIndex && player == .white {
        RoundedRectangle(cornerRadius: 4)
          .stroke(TawlaPalette.glow, lineWidth: 2)
      }
    }
    .contentShape(Rectangle())
    .onTapGesture { onTapBar() }
  }

  private var offColumn: some View {
    VStack(spacing: 2) {
      offTray(player: .black, count: shown.blackOff, active: false)
      offTray(
        player: .white,
        count: shown.whiteOff,
        active: destinations.contains(TawlaEngine.offIndex)
      )
    }
    .frame(maxWidth: 34)
  }

  private func offTray(player: TawlaPlayer, count: Int, active: Bool) -> some View {
    VStack(spacing: 2) {
      Text("\(count)")
        .font(.system(size: 15, weight: .bold, design: .serif))
        .foregroundStyle(TawlaPalette.glow)
      Text(player == .white ? "YOU" : "BOT")
        .font(.system(size: 8, weight: .bold, design: .serif))
        .foregroundStyle(TawlaPalette.cream.opacity(0.75))
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(TawlaPalette.trayBg)
    .clipShape(RoundedRectangle(cornerRadius: 5, style: .continuous))
    .overlay {
      if active {
        RoundedRectangle(cornerRadius: 5)
          .stroke(TawlaPalette.glow, lineWidth: 2)
      }
    }
    .onTapGesture {
      if player == .white { onTapOff() }
    }
  }
}

/// One point: the inlaid triangle plus its checker stack (max five drawn;
/// the last one carries the overflow count, like the web stack).
private struct TawlaPointView: View {
  let index: Int
  let isTop: Bool
  let signedCount: Int
  let isSelected: Bool
  let isDestination: Bool
  let isSource: Bool
  let onTap: () -> Void

  var body: some View {
    let owner: TawlaPlayer? = signedCount > 0 ? .white : signedCount < 0 ? .black : nil
    let count = abs(signedCount)
    let visible = min(count, 5)

    GeometryReader { proxy in
      let checkerSize = min(proxy.size.width * 0.9, proxy.size.height / 5.2)
      ZStack(alignment: isTop ? .top : .bottom) {
        TawlaTriangle(pointsDown: isTop)
          .fill(index % 2 == (isTop ? 0 : 1) ? TawlaPalette.pointDark : TawlaPalette.pointLight)
          .padding(.horizontal, proxy.size.width * 0.06)

        VStack(spacing: -checkerSize * 0.06) {
          ForEach(0..<visible, id: \.self) { checkerIndex in
            if let owner {
              TawlaCheckerView(
                player: owner,
                label: checkerIndex == visible - 1 && count > 5 ? "\(count)" : nil
              )
              .frame(width: checkerSize, height: checkerSize)
            }
          }
        }

        if isDestination || isSelected {
          RoundedRectangle(cornerRadius: 4)
            .stroke(
              isSelected ? TawlaPalette.brass : TawlaPalette.glow,
              lineWidth: 2
            )
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .contentShape(Rectangle())
      .onTapGesture { onTap() }
      .opacity(isSource || isDestination || owner != nil || isSelected ? 1 : 0.96)
    }
  }
}

/// A single checker disc with an optional overflow-count label.
private struct TawlaCheckerView: View {
  let player: TawlaPlayer
  let label: String?

  var body: some View {
    ZStack {
      Circle()
        .fill(player == .white ? TawlaPalette.checkerWhite : TawlaPalette.checkerBlack)
      Circle()
        .stroke(
          player == .white ? TawlaPalette.checkerWhiteRim : TawlaPalette.checkerBlackRim,
          lineWidth: 1
        )
      if let label {
        Text(label)
          .font(.system(size: 9, weight: .bold, design: .serif))
          .foregroundStyle(player == .white ? TawlaPalette.frameEdge : TawlaPalette.cream)
      }
    }
  }
}

/// The inlaid triangle behind each point's checkers.
private struct TawlaTriangle: Shape {
  let pointsDown: Bool

  func path(in rect: CGRect) -> Path {
    var path = Path()
    if pointsDown {
      path.move(to: CGPoint(x: rect.minX, y: rect.minY))
      path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
      path.addLine(to: CGPoint(x: rect.midX, y: rect.minY + rect.height * 0.92))
    } else {
      path.move(to: CGPoint(x: rect.minX, y: rect.maxY))
      path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
      path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY - rect.height * 0.92))
    }
    path.closeSubpath()
    return path
  }
}

/// Chunky café button consistent with the web page's toolbar buttons.
private struct TawlaChunkyButtonStyle: ButtonStyle {
  @Environment(\.uiThemeTokens) private var theme

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .serif))
      .foregroundStyle(theme.colors.textPrimary)
      .padding(.horizontal, 14)
      .padding(.vertical, 9)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
          .fill(configuration.isPressed ? theme.colors.hover : theme.colors.surfaceAlt)
          .overlay(
            RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
              .stroke(theme.colors.border, lineWidth: 1)
          )
      )
  }
}

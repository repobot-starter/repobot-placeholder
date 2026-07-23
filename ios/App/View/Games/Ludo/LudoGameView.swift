import SwiftUI

/// Self-contained board palette mirroring the web LudoPage.styles.css.ts —
/// the board keeps its classic look on both light and dark app themes (why:
/// the web board is hardcoded too; the colors are part of the game's
/// identity). App chrome around the board uses the theme tokens.
private enum LudoPalette {
  static let boardFace = Color(hex: "#f8f2e3")
  static let track = Color(hex: "#fffaf0")
  static let line = Color(hex: "#2b2015").opacity(0.35)
  static let star = Color(hex: "#2b2015").opacity(0.45)
  static let seatMain: [Color] = [
    Color(hex: "#e0453a"),
    Color(hex: "#2fa24c"),
    Color(hex: "#f2b705"),
    Color(hex: "#2f6fd0"),
  ]
  static let seatDark: [Color] = [
    Color(hex: "#9c2b22"),
    Color(hex: "#1d6c32"),
    Color(hex: "#a97f06"),
    Color(hex: "#1e4b90"),
  ]
}

private let ludoSeatNames = ["Red", "Green", "Yellow", "Blue"]

/// Where each seat's finished tokens rest, inside the center triangles.
private let ludoFinishAnchors: [LudoCell] = [
  LudoCell(col: 6.1, row: 7),
  LudoCell(col: 7, row: 6.1),
  LudoCell(col: 7.9, row: 7),
  LudoCell(col: 7, row: 7.9),
]

/// Grid offsets that fan out tokens sharing one square.
private let ludoStackOffsets: [(Double, Double)] = [
  (0, 0), (-0.18, -0.18), (0.18, -0.18), (-0.18, 0.18),
  (0.18, 0.18), (0, -0.22), (0, 0.22), (-0.22, 0),
]

/// Home surface for the `ludo` pack — the native twin of the web `LudoPage`.
/// Touch-first: tap the die to roll, tap a glowing token to move. Seats are
/// configurable (human/bot/off, 2-4 racers, full local hotseat). All rules
/// live in the pure `LudoEngine`; this view only renders and forwards taps.
/// Purely client-side: ludo projects have no backend, so this view must
/// never touch stores, GraphQL, or the network.
struct LudoGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  @State private var seatConfig: [LudoSeatKind] = [.human, .bot, .bot, .bot]
  @State private var game: LudoGameState?
  @State private var rolling = false
  @State private var dieFace = 6
  @State private var note = "Set up the seats, then start the game."

  private var racerCount: Int {
    seatConfig.filter { $0 != .off }.count
  }

  private var humanTurn: Bool {
    guard let state = game else { return false }
    return !state.over && state.seats[state.current] == .human
  }

  var body: some View {
    VStack(spacing: theme.spacing.md) {
      Text("🎲 LUDOBOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .rounded))
        .foregroundStyle(theme.colors.textPrimary)
        .padding(.top, theme.spacing.lg)

      LudoBoardView(
        state: game ?? LudoEngine.createGame(seats: seatConfig),
        movableTokens: movableTokens,
        onTapToken: { token in playMove(token) }
      )
      .aspectRatio(1, contentMode: .fit)
      .padding(.horizontal, theme.spacing.md)
      .overlay {
        if let state = game, state.over {
          winOverlay(state: state)
        }
      }

      controls

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
    // Keyed on the game state only: `rolling` flips inside rollDie(), and
    // keying on it would cancel the bot's own roll mid-animation.
    .task(id: game) {
      await runBotTurnIfNeeded()
    }
  }

  /// Tokens of the current seat the player may tap right now.
  private var movableTokens: Set<Int> {
    guard let state = game, humanTurn, !rolling else { return [] }
    return Set(LudoEngine.legalMoves(state).map(\.token))
  }

  // MARK: - Controls

  private var controls: some View {
    VStack(spacing: theme.spacing.md) {
      if let state = game, !state.over {
        HStack(spacing: theme.spacing.md) {
          Button(action: rollTapped) {
            HStack(spacing: 6) {
              Image(systemName: "die.face.\(dieFace).fill")
                .font(.system(size: 30))
                .rotationEffect(.degrees(rolling ? 16 : 0))
                .animation(
                  rolling
                    ? .easeInOut(duration: 0.08).repeatForever(autoreverses: true)
                    : .default,
                  value: rolling
                )
              Text("ROLL")
                .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .rounded))
            }
          }
          .buttonStyle(LudoChunkyButtonStyle(prominent: true))
          .disabled(!humanTurn || rolling || state.dice != nil)

          VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 6) {
              Circle()
                .fill(LudoPalette.seatMain[state.current])
                .frame(width: 12, height: 12)
              Text("\(ludoSeatNames[state.current]) — \(state.seats[state.current].rawValue)")
                .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .rounded))
                .foregroundStyle(theme.colors.textPrimary)
            }
            Text(note)
              .font(.system(size: theme.typography.sizes.xs, design: .rounded))
              .foregroundStyle(theme.colors.textSecondary)
              .lineLimit(2)
          }
          Spacer(minLength: 0)
        }
        .padding(.horizontal, theme.spacing.md)

        Button("⟳ New Game") {
          game = nil
          note = "Set up the seats, then start the game."
        }
        .buttonStyle(LudoChunkyButtonStyle())
      } else {
        seatSetup
      }
    }
  }

  /// Pre-game seat setup: each color is Human, Bot, or Off (2-4 racers).
  private var seatSetup: some View {
    VStack(spacing: theme.spacing.sm) {
      ForEach(0..<LudoEngine.seatCount, id: \.self) { seat in
        HStack(spacing: theme.spacing.sm) {
          Circle()
            .fill(LudoPalette.seatMain[seat])
            .frame(width: 14, height: 14)
          Text(ludoSeatNames[seat])
            .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .rounded))
            .foregroundStyle(theme.colors.textPrimary)
            .frame(width: 56, alignment: .leading)
          Picker(ludoSeatNames[seat], selection: $seatConfig[seat]) {
            ForEach(LudoSeatKind.allCases) { kind in
              Text(kind.rawValue.capitalized).tag(kind)
            }
          }
          .pickerStyle(.segmented)
        }
      }
      Button("▶ Start Game", action: startGame)
        .buttonStyle(LudoChunkyButtonStyle(prominent: true))
        .disabled(racerCount < 2)
      if racerCount < 2 {
        Text("Turn on at least two seats to play.")
          .font(.system(size: theme.typography.sizes.xs, design: .rounded))
          .foregroundStyle(theme.colors.textSecondary)
      }
    }
    .padding(.horizontal, theme.spacing.lg)
  }

  private func winOverlay(state: LudoGameState) -> some View {
    VStack(spacing: theme.spacing.sm) {
      Text("🏆 \(ludoSeatNames[state.placings.first ?? 0].uppercased()) WINS")
        .font(.system(size: theme.typography.sizes.lg, weight: .bold, design: .rounded))
        .foregroundStyle(.white)
      ForEach(Array(state.placings.enumerated()), id: \.offset) { place, seat in
        HStack(spacing: 6) {
          Text(["🥇", "🥈", "🥉", "4️⃣"][min(place, 3)])
          Circle()
            .fill(LudoPalette.seatMain[seat])
            .frame(width: 12, height: 12)
          Text("\(ludoSeatNames[seat]) — \(state.seats[seat].rawValue)")
            .font(.system(size: theme.typography.sizes.sm, weight: .semibold, design: .rounded))
            .foregroundStyle(.white)
        }
      }
      Button("⟳ Play Again", action: startGame)
        .buttonStyle(LudoChunkyButtonStyle(prominent: true))
    }
    .padding(theme.spacing.lg)
    .background(
      RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
        .fill(Color.black.opacity(0.72))
    )
  }

  // MARK: - Game flow

  private func startGame() {
    game = LudoEngine.createGame(seats: seatConfig)
    let first = seatConfig.firstIndex { $0 != .off } ?? 0
    note = "\(ludoSeatNames[first]) rolls first. Roll a 6 to leave the yard!"
  }

  private func rollTapped() {
    Task { await rollDie() }
  }

  /// Flicks the die face a few times, then commits a real 1..6 roll.
  private func rollDie() async {
    guard let state = game, !state.over, state.dice == nil, !rolling else { return }
    rolling = true
    for _ in 0..<6 {
      dieFace = Int.random(in: 1...6)
      try? await Task.sleep(nanoseconds: 60_000_000)
    }
    let value = Int.random(in: 1...6)
    dieFace = value
    rolling = false
    guard let prev = game else { return }
    let next = LudoEngine.applyRoll(prev, value: value)
    withAnimation(.spring(duration: 0.4)) {
      game = next
    }
    note = rollNote(prev: prev, next: next, value: value)
  }

  private func playMove(_ token: Int) {
    guard let prev = game, prev.dice != nil,
          let move = LudoEngine.legalMoves(prev).first(where: { $0.token == token })
    else { return }
    let next = LudoEngine.applyMove(prev, token: token)
    withAnimation(.spring(duration: 0.4)) {
      game = next
    }
    note = moveNote(prev: prev, next: next, move: move)
  }

  private func rollNote(prev: LudoGameState, next: LudoGameState, value: Int) -> String {
    let who = ludoSeatNames[prev.current]
    if next.dice != nil {
      return value == 6 ? "\(who) rolled a 6 — move, then roll again." : "\(who) rolled a \(value)."
    }
    if next.current == prev.current {
      return "\(who) rolled a 6 but has no move — roll again."
    }
    if value == 6 {
      return "Three sixes in a row! \(who) forfeits the turn."
    }
    return "\(who) rolled a \(value) — no legal move, turn passes."
  }

  private func moveNote(prev: LudoGameState, next: LudoGameState, move: LudoMove) -> String {
    let who = ludoSeatNames[prev.current]
    if next.over {
      return "\(ludoSeatNames[next.placings.first ?? 0]) wins the match!"
    }
    if move.captures {
      return "\(who) captures — back to the yard!"
    }
    if move.to == LudoEngine.homeProgress {
      return "\(who) brings a token home!"
    }
    if next.current == prev.current && next.dice == nil {
      return "Six! \(who) rolls again."
    }
    return "\(who) moves \(move.to - max(move.from, 0)) squares."
  }

  // MARK: - Bot scheduling

  /// Rolls after a beat, then picks a move after another beat, so hotseat
  /// players can follow along — mirrors the web bot pacing.
  private func runBotTurnIfNeeded() async {
    guard let state = game, !state.over, !rolling, state.seats[state.current] == .bot else { return }
    if state.dice == nil {
      try? await Task.sleep(nanoseconds: 750_000_000)
      guard !Task.isCancelled else { return }
      await rollDie()
    } else {
      try? await Task.sleep(nanoseconds: 620_000_000)
      guard !Task.isCancelled, let current = game, current.dice != nil else { return }
      if let token = LudoEngine.chooseBotMove(current) {
        playMove(token)
      }
    }
  }
}

/// Chunky rounded button consistent with the board-game look.
private struct LudoChunkyButtonStyle: ButtonStyle {
  @Environment(\.uiThemeTokens) private var theme

  var prominent = false

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .rounded))
      .foregroundStyle(prominent ? Color.white : theme.colors.textPrimary)
      .padding(.horizontal, 14)
      .padding(.vertical, 9)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
          .fill(
            prominent
              ? LudoPalette.seatMain[1]
              : configuration.isPressed ? theme.colors.hover : theme.colors.surfaceAlt
          )
          .overlay(
            RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
              .stroke(theme.colors.border, lineWidth: 1)
          )
      )
      .opacity(configuration.isPressed ? 0.85 : 1)
  }
}

/// The board itself: a Canvas draws the static chrome (yards, track, home
/// columns, center) in 15x15 grid space, and tokens are laid on top as
/// tappable circles so movement animates and taps hit-test naturally.
private struct LudoBoardView: View {
  let state: LudoGameState
  let movableTokens: Set<Int>
  let onTapToken: (Int) -> Void

  var body: some View {
    GeometryReader { proxy in
      let cell = proxy.size.width / 15

      ZStack(alignment: .topLeading) {
        Canvas { context, _ in
          drawBoard(context: context, cell: cell)
        }
        ForEach(tokenPlacements(cell: cell)) { placement in
          LudoTokenView(placement: placement)
            .onTapGesture {
              if placement.movable {
                onTapToken(placement.token)
              }
            }
        }
      }
    }
    .background(
      RoundedRectangle(cornerRadius: 12, style: .continuous)
        .fill(LudoPalette.boardFace)
    )
    .overlay(
      RoundedRectangle(cornerRadius: 12, style: .continuous)
        .stroke(LudoPalette.line, lineWidth: 2)
    )
    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
  }

  // MARK: - Token layout

  struct TokenPlacement: Identifiable {
    let id: Int
    let seat: Int
    let token: Int
    let center: CGPoint
    let radius: CGFloat
    let movable: Bool
    let finished: Bool
  }

  /// Board cell a token occupies (yard, ring, home column, or center).
  private func tokenCell(seat: Int, token: Int, progress: Int) -> LudoCell {
    if progress == -1 {
      return LudoEngine.yardCells(seat: seat)[token]
    }
    if progress <= LudoEngine.ringLastProgress {
      return LudoEngine.ringCells[LudoEngine.ringIndex(seat: seat, progress: progress)]
    }
    if progress < LudoEngine.homeProgress {
      return LudoEngine.homeColumnCells(seat: seat)[progress - LudoEngine.ringLastProgress - 1]
    }
    return ludoFinishAnchors[seat]
  }

  private func tokenPlacements(cell: CGFloat) -> [TokenPlacement] {
    var occupancy: [String: Int] = [:]
    var placements: [TokenPlacement] = []
    for seat in 0..<LudoEngine.seatCount where state.seats[seat] != .off {
      for (token, progress) in state.tokens[seat].enumerated() {
        let gridCell = tokenCell(seat: seat, token: token, progress: progress)
        let key = "\(gridCell.col)|\(gridCell.row)"
        let stackIndex = occupancy[key, default: 0]
        occupancy[key] = stackIndex + 1
        let (dx, dy) = ludoStackOffsets[min(stackIndex, ludoStackOffsets.count - 1)]
        let finished = progress == LudoEngine.homeProgress
        placements.append(
          TokenPlacement(
            id: seat * LudoEngine.tokensPerSeat + token,
            seat: seat,
            token: token,
            center: CGPoint(
              x: (gridCell.col + 0.5 + dx) * cell,
              y: (gridCell.row + 0.5 + dy) * cell
            ),
            radius: (finished ? 0.24 : 0.34) * cell,
            movable: seat == state.current && movableTokens.contains(token),
            finished: finished
          )
        )
      }
    }
    return placements
  }

  // MARK: - Board chrome

  private func drawBoard(context: GraphicsContext, cell: CGFloat) {
    // Yards
    for seat in 0..<LudoEngine.seatCount {
      let origin = LudoEngine.yardOrigins[seat]
      let yardRect = CGRect(x: origin.col * cell, y: origin.row * cell, width: 6 * cell, height: 6 * cell)
      context.fill(
        Path(roundedRect: yardRect, cornerRadius: cell * 0.25),
        with: .color(LudoPalette.seatMain[seat])
      )
      let innerRect = yardRect.insetBy(dx: cell, dy: cell)
      context.fill(
        Path(roundedRect: innerRect, cornerRadius: cell * 0.2),
        with: .color(LudoPalette.boardFace)
      )
      for spot in LudoEngine.yardCells(seat: seat) {
        let spotRect = CGRect(
          x: (spot.col + 0.5) * cell - cell * 0.38,
          y: (spot.row + 0.5) * cell - cell * 0.38,
          width: cell * 0.76,
          height: cell * 0.76
        )
        context.stroke(
          Path(ellipseIn: spotRect),
          with: .color(LudoPalette.seatDark[seat]),
          style: StrokeStyle(lineWidth: 1.5, dash: [3, 3])
        )
      }
    }

    // Ring track (start squares take their seat's color)
    for (index, ringCell) in LudoEngine.ringCells.enumerated() {
      let rect = CGRect(x: ringCell.col * cell, y: ringCell.row * cell, width: cell, height: cell)
      let startSeat = LudoEngine.startRingIndex.firstIndex(of: index)
      context.fill(
        Path(rect),
        with: .color(startSeat.map { LudoPalette.seatMain[$0] } ?? LudoPalette.track)
      )
      context.stroke(Path(rect), with: .color(LudoPalette.line), lineWidth: 1)
      if LudoEngine.starRingIndexes.contains(index) {
        context.fill(
          starPath(center: CGPoint(x: rect.midX, y: rect.midY), outer: cell * 0.32, inner: cell * 0.14),
          with: .color(LudoPalette.star)
        )
      }
    }

    // Home columns
    for seat in 0..<LudoEngine.seatCount {
      for columnCell in LudoEngine.homeColumnCells(seat: seat) {
        let rect = CGRect(x: columnCell.col * cell, y: columnCell.row * cell, width: cell, height: cell)
        context.fill(Path(rect), with: .color(LudoPalette.seatMain[seat]))
        context.stroke(Path(rect), with: .color(LudoPalette.seatDark[seat].opacity(0.6)), lineWidth: 1)
      }
    }

    // Center: four triangles pointing home
    let c6 = 6 * cell
    let c9 = 9 * cell
    let mid = 7.5 * cell
    context.fill(Path(CGRect(x: c6, y: c6, width: 3 * cell, height: 3 * cell)), with: .color(LudoPalette.track))
    let triangles: [(Int, [CGPoint])] = [
      (0, [CGPoint(x: c6, y: c6), CGPoint(x: c6, y: c9), CGPoint(x: mid, y: mid)]),
      (1, [CGPoint(x: c6, y: c6), CGPoint(x: c9, y: c6), CGPoint(x: mid, y: mid)]),
      (2, [CGPoint(x: c9, y: c6), CGPoint(x: c9, y: c9), CGPoint(x: mid, y: mid)]),
      (3, [CGPoint(x: c6, y: c9), CGPoint(x: c9, y: c9), CGPoint(x: mid, y: mid)]),
    ]
    for (seat, points) in triangles {
      var path = Path()
      path.addLines(points)
      path.closeSubpath()
      context.fill(path, with: .color(LudoPalette.seatMain[seat]))
    }
  }

  private func starPath(center: CGPoint, outer: CGFloat, inner: CGFloat) -> Path {
    var path = Path()
    for index in 0..<10 {
      let radius = index.isMultiple(of: 2) ? outer : inner
      let angle = Double(index) * .pi / 5 - .pi / 2
      let point = CGPoint(
        x: center.x + Foundation.cos(angle) * radius,
        y: center.y + Foundation.sin(angle) * radius
      )
      if index == 0 {
        path.move(to: point)
      } else {
        path.addLine(to: point)
      }
    }
    path.closeSubpath()
    return path
  }
}

/// One token: a colored disk with a highlight, plus a pulsing halo when the
/// player may move it.
private struct LudoTokenView: View {
  let placement: LudoBoardView.TokenPlacement

  @State private var pulsing = false

  var body: some View {
    ZStack {
      if placement.movable {
        Circle()
          .stroke(Color.white, lineWidth: pulsing ? 4.5 : 2.5)
          .frame(width: placement.radius * 2.6, height: placement.radius * 2.6)
          .opacity(pulsing ? 0.35 : 0.95)
          .animation(.easeInOut(duration: 0.55).repeatForever(autoreverses: true), value: pulsing)
          .onAppear { pulsing = true }
          .onDisappear { pulsing = false }
      }
      Circle()
        .fill(LudoPalette.seatMain[placement.seat])
        .overlay(Circle().stroke(LudoPalette.seatDark[placement.seat], lineWidth: 2))
      Circle()
        .fill(Color.white.opacity(0.4))
        .frame(width: placement.radius * 0.6, height: placement.radius * 0.6)
        .offset(x: -placement.radius * 0.25, y: -placement.radius * 0.3)
    }
    .frame(width: placement.radius * 2, height: placement.radius * 2)
    .position(placement.center)
  }
}

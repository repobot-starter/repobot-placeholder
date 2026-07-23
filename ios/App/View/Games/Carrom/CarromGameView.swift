import SwiftUI

/// Home surface for the `carrom` pack — the native twin of the web
/// `CarromPage`. Purely client-side: carrom projects have no backend, so
/// this view must never touch stores, components, or the network.
///
/// `TimelineView(.animation)` drives the frame clock and `Canvas` renders
/// the whole board (plywood, pockets, coins, aim overlay, scrims) exactly
/// like the web version's <canvas>, so the per-frame simulation never
/// churns SwiftUI state. Mobile is vs-bot only, like the Pong port.
struct CarromGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  /// Reference-typed frame state so the render loop can mutate the engine
  /// without invalidating the SwiftUI view tree every frame.
  @State private var session = CarromSession()
  @State private var botLevel: CarromBotLevel = .medium

  var body: some View {
    VStack(spacing: theme.spacing.lg) {
      Text("CARROMBOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .serif))
        .foregroundStyle(theme.colors.textPrimary)
        .padding(.top, theme.spacing.lg)

      CarromBoardView(session: session, botLevel: botLevel)
        .aspectRatio(1, contentMode: .fit)
        .padding(.horizontal, theme.spacing.md)

      controls

      Text("Press the baseline to place the striker · drag back from it to flick")
        .font(.system(size: theme.typography.sizes.xs, design: .serif))
        .foregroundStyle(theme.colors.textSecondary)
        .multilineTextAlignment(.center)
        .padding(.horizontal, theme.spacing.lg)

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
  }

  private var controls: some View {
    VStack(spacing: theme.spacing.md) {
      Button {
        session.engine.newMatch()
        session.reset()
      } label: {
        Label("New Match", systemImage: "arrow.counterclockwise")
      }
      .buttonStyle(CarromChunkyButtonStyle())

      Picker("Bot level", selection: $botLevel) {
        ForEach(CarromBotLevel.allCases) { level in
          Text(level.rawValue.capitalized).tag(level)
        }
      }
      .pickerStyle(.segmented)
      .padding(.horizontal, theme.spacing.md)
    }
  }
}

/// Chunky parlor button consistent with the web page's toolbar buttons.
private struct CarromChunkyButtonStyle: ButtonStyle {
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

/// Frame-loop state that must survive view updates but must not trigger
/// them: the engine, the previous frame timestamp, the active slingshot
/// drag, bot/next-board timers and the current ticker message.
final class CarromSession {
  let engine = CarromEngine()
  var lastFrameTime: Date?
  /// Current drag point in board units while the player is aiming.
  var aimDrag: CGPoint?
  var botStrikeAt: Date?
  var nextBoardAt: Date?
  var message = "You break. Drag back from the striker to flick."

  func reset() {
    lastFrameTime = nil
    aimDrag = nil
    botStrikeAt = nil
    nextBoardAt = nil
    message = "You break. Drag back from the striker to flick."
  }
}

/// The board: steps the engine each animation frame, runs the bot and
/// board-flow timers, and draws with the web version's plywood palette.
struct CarromBoardView: View {
  let session: CarromSession
  let botLevel: CarromBotLevel

  /// Pull-back distance (board units) mapping to a full-power flick —
  /// same feel as the web MAX_PULL.
  private static let maxPull: Double = 220
  private static let botDelay: TimeInterval = 0.9
  private static let nextBoardDelay: TimeInterval = 2.6

  var body: some View {
    GeometryReader { proxy in
      let scale = proxy.size.width / CarromEngine.boardSize

      TimelineView(.animation(minimumInterval: 1 / 120)) { timeline in
        Canvas { context, size in
          stepEngine(now: timeline.date)
          draw(context: context, size: size)
        }
      }
      .gesture(
        DragGesture(minimumDistance: 0)
          .onChanged { value in
            handleDragChanged(value, scale: scale)
          }
          .onEnded { value in
            handleDragEnded(value, scale: scale)
          }
      )
    }
    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 12, style: .continuous)
        .stroke(Color(hex: "#5b3a1c"), lineWidth: 4)
    )
  }

  // MARK: - Input (player 0 only; player 1 is the bot)

  private func handleDragChanged(_ value: DragGesture.Value, scale: Double) {
    let engine = session.engine
    guard engine.phase == .aiming, engine.currentPlayer == 0 else { return }
    let start = CGPoint(x: value.startLocation.x / scale, y: value.startLocation.y / scale)
    let point = CGPoint(x: value.location.x / scale, y: value.location.y / scale)
    let striker = engine.striker
    let grabRange = CarromEngine.strikerRadius * 2.4
    if session.aimDrag != nil || hypot(start.x - striker.x, start.y - striker.y) <= grabRange {
      session.aimDrag = point
    } else if abs(start.y - CarromEngine.baselineY(for: 0)) < 44 {
      // Press along the baseline repositions the striker before the flick.
      engine.setStrikerX(point.x)
    }
  }

  private func handleDragEnded(_ value: DragGesture.Value, scale: Double) {
    let engine = session.engine
    guard let drag = session.aimDrag else { return }
    session.aimDrag = nil
    guard engine.phase == .aiming, engine.currentPlayer == 0 else { return }
    let striker = engine.striker
    let pullX = drag.x - striker.x
    let pullY = drag.y - striker.y
    let power = min(1, hypot(pullX, pullY) / Self.maxPull)
    if power > 0.06 {
      engine.strike(dirX: -pullX, dirY: -pullY, power01: power)
    }
  }

  // MARK: - Simulation flow

  private func stepEngine(now: Date) {
    let engine = session.engine

    // Clamp dt like the web loop so backgrounding never teleports pieces.
    let dt: Double
    if let last = session.lastFrameTime {
      dt = min(0.05, now.timeIntervalSince(last))
    } else {
      dt = 0
    }
    session.lastFrameTime = now

    // Bot turn: think briefly, then flick.
    if engine.phase == .aiming, engine.currentPlayer == 1 {
      if session.botStrikeAt == nil {
        session.botStrikeAt = now.addingTimeInterval(Self.botDelay)
      } else if let strikeAt = session.botStrikeAt, now >= strikeAt {
        session.botStrikeAt = nil
        engine.botStrike(level: botLevel)
      }
    } else {
      session.botStrikeAt = nil
    }

    // Auto-rack the next board after the win scrim has been shown.
    if engine.phase == .boardOver {
      if session.nextBoardAt == nil {
        session.nextBoardAt = now.addingTimeInterval(Self.nextBoardDelay)
      } else if let rackAt = session.nextBoardAt, now >= rackAt {
        session.nextBoardAt = nil
        engine.nextBoard()
        session.message = engine.currentPlayer == 0 ? "New board. You break." : "New board. Bot breaks."
      }
    } else {
      session.nextBoardAt = nil
    }

    for event in engine.step(dt: dt) {
      handle(event)
    }
  }

  private func handle(_ event: CarromEvent) {
    switch event {
    case .strikeResolved(let summary):
      session.message = message(for: summary)
    case .boardOver(let winner, let points):
      session.message = winner == 0
        ? "You clear the board for \(points) point\(points == 1 ? "" : "s")!"
        : "Bot clears the board for \(points) point\(points == 1 ? "" : "s")."
    case .matchOver(let winner):
      session.message = winner == 0 ? "You win the match!" : "Bot wins the match."
    case .collision, .wall, .pocket:
      break
    }
  }

  private func message(for summary: CarromStrikeSummary) -> String {
    let shooter = summary.shooter == 0 ? "You" : "Bot"
    let next = summary.shooter == 0 ? "Bot" : "You"
    if summary.foul {
      return "Foul! \(shooter == "You" ? "You sank" : "Bot sank") the striker — a coin returns. \(next) to play."
    }
    switch summary.queenOutcome {
    case .covered:
      return "\(shooter) covered the queen!"
    case .pending:
      return "\(shooter) pocketed the queen — cover it next strike!"
    case .returned:
      return "No cover — the queen returns to center. \(next) to play."
    case nil:
      break
    }
    if summary.keptTurn {
      return "\(shooter) pocket\(shooter == "You" ? "" : "s") \(summary.ownPocketed) — again!"
    }
    return "\(next) to play."
  }

  // MARK: - Drawing (web CarromGame draw() palette)

  private func draw(context: GraphicsContext, size: CGSize) {
    let engine = session.engine
    var context = context
    context.scaleBy(
      x: size.width / CarromEngine.boardSize,
      y: size.height / CarromEngine.boardSize
    )
    let board = CarromEngine.boardSize

    drawBoard(context)

    for pocket in CarromEngine.pockets {
      let rect = CGRect(
        x: pocket.x - CarromEngine.pocketRadius,
        y: pocket.y - CarromEngine.pocketRadius,
        width: CarromEngine.pocketRadius * 2,
        height: CarromEngine.pocketRadius * 2
      )
      context.fill(Path(ellipseIn: rect), with: .color(Color(hex: "#241408")))
    }

    for piece in engine.pieces where piece.onBoard && piece.kind != .striker {
      drawCoin(context, piece: piece)
    }
    if engine.striker.onBoard, engine.phase != .boardOver, engine.phase != .matchOver {
      drawStriker(context, striker: engine.striker)
    }

    if engine.phase == .aiming {
      drawBaselineHighlight(context, player: engine.currentPlayer)
      if engine.currentPlayer == 0, let drag = session.aimDrag {
        drawAimOverlay(context, drag: drag)
      }
    }

    // HUD: match score at the top corners, ticker along the bottom rail.
    drawText(
      context, "YOU \(engine.matchScore[0])", size: 17, weight: .bold,
      color: Color(hex: "#5b3a1c"), at: CGPoint(x: board * 0.28, y: 22)
    )
    drawText(
      context, "BOT \(engine.matchScore[1])", size: 17, weight: .bold,
      color: Color(hex: "#5b3a1c"), at: CGPoint(x: board * 0.72, y: 22)
    )
    drawText(
      context, session.message, size: 14, weight: .semibold,
      color: Color(hex: "#5b3a1c"), at: CGPoint(x: board / 2, y: board - 20)
    )

    if engine.phase == .boardOver || engine.phase == .matchOver {
      drawScrim(context)
    }
  }

  /// Warm plywood field, frame, center rosette and baselines.
  private func drawBoard(_ context: GraphicsContext) {
    let board = CarromEngine.boardSize
    let center = board / 2
    context.fill(
      Path(CGRect(x: 0, y: 0, width: board, height: board)),
      with: .radialGradient(
        Gradient(colors: [Color(hex: "#e8c48a"), Color(hex: "#dcb271")]),
        center: CGPoint(x: center, y: center),
        startRadius: 60,
        endRadius: board * 0.75
      )
    )
    context.stroke(
      Path(CGRect(x: 5, y: 5, width: board - 10, height: board - 10)),
      with: .color(Color(hex: "#5b3a1c")),
      lineWidth: 10
    )

    let line = Color(hex: "#8a5a28")
    context.stroke(
      Path(ellipseIn: CGRect(x: center - 78, y: center - 78, width: 156, height: 156)),
      with: .color(line), lineWidth: 2
    )
    context.stroke(
      Path(ellipseIn: CGRect(x: center - 16, y: center - 16, width: 32, height: 32)),
      with: .color(line), lineWidth: 2
    )

    // Diagonal arrows from each pocket toward the center rosette.
    for pocket in CarromEngine.pockets {
      let dirX: Double = pocket.x < center ? 1 : -1
      let dirY: Double = pocket.y < center ? 1 : -1
      var arrow = Path()
      arrow.move(to: CGPoint(x: pocket.x + dirX * 44, y: pocket.y + dirY * 44))
      arrow.addLine(to: CGPoint(x: pocket.x + dirX * 150, y: pocket.y + dirY * 150))
      context.stroke(arrow, with: .color(line), lineWidth: 2)
      context.stroke(
        Path(ellipseIn: CGRect(
          x: pocket.x + dirX * 160 - 10, y: pocket.y + dirY * 160 - 10, width: 20, height: 20
        )),
        with: .color(line), lineWidth: 2
      )
    }

    // Baselines (double rails with end rings), horizontal and vertical.
    let margin = CarromEngine.baselineMargin
    let railGap: Double = 9
    for y in [CarromEngine.baselineY(for: 0), CarromEngine.baselineY(for: 1)] {
      for offset in [-railGap, railGap] {
        var rail = Path()
        rail.move(to: CGPoint(x: margin, y: y + offset))
        rail.addLine(to: CGPoint(x: board - margin, y: y + offset))
        context.stroke(rail, with: .color(line), lineWidth: 2)
      }
      for x in [margin, board - margin] {
        context.stroke(
          Path(ellipseIn: CGRect(x: x - railGap - 4, y: y - railGap - 4,
                                 width: (railGap + 4) * 2, height: (railGap + 4) * 2)),
          with: .color(line), lineWidth: 2
        )
      }
    }
    for x in [CarromEngine.baselineY(for: 0), CarromEngine.baselineY(for: 1)] {
      for offset in [-railGap, railGap] {
        var rail = Path()
        rail.move(to: CGPoint(x: x + offset, y: margin))
        rail.addLine(to: CGPoint(x: x + offset, y: board - margin))
        context.stroke(rail, with: .color(line), lineWidth: 2)
      }
      for y in [margin, board - margin] {
        context.stroke(
          Path(ellipseIn: CGRect(x: x - railGap - 4, y: y - railGap - 4,
                                 width: (railGap + 4) * 2, height: (railGap + 4) * 2)),
          with: .color(line), lineWidth: 2
        )
      }
    }
  }

  private func drawCoin(_ context: GraphicsContext, piece: CarromPiece) {
    let fill: Color
    let rim: Color
    switch piece.kind {
    case .queen:
      fill = Color(hex: "#b3232a")
      rim = Color(hex: "#7d1218")
    case .white:
      fill = Color(hex: "#f5e9d0")
      rim = Color(hex: "#c8b48d")
    default:
      fill = Color(hex: "#3d2a1e")
      rim = Color(hex: "#241811")
    }
    let shadow = CGRect(
      x: piece.x + 2 - piece.radius, y: piece.y + 3 - piece.radius,
      width: piece.radius * 2, height: piece.radius * 2
    )
    context.fill(Path(ellipseIn: shadow), with: .color(.black.opacity(0.22)))
    let body = CGRect(
      x: piece.x - piece.radius, y: piece.y - piece.radius,
      width: piece.radius * 2, height: piece.radius * 2
    )
    context.fill(Path(ellipseIn: body), with: .color(fill))
    context.stroke(Path(ellipseIn: body), with: .color(rim), lineWidth: 2)
    let inner = CGRect(
      x: piece.x - piece.radius * 0.55, y: piece.y - piece.radius * 0.55,
      width: piece.radius * 1.1, height: piece.radius * 1.1
    )
    context.stroke(Path(ellipseIn: inner), with: .color(rim.opacity(0.7)), lineWidth: 1.5)
  }

  private func drawStriker(_ context: GraphicsContext, striker: CarromPiece) {
    let r = striker.radius
    let shadow = CGRect(x: striker.x + 2 - r, y: striker.y + 4 - r, width: r * 2, height: r * 2)
    context.fill(Path(ellipseIn: shadow), with: .color(.black.opacity(0.25)))
    let body = CGRect(x: striker.x - r, y: striker.y - r, width: r * 2, height: r * 2)
    context.fill(Path(ellipseIn: body), with: .color(Color(hex: "#f0e7d4")))
    context.stroke(Path(ellipseIn: body), with: .color(Color(hex: "#4a6fa5")), lineWidth: 2.5)
    // Six-point star inlay.
    var star = Path()
    for i in 0..<6 {
      let angle = Double(i) * Double.pi / 3
      star.move(to: CGPoint(x: striker.x, y: striker.y))
      star.addLine(to: CGPoint(
        x: striker.x + cos(angle) * r * 0.7,
        y: striker.y + sin(angle) * r * 0.7
      ))
    }
    context.stroke(star, with: .color(Color(hex: "#4a6fa5")), lineWidth: 1.4)
  }

  private func drawBaselineHighlight(_ context: GraphicsContext, player: CarromPlayer) {
    let y = CarromEngine.baselineY(for: player)
    let margin = CarromEngine.baselineMargin
    context.fill(
      Path(CGRect(
        x: margin - 14, y: y - 22,
        width: CarromEngine.boardSize - 2 * (margin - 14), height: 44
      )),
      with: .color(Color(hex: "#4a6fa5").opacity(0.12))
    )
  }

  /// Slingshot band, first-bounce guide direction and the power arc.
  private func drawAimOverlay(_ context: GraphicsContext, drag: CGPoint) {
    let striker = session.engine.striker
    let pullX = drag.x - striker.x
    let pullY = drag.y - striker.y
    let pull = hypot(pullX, pullY)
    guard pull > 1 else { return }
    let power = min(1, pull / Self.maxPull)

    // Elastic band back to the finger.
    var band = Path()
    band.move(to: CGPoint(x: striker.x, y: striker.y))
    band.addLine(to: drag)
    context.stroke(band, with: .color(Color(hex: "#3c2814").opacity(0.55)), lineWidth: 3)

    // Straight dashed guide out the opposite way (first leg of the shot).
    let guideLength: Double = 260
    var guide = Path()
    guide.move(to: CGPoint(x: striker.x, y: striker.y))
    guide.addLine(to: CGPoint(
      x: striker.x - pullX / pull * guideLength,
      y: striker.y - pullY / pull * guideLength
    ))
    context.stroke(
      guide,
      with: .color(.white.opacity(0.75)),
      style: StrokeStyle(lineWidth: 2, dash: [8, 8])
    )

    // Power arc around the striker.
    var arc = Path()
    arc.addArc(
      center: CGPoint(x: striker.x, y: striker.y),
      radius: CarromEngine.strikerRadius + 8,
      startAngle: .degrees(-90),
      endAngle: .degrees(-90 + power * 360),
      clockwise: false
    )
    context.stroke(
      arc,
      with: .color(power > 0.85 ? Color(hex: "#c0392b") : Color(hex: "#2e7d32")),
      lineWidth: 5
    )
  }

  private func drawScrim(_ context: GraphicsContext) {
    let engine = session.engine
    let board = CarromEngine.boardSize
    context.fill(
      Path(CGRect(x: 0, y: 0, width: board, height: board)),
      with: .color(Color(hex: "#241408").opacity(0.62))
    )
    let winner = engine.matchWinner ?? engine.boardWinner ?? 0
    let title = engine.phase == .matchOver
      ? (winner == 0 ? "YOU WIN THE MATCH!" : "BOT WINS THE MATCH")
      : (winner == 0 ? "YOU TAKE THE BOARD" : "BOT TAKES THE BOARD")
    drawText(
      context, title, size: 32, weight: .bold,
      color: Color(hex: "#f5e9d0"), at: CGPoint(x: board / 2, y: board / 2 - 14)
    )
    let subtitle = engine.phase == .matchOver
      ? "Final \(engine.matchScore[0]) — \(engine.matchScore[1]). Press New Match."
      : "Score \(engine.matchScore[0]) — \(engine.matchScore[1]). Racking the next board…"
    drawText(
      context, subtitle, size: 16, weight: .semibold,
      color: Color(hex: "#f5e9d0"), at: CGPoint(x: board / 2, y: board / 2 + 22)
    )
  }

  private func drawText(
    _ context: GraphicsContext,
    _ text: String,
    size: CGFloat,
    weight: Font.Weight,
    color: Color,
    at point: CGPoint
  ) {
    context.draw(
      Text(text)
        .font(.system(size: size, weight: weight, design: .serif))
        .foregroundStyle(color),
      at: point,
      anchor: .center
    )
  }
}

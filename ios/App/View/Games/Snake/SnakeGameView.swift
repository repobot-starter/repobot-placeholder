import SwiftUI

/// Home surface for the `snake` pack — the native twin of the web `SnakePage`.
/// Purely client-side: snake projects have no backend, so this view must never
/// touch stores, components, or the network.
///
/// `TimelineView(.animation)` drives the frame clock and `Canvas` renders the
/// whole terminal screen (HUD, phosphor grid, snake, food, overlays) exactly
/// like the web version's <canvas>, so the per-frame simulation never churns
/// SwiftUI state. All rules live in `SnakeEngine`.
struct SnakeGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  /// Reference-typed frame state so the render loop can mutate the engine
  /// without invalidating the SwiftUI view tree every frame.
  @State private var session = SnakeSession()
  @State private var isPaused = false

  var body: some View {
    VStack(spacing: theme.spacing.lg) {
      Text("SNAKEBOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textPrimary)
        .padding(.top, theme.spacing.lg)

      SnakeBoardView(session: session, isPaused: isPaused)
        .aspectRatio(
          SnakeBoardView.totalWidth / SnakeBoardView.totalHeight,
          contentMode: .fit
        )
        .padding(.horizontal, theme.spacing.md)

      controls

      Text("Swipe on the grid to steer · Eat cells, avoid walls and your tail")
        .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
        .foregroundStyle(theme.colors.textSecondary)

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
  }

  private var controls: some View {
    HStack(spacing: theme.spacing.md) {
      Button {
        session.restart()
        isPaused = false
      } label: {
        Label("New Game", systemImage: "arrow.counterclockwise")
      }
      .buttonStyle(SnakeChunkyButtonStyle())

      Button {
        isPaused.toggle()
      } label: {
        Label(isPaused ? "Resume" : "Pause", systemImage: isPaused ? "play.fill" : "pause.fill")
      }
      .buttonStyle(SnakeChunkyButtonStyle())
    }
  }
}

/// Chunky retro button consistent with the web page's terminal buttons.
private struct SnakeChunkyButtonStyle: ButtonStyle {
  @Environment(\.uiThemeTokens) private var theme

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .monospaced))
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

/// One saved high-score row. Encoded to the same JSON shape (and stored under
/// the same key) as the web page's localStorage table, so the formats match
/// across platforms.
struct SnakeHighScoreEntry: Codable, Equatable {
  var name: String
  var score: Int
}

/// High-score persistence via `UserDefaults`, mirroring the web page's
/// localStorage table: key `snakebot-high-scores`, JSON array of
/// `{ name, score }`, top 10 by score. Unlike web there is no initials prompt
/// on touch — qualifying scores are recorded automatically as "BOT" (the
/// web page's default initials).
final class SnakeHighScoreStore {
  static let key = "snakebot-high-scores"
  static let maxEntries = 10
  static let defaultName = "BOT"

  private let defaults: UserDefaults

  init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }

  func load() -> [SnakeHighScoreEntry] {
    guard
      let raw = defaults.string(forKey: Self.key),
      let data = raw.data(using: .utf8),
      let entries = try? JSONDecoder().decode([SnakeHighScoreEntry].self, from: data)
    else {
      return []
    }
    return entries
  }

  /// Records `score` if it qualifies (web rule: non-zero, and either the
  /// table has room or it beats the current last place). Returns the table.
  @discardableResult
  func record(score: Int) -> [SnakeHighScoreEntry] {
    var entries = load()
    let qualifies =
      score > 0 && (entries.count < Self.maxEntries || score > (entries.last?.score ?? 0))
    guard qualifies else { return entries }

    entries.append(SnakeHighScoreEntry(name: Self.defaultName, score: score))
    entries.sort { $0.score > $1.score }
    entries = Array(entries.prefix(Self.maxEntries))
    if let data = try? JSONEncoder().encode(entries),
       let raw = String(data: data, encoding: .utf8) {
      defaults.set(raw, forKey: Self.key)
    }
    return entries
  }
}

/// Frame-loop state that must survive view updates but must not trigger them:
/// the engine, the last tick timestamp, and the persisted best score.
final class SnakeSession {
  let engine = SnakeEngine()
  let highScores = SnakeHighScoreStore()
  var lastTickTime: Date?
  var bestScore: Int
  /// Guards against recording the same crash twice across frames.
  var didRecordCurrentGame = false

  init() {
    bestScore = highScores.load().first?.score ?? 0
  }

  func restart() {
    engine.newGame()
    lastTickTime = nil
    didRecordCurrentGame = false
  }
}

/// The terminal screen: a HUD strip (score / best / level) above the 28x22
/// phosphor grid, all drawn in field units and scaled to the device. Swipe in
/// any of the four directions to steer; tap after a crash to restart.
struct SnakeBoardView: View {
  // Board geometry in field units — the web board is GRID_COLS x GRID_ROWS
  // cells of 24px; the HUD strip is native-only (the web shows score in side
  // panels that don't fit a phone).
  static let cell: Double = 24
  static let boardWidth = Double(SnakeEngine.gridCols) * cell
  static let boardHeight = Double(SnakeEngine.gridRows) * cell
  static let hudHeight: Double = 40
  static let totalWidth = boardWidth
  static let totalHeight = boardHeight + hudHeight

  // Green-phosphor palette lifted from the web SnakePage.styles.css.ts / draw().
  private static let ink = Color(hex: "#020b04")
  private static let green = Color(hex: "#42f578")
  private static let greenDim = Color(hex: "#1d7a3c")
  private static let greenSoft = Color(hex: "#b8ffd0")
  private static let amber = Color(hex: "#ffd166")

  let session: SnakeSession
  let isPaused: Bool

  var body: some View {
    TimelineView(.animation(minimumInterval: 1 / 60, paused: isPaused)) { timeline in
      Canvas { context, size in
        stepEngine(now: timeline.date)
        draw(context: context, size: size)
      }
    }
    .gesture(
      DragGesture(minimumDistance: 12)
        .onEnded { value in
          // Dominant axis of the swipe picks one of the four directions;
          // the engine rejects reversals itself, like the web key handler.
          let translation = value.translation
          if abs(translation.width) > abs(translation.height) {
            session.engine.setDirection(dx: translation.width > 0 ? 1 : -1, dy: 0)
          } else {
            session.engine.setDirection(dx: 0, dy: translation.height > 0 ? 1 : -1)
          }
        }
    )
    .onTapGesture {
      if session.engine.isOver {
        session.restart()
      }
    }
    .background(Self.ink)
    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 8, style: .continuous)
        .stroke(Self.green, lineWidth: 2)
    )
  }

  /// Fixed-timestep pacing identical to the web rAF loop: run one engine tick
  /// whenever `tickInterval` (which shrinks as the level rises) has elapsed.
  private func stepEngine(now: Date) {
    let engine = session.engine
    guard !isPaused, !engine.isOver else {
      session.lastTickTime = nil
      return
    }
    guard let last = session.lastTickTime else {
      session.lastTickTime = now
      return
    }
    if now.timeIntervalSince(last) >= engine.tickInterval {
      session.lastTickTime = now
      let events = engine.step()
      for event in events {
        if case .gameOver(let score, _) = event, !session.didRecordCurrentGame {
          session.didRecordCurrentGame = true
          let table = session.highScores.record(score: score)
          session.bestScore = max(session.bestScore, table.first?.score ?? 0)
        }
      }
    }
  }

  private func draw(context: GraphicsContext, size: CGSize) {
    let engine = session.engine
    var context = context
    context.scaleBy(x: size.width / Self.totalWidth, y: size.height / Self.totalHeight)

    // Backdrop
    context.fill(
      Path(CGRect(x: 0, y: 0, width: Self.totalWidth, height: Self.totalHeight)),
      with: .color(Self.ink)
    )

    drawHud(context)

    // Grid area starts below the HUD strip.
    context.translateBy(x: 0, y: Self.hudHeight)

    // Phosphor grid, same 8% green as the web draw().
    var gridLines = Path()
    for x in 0...SnakeEngine.gridCols {
      gridLines.move(to: CGPoint(x: Double(x) * Self.cell + 0.5, y: 0))
      gridLines.addLine(to: CGPoint(x: Double(x) * Self.cell + 0.5, y: Self.boardHeight))
    }
    for y in 0...SnakeEngine.gridRows {
      gridLines.move(to: CGPoint(x: 0, y: Double(y) * Self.cell + 0.5))
      gridLines.addLine(to: CGPoint(x: Self.boardWidth, y: Double(y) * Self.cell + 0.5))
    }
    context.stroke(gridLines, with: .color(Self.green.opacity(0.08)), lineWidth: 1)

    // Food emoji at its cell center, sized like the web (CELL - 4).
    context.draw(
      Text(engine.food.kind).font(.system(size: Self.cell - 4)),
      at: CGPoint(
        x: Double(engine.food.x) * Self.cell + Self.cell / 2,
        y: Double(engine.food.y) * Self.cell + Self.cell / 2 + 1
      ),
      anchor: .center
    )

    drawSnake(context, engine: engine)
    drawScanlines(context)

    if engine.isOver {
      drawOverlay(
        context,
        title: "SYSTEM CRASH",
        titleColor: Self.amber,
        lines: [
          "SCORE \(paddedScore(engine.score))",
          "TAP GRID OR PRESS NEW GAME",
        ]
      )
    } else if isPaused {
      drawOverlay(context, title: "PAUSED", titleColor: Self.amber, lines: [])
    }
  }

  /// Native-only HUD strip: the web page shows these readouts in its side
  /// panels, which have no room on a phone.
  private func drawHud(_ context: GraphicsContext) {
    let engine = session.engine
    let midY = Self.hudHeight / 2
    context.draw(
      hudText("SCORE \(paddedScore(engine.score))", color: Self.green),
      at: CGPoint(x: 12, y: midY),
      anchor: .leading
    )
    context.draw(
      hudText("HI \(paddedScore(max(session.bestScore, engine.score)))", color: Self.greenDim),
      at: CGPoint(x: Self.totalWidth / 2, y: midY),
      anchor: .center
    )
    context.draw(
      hudText("LV \(String(format: "%02d", engine.level))", color: Self.green),
      at: CGPoint(x: Self.totalWidth - 12, y: midY),
      anchor: .trailing
    )

    var divider = Path()
    divider.move(to: CGPoint(x: 0, y: Self.hudHeight - 0.5))
    divider.addLine(to: CGPoint(x: Self.totalWidth, y: Self.hudHeight - 0.5))
    context.stroke(divider, with: .color(Self.greenDim), lineWidth: 1)
  }

  /// Glowing rounded segments with the bot face on the head, matching the web
  /// draw() geometry (insets, corner radii, eye/mouth rects). The web's
  /// canvas shadowBlur glow is approximated with a translucent halo.
  private func drawSnake(_ context: GraphicsContext, engine: SnakeEngine) {
    for (index, segment) in engine.snake.enumerated() {
      let isHead = index == 0
      let inset: Double = isHead ? 1 : 2
      let originX = Double(segment.x) * Self.cell
      let originY = Double(segment.y) * Self.cell

      if isHead {
        context.fill(
          Path(
            roundedRect: CGRect(
              x: originX - 2, y: originY - 2, width: Self.cell + 4, height: Self.cell + 4
            ),
            cornerRadius: 9
          ),
          with: .color(Self.green.opacity(0.25))
        )
      }
      context.fill(
        Path(
          roundedRect: CGRect(
            x: originX + inset,
            y: originY + inset,
            width: Self.cell - inset * 2,
            height: Self.cell - inset * 2
          ),
          cornerRadius: isHead ? 7 : 8
        ),
        with: .color(isHead ? Self.greenSoft : Self.green)
      )

      if isHead {
        let cx = originX + Self.cell / 2
        let cy = originY + Self.cell / 2
        context.fill(
          Path(CGRect(x: cx - 6, y: cy - 3, width: 4, height: 4)), with: .color(Self.ink)
        )
        context.fill(
          Path(CGRect(x: cx + 2, y: cy - 3, width: 4, height: 4)), with: .color(Self.ink)
        )
        context.fill(
          Path(CGRect(x: cx - 4, y: cy + 3, width: 8, height: 2)), with: .color(Self.ink)
        )
      }
    }
  }

  /// CRT scanlines, the native stand-in for the web page's crtOverlay CSS.
  private func drawScanlines(_ context: GraphicsContext) {
    var lines = Path()
    var y: Double = 0
    while y < Self.boardHeight {
      lines.addRect(CGRect(x: 0, y: y, width: Self.boardWidth, height: 1))
      y += 3
    }
    context.fill(lines, with: .color(.white.opacity(0.03)))
  }

  private func drawOverlay(
    _ context: GraphicsContext,
    title: String,
    titleColor: Color,
    lines: [String]
  ) {
    context.fill(
      Path(CGRect(x: 0, y: 0, width: Self.boardWidth, height: Self.boardHeight)),
      with: .color(Self.ink.opacity(0.82))
    )
    context.draw(
      Text(title).font(.system(size: 52, weight: .bold, design: .monospaced))
        .foregroundStyle(titleColor),
      at: CGPoint(x: Self.boardWidth / 2, y: Self.boardHeight / 2 - 30),
      anchor: .center
    )
    for (index, line) in lines.enumerated() {
      context.draw(
        Text(line).font(.system(size: 22, weight: .semibold, design: .monospaced))
          .foregroundStyle(Self.green),
        at: CGPoint(x: Self.boardWidth / 2, y: Self.boardHeight / 2 + 20 + Double(index) * 34),
        anchor: .center
      )
    }
  }

  private func hudText(_ string: String, color: Color) -> Text {
    Text(string)
      .font(.system(size: 20, weight: .bold, design: .monospaced))
      .foregroundStyle(color)
  }

  private func paddedScore(_ score: Int) -> String {
    String(format: "%06d", score)
  }
}

import SwiftUI

/// Home surface for the `chimney` pack — the native twin of the web
/// `ChimneyPage`. Purely client-side: chimney projects have no backend, so
/// this view must never touch stores, components, or the network.
///
/// `TimelineView(.animation)` drives the frame clock and `Canvas` renders the
/// whole street (night sky, stars, moon, parallax skyline, row houses with
/// lit windows, brick chimneys with smoke, the robot runner, HUD, overlays)
/// exactly like the web version's <canvas>, so the per-frame simulation never
/// churns SwiftUI state.
///
/// Touch controls match the web's pointer handlers directly: press anywhere
/// on the street to jump, release to cut the hop short — a zero-distance
/// drag instead of a tap gesture so the release fires too (hold to jump
/// farther, exactly like the held key).
struct ChimneyGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  /// Reference-typed frame state so the render loop can mutate the engine
  /// without invalidating the SwiftUI view tree every frame.
  @State private var session = ChimneySession()
  @State private var isPaused = false
  @State private var isGameOver = false
  @State private var isJumpHeld = false
  @State private var bestScore = UserDefaults.standard.integer(forKey: ChimneyEngine.highScoreKey)

  var body: some View {
    VStack(spacing: theme.spacing.md) {
      Text("CHIMNEYBOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textPrimary)
        .padding(.top, theme.spacing.lg)

      HStack(spacing: theme.spacing.md) {
        Button {
          newGame()
        } label: {
          Label("Restart", systemImage: "arrow.counterclockwise")
        }
        .buttonStyle(ChimneyChunkyButtonStyle())

        Button {
          isPaused.toggle()
        } label: {
          Label(
            isPaused ? "Resume" : "Catch Breath",
            systemImage: isPaused ? "play.fill" : "pause.fill"
          )
        }
        .buttonStyle(ChimneyChunkyButtonStyle())
        .disabled(isGameOver)
      }

      ChimneyFieldView(
        session: session,
        isPaused: isPaused,
        bestScore: bestScore,
        onEnding: { score in
          isGameOver = true
          if score > bestScore {
            bestScore = score
            UserDefaults.standard.set(score, forKey: ChimneyEngine.highScoreKey)
          }
        }
      )
      .aspectRatio(ChimneyEngine.fieldWidth / ChimneyEngine.fieldHeight, contentMode: .fit)
      .padding(.horizontal, theme.spacing.md)
      // Press/release both matter (release cuts the jump), so a
      // zero-distance drag instead of a tap gesture.
      .gesture(
        DragGesture(minimumDistance: 0)
          .onChanged { _ in
            if !isJumpHeld {
              isJumpHeld = true
              session.engine.pressJump()
            }
          }
          .onEnded { _ in
            isJumpHeld = false
            session.engine.releaseJump()
          }
      )

      Text("Tap to jump · hold to jump farther · never land in a chimney")
        .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
        .foregroundStyle(theme.colors.textSecondary)

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
  }

  private func newGame() {
    session.engine.newGame()
    isPaused = false
    isGameOver = false
  }
}

/// Chunky retro button consistent with the web cabinet's toolbar buttons.
private struct ChimneyChunkyButtonStyle: ButtonStyle {
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

/// Frame-loop state that must survive view updates but must not trigger
/// them: the engine and the previous frame timestamp for dt computation.
final class ChimneySession {
  let engine = ChimneyEngine()
  var lastFrameTime: Date?

  init() {
    engine.newGame()
  }
}

/// The street: steps the engine each animation frame and draws it with the
/// web version's night palette (indigo sky, cream moon and stars, dark
/// facades with warm lit windows, brick chimneys, mint robot).
struct ChimneyFieldView: View {
  let session: ChimneySession
  let isPaused: Bool
  let bestScore: Int
  let onEnding: (Int) -> Void

  private static let skyTop = Color(hex: "#0a1030")
  private static let skyBottom = Color(hex: "#1a2247")
  private static let moonColor = Color(hex: "#fdf3c9")
  /// Facade palette cycled by house index — same as the web WALL_COLORS.
  private static let wallColors = [
    Color(hex: "#33405f"), Color(hex: "#3c3357"), Color(hex: "#2f4a55"), Color(hex: "#45384f"),
  ]
  private static let roofColor = Color(hex: "#1c2338")
  private static let brickColor = Color(hex: "#a2543c")
  private static let brickDarkColor = Color(hex: "#7c3f2d")
  private static let windowLitColor = Color(hex: "#ffd98a")
  private static let windowDarkColor = Color(hex: "#131a30")
  private static let robotColor = Color(hex: "#8df2b6")
  private static let hudAmber = Color(hex: "#ffbe55")
  private static let hudEmber = Color(hex: "#ff7761")
  private static let hudMint = Color(hex: "#8df2b6")
  private static let copyColor = Color(hex: "#dfe4ff")

  var body: some View {
    TimelineView(.animation(minimumInterval: 1 / 120, paused: isPaused)) { timeline in
      Canvas { context, size in
        stepEngine(now: timeline.date)
        draw(context: context, size: size)
      }
    }
    .background(Self.skyTop)
    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 12, style: .continuous)
        .stroke(Color(hex: "#2c3555"), lineWidth: 2)
    )
  }

  private func stepEngine(now: Date) {
    guard !isPaused, !session.engine.isOver else {
      session.lastFrameTime = nil
      return
    }
    // Clamp dt like the web loop so backgrounding never teleports the run.
    let dt: Double
    if let last = session.lastFrameTime {
      dt = min(0.05, now.timeIntervalSince(last))
    } else {
      dt = 0
    }
    session.lastFrameTime = now
    let events = session.engine.step(dt: dt)
    for event in events {
      switch event {
      case .cooked(let score), .fell(let score), .bonked(let score):
        onEnding(score)
      case .hop:
        break
      }
    }
  }

  private func draw(context: GraphicsContext, size: CGSize) {
    let engine = session.engine
    var context = context
    context.scaleBy(
      x: size.width / ChimneyEngine.fieldWidth,
      y: size.height / ChimneyEngine.fieldHeight
    )

    let fieldWidth = ChimneyEngine.fieldWidth
    let fieldHeight = ChimneyEngine.fieldHeight
    let camera = engine.playerWorldX - ChimneyEngine.playerX

    // Night sky.
    context.fill(
      Path(CGRect(x: 0, y: 0, width: fieldWidth, height: fieldHeight)),
      with: .linearGradient(
        Gradient(colors: [Self.skyTop, Self.skyBottom]),
        startPoint: CGPoint(x: 0, y: 0),
        endPoint: CGPoint(x: 0, y: fieldHeight)
      )
    )

    // Stars: fixed star field, slow parallax so pausing freezes it.
    let starColor = Self.moonColor.opacity(0.7)
    for index in 0..<40 {
      let raw = (Double(index) * 173 + 61 - camera * 0.08)
        .truncatingRemainder(dividingBy: fieldWidth)
      let starX = raw < 0 ? raw + fieldWidth : raw
      let starY = Double((index * 97 + 23) % 170)
      let starSize: Double = index % 5 == 0 ? 2 : 1
      context.fill(
        Path(CGRect(x: starX, y: starY, width: starSize, height: starSize)),
        with: .color(starColor)
      )
    }

    // Moon.
    context.drawLayer { layer in
      layer.addFilter(.shadow(color: Self.moonColor, radius: 12))
      layer.fill(
        Path(ellipseIn: CGRect(x: fieldWidth - 92 - 26, y: 66 - 26, width: 52, height: 52)),
        with: .color(Self.moonColor)
      )
    }

    // Distant skyline, half-speed parallax.
    let skylineColor = Color(hex: "#10162e").opacity(0.9)
    for index in 0..<12 {
      let towerWidth = Double(90 + (index % 4) * 34)
      let towerHeight = Double(70 + (index % 5) * 26)
      let raw = (Double(index) * 160 - camera * 0.4)
        .truncatingRemainder(dividingBy: fieldWidth + 240)
      let towerX = raw < -towerWidth ? raw + fieldWidth + 240 : raw
      context.fill(
        Path(CGRect(
          x: towerX - 120, y: fieldHeight - towerHeight - 60,
          width: towerWidth, height: towerHeight + 60
        )),
        with: .color(skylineColor)
      )
    }

    // Street glow at the bottom of the canyon.
    context.fill(
      Path(CGRect(x: 0, y: fieldHeight - 70, width: fieldWidth, height: 70)),
      with: .linearGradient(
        Gradient(colors: [Self.hudAmber.opacity(0), Self.hudAmber.opacity(0.22)]),
        startPoint: CGPoint(x: 0, y: fieldHeight - 70),
        endPoint: CGPoint(x: 0, y: fieldHeight)
      )
    )

    // Houses.
    for house in engine.houses {
      let screenX = house.x - camera
      if screenX > fieldWidth || screenX + house.width < 0 {
        continue
      }
      drawHouse(
        context: context,
        x: screenX,
        roofY: house.roofY,
        width: house.width,
        index: house.index,
        chimneyOffset: house.chimneyOffset,
        camera: camera
      )
    }

    // The runner robot.
    drawRunner(context: context, engine: engine)

    drawHud(context: context, engine: engine)

    if engine.isOver, let ending = engine.ending {
      drawGameOver(context: context, engine: engine, ending: ending)
    } else if isPaused {
      context.fill(
        Path(CGRect(x: 0, y: 0, width: fieldWidth, height: fieldHeight)),
        with: .color(Color(hex: "#04060c").opacity(0.6))
      )
      drawCenteredText(
        context, text: "CATCHING BREATH", size: 30, weight: .bold,
        color: Self.hudAmber, at: CGPoint(x: fieldWidth / 2, y: fieldHeight / 2)
      )
    }
  }

  /// One row house: facade, roof cap, deterministic window grid (most lit
  /// warm, some dark), and the chimney with its opening and smoke puffs.
  private func drawHouse(
    context: GraphicsContext,
    x: Double,
    roofY: Double,
    width: Double,
    index: Int,
    chimneyOffset: Double?,
    camera: Double
  ) {
    let fieldHeight = ChimneyEngine.fieldHeight

    // Facade.
    context.fill(
      Path(CGRect(x: x, y: roofY, width: width, height: fieldHeight - roofY)),
      with: .color(Self.wallColors[index % Self.wallColors.count])
    )

    // Roof cap.
    context.fill(
      Path(CGRect(x: x - 3, y: roofY - 6, width: width + 6, height: 8)),
      with: .color(Self.roofColor)
    )

    // Windows: a deterministic grid, most lit warm, some dark.
    let cols = max(1, Int((width - 24) / 42))
    let rows = max(1, Int((fieldHeight - roofY - 30) / 52))
    for row in 0..<rows {
      for col in 0..<cols {
        let lit = (index * 7 + row * 3 + col * 5) % 4 != 0
        context.fill(
          Path(CGRect(
            x: x + 14 + Double(col) * 42, y: roofY + 18 + Double(row) * 52,
            width: 20, height: 26
          )),
          with: .color(lit ? Self.windowLitColor : Self.windowDarkColor)
        )
      }
    }

    // Chimney with its dark opening and a drifting smoke puff.
    if let chimneyOffset {
      let chimneyX = x + chimneyOffset
      let chimneyTop = roofY - ChimneyEngine.chimneyHeight
      context.fill(
        Path(CGRect(
          x: chimneyX, y: chimneyTop,
          width: ChimneyEngine.chimneyWidth, height: ChimneyEngine.chimneyHeight
        )),
        with: .color(Self.brickColor)
      )
      context.fill(
        Path(CGRect(
          x: chimneyX - 2, y: chimneyTop, width: ChimneyEngine.chimneyWidth + 4, height: 5
        )),
        with: .color(Self.brickDarkColor)
      )
      // The opening — the part that cooks you.
      context.fill(
        Path(CGRect(
          x: chimneyX + ChimneyEngine.chimneyLip, y: chimneyTop + 2,
          width: ChimneyEngine.chimneyWidth - ChimneyEngine.chimneyLip * 2, height: 6
        )),
        with: .color(Color(hex: "#0a0d18"))
      )

      // Smoke drifts on world position so it freezes when paused.
      let drift = (chimneyX + camera) * 0.7
      let smokeColor = Self.copyColor.opacity(0.28)
      for puff in 0..<3 {
        let wobble = sin((drift + Double(puff) * 40) / 26) * 6
        let radius = 5 + Double(puff) * 2
        context.fill(
          Path(ellipseIn: CGRect(
            x: chimneyX + ChimneyEngine.chimneyWidth / 2 + wobble - radius,
            y: chimneyTop - 12 - Double(puff) * 16 - radius,
            width: radius * 2, height: radius * 2
          )),
          with: .color(smokeColor)
        )
      }
    }
  }

  /// The mint robot: glowing body and head, eye looking ahead, legs that
  /// tuck mid-air or alternate stride from world distance.
  private func drawRunner(context: GraphicsContext, engine: ChimneyEngine) {
    let x = ChimneyEngine.playerX
    let y = engine.playerY
    let playerWidth = ChimneyEngine.playerWidth
    let playerHeight = ChimneyEngine.playerHeight

    context.drawLayer { layer in
      layer.addFilter(.shadow(color: Self.robotColor, radius: 5))
      // Body.
      layer.fill(
        Path(CGRect(x: x, y: y + 8, width: playerWidth, height: playerHeight - 14)),
        with: .color(Self.robotColor)
      )
      // Head.
      layer.fill(
        Path(CGRect(x: x + 3, y: y, width: playerWidth - 6, height: 10)),
        with: .color(Self.robotColor)
      )
    }
    // Eye, looking ahead.
    context.fill(
      Path(CGRect(x: x + playerWidth - 10, y: y + 3, width: 5, height: 4)),
      with: .color(Color(hex: "#08130f"))
    )
    // Legs: mid-air tuck vs alternating stride from world distance.
    if engine.velocityY != 0 {
      context.fill(
        Path(CGRect(x: x + 3, y: y + playerHeight - 6, width: 8, height: 6)),
        with: .color(Self.robotColor)
      )
      context.fill(
        Path(CGRect(x: x + playerWidth - 11, y: y + playerHeight - 8, width: 8, height: 6)),
        with: .color(Self.robotColor)
      )
    } else {
      let stride = Int(floor(engine.playerWorldX / 18)) % 2 == 0
      context.fill(
        Path(CGRect(x: x + (stride ? 2 : 6), y: y + playerHeight - 6, width: 7, height: 6)),
        with: .color(Self.robotColor)
      )
      context.fill(
        Path(CGRect(
          x: x + (stride ? playerWidth - 9 : playerWidth - 13),
          y: y + playerHeight - 6, width: 7, height: 6
        )),
        with: .color(Self.robotColor)
      )
    }
  }

  /// Houses (top-left), best run (top-center) and pace (top-right) — the
  /// canvas stand-in for the web's Run Log side panel.
  private func drawHud(context: GraphicsContext, engine: ChimneyEngine) {
    context.draw(
      Text("HOUSES \(paddedScore(engine.housesCleared))")
        .font(.system(size: 17, weight: .bold, design: .monospaced))
        .foregroundStyle(Self.hudAmber),
      at: CGPoint(x: 14, y: 22),
      anchor: .leading
    )
    drawCenteredText(
      context, text: "BEST \(paddedScore(max(bestScore, engine.housesCleared)))",
      size: 17, weight: .bold,
      color: Self.hudMint, at: CGPoint(x: ChimneyEngine.fieldWidth / 2, y: 22)
    )
    context.draw(
      Text("PACE \(Int(engine.speed.rounded())) U/S")
        .font(.system(size: 17, weight: .bold, design: .monospaced))
        .foregroundStyle(Self.hudEmber),
      at: CGPoint(x: ChimneyEngine.fieldWidth - 14, y: 22),
      anchor: .trailing
    )
  }

  /// The ending card — same titles and copy as the web modal, drawn on the
  /// canvas like Race's "WRECKED" overlay.
  private func drawGameOver(
    context: GraphicsContext,
    engine: ChimneyEngine,
    ending: ChimneyEnding
  ) {
    let fieldWidth = ChimneyEngine.fieldWidth
    let fieldHeight = ChimneyEngine.fieldHeight
    let centerX = fieldWidth / 2
    context.fill(
      Path(CGRect(x: 0, y: 0, width: fieldWidth, height: fieldHeight)),
      with: .color(Color(hex: "#04060c").opacity(0.82))
    )

    let title: String
    let lines: [String]
    switch ending {
    case .cooked:
      title = "YOU GOT COOKED"
      lines = [
        "Straight down the chimney and onto the family's",
        "dinner stove. Tonight's special: you.",
      ]
    case .fell:
      title = "YOU FELL"
      lines = [
        "You missed the next roof and dropped into the alley.",
        "The street is not a house.",
      ]
    case .bonked:
      title = "BONKED"
      lines = [
        "Face first into the bricks.",
        "The chimney won that one.",
      ]
    }

    if ending == .cooked {
      drawCenteredText(
        context, text: "🏠🔥🍲", size: 30, weight: .bold,
        color: Self.moonColor, at: CGPoint(x: centerX, y: fieldHeight / 2 - 96)
      )
    }
    drawCenteredText(
      context, text: title, size: 32, weight: .bold,
      color: Self.hudEmber, at: CGPoint(x: centerX, y: fieldHeight / 2 - 52)
    )
    for (index, line) in lines.enumerated() {
      drawCenteredText(
        context, text: line, size: 13, weight: .regular,
        color: Self.copyColor,
        at: CGPoint(x: centerX, y: fieldHeight / 2 - 10 + Double(index) * 20)
      )
    }
    drawCenteredText(
      context, text: "HOUSES CLEARED \(paddedScore(engine.score))", size: 15, weight: .semibold,
      color: Self.hudMint, at: CGPoint(x: centerX, y: fieldHeight / 2 + 48)
    )
    let recordLine = engine.score >= bestScore && engine.score > 0
      ? "★ NEW NEIGHBORHOOD RECORD ★"
      : "BEST \(paddedScore(max(bestScore, engine.score)))"
    drawCenteredText(
      context, text: recordLine, size: 14, weight: .semibold,
      color: engine.score >= bestScore && engine.score > 0 ? Self.hudMint : Self.hudAmber,
      at: CGPoint(x: centerX, y: fieldHeight / 2 + 80)
    )
  }

  private func paddedScore(_ score: Int) -> String {
    String(format: "%06d", score)
  }

  private func drawCenteredText(
    _ context: GraphicsContext,
    text: String,
    size: CGFloat,
    weight: Font.Weight,
    color: Color,
    at point: CGPoint
  ) {
    context.draw(
      Text(text)
        .font(.system(size: size, weight: weight, design: .monospaced))
        .foregroundStyle(color),
      at: point,
      anchor: .center
    )
  }
}

import SwiftUI

/// Home surface for the `race` pack — the native twin of the web `RacePage`.
/// Purely client-side: race projects have no backend, so this view must never
/// touch stores, components, or the network.
///
/// `TimelineView(.animation)` drives the frame clock and `Canvas` renders the
/// whole road (asphalt, rumble strips, lane dashes, traffic, player car,
/// HUD, overlays) exactly like the web version's <canvas>, so the per-frame
/// simulation never churns SwiftUI state.
///
/// Touch controls (an intentional divergence from the web's keyboard): the
/// web taps ←/→ to change lane and holds ↑/Shift for nitro, so the natural
/// touch translation is two tap pads for steering plus one hold pad for
/// nitro. Tap pads (not swipes) because a lane change is a discrete input
/// the engine consumes instantly; the nitro pad is hold-to-activate because
/// the gauge drains while held, exactly like the held key.
struct RaceGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  /// Reference-typed frame state so the render loop can mutate the engine
  /// without invalidating the SwiftUI view tree every frame.
  @State private var session = RaceSession()
  @State private var isPaused = false
  @State private var isGameOver = false
  @State private var bestScore = UserDefaults.standard.integer(forKey: RaceEngine.highScoreKey)

  var body: some View {
    VStack(spacing: theme.spacing.md) {
      Text("RACEBOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textPrimary)
        .padding(.top, theme.spacing.lg)

      HStack(spacing: theme.spacing.md) {
        Button {
          newGame()
        } label: {
          Label("Restart", systemImage: "arrow.counterclockwise")
        }
        .buttonStyle(RaceChunkyButtonStyle())

        Button {
          isPaused.toggle()
        } label: {
          Label(isPaused ? "Resume" : "Pit Stop", systemImage: isPaused ? "play.fill" : "pause.fill")
        }
        .buttonStyle(RaceChunkyButtonStyle())
        .disabled(isGameOver)
      }

      RaceFieldView(
        session: session,
        isPaused: isPaused,
        bestScore: bestScore,
        onCrash: { score in
          isGameOver = true
          if score > bestScore {
            bestScore = score
            UserDefaults.standard.set(score, forKey: RaceEngine.highScoreKey)
          }
        }
      )
      .aspectRatio(RaceEngine.fieldWidth / RaceEngine.fieldHeight, contentMode: .fit)
      .padding(.horizontal, theme.spacing.md)

      touchControls

      Text("Tap ◀ ▶ to change lane · hold NITRO to burn · every overtake +50")
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

  /// Steering taps on the left thumb, the nitro hold pad on the right.
  private var touchControls: some View {
    HStack(spacing: theme.spacing.md) {
      HStack(spacing: theme.spacing.sm) {
        RaceTapPad(systemImage: "arrow.left") {
          session.engine.steerLeft()
        }
        RaceTapPad(systemImage: "arrow.right") {
          session.engine.steerRight()
        }
      }
      Spacer(minLength: theme.spacing.md)
      RaceHoldPad(systemImage: "flame.fill") { pressed in
        session.engine.isBoosting = pressed
      }
    }
    .padding(.horizontal, theme.spacing.lg)
  }
}

/// Chunky retro button consistent with the web cockpit's toolbar buttons.
private struct RaceChunkyButtonStyle: ButtonStyle {
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

/// A discrete tap pad: one lane change per touch-down.
private struct RaceTapPad: View {
  @Environment(\.uiThemeTokens) private var theme
  let systemImage: String
  let onTap: () -> Void

  @State private var isHeld = false

  var body: some View {
    Image(systemName: systemImage)
      .font(.system(size: 24, weight: .bold))
      .foregroundStyle(theme.colors.textPrimary)
      .frame(width: 64, height: 64)
      .background(
        Circle()
          .fill(isHeld ? theme.colors.hover : theme.colors.surfaceAlt)
          .overlay(Circle().stroke(theme.colors.border, lineWidth: 1))
      )
      .gesture(
        DragGesture(minimumDistance: 0)
          .onChanged { _ in
            if !isHeld {
              isHeld = true
              onTap()
            }
          }
          .onEnded { _ in
            isHeld = false
          }
      )
  }
}

/// A hold-to-activate pad (press and release both matter) for the nitro
/// pedal. Zero-distance drag instead of `Button` so the release fires too.
private struct RaceHoldPad: View {
  @Environment(\.uiThemeTokens) private var theme
  let systemImage: String
  let onPress: (Bool) -> Void

  @State private var isHeld = false

  var body: some View {
    Image(systemName: systemImage)
      .font(.system(size: 24, weight: .bold))
      .foregroundStyle(theme.colors.textPrimary)
      .frame(width: 84, height: 64)
      .background(
        Capsule()
          .fill(isHeld ? theme.colors.hover : theme.colors.surfaceAlt)
          .overlay(Capsule().stroke(theme.colors.border, lineWidth: 1))
      )
      .gesture(
        DragGesture(minimumDistance: 0)
          .onChanged { _ in
            if !isHeld {
              isHeld = true
              onPress(true)
            }
          }
          .onEnded { _ in
            isHeld = false
            onPress(false)
          }
      )
  }
}

/// Frame-loop state that must survive view updates but must not trigger
/// them: the engine and the previous frame timestamp for dt computation.
final class RaceSession {
  let engine = RaceEngine()
  var lastFrameTime: Date?
}

/// The road: steps the engine each animation frame and draws it with the
/// web version's neon night palette (dark asphalt, pink/white rumble
/// strips, cyan player car, warm nitro flame).
struct RaceFieldView: View {
  let session: RaceSession
  let isPaused: Bool
  let bestScore: Int
  let onCrash: (Int) -> Void

  private static let grassColor = Color(hex: "#08130a")
  private static let asphaltColor = Color(hex: "#14141d")
  private static let laneDashColor = Color(hex: "#3c3c52")
  private static let rumblePink = Color(hex: "#ff6b81")
  private static let rumbleWhite = Color(hex: "#f4f4f8")
  private static let playerColor = Color(hex: "#57c8ff")
  private static let nitroColor = Color(hex: "#ffb347")
  private static let hudAmber = Color(hex: "#ffd166")
  private static let hudGreen = Color(hex: "#7cf29c")
  /// Traffic paint jobs by `kind` — same palette as the web TRAFFIC_COLORS.
  private static let trafficColors = [
    Color(hex: "#ff6b81"), Color(hex: "#ffd166"), Color(hex: "#b98cff"), Color(hex: "#7cf29c"),
  ]

  var body: some View {
    TimelineView(.animation(minimumInterval: 1 / 120, paused: isPaused)) { timeline in
      Canvas { context, size in
        stepEngine(now: timeline.date)
        draw(context: context, size: size)
      }
    }
    .background(Self.grassColor)
    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 12, style: .continuous)
        .stroke(Color(hex: "#3c2454"), lineWidth: 2)
    )
  }

  private func stepEngine(now: Date) {
    guard !isPaused, !session.engine.isOver else {
      session.lastFrameTime = nil
      return
    }
    // Clamp dt like the web loop so backgrounding never teleports traffic.
    let dt: Double
    if let last = session.lastFrameTime {
      dt = min(0.05, now.timeIntervalSince(last))
    } else {
      dt = 0
    }
    session.lastFrameTime = now
    let events = session.engine.step(dt: dt)
    for case .crash(let score) in events {
      onCrash(score)
    }
  }

  private func draw(context: GraphicsContext, size: CGSize) {
    let engine = session.engine
    var context = context
    context.scaleBy(
      x: size.width / RaceEngine.fieldWidth,
      y: size.height / RaceEngine.fieldHeight
    )

    let fieldWidth = RaceEngine.fieldWidth
    let fieldHeight = RaceEngine.fieldHeight
    context.fill(
      Path(CGRect(x: 0, y: 0, width: fieldWidth, height: fieldHeight)),
      with: .color(Self.grassColor)
    )
    context.fill(
      Path(CGRect(x: RaceEngine.roadLeft, y: 0, width: RaceEngine.roadWidth, height: fieldHeight)),
      with: .color(Self.asphaltColor)
    )

    // Everything painted on the road scrolls by total distance traveled.
    let scroll = engine.distanceMeters * RaceEngine.unitsPerMeter

    // Rumble strips on both road edges.
    let stripePeriod: Double = 48
    let stripeOffset = scroll.truncatingRemainder(dividingBy: stripePeriod)
    var y = -stripePeriod
    var stripeIndex = 0
    while y < fieldHeight + stripePeriod {
      let color = stripeIndex % 2 == 0 ? Self.rumblePink : Self.rumbleWhite
      let stripeY = y + stripeOffset
      context.fill(
        Path(CGRect(x: RaceEngine.roadLeft - 10, y: stripeY, width: 10, height: stripePeriod / 2)),
        with: .color(color)
      )
      context.fill(
        Path(CGRect(
          x: RaceEngine.roadLeft + RaceEngine.roadWidth, y: stripeY,
          width: 10, height: stripePeriod / 2
        )),
        with: .color(color)
      )
      y += stripePeriod
      stripeIndex += 1
    }

    // Dashed lane dividers.
    let dashPeriod: Double = 68
    let dashOffset = scroll.truncatingRemainder(dividingBy: dashPeriod)
    for lane in 1..<RaceEngine.laneCount {
      let x = RaceEngine.roadLeft + RaceEngine.laneWidth * Double(lane)
      var dashY = -dashPeriod
      while dashY < fieldHeight + dashPeriod {
        context.fill(
          Path(CGRect(x: x - 3, y: dashY + dashOffset, width: 6, height: 40)),
          with: .color(Self.laneDashColor)
        )
        dashY += dashPeriod
      }
    }

    // Traffic (tail lights face the player — everyone drives the same way).
    for car in engine.traffic {
      drawCar(
        context: context,
        centerX: car.x,
        topY: car.y,
        color: Self.trafficColors[car.kind % Self.trafficColors.count],
        isPlayer: false
      )
    }

    // Player car with the nitro flame behind the rear bumper.
    if engine.isNitroActive {
      var flame = Path()
      flame.move(to: CGPoint(x: engine.playerX - 10, y: RaceEngine.playerY + RaceEngine.carLength - 4))
      flame.addLine(to: CGPoint(
        x: engine.playerX,
        y: RaceEngine.playerY + RaceEngine.carLength + 26
          + scroll.truncatingRemainder(dividingBy: 9)
      ))
      flame.addLine(to: CGPoint(x: engine.playerX + 10, y: RaceEngine.playerY + RaceEngine.carLength - 4))
      flame.closeSubpath()
      context.drawLayer { layer in
        layer.addFilter(.shadow(color: Self.nitroColor, radius: 8))
        layer.fill(flame, with: .color(Self.nitroColor))
      }
    }
    drawCar(
      context: context,
      centerX: engine.playerX,
      topY: RaceEngine.playerY,
      color: Self.playerColor,
      isPlayer: true
    )

    drawHud(context: context, engine: engine)

    if engine.isOver {
      context.fill(
        Path(CGRect(x: 0, y: 0, width: fieldWidth, height: fieldHeight)),
        with: .color(Self.grassColor.opacity(0.8))
      )
      drawCenteredText(
        context, text: "WRECKED", size: 40, weight: .bold,
        color: Self.rumblePink, at: CGPoint(x: fieldWidth / 2, y: fieldHeight / 2 - 40)
      )
      drawCenteredText(
        context, text: "FINAL SCORE \(paddedScore(engine.score))", size: 18, weight: .semibold,
        color: Self.hudGreen, at: CGPoint(x: fieldWidth / 2, y: fieldHeight / 2 + 8)
      )
      let recordLine = engine.score >= bestScore && engine.score > 0
        ? "★ NEW LAP RECORD ★"
        : "BEST \(paddedScore(max(bestScore, engine.score)))"
      drawCenteredText(
        context, text: recordLine, size: 15, weight: .semibold,
        color: Self.hudAmber, at: CGPoint(x: fieldWidth / 2, y: fieldHeight / 2 + 42)
      )
    } else if isPaused {
      context.fill(
        Path(CGRect(x: 0, y: 0, width: fieldWidth, height: fieldHeight)),
        with: .color(Self.grassColor.opacity(0.6))
      )
      drawCenteredText(
        context, text: "PIT STOP", size: 34, weight: .bold,
        color: Self.hudAmber, at: CGPoint(x: fieldWidth / 2, y: fieldHeight / 2)
      )
    }
  }

  /// One car: glowing rounded body, cabin glass, and head/tail lights.
  private func drawCar(
    context: GraphicsContext,
    centerX: Double,
    topY: Double,
    color: Color,
    isPlayer: Bool
  ) {
    let left = centerX - RaceEngine.carWidth / 2
    let body = Path(
      roundedRect: CGRect(x: left, y: topY, width: RaceEngine.carWidth, height: RaceEngine.carLength),
      cornerRadius: 12
    )
    context.drawLayer { layer in
      layer.addFilter(.shadow(color: color, radius: 7))
      layer.fill(body, with: .color(color))
    }

    // Cabin glass.
    let cabinY = topY + (isPlayer ? 18 : RaceEngine.carLength - 52)
    context.fill(
      Path(
        roundedRect: CGRect(x: left + 8, y: cabinY, width: RaceEngine.carWidth - 16, height: 34),
        cornerRadius: 7
      ),
      with: .color(Color(hex: "#080a12").opacity(0.78))
    )

    // Player shows headlights up the road; traffic shows tail lights.
    let lightColor = isPlayer ? Color(hex: "#fdf6c9") : Color(hex: "#ff3b30")
    let lightY = isPlayer ? topY + 2 : topY + RaceEngine.carLength - 6
    context.fill(
      Path(CGRect(x: left + 6, y: lightY, width: 12, height: 4)),
      with: .color(lightColor)
    )
    context.fill(
      Path(CGRect(x: left + RaceEngine.carWidth - 18, y: lightY, width: 12, height: 4)),
      with: .color(lightColor)
    )
  }

  /// Score (top-left), speed (top-center) and the nitro gauge (top-right) —
  /// the canvas stand-in for the web's pit-wall side panels.
  private func drawHud(context: GraphicsContext, engine: RaceEngine) {
    context.draw(
      Text("SCORE \(paddedScore(engine.score))")
        .font(.system(size: 17, weight: .bold, design: .monospaced))
        .foregroundStyle(Self.hudGreen),
      at: CGPoint(x: 14, y: 22),
      anchor: .leading
    )
    let kph = Int((engine.effectiveSpeed / RaceEngine.unitsPerMeter * 3.6).rounded())
    drawCenteredText(
      context, text: "\(kph) KM/H", size: 17, weight: .bold,
      color: Self.hudAmber, at: CGPoint(x: RaceEngine.fieldWidth / 2, y: 22)
    )
    // Nitro gauge.
    let gaugeWidth: Double = 70
    let gaugeX = RaceEngine.fieldWidth - gaugeWidth - 14
    context.stroke(
      Path(CGRect(x: gaugeX, y: 14, width: gaugeWidth, height: 12)),
      with: .color(Self.nitroColor),
      lineWidth: 1.5
    )
    context.fill(
      Path(CGRect(x: gaugeX + 2, y: 16, width: (gaugeWidth - 4) * engine.nitro, height: 8)),
      with: .color(Self.nitroColor)
    )
  }

  private func paddedScore(_ score: Int) -> String {
    String(format: "%08d", score)
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

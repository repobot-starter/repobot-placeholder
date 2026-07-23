import SwiftUI

/// Home surface for the `pong` pack — the native twin of the web `PongPage`.
/// Purely client-side: pong projects have no backend, so this view must never
/// touch stores, components, or the network.
///
/// `TimelineView(.animation)` drives the frame clock and `Canvas` renders the
/// whole playfield (scores, paddles, ball, overlays) exactly like the web
/// version's <canvas>, so the per-frame simulation never churns SwiftUI state.
struct PongGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  /// Reference-typed frame state so the render loop can mutate the engine
  /// without invalidating the SwiftUI view tree every frame.
  @State private var session = PongSession()
  @State private var difficulty: PongDifficulty = .hard
  @State private var isPaused = false

  var body: some View {
    VStack(spacing: theme.spacing.lg) {
      Text("PONGBOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textPrimary)
        .padding(.top, theme.spacing.lg)

      PongFieldView(session: session, isPaused: isPaused)
        .aspectRatio(PongEngine.fieldWidth / PongEngine.fieldHeight, contentMode: .fit)
        .padding(.horizontal, theme.spacing.md)

      controls

      Text("Drag on the field to move your paddle · First to 7 wins")
        .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
        .foregroundStyle(theme.colors.textSecondary)

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
    .onChange(of: difficulty) { _, newValue in
      session.engine.difficulty = newValue
    }
  }

  private var controls: some View {
    VStack(spacing: theme.spacing.md) {
      HStack(spacing: theme.spacing.md) {
        Button {
          session.engine.newGame()
          isPaused = false
        } label: {
          Label("New Game", systemImage: "arrow.counterclockwise")
        }
        .buttonStyle(PongChunkyButtonStyle())

        Button {
          isPaused.toggle()
        } label: {
          Label(isPaused ? "Resume" : "Pause", systemImage: isPaused ? "play.fill" : "pause.fill")
        }
        .buttonStyle(PongChunkyButtonStyle())
      }

      Picker("Difficulty", selection: $difficulty) {
        ForEach(PongDifficulty.allCases) { level in
          Text(level.rawValue.capitalized).tag(level)
        }
      }
      .pickerStyle(.segmented)
      .padding(.horizontal, theme.spacing.md)
    }
  }
}

/// Chunky retro button consistent with the web page's toolbar buttons.
private struct PongChunkyButtonStyle: ButtonStyle {
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

/// Frame-loop state that must survive view updates but must not trigger them:
/// the engine itself and the previous frame timestamp for dt computation.
final class PongSession {
  let engine = PongEngine()
  var lastFrameTime: Date?
}

/// The playfield: steps the engine each animation frame and draws it with the
/// web version's retro palette (dark field, cyan/violet paddles, white ball,
/// dashed center line). Drag anywhere on the field to steer the left paddle.
struct PongFieldView: View {
  let session: PongSession
  let isPaused: Bool

  var body: some View {
    GeometryReader { proxy in
      let scale = proxy.size.width / PongEngine.fieldWidth

      TimelineView(.animation(minimumInterval: 1 / 120, paused: isPaused)) { timeline in
        Canvas { context, size in
          stepEngine(now: timeline.date)
          draw(context: context, size: size)
        }
      }
      .gesture(
        DragGesture(minimumDistance: 0)
          .onChanged { value in
            // Map the touch back into field coordinates. The finger sets a
            // target; the engine chases it at the fixed paddle speed.
            session.engine.playerTargetY = value.location.y / scale
          }
      )
    }
    .background(Color(hex: "#0a0a0f"))
    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 12, style: .continuous)
        .stroke(Color(hex: "#2a3550"), lineWidth: 2)
    )
  }

  private func stepEngine(now: Date) {
    guard !isPaused else {
      session.lastFrameTime = nil
      return
    }
    // Clamp dt like the web loop so backgrounding never teleports the ball.
    let dt: Double
    if let last = session.lastFrameTime {
      dt = min(0.05, now.timeIntervalSince(last))
    } else {
      dt = 0
    }
    session.lastFrameTime = now
    _ = session.engine.step(dt: dt)
  }

  private func draw(context: GraphicsContext, size: CGSize) {
    let engine = session.engine
    var context = context
    context.scaleBy(x: size.width / PongEngine.fieldWidth, y: size.height / PongEngine.fieldHeight)

    let fieldWidth = PongEngine.fieldWidth
    let fieldHeight = PongEngine.fieldHeight
    let playerColor = Color(hex: "#57c8ff")
    let botColor = Color(hex: "#a98ffb")

    context.fill(
      Path(CGRect(x: 0, y: 0, width: fieldWidth, height: fieldHeight)),
      with: .color(Color(hex: "#0a0a0f"))
    )

    // Center dashed line
    var centerLine = Path()
    centerLine.move(to: CGPoint(x: fieldWidth / 2, y: 10))
    centerLine.addLine(to: CGPoint(x: fieldWidth / 2, y: fieldHeight - 10))
    context.stroke(
      centerLine,
      with: .color(Color(hex: "#8c96ff").opacity(0.5)),
      style: StrokeStyle(lineWidth: 3, dash: [10, 14])
    )

    // Scores
    drawCenteredText(
      context, text: scoreText(engine.leftScore), size: 52, weight: .bold,
      color: playerColor, at: CGPoint(x: fieldWidth * 0.3, y: 55)
    )
    drawCenteredText(
      context, text: scoreText(engine.rightScore), size: 52, weight: .bold,
      color: botColor, at: CGPoint(x: fieldWidth * 0.7, y: 55)
    )
    drawCenteredText(
      context, text: "PLAYER", size: 14, weight: .semibold,
      color: playerColor, at: CGPoint(x: fieldWidth * 0.3, y: 20)
    )
    drawCenteredText(
      context, text: "BOT", size: 14, weight: .semibold,
      color: botColor, at: CGPoint(x: fieldWidth * 0.7, y: 20)
    )

    // Paddles
    context.fill(
      Path(CGRect(
        x: PongEngine.paddleMargin,
        y: engine.leftPaddleY - PongEngine.paddleHeight / 2,
        width: PongEngine.paddleWidth,
        height: PongEngine.paddleHeight
      )),
      with: .color(playerColor)
    )
    context.fill(
      Path(CGRect(
        x: fieldWidth - PongEngine.paddleMargin - PongEngine.paddleWidth,
        y: engine.rightPaddleY - PongEngine.paddleHeight / 2,
        width: PongEngine.paddleWidth,
        height: PongEngine.paddleHeight
      )),
      with: .color(botColor)
    )

    // Ball with a short motion trail
    let ball = engine.ball
    let trailRadius = PongEngine.ballSize / 2.6
    context.fill(
      Path(ellipseIn: CGRect(
        x: ball.x - ball.vx * 14 - trailRadius,
        y: ball.y - ball.vy * 14 - trailRadius,
        width: trailRadius * 2,
        height: trailRadius * 2
      )),
      with: .color(.white.opacity(0.25))
    )
    context.fill(
      Path(ellipseIn: CGRect(
        x: ball.x - PongEngine.ballSize / 2,
        y: ball.y - PongEngine.ballSize / 2,
        width: PongEngine.ballSize,
        height: PongEngine.ballSize
      )),
      with: .color(.white)
    )

    if let winner = engine.winner {
      context.fill(
        Path(CGRect(x: 0, y: 0, width: fieldWidth, height: fieldHeight)),
        with: .color(Color(hex: "#0a0a0f").opacity(0.75))
      )
      drawCenteredText(
        context, text: winner == .left ? "PLAYER WINS" : "BOT WINS", size: 40, weight: .bold,
        color: Color(hex: "#7cf29c"), at: CGPoint(x: fieldWidth / 2, y: fieldHeight / 2 - 20)
      )
      drawCenteredText(
        context, text: "PRESS NEW GAME", size: 16, weight: .semibold,
        color: Color(hex: "#7cf29c"), at: CGPoint(x: fieldWidth / 2, y: fieldHeight / 2 + 25)
      )
    } else if isPaused {
      context.fill(
        Path(CGRect(x: 0, y: 0, width: fieldWidth, height: fieldHeight)),
        with: .color(Color(hex: "#0a0a0f").opacity(0.6))
      )
      drawCenteredText(
        context, text: "PAUSED", size: 36, weight: .bold,
        color: Color(hex: "#ffd166"), at: CGPoint(x: fieldWidth / 2, y: fieldHeight / 2)
      )
    }
  }

  private func scoreText(_ score: Int) -> String {
    String(format: "%02d", score)
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

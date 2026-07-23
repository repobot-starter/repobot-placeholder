import SwiftUI

/// Home surface for the `astro` pack — the native twin of the web `AstroPage`.
/// Purely client-side: astro projects have no backend, so this view must never
/// touch stores, components, or the network.
///
/// `TimelineView(.animation)` drives the frame clock and `Canvas` renders the
/// whole playfield (starfield, rocks, ship, HUD, overlays) exactly like the
/// web version's <canvas>, so the per-frame simulation never churns SwiftUI
/// state.
///
/// Touch controls (an intentional divergence from the web's keyboard): the
/// web maps ←/→/↑/space to held keys, so the natural touch translation is
/// four hold-to-activate pads — ◀ ▶ turn pads on the left, THRUST and FIRE
/// on the right. Pads were chosen over a virtual stick because the ship only
/// has three digital inputs (turn is a fixed rate, thrust is on/off); a
/// stick would fake analog control the engine doesn't have. Each pad is its
/// own gesture surface, so multi-touch chords (turn + thrust + fire) work.
struct AstroGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  /// Reference-typed frame state so the render loop can mutate the engine
  /// without invalidating the SwiftUI view tree every frame.
  @State private var session = AstroSession()
  @State private var isPaused = false

  var body: some View {
    VStack(spacing: theme.spacing.md) {
      Text("ASTROBOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textPrimary)
        .padding(.top, theme.spacing.lg)

      HStack(spacing: theme.spacing.md) {
        Button {
          session.engine.newGame()
          isPaused = false
        } label: {
          Label("New Game", systemImage: "arrow.counterclockwise")
        }
        .buttonStyle(AstroChunkyButtonStyle())

        Button {
          isPaused.toggle()
        } label: {
          Label(isPaused ? "Resume" : "Pause", systemImage: isPaused ? "play.fill" : "pause.fill")
        }
        .buttonStyle(AstroChunkyButtonStyle())
      }

      AstroFieldView(session: session, isPaused: isPaused)
        .aspectRatio(AstroEngine.fieldWidth / AstroEngine.fieldHeight, contentMode: .fit)
        .padding(.horizontal, theme.spacing.md)

      touchControls

      Text("Big rocks split — small ones score more · Sector bonus +250")
        .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
        .foregroundStyle(theme.colors.textSecondary)

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
  }

  /// Turn pads on the left thumb, thrust/fire on the right thumb. Every pad
  /// is hold-to-activate and simply toggles the matching engine input flag.
  private var touchControls: some View {
    HStack(spacing: theme.spacing.md) {
      HStack(spacing: theme.spacing.sm) {
        AstroHoldPad(systemImage: "arrow.turn.up.left") { pressed in
          session.engine.isTurningLeft = pressed
        }
        AstroHoldPad(systemImage: "arrow.turn.up.right") { pressed in
          session.engine.isTurningRight = pressed
        }
      }
      Spacer(minLength: theme.spacing.md)
      HStack(spacing: theme.spacing.sm) {
        AstroHoldPad(systemImage: "flame.fill") { pressed in
          session.engine.isThrusting = pressed
        }
        AstroHoldPad(systemImage: "burst.fill") { pressed in
          session.engine.isFiring = pressed
        }
      }
    }
    .padding(.horizontal, theme.spacing.lg)
  }
}

/// Chunky retro button consistent with the web cockpit's toolbar buttons.
private struct AstroChunkyButtonStyle: ButtonStyle {
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

/// A hold-to-activate control pad. Uses a zero-distance drag gesture instead
/// of `Button` because we need press *and* release, and each pad must track
/// its own finger so several pads can be held at once.
private struct AstroHoldPad: View {
  @Environment(\.uiThemeTokens) private var theme
  let systemImage: String
  let onPress: (Bool) -> Void

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

/// One background star (render-only; the web builds these in `makeStars`
/// outside the simulation, so they live in the view session, not the engine).
private struct AstroStar {
  let x: Double
  let y: Double
  let depth: Double
}

/// Frame-loop state that must survive view updates but must not trigger
/// them: the engine, the previous frame timestamp for dt computation, and
/// the baked starfield.
final class AstroSession {
  let engine = AstroEngine()
  var lastFrameTime: Date?
  fileprivate let stars: [AstroStar] = (0..<90).map { _ in
    AstroStar(
      x: Double.random(in: 0..<AstroEngine.fieldWidth),
      y: Double.random(in: 0..<AstroEngine.fieldHeight),
      depth: 0.3 + Double.random(in: 0..<0.7)
    )
  }
  fileprivate let startedAt = Date()
}

/// The playfield: steps the engine each animation frame and draws it with
/// the web version's neon palette (near-black space, violet rocks, cyan
/// ship, green bullets) including the parallax starfield and glow.
struct AstroFieldView: View {
  let session: AstroSession
  let isPaused: Bool

  private static let spaceColor = Color(hex: "#05030f")
  private static let asteroidColor = Color(hex: "#b98cff")
  private static let bulletColor = Color(hex: "#7cf29c")
  private static let shipColor = Color(hex: "#57c8ff")
  private static let flameColor = Color(hex: "#ffb347")
  private static let asteroidDebrisColor = Color(hex: "#ff9d5c")
  private static let hudAmber = Color(hex: "#ffd166")

  var body: some View {
    TimelineView(.animation(minimumInterval: 1 / 120, paused: isPaused)) { timeline in
      Canvas { context, size in
        stepEngine(now: timeline.date)
        draw(context: context, size: size, now: timeline.date)
      }
    }
    .background(Self.spaceColor)
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
    // Clamp dt like the web loop so backgrounding never teleports the ship.
    let dt: Double
    if let last = session.lastFrameTime {
      dt = min(0.05, now.timeIntervalSince(last))
    } else {
      dt = 0
    }
    session.lastFrameTime = now
    _ = session.engine.step(dt: dt)
  }

  private func draw(context: GraphicsContext, size: CGSize, now: Date) {
    let engine = session.engine
    var context = context
    context.scaleBy(
      x: size.width / AstroEngine.fieldWidth,
      y: size.height / AstroEngine.fieldHeight
    )

    let fieldWidth = AstroEngine.fieldWidth
    let fieldHeight = AstroEngine.fieldHeight
    context.fill(
      Path(CGRect(x: 0, y: 0, width: fieldWidth, height: fieldHeight)),
      with: .color(Self.spaceColor)
    )

    // Parallax starfield drifting slowly right, like the web draw().
    let elapsedWall = now.timeIntervalSince(session.startedAt)
    for star in session.stars {
      let drift = elapsedWall * 4 * star.depth
      let x = (star.x + drift).truncatingRemainder(dividingBy: fieldWidth)
      let dot = star.depth > 0.75 ? 2.0 : 1.0
      context.fill(
        Path(CGRect(x: x, y: star.y, width: dot, height: dot)),
        with: .color(.white.opacity(0.25 + star.depth * 0.55))
      )
    }

    // Asteroids: lumpy neon outlines with a soft glow layer.
    for asteroid in engine.asteroids {
      var path = Path()
      for (index, lump) in asteroid.lumps.enumerated() {
        let angle = Double(index) / Double(asteroid.lumps.count) * .pi * 2 + asteroid.rotation
        let radius = asteroid.radius * lump
        let point = CGPoint(
          x: asteroid.x + cos(angle) * radius,
          y: asteroid.y + sin(angle) * radius
        )
        if index == 0 {
          path.move(to: point)
        } else {
          path.addLine(to: point)
        }
      }
      path.closeSubpath()
      context.drawLayer { layer in
        layer.addFilter(.shadow(color: Self.asteroidColor, radius: 6))
        layer.stroke(path, with: .color(Self.asteroidColor), lineWidth: 2)
      }
    }

    // Bullets: small glowing squares.
    context.drawLayer { layer in
      layer.addFilter(.shadow(color: Self.bulletColor, radius: 4))
      for bullet in engine.bullets {
        layer.fill(
          Path(CGRect(x: bullet.x - 2, y: bullet.y - 2, width: 4, height: 4)),
          with: .color(Self.bulletColor)
        )
      }
    }

    // Particles fade out with remaining life, exactly like the web.
    for particle in engine.particles {
      let color = particle.kind == .asteroidDebris ? Self.asteroidDebrisColor : Self.shipColor
      context.fill(
        Path(CGRect(x: particle.x, y: particle.y, width: 3, height: 3)),
        with: .color(color.opacity(max(0, particle.life)))
      )
    }

    // Ship (blinks at ~8Hz while the respawn shield is up, like web's
    // `Math.floor(now / 120) % 2`). Uses the engine clock so pausing pauses
    // the blink too.
    let blinkOn = Int(engine.elapsed / 0.12) % 2 == 0
    if !engine.isOver, !engine.isShipInvulnerable || blinkOn {
      drawShip(context: context, engine: engine)
    }

    drawHud(context: context, engine: engine)

    if engine.isOver {
      context.fill(
        Path(CGRect(x: 0, y: 0, width: fieldWidth, height: fieldHeight)),
        with: .color(Self.spaceColor.opacity(0.75))
      )
      drawCenteredText(
        context, text: "SHIP DESTROYED", size: 40, weight: .bold,
        color: Self.asteroidDebrisColor, at: CGPoint(x: fieldWidth / 2, y: fieldHeight / 2 - 40)
      )
      drawCenteredText(
        context, text: "FINAL SCORE \(paddedScore(engine.score))", size: 20, weight: .semibold,
        color: Self.bulletColor, at: CGPoint(x: fieldWidth / 2, y: fieldHeight / 2 + 8)
      )
      drawCenteredText(
        context, text: "PRESS NEW GAME", size: 16, weight: .semibold,
        color: Self.bulletColor, at: CGPoint(x: fieldWidth / 2, y: fieldHeight / 2 + 44)
      )
    } else if isPaused {
      context.fill(
        Path(CGRect(x: 0, y: 0, width: fieldWidth, height: fieldHeight)),
        with: .color(Self.spaceColor.opacity(0.6))
      )
      drawCenteredText(
        context, text: "PAUSED", size: 36, weight: .bold,
        color: Self.hudAmber, at: CGPoint(x: fieldWidth / 2, y: fieldHeight / 2)
      )
    }
  }

  /// Ship silhouette from the web draw(): nose at (0,-16), wings at (±11,13),
  /// tail notch at (0,7), rotated so `angle` faces the nose, plus the
  /// flickering thrust flame.
  private func drawShip(context: GraphicsContext, engine: AstroEngine) {
    let ship = engine.ship
    var context = context
    context.translateBy(x: ship.x, y: ship.y)
    context.rotate(by: .radians(ship.angle + .pi / 2))

    if ship.thrusting {
      var flame = Path()
      flame.move(to: CGPoint(x: -5, y: 14))
      flame.addLine(to: CGPoint(x: 0, y: 24 + Double.random(in: 0..<8)))
      flame.addLine(to: CGPoint(x: 5, y: 14))
      flame.closeSubpath()
      context.drawLayer { layer in
        layer.addFilter(.shadow(color: Self.flameColor, radius: 7))
        layer.fill(flame, with: .color(Self.flameColor))
      }
    }

    var hull = Path()
    hull.move(to: CGPoint(x: 0, y: -16))
    hull.addLine(to: CGPoint(x: 11, y: 13))
    hull.addLine(to: CGPoint(x: 0, y: 7))
    hull.addLine(to: CGPoint(x: -11, y: 13))
    hull.closeSubpath()
    context.drawLayer { layer in
      layer.addFilter(.shadow(color: Self.shipColor, radius: 7))
      layer.stroke(hull, with: .color(Self.shipColor), lineWidth: 2)
    }
  }

  /// Score (top-left), sector (top-center) and remaining lives as little
  /// ship glyphs (top-right) — the canvas stand-in for the web's cockpit
  /// side panels.
  private func drawHud(context: GraphicsContext, engine: AstroEngine) {
    context.draw(
      Text("SCORE \(paddedScore(engine.score))")
        .font(.system(size: 18, weight: .bold, design: .monospaced))
        .foregroundStyle(Self.bulletColor),
      at: CGPoint(x: 16, y: 22),
      anchor: .leading
    )
    drawCenteredText(
      context, text: sectorLabel(engine.level), size: 18, weight: .bold,
      color: Self.hudAmber, at: CGPoint(x: AstroEngine.fieldWidth / 2, y: 22)
    )
    for index in 0..<max(0, engine.lives) {
      var glyph = Path()
      let originX = AstroEngine.fieldWidth - 24 - Double(index) * 24
      glyph.move(to: CGPoint(x: originX, y: 12))
      glyph.addLine(to: CGPoint(x: originX + 7, y: 30))
      glyph.addLine(to: CGPoint(x: originX, y: 26))
      glyph.addLine(to: CGPoint(x: originX - 7, y: 30))
      glyph.closeSubpath()
      context.stroke(glyph, with: .color(Self.shipColor), lineWidth: 1.5)
    }
  }

  /// "01 SECTOR A" style label, mirroring the web status panel.
  private func sectorLabel(_ level: Int) -> String {
    let letter = String(UnicodeScalar(UInt8(64 + min(26, level))))
    return String(format: "%02d SECTOR %@", level, letter)
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

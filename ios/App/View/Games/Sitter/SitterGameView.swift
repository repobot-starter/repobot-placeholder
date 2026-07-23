import SwiftUI

/// Home surface for the `sitter` pack — the native twin of the web
/// `SitterPage`. Purely client-side: sitter projects have no backend, so this
/// view must never touch stores, components, or the network.
///
/// Art approach: like the web page, the whole game is drawn with emoji — the
/// rooms are warm parchment panels with emoji furniture, the kids and mishaps
/// are emoji sprites, and the tool tray is emoji buttons. The web's conic
/// severity ring becomes a trimmed `Circle` stroke that sweeps and shifts
/// from yellow to red as a mishap ages; pixel-parity with the web CSS is a
/// non-goal, matching its silliness is the goal.
///
/// A 100ms `Timer` drives `SitterEngine.step(dt:)` — the exact tick the web
/// page uses — and a `renderTick` counter republishes the view tree, exactly
/// like the web's `setRenderTick`.
struct SitterGameView: View {
  private enum Phase {
    case idle
    case playing
    case rating
  }

  @Environment(\.uiThemeTokens) private var theme

  /// Reference-typed engine: the tick loop mutates it in place and
  /// `renderTick` tells SwiftUI when to re-read it.
  @State private var engine = SitterEngine()
  @State private var phase: Phase = .idle
  @State private var difficulty: SitterDifficulty = .normal
  @State private var selectedTool: SitterToolKey?
  @State private var bestPay = UserDefaults.standard.integer(forKey: SitterEngine.bestPayKey)
  @State private var renderTick = 0

  /// The web ticks the shift 10 times a second; so do we.
  private let clock = Timer.publish(every: 0.1, on: .main, in: .common).autoconnect()

  var body: some View {
    // Reading renderTick here makes the body depend on it, so each engine
    // tick re-renders the tree — the web's setRenderTick.
    let _ = renderTick
    VStack(spacing: theme.spacing.sm) {
      titleBar
      toolbar
      houseArea
      toolTray
      statusBar
    }
    .padding(theme.spacing.md)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
    .onReceive(clock) { _ in tick() }
  }

  // MARK: Tick loop

  private func tick() {
    guard phase == .playing else { return }
    let events = engine.step(dt: 0.1)
    for event in events {
      if case .shiftEnded(let result) = event {
        phase = .rating
        if result.pay > bestPay {
          bestPay = result.pay
          UserDefaults.standard.set(result.pay, forKey: SitterEngine.bestPayKey)
        }
      }
    }
    renderTick += 1
  }

  private func startShift() {
    engine.difficulty = difficulty
    if phase == .rating {
      engine.babysitAgain()
    } else {
      engine.startShift()
    }
    selectedTool = nil
    phase = .playing
  }

  // MARK: Chrome

  private var titleBar: some View {
    HStack {
      Text("🤖 SitterBot")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textPrimary)
      Spacer()
      Text("💰 BEST PAY $\(bestPay)")
        .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textSecondary)
    }
  }

  private var toolbar: some View {
    HStack(spacing: theme.spacing.sm) {
      Button {
        startShift()
      } label: {
        Text("🔔 Start Shift")
      }
      .buttonStyle(SitterChunkyButtonStyle(isLit: false))
      .disabled(phase == .playing)

      ForEach(SitterDifficulty.allCases) { level in
        Button {
          difficulty = level
        } label: {
          Text(level.label)
        }
        .buttonStyle(SitterChunkyButtonStyle(isLit: difficulty == level))
        .disabled(phase == .playing)
      }
      Spacer(minLength: 0)
    }
  }

  // MARK: House

  private var houseArea: some View {
    VStack(spacing: theme.spacing.xs) {
      if engine.overflowStage == .active && phase == .playing {
        Text("UH OH! THE TUB IS OVERFLOWING — TAP IT ×\(SitterEngine.overflowClicks)!")
          .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
          .foregroundStyle(SitterPalette.bannerText)
          .padding(.vertical, 6)
          .frame(maxWidth: .infinity)
          .background(
            RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
              .fill(SitterPalette.bannerBg)
          )
      }

      houseGrid
        .overlay { overlays }
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
        .overlay(
          RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
            .stroke(SitterPalette.wall, lineWidth: 3)
        )
    }
    .frame(maxHeight: .infinity)
  }

  private var houseGrid: some View {
    // 2×2 grid in the web's room order: living/kitchen over bedroom/bathroom.
    VStack(spacing: 3) {
      HStack(spacing: 3) {
        roomView(SitterEngine.rooms[0])
        roomView(SitterEngine.rooms[1])
      }
      HStack(spacing: 3) {
        roomView(SitterEngine.rooms[2])
        roomView(SitterEngine.rooms[3])
      }
    }
    .background(SitterPalette.wall)
  }

  private func roomView(_ room: SitterRoom) -> some View {
    let flooded = room.key == .bathroom && engine.overflowStage == .flooded
    return GeometryReader { geo in
      ZStack(alignment: .topLeading) {
        Rectangle()
          .fill(flooded ? SitterPalette.floodedFloor : SitterPalette.floor)

        Text("\(room.emoji) \(room.name)")
          .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
          .foregroundStyle(SitterPalette.roomLabel)
          .padding(4)

        ForEach(Array(room.furniture.enumerated()), id: \.offset) { _, item in
          Text(item.emoji)
            .font(.system(size: 22))
            .opacity(0.6)
            .position(
              x: geo.size.width * item.x / 100,
              y: geo.size.height * item.y / 100
            )
        }

        if flooded {
          Text("💦")
            .font(.system(size: 34))
            .position(x: geo.size.width / 2, y: geo.size.height / 2)
        }

        ForEach(engine.kids.filter { $0.room == room.key }) { kid in
          Text(kid.emoji)
            .font(.system(size: 26))
            .scaleEffect(kid.hopToken % 2 == 0 ? 1 : 1.12)
            .animation(.spring(duration: 0.3), value: kid.hopToken)
            .position(
              x: geo.size.width * kid.x / 100,
              y: geo.size.height * kid.y / 100
            )
        }

        ForEach(engine.mishaps.filter { $0.room == room.key }) { mishap in
          SitterMishapButton(
            mishap: mishap,
            severity: min(1, (engine.elapsedMs - mishap.spawnedAtMs) / SitterEngine.mishapTimerMs),
            holdProgress: engine.holdingMishapID == mishap.id ? engine.holdProgress : nil,
            onPress: {
              _ = engine.applyTool(selectedTool, toMishapID: mishap.id)
              renderTick += 1
            },
            onRelease: {
              engine.releaseHold()
              renderTick += 1
            }
          )
          .position(
            x: geo.size.width * mishap.x / 100,
            y: geo.size.height * mishap.y / 100
          )
        }

        if room.key == .bathroom && engine.overflowStage == .active {
          Button {
            _ = engine.tapOverflow()
            renderTick += 1
          } label: {
            VStack(spacing: 0) {
              Text("🛁💦").font(.system(size: 30))
              Text("\(SitterEngine.overflowClicks - engine.overflowClicksDone) TAPS!")
                .font(.system(size: 10, weight: .heavy, design: .monospaced))
                .foregroundStyle(SitterPalette.bannerText)
            }
            .padding(6)
            .background(
              RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
                .fill(SitterPalette.bannerBg)
            )
          }
          .position(x: geo.size.width / 2, y: geo.size.height * 0.55)
        }
      }
    }
  }

  // MARK: Overlays (idle / rating), mirroring the web overlay cards

  @ViewBuilder
  private var overlays: some View {
    if phase == .idle {
      overlayCard {
        Text("🧒 🤖 👧").font(.system(size: 30))
        Text("BABYSITTING NIGHT")
          .font(.system(size: theme.typography.sizes.lg, weight: .bold, design: .monospaced))
        Text(
          "The parents are out for two hours (okay, two minutes). Pick the right tool "
            + "from the tray, then tap each mishap before it hardens into a MESS. Hug the "
            + "criers, feed the hungry, and whatever you do — watch that bathtub."
        )
        .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
        .multilineTextAlignment(.center)
        Button {
          startShift()
        } label: {
          Text("🔔 Start Shift")
        }
        .buttonStyle(SitterChunkyButtonStyle(isLit: true))
      }
    } else if phase == .rating, let result = engine.result {
      overlayCard {
        Text("🚗 🔑 🚪").font(.system(size: 30))
        Text("THE PARENTS ARE HOME!")
          .font(.system(size: theme.typography.sizes.lg, weight: .bold, design: .monospaced))
        Text(String(repeating: "★", count: result.stars) + String(repeating: "☆", count: 5 - result.stars))
          .font(.system(size: 30))
          .foregroundStyle(SitterPalette.stars)
        HStack(spacing: theme.spacing.md) {
          Text("🧹 Tidiness \(result.tidiness)%")
          Text("😊 Happiness \(result.happiness)%")
        }
        .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
        Text("PAYCHECK: $\(result.pay)")
          .font(.system(size: theme.typography.sizes.md, weight: .heavy, design: .monospaced))
        if result.pay >= bestPay && result.pay > 0 {
          Text("New best paycheck! 🎉")
            .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
        }
        Button {
          startShift()
        } label: {
          Text("🔔 Babysit again")
        }
        .buttonStyle(SitterChunkyButtonStyle(isLit: true))
      }
    }
  }

  private func overlayCard(@ViewBuilder content: () -> some View) -> some View {
    ZStack {
      Rectangle().fill(Color.black.opacity(0.45))
      VStack(spacing: theme.spacing.sm) {
        content()
      }
      .foregroundStyle(SitterPalette.cardText)
      .padding(theme.spacing.lg)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
          .fill(SitterPalette.card)
          .overlay(
            RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
              .stroke(SitterPalette.wall, lineWidth: 2)
          )
      )
      .padding(theme.spacing.lg)
    }
  }

  // MARK: Tool tray + status bar

  private var toolTray: some View {
    HStack(spacing: theme.spacing.xs) {
      ForEach(SitterEngine.tools, id: \.key) { tool in
        Button {
          selectedTool = tool.key
          renderTick += 1
        } label: {
          VStack(spacing: 2) {
            Text(tool.emoji).font(.system(size: 24))
            Text(tool.label.uppercased())
              .font(.system(size: 9, weight: .bold, design: .monospaced))
          }
          .frame(maxWidth: .infinity)
          .padding(.vertical, 6)
          .background(
            RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
              .fill(selectedTool == tool.key ? theme.colors.accent : theme.colors.surfaceAlt)
          )
          .overlay(
            RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
              .stroke(theme.colors.border, lineWidth: 1)
          )
          .foregroundStyle(
            selectedTool == tool.key ? theme.colors.accentText : theme.colors.textPrimary
          )
        }
      }
    }
  }

  private var statusBar: some View {
    let remaining = phase == .playing
      ? engine.remainingMs
      : phase == .rating ? 0 : SitterEngine.shiftLengthMs
    let status: String
    switch phase {
    case .playing: status = engine.statusMessage
    case .rating: status = "SHIFT OVER. THE PARENTS ARE HOME."
    case .idle: status = "READY. PICK A DIFFICULTY AND RING THE BELL."
    }
    let urgent = phase == .playing && remaining <= 15_000

    return VStack(spacing: 2) {
      Text(status)
        .font(.system(size: theme.typography.sizes.xs, weight: .semibold, design: .monospaced))
        .foregroundStyle(theme.colors.textPrimary)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
      HStack {
        Text("● SHIFT \(engine.shiftNumber) · \(difficulty.label.uppercased())")
        Spacer()
        Text("PARENTS HOME IN \(formatClock(remaining))")
          .foregroundStyle(urgent ? SitterPalette.urgent : theme.colors.textSecondary)
          .fontWeight(urgent ? .heavy : .regular)
      }
      .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
      .foregroundStyle(theme.colors.textSecondary)
    }
  }

  private func formatClock(_ ms: Double) -> String {
    let totalSeconds = Int(ceil(ms / 1_000))
    let minutes = totalSeconds / 60
    let seconds = totalSeconds % 60
    return String(format: "%d:%02d", minutes, seconds)
  }
}

// MARK: - Mishap button

/// One tappable mishap. Fresh mishaps show a sweeping severity ring that
/// shifts yellow → red as the 12s escalation timer runs down (the web's conic
/// gradient); a hug in progress swaps it for a teal hold-progress ring; a
/// hardened MESS gets an angry red badge. Multi-tap fixes show pips for the
/// taps still needed. Press-and-release drives both tap fixes and holds.
private struct SitterMishapButton: View {
  let mishap: SitterMishap
  let severity: Double
  /// Non-nil while this mishap's hold fix is in progress (0...1).
  let holdProgress: Double?
  let onPress: () -> Void
  let onRelease: () -> Void

  @State private var isPressed = false

  var body: some View {
    ZStack {
      if mishap.isMess {
        Circle()
          .fill(SitterPalette.messBg)
          .overlay(Circle().stroke(SitterPalette.urgent, lineWidth: 3))
      } else {
        Circle().stroke(SitterPalette.ringTrack, lineWidth: 4)
        Circle()
          .trim(from: 0, to: holdProgress ?? severity)
          .stroke(
            holdProgress != nil
              ? SitterPalette.holdRing
              : Color(hue: (45 - severity * 40) / 360, saturation: 0.85, brightness: 0.9),
            style: StrokeStyle(lineWidth: 4, lineCap: .round)
          )
          .rotationEffect(.degrees(-90))
      }
      VStack(spacing: 0) {
        Text(mishap.kind.emoji).font(.system(size: 24))
        if mishap.kind.clicksToFix > 1 {
          Text(String(repeating: "●", count: mishap.kind.clicksToFix - mishap.clicksDone))
            .font(.system(size: 7))
            .foregroundStyle(SitterPalette.roomLabel)
        }
      }
    }
    .frame(width: 44, height: 44)
    .scaleEffect(mishap.isMess ? 1.15 : 1)
    .gesture(
      DragGesture(minimumDistance: 0)
        .onChanged { _ in
          if !isPressed {
            isPressed = true
            onPress()
          }
        }
        .onEnded { _ in
          isPressed = false
          onRelease()
        }
    )
  }
}

// MARK: - Chunky button + palette

/// Chunky retro button consistent with the web page's toolbar buttons.
private struct SitterChunkyButtonStyle: ButtonStyle {
  @Environment(\.uiThemeTokens) private var theme
  let isLit: Bool

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .monospaced))
      .foregroundStyle(isLit ? theme.colors.accentText : theme.colors.textPrimary)
      .padding(.horizontal, 12)
      .padding(.vertical, 8)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
          .fill(
            isLit
              ? theme.colors.accent
              : configuration.isPressed ? theme.colors.hover : theme.colors.surfaceAlt
          )
          .overlay(
            RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
              .stroke(theme.colors.border, lineWidth: 1)
          )
      )
  }
}

/// Warm "cardboard house" palette echoing the web page's parchment-and-wood
/// look. The house keeps its own colors on both light and dark app themes —
/// like the Pong field, the game surface is part of the game's identity.
private enum SitterPalette {
  static let wall = Color(hex: "#4a3826")
  static let floor = Color(hex: "#f7ecd7")
  static let floodedFloor = Color(hex: "#bcd9e8")
  static let roomLabel = Color(hex: "#6b563d")
  static let ringTrack = Color(hex: "#4a3826").opacity(0.18)
  static let holdRing = Color(hex: "#2f8f83")
  static let messBg = Color(hex: "#ffd9d0")
  static let urgent = Color(hex: "#c73e2e")
  static let bannerBg = Color(hex: "#ffe3a6")
  static let bannerText = Color(hex: "#7a3b12")
  static let card = Color(hex: "#fff6e5")
  static let cardText = Color(hex: "#4a3826")
  static let stars = Color(hex: "#d99a26")
}

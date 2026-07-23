import SwiftUI

/// Backstage palette lifted from the web `StylePage.styles.css.ts` constants
/// so the native game keeps the same velvet-and-gold fashion-console look on
/// both light and dark app themes (the web page is hardcoded dark too — it is
/// part of the game's identity).
private enum StyleColors {
  static let bgDeep = Color(hex: "#1d0631")
  static let shell = Color(hex: "#33104f")
  static let shellDark = Color(hex: "#270b3e")
  static let ink = Color(hex: "#140420")
  static let hotPink = Color(hex: "#ff4fa3")
  static let violet = Color(hex: "#8b2fc9")
  static let gold = Color(hex: "#ffd166")
  static let cream = Color(hex: "#fff0fa")
  static let mutedText = Color(hex: "#c9a8e0")
  static let stageTop = Color(hex: "#2a0a44")
  static let stageMid = Color(hex: "#3d1160")
  static let backstage = Color(hex: "#1a0529")
  static let runwayMid = Color(hex: "#b32b73")
  static let runwayDark = Color(hex: "#6e1a49")
}

/// Home surface for the `style` pack — the native twin of the web
/// `StylePage`. Purely client-side: style projects have no backend, so this
/// view must never touch stores, components, or the network.
///
/// All rules live in `StyleEngine` (a value type held in `@State`, so every
/// engine mutation re-renders the view); this file is rendering, touch input,
/// the 10Hz tick clock, and UserDefaults persistence of the best score.
///
/// Art approach: like the web `DressUpStage`, the model is a dress-up doll
/// composed from stacked emoji layers (base 🧍 plus one emoji per worn slot,
/// offset onto head/torso/legs/feet), strutting across a vector runway —
/// gradient backdrop, gold marquee dots, hot-pink catwalk strip. No image
/// assets; visual parity with the web CSS art is not attempted, but the
/// palette and layout language match.
struct StyleGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  @State private var engine = StyleEngine()
  @State private var bestScore = UserDefaults.standard.integer(forKey: StyleWardrobe.bestScoreKey)
  @State private var activeSlot: StyleSlotId = .hat
  @State private var lastTick: Date?

  /// 10Hz is plenty for a 1-second countdown and a 2.6s walk; the engine
  /// accumulates real elapsed time, so tick rate never skews the clock.
  private let clock = Timer.publish(every: 0.1, on: .main, in: .common).autoconnect()

  /// Countdown ticks turn the timer urgent from this many seconds left,
  /// like the web `TICK_FROM_SECONDS`.
  private static let urgentFromSeconds = 10

  private var dressing: Bool { engine.phase == .dressing }

  var body: some View {
    VStack(spacing: theme.spacing.sm) {
      header
      countdownBar
      themeBanner
      stage
        .frame(maxHeight: .infinity)
      closet
      seasonScoreRow
    }
    .padding(theme.spacing.md)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(StyleColors.bgDeep)
    .onReceive(clock) { now in
      // The view owns the clock; the engine is purely tick-driven.
      let dt = lastTick.map { now.timeIntervalSince($0) } ?? 0
      lastTick = now
      _ = engine.tick(dt: dt)
    }
  }

  // MARK: - Header + timer

  private var header: some View {
    HStack(spacing: theme.spacing.sm) {
      Text("🤖 STYLEBOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
        .foregroundStyle(StyleColors.cream)
      Spacer(minLength: 0)
      badge(
        engine.phase == .idle
          ? "ROUND —"
          : "ROUND \(engine.roundIndex + 1)/\(StyleWardrobe.roundsPerSeason)",
        color: StyleColors.gold
      )
      badge(
        "⏱ 0:" + String(format: "%02d", engine.secondsLeft),
        color: dressing && engine.secondsLeft <= Self.urgentFromSeconds
          ? StyleColors.hotPink
          : StyleColors.gold
      )
    }
  }

  private func badge(_ text: String, color: Color) -> some View {
    Text(text)
      .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
      .foregroundStyle(color)
      .padding(.horizontal, 10)
      .padding(.vertical, 5)
      .background(Capsule().fill(StyleColors.ink))
      .overlay(Capsule().stroke(color, lineWidth: 2))
  }

  /// The dressing clock as a draining bar — gold, flipping to hot pink for
  /// the last urgent seconds.
  private var countdownBar: some View {
    GeometryReader { proxy in
      let fraction = Double(engine.secondsLeft) / Double(StyleWardrobe.roundSeconds)
      ZStack(alignment: .leading) {
        Capsule().fill(StyleColors.ink)
        Capsule()
          .fill(
            engine.secondsLeft <= Self.urgentFromSeconds && dressing
              ? StyleColors.hotPink
              : StyleColors.gold
          )
          .frame(width: max(0, proxy.size.width * fraction))
          .animation(.linear(duration: 1), value: engine.secondsLeft)
      }
      .opacity(dressing ? 1 : 0.35)
    }
    .frame(height: 8)
  }

  private var themeBanner: some View {
    HStack(spacing: theme.spacing.sm) {
      if let roundTheme = engine.theme, engine.phase != .idle {
        Text(roundTheme.emoji).font(.system(size: 28))
        VStack(alignment: .leading, spacing: 2) {
          Text("TONIGHT'S THEME")
            .font(.system(size: 9, weight: .bold, design: .monospaced))
            .foregroundStyle(StyleColors.mutedText)
          Text(roundTheme.name)
            .font(.system(size: theme.typography.sizes.lg, weight: .bold, design: .monospaced))
            .foregroundStyle(StyleColors.gold)
        }
      } else {
        Text("Start a season to reveal the theme.")
          .font(.system(size: theme.typography.sizes.sm, design: .monospaced))
          .foregroundStyle(StyleColors.mutedText)
      }
      Spacer(minLength: 0)
      chunkyButton("✔ Done!", background: StyleColors.gold, foreground: StyleColors.ink) {
        engine.finishRound()
      }
      .disabled(!dressing)
      .opacity(dressing ? 1 : 0.4)
    }
    .padding(theme.spacing.sm)
    .background(
      RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
        .fill(StyleColors.shellDark)
    )
  }

  // MARK: - Stage

  private var stage: some View {
    GeometryReader { proxy in
      ZStack {
        stageBackdrop(size: proxy.size)
        DollView(outfit: engine.outfit, walking: engine.phase == .walking, stageSize: proxy.size)
        if engine.phase == .walking {
          SparkleLayer(size: proxy.size)
        }
        overlayCard
      }
      .frame(width: proxy.size.width, height: proxy.size.height)
      .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
          .stroke(StyleColors.gold, lineWidth: 2)
      )
    }
    .frame(minHeight: 220)
  }

  /// The catwalk scenery: violet stage gradient, a row of gold marquee dots
  /// along the top, and the hot-pink runway strip across the bottom.
  private func stageBackdrop(size: CGSize) -> some View {
    ZStack {
      LinearGradient(
        colors: [StyleColors.stageTop, StyleColors.stageMid, StyleColors.backstage],
        startPoint: .top,
        endPoint: .bottom
      )
      VStack(spacing: 0) {
        HStack(spacing: 22) {
          ForEach(0..<max(1, Int(size.width / 28)), id: \.self) { _ in
            Circle().fill(StyleColors.gold).frame(width: 5, height: 5)
          }
        }
        .padding(.top, 6)
        Spacer(minLength: 0)
        LinearGradient(
          colors: [StyleColors.hotPink, StyleColors.runwayMid, StyleColors.runwayDark],
          startPoint: .top,
          endPoint: .bottom
        )
        .frame(height: size.height * 0.3)
        .overlay(alignment: .top) {
          Rectangle().fill(StyleColors.gold).frame(height: 3)
        }
      }
    }
  }

  /// The idle / verdict / season-over cards over the stage, mirroring the
  /// web `stageOverlay` states.
  @ViewBuilder private var overlayCard: some View {
    switch engine.phase {
    case .idle:
      verdictCardShell {
        Text("✨ STYLEBOT ✨")
          .font(.system(size: theme.typography.sizes.lg, weight: .bold, design: .monospaced))
          .foregroundStyle(StyleColors.gold)
        Text(
          "\(StyleWardrobe.roundsPerSeason) rounds. \(StyleWardrobe.roundSeconds) seconds each. "
            + "Dress to impress the judges!"
        )
        .font(.system(size: theme.typography.sizes.sm, design: .monospaced))
        .foregroundStyle(StyleColors.cream)
        .multilineTextAlignment(.center)
        chunkyButton("💃 Start Season", background: StyleColors.hotPink, foreground: StyleColors.cream) {
          engine.startSeason()
          activeSlot = .hat
        }
      }
    case .verdict:
      if let verdict = engine.verdict {
        verdictCardShell {
          Text(
            String(repeating: "★", count: verdict.score.stars)
              + String(repeating: "☆", count: 5 - verdict.score.stars)
          )
          .font(.system(size: 28))
          .foregroundStyle(StyleColors.gold)
          Text("+\(verdict.score.total) pts")
            .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
            .foregroundStyle(StyleColors.cream)
          Text("“\(verdict.line)”")
            .font(.system(size: theme.typography.sizes.sm, design: .monospaced))
            .foregroundStyle(StyleColors.mutedText)
            .multilineTextAlignment(.center)
          Text(verdictDetail(verdict.score))
            .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
            .foregroundStyle(StyleColors.mutedText)
          chunkyButton(
            engine.isFinalRound ? "🏁 Finish Season" : "▶ Next Round",
            background: StyleColors.hotPink,
            foreground: StyleColors.cream
          ) {
            dismissVerdict()
          }
        }
      }
    case .seasonOver:
      verdictCardShell {
        Text("SEASON OVER")
          .font(.system(size: theme.typography.sizes.lg, weight: .bold, design: .monospaced))
          .foregroundStyle(StyleColors.gold)
        Text("\(engine.seasonTotal) pts")
          .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
          .foregroundStyle(StyleColors.cream)
        Text(
          engine.seasonTotal >= bestScore && engine.seasonTotal > 0
            ? "🌟 New best score!"
            : "Best season: \(bestScore) pts"
        )
        .font(.system(size: theme.typography.sizes.sm, design: .monospaced))
        .foregroundStyle(StyleColors.mutedText)
        chunkyButton("⟳ New Season", background: StyleColors.hotPink, foreground: StyleColors.cream) {
          engine.startSeason()
          activeSlot = .hat
        }
      }
    case .dressing, .walking:
      EmptyView()
    }
  }

  private func verdictDetail(_ score: StyleRoundScore) -> String {
    var detail = "\(score.matches)/5 on-theme"
    if score.fullMatch { detail += " · full-theme bonus!" }
    if score.complete { detail += " · complete outfit" }
    return detail
  }

  private func verdictCardShell(@ViewBuilder content: () -> some View) -> some View {
    VStack(spacing: theme.spacing.sm) {
      content()
    }
    .padding(theme.spacing.lg)
    .background(
      RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
        .fill(StyleColors.shellDark)
        .shadow(color: StyleColors.gold.opacity(0.35), radius: 17)
    )
    .overlay(
      RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
        .stroke(StyleColors.gold, lineWidth: 2)
    )
    .padding(theme.spacing.lg)
  }

  // MARK: - Closet

  private var closet: some View {
    VStack(spacing: theme.spacing.sm) {
      HStack(spacing: theme.spacing.xs) {
        ForEach(StyleWardrobe.slots) { slot in
          Button {
            activeSlot = slot.id
          } label: {
            Text(slot.icon)
              .font(.system(size: 20))
              .frame(maxWidth: .infinity)
              .padding(.vertical, 6)
              .background(
                RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
                  .fill(slot.id == activeSlot ? StyleColors.violet : StyleColors.shellDark)
              )
          }
          .buttonStyle(.plain)
        }
      }

      itemGrid

      HStack(spacing: theme.spacing.sm) {
        chunkyButton("🎲 Shuffle", background: StyleColors.violet, foreground: StyleColors.cream) {
          engine.shuffleOutfit()
        }
        .disabled(!dressing)
        chunkyButton("🧺 Clear", background: StyleColors.violet, foreground: StyleColors.cream) {
          engine.clearOutfit()
        }
        .disabled(!dressing)
        Spacer(minLength: 0)
      }
      .opacity(dressing ? 1 : 0.4)
    }
    .padding(theme.spacing.sm)
    .background(
      RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
        .fill(StyleColors.shell)
    )
  }

  private var activeSlotData: StyleSlot {
    StyleWardrobe.slots.first { $0.id == activeSlot } ?? StyleWardrobe.slots[0]
  }

  private var itemGrid: some View {
    LazyVGrid(
      columns: Array(repeating: GridItem(.flexible(), spacing: theme.spacing.xs), count: 4),
      spacing: theme.spacing.xs
    ) {
      ForEach(activeSlotData.items) { item in
        let selected = engine.outfit[activeSlot]?.id == item.id
        Button {
          engine.pick(item, in: activeSlot)
        } label: {
          VStack(spacing: 2) {
            Text(item.emoji).font(.system(size: 26))
            Text(item.name)
              .font(.system(size: 9, weight: .semibold, design: .monospaced))
              .foregroundStyle(StyleColors.cream)
              .lineLimit(1)
              .minimumScaleFactor(0.7)
          }
          .frame(maxWidth: .infinity)
          .padding(.vertical, 6)
          .background(
            RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
              .fill(selected ? StyleColors.violet : StyleColors.shellDark)
          )
          .overlay(
            RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
              .stroke(selected ? StyleColors.gold : StyleColors.violet, lineWidth: selected ? 2 : 1)
          )
        }
        .buttonStyle(.plain)
        .disabled(!dressing)
        .opacity(dressing ? 1 : 0.5)
      }
    }
  }

  private var seasonScoreRow: some View {
    HStack {
      Text("💎 TOTAL \(engine.seasonTotal)")
      Spacer(minLength: 0)
      Text("🏆 BEST \(bestScore)")
      Spacer(minLength: 0)
      Text("MAX \(StyleWardrobe.maxRoundScore) PTS / ROUND")
    }
    .font(.system(size: theme.typography.sizes.xs, weight: .semibold, design: .monospaced))
    .foregroundStyle(StyleColors.mutedText)
  }

  // MARK: - Actions

  /// Advances past the verdict card and, when the season just ended,
  /// persists a new best score (the web writes the same key to localStorage).
  private func dismissVerdict() {
    engine.dismissVerdict()
    if engine.phase == .seasonOver, engine.seasonTotal > bestScore {
      bestScore = engine.seasonTotal
      UserDefaults.standard.set(engine.seasonTotal, forKey: StyleWardrobe.bestScoreKey)
    }
  }

  private func chunkyButton(
    _ label: String,
    background: Color,
    foreground: Color,
    action: @escaping () -> Void
  ) -> some View {
    Button(action: action) {
      Text(label)
        .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .monospaced))
        .foregroundStyle(foreground)
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(Capsule().fill(background))
        .overlay(Capsule().stroke(StyleColors.ink, lineWidth: 2))
    }
    .buttonStyle(.plain)
  }
}

/// The dress-up doll: a base 🧍 with each worn item's emoji layered onto the
/// matching body zone (hat on head, top on torso, bottom on legs, shoes at
/// the feet, accessory held to the side). During the runway walk the whole
/// doll struts off stage-right over the engine's 2.6s walk window.
private struct DollView: View {
  let outfit: StyleOutfit
  let walking: Bool
  let stageSize: CGSize

  var body: some View {
    ZStack {
      Text("🧍").font(.system(size: 120))
      if let item = outfit[.bottom] {
        Text(item.emoji).font(.system(size: 42)).offset(y: 30)
      }
      if let item = outfit[.top] {
        Text(item.emoji).font(.system(size: 52)).offset(y: -8)
      }
      if let item = outfit[.shoes] {
        Text(item.emoji).font(.system(size: 30)).offset(y: 62)
      }
      if let item = outfit[.hat] {
        Text(item.emoji).font(.system(size: 38)).offset(y: -64)
      }
      if let item = outfit[.accessory] {
        Text(item.emoji).font(.system(size: 36)).offset(x: 46, y: -4)
      }
    }
    .shadow(color: .black.opacity(0.5), radius: 6, y: 8)
    // Stand just above the runway strip; strut off stage-right when walking.
    .offset(
      x: walking ? stageSize.width * 0.75 : 0,
      y: stageSize.height * 0.18
    )
    .rotationEffect(.degrees(walking ? 2 : 0))
    // Strut out over the engine's walk window; snap back instantly when the
    // walk ends so the next round starts with the doll centered.
    .animation(walking ? .easeInOut(duration: StyleEngine.walkDuration) : nil, value: walking)
  }
}

/// Camera flashes + sparkles shown during the runway walk. Positions mirror
/// the web `SPARKLES` table; here they pulse in with a simple scale/opacity
/// pop instead of a repeating CSS keyframe.
private struct SparkleLayer: View {
  let size: CGSize

  @State private var shown = false

  private static let sparkles: [(emoji: String, x: Double, y: Double)] = [
    ("📸", 0.08, 0.22),
    ("✨", 0.22, 0.48),
    ("📸", 0.88, 0.30),
    ("✨", 0.70, 0.14),
    ("📸", 0.45, 0.10),
    ("✨", 0.92, 0.60),
  ]

  var body: some View {
    ZStack {
      ForEach(Array(Self.sparkles.enumerated()), id: \.offset) { index, spark in
        Text(spark.emoji)
          .font(.system(size: 24))
          .position(x: size.width * spark.x, y: size.height * spark.y)
          .opacity(shown ? 1 : 0)
          .scaleEffect(shown ? 1.2 : 0.4)
          .animation(
            .easeOut(duration: 0.6).delay(Double(index) * 0.15),
            value: shown
          )
      }
    }
    .onAppear { shown = true }
  }
}

import SwiftUI

/// Home surface for the `salon` pack — the native twin of the web `SalonPage`.
/// Purely client-side: salon projects have no backend, so this view must never
/// touch stores, components, or the network. All rules live in `SalonEngine`;
/// this file is rendering and touch input only.
///
/// ART APPROACH: the web draws the client as hand-authored SVG paths
/// (`ClientHead.tsx`). This port re-draws the same character in a SwiftUI
/// `Canvas` using the web's 320x360 coordinate space and the same key
/// landmarks (face ellipse, dome curve, fringe, per-length hair bottoms,
/// updo bun / braid beads), so the silhouette parameterization matches the
/// web `buildHairdo({length, texture})` exactly. Two simplifications:
/// - The web's CSS `saturate`/`brightness` dullness filter is approximated by
///   overlaying the hair shapes with translucent ink scaled by messiness.
/// - Emoji (accessories, debris, scissors, sparkles) are drawn as Canvas text
///   at the web's coordinates instead of SVG `<text>` nodes.
/// Cute and readable over pixel parity.
struct SalonGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  /// Reference-typed engine so station handlers can mutate freely; `revision`
  /// is bumped after every mutation to invalidate the SwiftUI view tree.
  @State private var session = SalonSession()
  @State private var revision = 0

  private var engine: SalonEngine { session.engine }

  var body: some View {
    let _ = revision
    ScrollView {
      VStack(spacing: theme.spacing.md) {
        titleBar
        toolbar
        if engine.station == .reveal, let score = engine.score {
          revealStage
          scorecard(score)
        } else {
          requestCard
          stage
          stationStrip
          stationPanel
        }
        statusBar
      }
      .padding(theme.spacing.md)
    }
    .background(theme.colors.appBg)
  }

  /// Runs one engine mutation and invalidates the view tree.
  private func act(_ mutation: () -> Void) {
    mutation()
    revision &+= 1
  }

  // MARK: - Chrome

  private var titleBar: some View {
    Text("🤖 SALONBOT")
      .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .rounded))
      .foregroundStyle(theme.colors.textPrimary)
      .frame(maxWidth: .infinity, alignment: .leading)
  }

  private var toolbar: some View {
    HStack(spacing: theme.spacing.sm) {
      SalonChunkyButton(label: "💺 New Client") {
        act { engine.nextClient() }
      }
      Spacer()
      Text("💇 STREAK: \(engine.streak)")
        .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .rounded))
        .foregroundStyle(theme.colors.textSecondary)
    }
  }

  private var statusBar: some View {
    HStack {
      Text("● \(engine.station.rawValue.uppercased())")
      Spacer()
      Text(engine.status)
        .lineLimit(2)
        .multilineTextAlignment(.center)
      Spacer()
      Text("BEST: \(engine.bestStreak)")
    }
    .font(.system(size: theme.typography.sizes.xs, weight: .semibold, design: .rounded))
    .foregroundStyle(theme.colors.textSecondary)
    .padding(theme.spacing.sm)
    .background(
      RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
        .fill(theme.colors.surfaceAlt)
    )
  }

  // MARK: - Request card

  private var requestCard: some View {
    SalonPanel(title: "💌 Request Card") {
      VStack(alignment: .leading, spacing: theme.spacing.xs) {
        requestRow(icon: "📏", label: engine.client.request.length.label)
        HStack(spacing: theme.spacing.sm) {
          Circle()
            .fill(Color(hex: engine.client.request.color.fillHex))
            .frame(width: 16, height: 16)
            .overlay(Circle().stroke(theme.colors.border, lineWidth: 1))
          Text(engine.client.request.color.label)
        }
        requestRow(
          icon: engine.client.request.texture.emoji,
          label: engine.client.request.texture.label
        )
        if let accessory = engine.client.request.accessory {
          requestRow(icon: accessory.emoji, label: "\(accessory.label), please!")
        }
        Text("…and a good scrub! ✨ — \(engine.client.name), "
          + (engine.client.debris == .leaf ? "leaf in hair 🍂" : "gum in hair 🍬"))
          .font(.system(size: theme.typography.sizes.xs, design: .rounded))
          .foregroundStyle(theme.colors.textSecondary)
      }
      .font(.system(size: theme.typography.sizes.sm, weight: .semibold, design: .rounded))
      .foregroundStyle(theme.colors.textPrimary)
    }
  }

  private func requestRow(icon: String, label: String) -> some View {
    HStack(spacing: theme.spacing.sm) {
      Text(icon)
      Text(label)
    }
  }

  // MARK: - Stage

  private var stage: some View {
    VStack(spacing: theme.spacing.sm) {
      SalonHeadView(
        client: engine.client,
        look: engine.look,
        messiness: engine.messiness,
        bubbles: engine.station == .wash ? engine.bubbles.filter { !$0.isPopped } : [],
        strays: engine.station == .cut ? engine.strays : [],
        sparkles: engine.station == .finish ? engine.sparkles : [],
        onScrub: { id in act { engine.scrub(bubbleID: id) } },
        onSnip: { id in act { engine.snip(strayID: id) } }
      )
      .aspectRatio(
        SalonEngine.headViewWidth / SalonEngine.headViewHeight, contentMode: .fit
      )
      .frame(maxWidth: 320)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
          .fill(Color(hex: "#fdeef7"))
      )

      Text(engine.station.hint)
        .font(.system(size: theme.typography.sizes.xs, design: .rounded))
        .foregroundStyle(theme.colors.textSecondary)
        .multilineTextAlignment(.center)
    }
  }

  private var revealStage: some View {
    VStack(spacing: theme.spacing.sm) {
      Text("\(engine.mood.emoji) “\(engine.reactionLine)”")
        .font(.system(size: theme.typography.sizes.md, weight: .semibold, design: .rounded))
        .foregroundStyle(theme.colors.textPrimary)
        .multilineTextAlignment(.center)
        .padding(theme.spacing.sm)
        .background(
          RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
            .fill(theme.colors.surfaceAlt)
        )

      HStack(spacing: theme.spacing.md) {
        revealCard(label: "Before 😱", look: engine.client.startLook, messiness: 1, sparkles: [])
        revealCard(label: "After ✨", look: engine.look, messiness: 0, sparkles: engine.sparkles)
      }
    }
  }

  private func revealCard(
    label: String, look: SalonHairLook, messiness: Double, sparkles: [SalonSparkle]
  ) -> some View {
    VStack(spacing: theme.spacing.xs) {
      Text(label)
        .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .rounded))
        .foregroundStyle(theme.colors.textPrimary)
      SalonHeadView(
        client: engine.client,
        look: look,
        messiness: messiness,
        bubbles: [],
        strays: [],
        sparkles: sparkles,
        onScrub: nil,
        onSnip: nil
      )
      .aspectRatio(SalonEngine.headViewWidth / SalonEngine.headViewHeight, contentMode: .fit)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
          .fill(Color(hex: "#fdeef7"))
      )
    }
  }

  // MARK: - Station strip

  private var stationStrip: some View {
    let currentIndex = SalonStation.workflow.firstIndex(of: engine.station)
      ?? SalonStation.workflow.count
    return HStack(spacing: theme.spacing.xs) {
      ForEach(0..<SalonStation.workflow.count, id: \.self) { index in
        let entry = SalonStation.workflow[index]
        let state: String = index < currentIndex ? "✔" : index == currentIndex ? "▶" : ""
        Text("\(entry.emoji) \(entry.label) \(state)")
          .font(.system(size: theme.typography.sizes.xs, weight: .semibold, design: .rounded))
          .foregroundStyle(
            index == currentIndex ? theme.colors.accentText : theme.colors.textSecondary
          )
          .padding(.horizontal, theme.spacing.sm)
          .padding(.vertical, theme.spacing.xs)
          .background(
            Capsule().fill(
              index == currentIndex
                ? theme.colors.accent
                : index < currentIndex ? theme.colors.hover : theme.colors.surfaceAlt
            )
          )
      }
    }
    .frame(maxWidth: .infinity)
  }

  // MARK: - Station panels

  @ViewBuilder
  private var stationPanel: some View {
    switch engine.station {
    case .wash:
      washPanel
    case .cut:
      cutPanel
    case .color:
      colorPanel
    case .style:
      stylePanel
    case .finish:
      finishPanel
    case .reveal:
      EmptyView()
    }
  }

  private var washPanel: some View {
    SalonPanel(title: "🫧 Wash") {
      VStack(alignment: .leading, spacing: theme.spacing.xs) {
        Text("Cleanliness")
          .font(.system(size: theme.typography.sizes.xs, weight: .semibold, design: .rounded))
          .foregroundStyle(theme.colors.textSecondary)
        GeometryReader { proxy in
          ZStack(alignment: .leading) {
            Capsule().fill(theme.colors.surfaceAlt)
            Capsule()
              .fill(Color(hex: "#58c9a2"))
              .frame(width: proxy.size.width * engine.cleanliness)
          }
        }
        .frame(height: 12)
        Text("Pop every bubble to fill the meter.")
          .font(.system(size: theme.typography.sizes.xs, design: .rounded))
          .foregroundStyle(theme.colors.textSecondary)
      }
    }
  }

  private var cutPanel: some View {
    SalonPanel(title: "✂️ Cut") {
      VStack(spacing: theme.spacing.sm) {
        HStack(spacing: theme.spacing.sm) {
          ForEach(SalonHairLength.allCases, id: \.rawValue) { length in
            SalonChunkyButton(
              label: length.label,
              isLit: engine.lengthChosen && engine.look.length == length
            ) {
              act { engine.chooseLength(length) }
            }
          }
        }
        Text(
          !engine.lengthChosen
            ? "Choose a target length."
            : engine.straysLeft > 0
              ? "Snip \(engine.straysLeft) stray strand\(engine.straysLeft == 1 ? "" : "s")!"
              : "Clean cut! ✂️"
        )
        .font(.system(size: theme.typography.sizes.xs, design: .rounded))
        .foregroundStyle(theme.colors.textSecondary)
        SalonChunkyButton(label: "Next: Color →", isEnabled: engine.cutDone) {
          act { engine.advanceToColor() }
        }
      }
    }
  }

  private var colorPanel: some View {
    SalonPanel(title: "🎨 Color") {
      VStack(spacing: theme.spacing.sm) {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 44))], spacing: theme.spacing.sm) {
          ForEach(SalonHairColor.allCases, id: \.rawValue) { color in
            Button {
              act { engine.applyDye(color) }
            } label: {
              RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
                .fill(Color(hex: color.fillHex))
                .frame(height: 40)
                .overlay(
                  RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
                    .stroke(
                      engine.hasDyed && engine.look.color == color
                        ? theme.colors.accent : theme.colors.border,
                      lineWidth: engine.hasDyed && engine.look.color == color ? 3 : 1
                    )
                )
            }
            .accessibilityLabel(color.label)
          }
        }
        SalonChunkyButton(label: "Next: Style →", isEnabled: engine.hasDyed) {
          act { engine.advanceToStyle() }
        }
      }
    }
  }

  private var stylePanel: some View {
    SalonPanel(title: "💈 Style") {
      VStack(spacing: theme.spacing.sm) {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: theme.spacing.sm) {
          ForEach(SalonHairTexture.allCases, id: \.rawValue) { texture in
            SalonChunkyButton(
              label: "\(texture.emoji) \(texture.label)",
              isLit: engine.hasStyled && engine.look.texture == texture
            ) {
              act { engine.chooseTexture(texture) }
            }
          }
        }
        SalonChunkyButton(label: "Next: Finish →", isEnabled: engine.hasStyled) {
          act { engine.advanceToFinish() }
        }
      }
    }
  }

  private var finishPanel: some View {
    SalonPanel(title: "✨ Finish") {
      VStack(spacing: theme.spacing.sm) {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 90))], spacing: theme.spacing.sm) {
          ForEach(SalonAccessory.allCases, id: \.rawValue) { accessory in
            SalonChunkyButton(
              label: "\(accessory.emoji) \(accessory.label)",
              isLit: engine.look.accessory == accessory
            ) {
              act { engine.chooseAccessory(accessory) }
            }
          }
        }
        SalonChunkyButton(label: "💦 Spritz of shine") {
          act { engine.spritz() }
        }
        SalonChunkyButton(label: "🪞 The big reveal!") {
          act { engine.reveal() }
        }
      }
    }
  }

  private func scorecard(_ score: SalonScore) -> some View {
    SalonPanel(title: "🪞 Scorecard") {
      VStack(spacing: theme.spacing.xs) {
        scoreRow("📏 Length", matched: score.lengthMatch)
        scoreRow("🎨 Color", matched: score.colorMatch)
        scoreRow("💈 Style", matched: score.textureMatch)
        if let accessoryMatch = score.accessoryMatch {
          scoreRow("🎀 Accessory", matched: accessoryMatch)
        }
        HStack {
          Text("🫧 Wash bonus")
          Spacer()
          Text("+\(score.washBonus)")
        }
        HStack {
          Text("Total").fontWeight(.bold)
          Spacer()
          Text("\(score.total) / \(score.max)").fontWeight(.bold)
        }
        SalonChunkyButton(label: "💺 Next client →") {
          act { engine.nextClient() }
        }
      }
      .font(.system(size: theme.typography.sizes.sm, design: .rounded))
      .foregroundStyle(theme.colors.textPrimary)
    }
  }

  private func scoreRow(_ label: String, matched: Bool) -> some View {
    HStack {
      Text(label)
      Spacer()
      Text(matched ? "✔ +\(SalonEngine.pointsPerMatch)" : "✘ 0")
        .foregroundStyle(matched ? theme.colors.statusSuccess : theme.colors.statusError)
    }
  }
}

/// Frame state that must survive view updates but must not trigger them.
final class SalonSession {
  let engine = SalonEngine()
}

// MARK: - Shared chrome pieces

/// Pastel panel with a header, echoing the web console's side panels.
private struct SalonPanel<Content: View>: View {
  @Environment(\.uiThemeTokens) private var theme
  let title: String
  let content: Content

  init(title: String, @ViewBuilder content: () -> Content) {
    self.title = title
    self.content = content()
  }

  var body: some View {
    VStack(alignment: .leading, spacing: theme.spacing.sm) {
      Text(title)
        .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .rounded))
        .foregroundStyle(theme.colors.textPrimary)
      content
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(theme.spacing.md)
    .background(
      RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
        .fill(theme.colors.surface)
        .overlay(
          RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
            .stroke(theme.colors.border, lineWidth: 1)
        )
    )
  }
}

/// Chunky rounded button consistent with the web page's toolbar buttons.
private struct SalonChunkyButton: View {
  @Environment(\.uiThemeTokens) private var theme
  let label: String
  var isLit = false
  var isEnabled = true
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      Text(label)
        .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .rounded))
        .foregroundStyle(isLit ? theme.colors.accentText : theme.colors.textPrimary)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
          RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
            .fill(isLit ? theme.colors.accent : theme.colors.surfaceAlt)
            .overlay(
              RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
                .stroke(theme.colors.border, lineWidth: 1)
            )
        )
    }
    .disabled(!isEnabled)
    .opacity(isEnabled ? 1 : 0.45)
  }
}

// MARK: - Client head canvas

/// The client in the mirror: a Canvas re-drawing of the web `ClientHead` SVG
/// in the same 320x360 coordinate space. Purely presentational — wash bubbles,
/// stray strands, and sparkles are passed in; touch interactions are reported
/// through the optional `onScrub` / `onSnip` callbacks.
///
/// Touch model (web used mouse-enter + click):
/// - Wash: dragging across a bubble scrubs it once per entry, so rubbing back
///   and forth lands repeated scrubs; a plain tap also scrubs once.
/// - Cut: tapping or dragging across a stray strand snips it.
struct SalonHeadView: View {
  let client: SalonClient
  let look: SalonHairLook
  let messiness: Double
  let bubbles: [SalonWashBubble]
  let strays: [SalonStrayStrand]
  let sparkles: [SalonSparkle]
  let onScrub: ((Int) -> Void)?
  let onSnip: ((Int) -> Void)?

  /// Bubble the finger is currently inside, so one continuous hover cannot
  /// machine-gun scrubs; re-entering the bubble scrubs again.
  @State private var hoveredBubbleID: Int?

  private static let ink = Color(hex: "#4a3b45")
  private static let shirt = Color(hex: "#b7e0f2")

  var body: some View {
    GeometryReader { proxy in
      let scale = proxy.size.width / SalonEngine.headViewWidth
      Canvas { context, size in
        var context = context
        context.scaleBy(x: size.width / SalonEngine.headViewWidth,
                        y: size.height / SalonEngine.headViewHeight)
        draw(in: &context)
      }
      .gesture(
        DragGesture(minimumDistance: 0)
          .onChanged { value in
            handleTouch(at: headPoint(value.location, scale: scale), isEnd: false)
          }
          .onEnded { value in
            handleTouch(at: headPoint(value.location, scale: scale), isEnd: true)
            hoveredBubbleID = nil
          }
      )
    }
  }

  private func headPoint(_ location: CGPoint, scale: CGFloat) -> CGPoint {
    CGPoint(x: location.x / scale, y: location.y / scale)
  }

  private func handleTouch(at point: CGPoint, isEnd: Bool) {
    if let onScrub {
      let hit = bubbles.first { bubble in
        !bubble.isPopped && hypot(point.x - bubble.x, point.y - bubble.y) <= bubble.r + 6
      }
      if let hit {
        if hit.id != hoveredBubbleID {
          hoveredBubbleID = hit.id
          onScrub(hit.id)
        }
      } else {
        hoveredBubbleID = nil
      }
    }
    if let onSnip {
      // Hit zone covers the strand arc and its floating scissors.
      let hit = strays.first { stray in
        !stray.snipped
          && hypot(point.x - (stray.x + 24 * stray.direction), point.y - stray.y) <= 34
      }
      if let hit {
        onSnip(hit.id)
      }
    }
  }

  // MARK: Drawing (web ClientHead render order)

  private func draw(in context: inout GraphicsContext) {
    let hairdo = SalonHairdoBuilder.build(length: look.length, texture: look.texture)
    let fill = Color(hex: look.color.fillHex)
    let highlight = Color(hex: look.color.highlightHex)
    let skin = Color(hex: client.skinToneHex)

    // Back hair, extra lobes (bun / braid beads), and the shine streak.
    context.fill(hairdo.back, with: .color(fill))
    context.stroke(hairdo.back, with: .color(Self.ink), lineWidth: 3)
    for lobe in hairdo.lobes {
      let path = Path(ellipseIn: lobe)
      context.fill(path, with: .color(fill))
      context.stroke(path, with: .color(Self.ink), lineWidth: 3)
    }
    var streak = Path()
    streak.move(to: CGPoint(x: 112, y: 124))
    streak.addQuadCurve(to: CGPoint(x: 154, y: 84), control: CGPoint(x: 122, y: 92))
    context.stroke(
      streak,
      with: .color(highlight.opacity(0.75)),
      style: StrokeStyle(lineWidth: 10, lineCap: .round)
    )

    // Neck and shirt.
    let neck = Path(CGRect(x: 146, y: 226, width: 28, height: 38))
    context.fill(neck, with: .color(skin))
    context.stroke(neck, with: .color(Self.ink), lineWidth: 3)
    var shirtPath = Path()
    shirtPath.move(to: CGPoint(x: 104, y: 322))
    shirtPath.addQuadCurve(to: CGPoint(x: 160, y: 260), control: CGPoint(x: 104, y: 260))
    shirtPath.addQuadCurve(to: CGPoint(x: 216, y: 322), control: CGPoint(x: 216, y: 260))
    shirtPath.closeSubpath()
    context.fill(shirtPath, with: .color(Self.shirt))
    context.stroke(shirtPath, with: .color(Self.ink), lineWidth: 3)

    // Face.
    let face = Path(ellipseIn: CGRect(x: 160 - 62, y: 172 - 72, width: 124, height: 144))
    context.fill(face, with: .color(skin))
    context.stroke(face, with: .color(Self.ink), lineWidth: 3)

    for side in [-1.0, 1.0] {
      let eyeX = 160 + side * 24
      var brow = Path()
      brow.move(to: CGPoint(x: eyeX - 10, y: 150))
      brow.addQuadCurve(to: CGPoint(x: eyeX + 10, y: 150), control: CGPoint(x: eyeX, y: 144))
      context.stroke(
        brow, with: .color(Self.ink), style: StrokeStyle(lineWidth: 3, lineCap: .round)
      )
      let white = Path(ellipseIn: CGRect(x: eyeX - 9, y: 166 - 10, width: 18, height: 20))
      context.fill(white, with: .color(.white))
      context.stroke(white, with: .color(Self.ink), lineWidth: 2)
      context.fill(
        Path(ellipseIn: CGRect(x: eyeX - 4.5, y: 168 - 4.5, width: 9, height: 9)),
        with: .color(Color(hex: client.eyeColorHex))
      )
      context.fill(
        Path(ellipseIn: CGRect(x: eyeX - 2 - 1.6, y: 165 - 1.6, width: 3.2, height: 3.2)),
        with: .color(.white)
      )
      context.fill(
        Path(ellipseIn: CGRect(x: 160 + side * 32 - 7, y: 192 - 7, width: 14, height: 14)),
        with: .color(Color(hex: "#f7a8bd").opacity(0.5))
      )
    }

    // Nose and smile.
    var nose = Path()
    nose.move(to: CGPoint(x: 160, y: 176))
    nose.addQuadCurve(to: CGPoint(x: 158, y: 188), control: CGPoint(x: 164, y: 184))
    context.stroke(
      nose, with: .color(Self.ink), style: StrokeStyle(lineWidth: 2.5, lineCap: .round)
    )
    if client.smile == .wide {
      var smile = Path()
      smile.move(to: CGPoint(x: 140, y: 198))
      smile.addQuadCurve(to: CGPoint(x: 180, y: 198), control: CGPoint(x: 160, y: 222))
      smile.addQuadCurve(to: CGPoint(x: 140, y: 198), control: CGPoint(x: 160, y: 208))
      smile.closeSubpath()
      context.fill(smile, with: .color(Color(hex: "#a3505f")))
    } else {
      var smile = Path()
      smile.move(to: CGPoint(x: 146, y: 200))
      smile.addQuadCurve(to: CGPoint(x: 174, y: 200), control: CGPoint(x: 160, y: 211))
      context.stroke(
        smile, with: .color(Self.ink), style: StrokeStyle(lineWidth: 3, lineCap: .round)
      )
    }

    // Fringe over the forehead.
    context.fill(hairdo.front, with: .color(fill))
    context.stroke(hairdo.front, with: .color(Self.ink), lineWidth: 3)

    // Dullness: approximate the web saturate/brightness filter with a
    // translucent ink overlay on the hair shapes.
    if messiness > 0.02 {
      let dull = Self.ink.opacity(0.18 * messiness)
      context.fill(hairdo.back, with: .color(dull))
      context.fill(hairdo.front, with: .color(dull))
      for lobe in hairdo.lobes {
        context.fill(Path(ellipseIn: lobe), with: .color(dull))
      }
      // Zigzag tangles fade out as the hair gets cleaner.
      for tangle in SalonHairdoBuilder.tangles {
        context.stroke(
          tangle,
          with: .color(.black.opacity(0.35 * messiness)),
          style: StrokeStyle(lineWidth: 3, lineJoin: .round)
        )
      }
    }

    // Debris stuck in the walk-in hair.
    if messiness > 0.45 {
      if client.debris == .leaf {
        context.draw(Text("🍂").font(.system(size: 24)), at: CGPoint(x: 204, y: 148))
      } else {
        let gum = Path(ellipseIn: CGRect(x: 120 - 9, y: 198 - 9, width: 18, height: 18))
        context.fill(gum, with: .color(Color(hex: "#ff8fc0")))
        context.stroke(gum, with: .color(Self.ink), lineWidth: 2)
        context.fill(
          Path(ellipseIn: CGRect(x: 117 - 2.5, y: 195 - 2.5, width: 5, height: 5)),
          with: .color(.white.opacity(0.8))
        )
      }
    }

    // Accessory (web ACCESSORY_GLYPHS coordinates).
    if look.accessory != SalonAccessory.none {
      let glyph: (x: CGFloat, y: CGFloat, size: CGFloat)
      switch look.accessory {
      case .bow: glyph = (206, 118, 30)
      case .flower: glyph = (112, 118, 28)
      case .clip: glyph = (200, 102, 24)
      case .tiara: glyph = (160, 66, 34)
      case .none: glyph = (0, 0, 0)
      }
      context.draw(
        Text(look.accessory.emoji).font(.system(size: glyph.size)),
        at: CGPoint(x: glyph.x, y: glyph.y)
      )
    }

    // Stray strands to snip (snipped ones vanish, like the web fade-out).
    for stray in strays where !stray.snipped {
      var strand = Path()
      strand.move(to: CGPoint(x: stray.x, y: stray.y))
      strand.addQuadCurve(
        to: CGPoint(x: stray.x + 26 * stray.direction, y: stray.y - 6),
        control: CGPoint(x: stray.x + 12 * stray.direction, y: stray.y - 10)
      )
      strand.addQuadCurve(
        to: CGPoint(x: stray.x + 42 * stray.direction, y: stray.y + 4),
        control: CGPoint(x: stray.x + 36 * stray.direction, y: stray.y - 4)
      )
      context.stroke(
        strand,
        with: .color(Color(hex: look.color.fillHex)),
        style: StrokeStyle(lineWidth: 4, lineCap: .round)
      )
      context.draw(
        Text("✂️").font(.system(size: 20)),
        at: CGPoint(x: stray.x + 36 * stray.direction, y: stray.y - 14)
      )
    }

    // Wash bubbles (radius shrinks as they get scrubbed, like the web).
    for bubble in bubbles where !bubble.isPopped {
      let r = bubble.r * (1 - 0.2 * Double(bubble.scrubs))
      let circle = Path(ellipseIn: CGRect(
        x: bubble.x - r, y: bubble.y - r, width: r * 2, height: r * 2
      ))
      context.fill(circle, with: .color(Color(hex: "#d6f2ff").opacity(0.8)))
      context.stroke(circle, with: .color(Color(hex: "#8fcdea")), lineWidth: 2)
      let shineR = r / 4
      context.fill(
        Path(ellipseIn: CGRect(
          x: bubble.x - r / 3 - shineR, y: bubble.y - r / 3 - shineR,
          width: shineR * 2, height: shineR * 2
        )),
        with: .color(.white.opacity(0.9))
      )
    }

    // Shine sparkles.
    for sparkle in sparkles {
      context.draw(
        Text("✦")
          .font(.system(size: sparkle.size))
          .foregroundStyle(Color(hex: "#ffd76e")),
        at: CGPoint(x: sparkle.x, y: sparkle.y)
      )
    }
  }
}

// MARK: - Hairdo geometry

/// Hair silhouette paths for a `{length, texture}` pair — the native twin of
/// the web `buildHairdo` in `ClientHead.tsx`, with the same landmarks:
/// side edges at x 88/232 from y 150, the dome over the top of the head, the
/// per-length bottom edge, curly scallops / wavy S-curves on the edges, an
/// updo bun above the head, and braid bead columns.
enum SalonHairdoBuilder {
  struct Hairdo {
    /// Main silhouette behind the face.
    let back: Path
    /// Fringe drawn over the forehead.
    let front: Path
    /// Extra blobs: updo bun or braid beads (ellipse bounding rects).
    let lobes: [CGRect]
  }

  private static let cx: CGFloat = 160
  private static let sideLeft = CGFloat(SalonEngine.hairSideLeft)
  private static let sideRight = CGFloat(SalonEngine.hairSideRight)
  private static let sideTop: CGFloat = 150
  private static let domeTop: CGFloat = 76

  static func build(length: SalonHairLength, texture: SalonHairTexture) -> Hairdo {
    if texture == .updo {
      let bunRadius: CGFloat = length == .short ? 18 : length == .medium ? 24 : 30
      return Hairdo(
        back: capPath(bottomY: 196),
        front: fringePath(),
        lobes: [CGRect(
          x: cx - bunRadius, y: 58 - bunRadius * 0.85,
          width: bunRadius * 2, height: bunRadius * 1.7
        )]
      )
    }
    if texture == .braids {
      let bottom = CGFloat(length.silhouetteBottom)
      var lobes: [CGRect] = []
      for side in [CGFloat(-1), CGFloat(1)] {
        var index = 0
        var y: CGFloat = 208
        while y <= bottom {
          let beadX = cx + side * 62 + side * (index % 2 == 0 ? 4 : -4)
          lobes.append(CGRect(x: beadX - 12, y: y - 14, width: 24, height: 28))
          index += 1
          y += 24
        }
      }
      return Hairdo(back: capPath(bottomY: 206), front: fringePath(), lobes: lobes)
    }

    let bottom = CGFloat(length.silhouetteBottom)
    var path = Path()
    path.move(to: CGPoint(x: sideLeft, y: bottom))
    appendTexturedV(&path, x: sideLeft, fromY: bottom, toY: sideTop, texture: texture, outward: -1)
    appendDome(&path)
    appendTexturedV(&path, x: sideRight, fromY: sideTop, toY: bottom, texture: texture, outward: 1)
    appendTexturedH(&path, y: bottom, fromX: sideRight, toX: sideLeft, texture: texture)
    path.closeSubpath()
    return Hairdo(back: path, front: fringePath(), lobes: [])
  }

  /// Crown of the hair, shared by every hairdo (web `DOME`).
  private static func appendDome(_ path: inout Path) {
    path.addCurve(
      to: CGPoint(x: cx, y: domeTop),
      control1: CGPoint(x: sideLeft, y: 96),
      control2: CGPoint(x: 118, y: domeTop)
    )
    path.addCurve(
      to: CGPoint(x: sideRight, y: sideTop),
      control1: CGPoint(x: 202, y: domeTop),
      control2: CGPoint(x: sideRight, y: 96)
    )
  }

  /// Vertical hair edge at `x`; curly scallops or wavy S-curves bulge
  /// `outward` (web `texturedV`).
  private static func appendTexturedV(
    _ path: inout Path, x: CGFloat, fromY: CGFloat, toY: CGFloat,
    texture: SalonHairTexture, outward: CGFloat
  ) {
    guard texture == .curly || texture == .waves else {
      path.addLine(to: CGPoint(x: x, y: toY))
      return
    }
    let step: CGFloat = texture == .curly ? 20 : 36
    let amp: CGFloat = texture == .curly ? 14 : 9
    let dir: CGFloat = fromY < toY ? 1 : -1
    var y = fromY
    var flip: CGFloat = 1
    while dir > 0 ? y < toY : y > toY {
      let next = dir > 0 ? min(y + step, toY) : max(y - step, toY)
      let offset = texture == .waves ? amp * outward * flip : amp * outward
      path.addQuadCurve(
        to: CGPoint(x: x, y: next),
        control: CGPoint(x: x + offset, y: (y + next) / 2)
      )
      flip = -flip
      y = next
    }
  }

  /// Bottom hair edge at height `y`, walking `fromX` to `toX` (web `texturedH`).
  private static func appendTexturedH(
    _ path: inout Path, y: CGFloat, fromX: CGFloat, toX: CGFloat, texture: SalonHairTexture
  ) {
    guard texture == .curly || texture == .waves else {
      path.addQuadCurve(to: CGPoint(x: toX, y: y), control: CGPoint(x: cx, y: y + 16))
      return
    }
    let step: CGFloat = texture == .curly ? 22 : 40
    let amp: CGFloat = texture == .curly ? 15 : 10
    let dir: CGFloat = fromX < toX ? 1 : -1
    var x = fromX
    var flip: CGFloat = 1
    while dir > 0 ? x < toX : x > toX {
      let next = dir > 0 ? min(x + step, toX) : max(x - step, toX)
      let offset = texture == .waves ? amp * flip : amp
      path.addQuadCurve(
        to: CGPoint(x: next, y: y),
        control: CGPoint(x: (x + next) / 2, y: y + offset)
      )
      flip = -flip
      x = next
    }
  }

  /// A short cap of hair hugging the head, used by updo and braids.
  private static func capPath(bottomY: CGFloat) -> Path {
    var path = Path()
    path.move(to: CGPoint(x: sideLeft, y: bottomY))
    path.addLine(to: CGPoint(x: sideLeft, y: sideTop))
    appendDome(&path)
    path.addLine(to: CGPoint(x: sideRight, y: bottomY))
    path.addQuadCurve(
      to: CGPoint(x: sideLeft, y: bottomY), control: CGPoint(x: cx, y: bottomY + 18)
    )
    path.closeSubpath()
    return path
  }

  /// Fringe over the forehead (web `FRINGE` path, hand-converted).
  private static func fringePath() -> Path {
    var path = Path()
    path.move(to: CGPoint(x: 98, y: 150))
    path.addCurve(
      to: CGPoint(x: 160, y: 88),
      control1: CGPoint(x: 100, y: 104), control2: CGPoint(x: 124, y: 88)
    )
    path.addCurve(
      to: CGPoint(x: 222, y: 150),
      control1: CGPoint(x: 196, y: 88), control2: CGPoint(x: 220, y: 104)
    )
    path.addQuadCurve(to: CGPoint(x: 184, y: 114), control: CGPoint(x: 208, y: 120))
    path.addQuadCurve(to: CGPoint(x: 160, y: 132), control: CGPoint(x: 174, y: 134))
    path.addQuadCurve(to: CGPoint(x: 136, y: 114), control: CGPoint(x: 146, y: 134))
    path.addQuadCurve(to: CGPoint(x: 98, y: 150), control: CGPoint(x: 112, y: 120))
    path.closeSubpath()
    return path
  }

  /// Zigzag tangle strands overlaid while the hair is messy (web `TANGLES`,
  /// relative line commands resolved to absolute points).
  static let tangles: [Path] = [
    polyline([(100, 120), (114, 130), (104, 142), (120, 151), (108, 163)]),
    polyline([(196, 108), (182, 120), (197, 128), (185, 141), (201, 149)]),
    polyline([(92, 210), (104, 224), (90, 234), (103, 248), (92, 260), (106, 272)]),
    polyline([(226, 200), (214, 214), (228, 225), (215, 238), (227, 250), (213, 262)]),
    polyline([(148, 90), (160, 100), (146, 108), (158, 118)]),
  ]

  private static func polyline(_ points: [(CGFloat, CGFloat)]) -> Path {
    var path = Path()
    guard let first = points.first else { return path }
    path.move(to: CGPoint(x: first.0, y: first.1))
    for point in points.dropFirst() {
      path.addLine(to: CGPoint(x: point.0, y: point.1))
    }
    return path
  }
}

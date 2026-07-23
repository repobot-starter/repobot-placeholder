import SwiftUI

/// Home surface for the `cabin` pack — the native twin of the web `CabinPage`.
/// Purely client-side: cabin projects have no backend, so this view must never
/// touch stores, components, or the network.
///
/// Art approach: the web page draws a DOM airliner console; visual parity is
/// not required here, so this port keeps the same *ingredients* (sky-blue
/// backdrop, fuselage-white seat map, emoji passengers, chunky monospace
/// controls) using plain SwiftUI views. Patience meters become rings drawn
/// with `Circle().trim`, the galley tray is a horizontal scroller, and the
/// runner is a button hopping along the aisle column. `TimelineView` drives
/// the frame clock while the engine lives in a reference-typed session, so
/// per-frame simulation never churns SwiftUI state.
struct CabinGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  /// Reference-typed frame state so the render loop can mutate the engine
  /// without invalidating the SwiftUI view tree every frame.
  @State private var session = CabinSession()
  @State private var difficulty: CabinDifficulty = .crew
  /// Galley item currently "in hand"; tapping a seat serves it.
  @State private var heldItem: CabinItem?

  var body: some View {
    TimelineView(.animation(minimumInterval: 1 / 60)) { timeline in
      let _ = session.tick(now: timeline.date)
      content
    }
    .background(CabinPalette.skyGradient.ignoresSafeArea())
  }

  private var content: some View {
    let engine = session.engine
    return VStack(spacing: theme.spacing.sm) {
      Text("🤖 CABINBOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
        .foregroundStyle(CabinPalette.ink)
        .padding(.top, theme.spacing.sm)

      toolbar

      CabinProgressBar(progress: engine.flightProgress)
        .padding(.horizontal, theme.spacing.md)

      ZStack {
        CabinSeatMapView(session: session, heldItem: $heldItem)

        if let announcement = engine.announcement {
          VStack {
            CabinBannerView(text: announcement)
            Spacer()
          }
          .padding(theme.spacing.sm)
        }

        // Countdown overlays ported from the web: paparazzi flash + cookie glow.
        Color.white
          .opacity(0.85 * engine.paparazziMs / CabinTuning.celebrityFlashMs)
          .allowsHitTesting(false)
        Color.yellow
          .opacity(0.3 * engine.cookieGlowMs / CabinTuning.grandmaGlowMs)
          .allowsHitTesting(false)

        if engine.phase == .idle {
          CabinOverlayCard(
            title: "✈️ Welcome aboard!",
            message: "Passengers pop requests over their seats. Grab the right item from the "
              + "galley tray, tap the seat to serve it, and keep the whole cabin smiling "
              + "until touchdown.",
            buttonLabel: "🛫 Start Flight",
            action: startFlight
          )
        }

        if engine.phase == .landed {
          CabinLandedCard(
            stars: engine.stars,
            served: engine.served,
            missed: engine.missed,
            happiness: engine.cabinHappiness,
            isBest: engine.stars >= session.bestRating && engine.stars > 0,
            action: startFlight
          )
        }
      }
      .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
          .stroke(CabinPalette.ink, lineWidth: 2)
      )
      .padding(.horizontal, theme.spacing.md)

      galleyTray

      statusBar
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }

  private func startFlight() {
    session.engine.newFlight(difficulty: difficulty)
    session.engine.beginBoarding()
    heldItem = nil
  }

  private var toolbar: some View {
    let engine = session.engine
    let flightActive = engine.phase == .boarding || engine.phase == .cruise
    return HStack(spacing: theme.spacing.sm) {
      Button("🛫 Start Flight", action: startFlight)
        .buttonStyle(CabinChunkyButtonStyle(isLit: false))

      ForEach(CabinDifficulty.allCases) { level in
        Button(level.rawValue.capitalized) {
          difficulty = level
        }
        .buttonStyle(CabinChunkyButtonStyle(isLit: difficulty == level))
        .disabled(flightActive)
      }

      Spacer(minLength: 0)

      Text("BEST \(session.bestRating > 0 ? starString(session.bestRating) : "—")")
        .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
        .foregroundStyle(CabinPalette.ink)
    }
    .padding(.horizontal, theme.spacing.md)
  }

  /// The five web galley items; tap to pick one up, tap again to put it down.
  private var galleyTray: some View {
    let engine = session.engine
    return ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: theme.spacing.sm) {
        Text("GALLEY")
          .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
          .foregroundStyle(CabinPalette.ink.opacity(0.7))

        ForEach(CabinItem.allCases) { item in
          Button {
            heldItem = heldItem == item ? nil : item
          } label: {
            VStack(spacing: 2) {
              Text(item.emoji).font(.system(size: 24))
              Text(item.label)
                .font(.system(size: 10, weight: .bold, design: .monospaced))
                .foregroundStyle(CabinPalette.ink)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
              RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
                .fill(heldItem == item ? CabinPalette.brand.opacity(0.35) : CabinPalette.fuselage)
                .overlay(
                  RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
                    .stroke(
                      heldItem == item ? CabinPalette.brand : CabinPalette.ink.opacity(0.4),
                      lineWidth: heldItem == item ? 2 : 1
                    )
                )
            )
          }
          .disabled(engine.phase != .cruise)
          .opacity(engine.phase == .cruise ? 1 : 0.5)
        }

        CabinHappinessMeter(happiness: engine.cabinHappiness)
      }
      .padding(.horizontal, theme.spacing.md)
    }
  }

  private var statusBar: some View {
    let engine = session.engine
    return HStack {
      Text("● \(phaseLabel(engine.phase))")
      Spacer()
      Text("ALT \(engine.altitudeFt.formatted()) FT")
      Spacer()
      Text("SERVED \(engine.served) · MISSED \(engine.missed)")
    }
    .font(.system(size: theme.typography.sizes.xs, weight: .semibold, design: .monospaced))
    .foregroundStyle(CabinPalette.ink)
    .padding(.horizontal, theme.spacing.md)
    .padding(.bottom, theme.spacing.sm)
  }

  private func phaseLabel(_ phase: CabinPhase) -> String {
    switch phase {
    case .idle: return "AT GATE."
    case .boarding: return "BOARDING."
    case .cruise: return "CRUISING."
    case .landed: return "LANDED."
    }
  }
}

/// Frame-loop state that must survive view updates but must not trigger them:
/// the engine, the previous frame timestamp, and the persisted best rating.
final class CabinSession {
  static let bestRatingKey = "cabin.bestRating"

  let engine = CabinEngine()
  var lastFrameTime: Date?
  /// Best star rating so far, persisted like the web's localStorage key.
  private(set) var bestRating = UserDefaults.standard.integer(forKey: CabinSession.bestRatingKey)

  /// Step the engine by the wall-clock dt (clamped to 100ms like the web
  /// loop, so backgrounding never fast-forwards the flight).
  func tick(now: Date) {
    let dt: Double
    if let last = lastFrameTime {
      dt = min(0.1, now.timeIntervalSince(last))
    } else {
      dt = 0
    }
    lastFrameTime = now
    _ = engine.step(dt: dt)
    if engine.phase == .landed, engine.stars > bestRating {
      bestRating = engine.stars
      UserDefaults.standard.set(bestRating, forKey: Self.bestRatingKey)
    }
  }
}

/// Colors lifted from the web `CabinPage.styles.css.ts` palette so the cabin
/// keeps its daylight airliner identity on both app themes.
enum CabinPalette {
  static let sky = Color(hex: "#8ecdf3")
  static let skyDeep = Color(hex: "#4f9fd9")
  static let fuselage = Color(hex: "#f2f8fd")
  static let fuselageDark = Color(hex: "#dcebf7")
  static let ink = Color(hex: "#1b3a57")
  static let brand = Color(hex: "#1f6fb2")
  static let good = Color(hex: "#2e9e5b")
  static let warn = Color(hex: "#e8912d")
  static let bad = Color(hex: "#d64550")

  static var skyGradient: LinearGradient {
    LinearGradient(
      colors: [skyDeep, sky, Color(hex: "#d9eefb")],
      startPoint: .top,
      endPoint: .bottom
    )
  }

  /// Meter color by remaining fraction — the web `barColor` thresholds.
  static func barColor(_ fraction: Double) -> Color {
    if fraction >= 0.6 { return good }
    return fraction >= 0.3 ? warn : bad
  }
}

private func starString(_ stars: Int) -> String {
  String(repeating: "★", count: stars) + String(repeating: "☆", count: 5 - stars)
}

/// Overall 🛫→🛬 flight progress with the little plane riding the fill edge.
private struct CabinProgressBar: View {
  let progress: Double

  var body: some View {
    HStack(spacing: 6) {
      Text("🛫")
      GeometryReader { proxy in
        ZStack(alignment: .leading) {
          Capsule().fill(CabinPalette.fuselageDark)
          Capsule()
            .fill(CabinPalette.brand)
            .frame(width: max(8, proxy.size.width * progress))
          Text("✈️")
            .font(.system(size: 14))
            .offset(x: max(0, proxy.size.width * progress - 10), y: -3)
        }
      }
      .frame(height: 10)
      Text("🛬")
    }
    .font(.system(size: 14))
  }
}

/// The seat map: 5 rows x (2 seats, aisle, 2 seats), plus the runner darting
/// along the aisle when that event is live.
private struct CabinSeatMapView: View {
  let session: CabinSession
  @Binding var heldItem: CabinItem?

  var body: some View {
    let engine = session.engine
    ZStack {
      CabinPalette.fuselage

      VStack(spacing: 10) {
        ForEach(0..<CabinEngine.rows, id: \.self) { row in
          HStack(spacing: 8) {
            seat(row: row, seat: 0)
            seat(row: row, seat: 1)
            Text("\(row + 1)")
              .font(.system(size: 12, weight: .bold, design: .monospaced))
              .foregroundStyle(CabinPalette.ink.opacity(0.5))
              .frame(width: 28)
            seat(row: row, seat: 2)
            seat(row: row, seat: 3)
          }
        }
      }
      .padding(.vertical, 14)

      if let runner = engine.passengers.first(where: { $0.running }) {
        GeometryReader { proxy in
          Button {
            _ = engine.grabRunner(passengerId: runner.id)
          } label: {
            Text("🏃")
              .font(.system(size: 30))
              .padding(6)
              .background(Circle().fill(CabinPalette.warn.opacity(0.4)))
          }
          .position(
            x: proxy.size.width / 2,
            y: proxy.size.height * (0.1 + runner.aislePos * 0.8)
          )
        }
      }
    }
  }

  private func seat(row: Int, seat: Int) -> some View {
    let passenger = session.engine.passengers[row * CabinEngine.seatsPerRow + seat]
    return CabinSeatView(
      passenger: passenger,
      onTap: {
        guard session.engine.phase == .cruise else { return }
        if let item = heldItem {
          let result = session.engine.serveItem(passengerId: passenger.id, item: item)
          if result.correct {
            heldItem = nil
          }
        }
      },
      onChatPressChange: { pressing in
        if pressing {
          session.engine.startChat(passengerId: passenger.id)
        } else {
          session.engine.stopChatting()
        }
      }
    )
  }
}

/// One seat: emoji passenger, request bubble with a patience ring, happiness
/// bar, role badges, and grandma's press-and-hold chat progress ring.
private struct CabinSeatView: View {
  let passenger: CabinPassenger
  let onTap: () -> Void
  let onChatPressChange: (Bool) -> Void

  private var faceText: String {
    switch passenger.mood {
    case .happy: return "😄"
    case .upset: return "😠"
    case nil: return passenger.face
    }
  }

  var body: some View {
    let away = !passenger.boarded || passenger.running
    VStack(spacing: 3) {
      ZStack(alignment: .topTrailing) {
        RoundedRectangle(cornerRadius: 8, style: .continuous)
          .fill(away ? CabinPalette.fuselageDark : Color.white)
          .overlay(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
              .stroke(CabinPalette.ink.opacity(away ? 0.2 : 0.5), lineWidth: 1)
          )
          .frame(width: 52, height: 46)
          .overlay(Text(away ? "💺" : faceText).font(.system(size: 26)))

        if !away, let request = passenger.request {
          CabinRequestBadge(request: request)
            .offset(x: 10, y: -12)
        }
        if !away, passenger.role == .celebrity {
          Text("⭐").font(.system(size: 12)).offset(x: 4, y: 30)
        }
        if !away, passenger.role == .grandma, passenger.needsChat {
          CabinChatRing(fraction: passenger.chatMs / CabinTuning.grandmaChatMs)
            .offset(x: -38, y: -8)
        }
      }

      if !away {
        Capsule()
          .fill(CabinPalette.barColor(passenger.happiness / 100))
          .frame(width: 44 * passenger.happiness / 100, height: 3)
          .frame(width: 44, alignment: .leading)
          .background(Capsule().fill(CabinPalette.ink.opacity(0.15)))
      } else {
        Color.clear.frame(width: 44, height: 3)
      }
    }
    .contentShape(Rectangle())
    .onTapGesture(perform: onTap)
    .onLongPressGesture(
      minimumDuration: .infinity,
      perform: {},
      onPressingChanged: onChatPressChange
    )
  }
}

/// Request bubble: the wanted item's emoji ringed by the remaining patience.
private struct CabinRequestBadge: View {
  let request: CabinRequest

  var body: some View {
    let fraction = max(0, request.remainingMs / request.totalMs)
    ZStack {
      Circle().fill(Color.white)
      Circle()
        .trim(from: 0, to: fraction)
        .stroke(CabinPalette.barColor(fraction), style: StrokeStyle(lineWidth: 3, lineCap: .round))
        .rotationEffect(.degrees(-90))
      Text(request.item.emoji).font(.system(size: 13))
    }
    .frame(width: 26, height: 26)
    .shadow(color: CabinPalette.ink.opacity(0.3), radius: 1, y: 1)
  }
}

/// Grandma's chat indicator: 💬 wrapped in a hold-progress ring.
private struct CabinChatRing: View {
  let fraction: Double

  var body: some View {
    ZStack {
      Circle().fill(CabinPalette.fuselageDark)
      Circle()
        .trim(from: 0, to: min(1, fraction))
        .stroke(CabinPalette.brand, style: StrokeStyle(lineWidth: 3, lineCap: .round))
        .rotationEffect(.degrees(-90))
      Text("💬").font(.system(size: 11))
    }
    .frame(width: 22, height: 22)
  }
}

/// Intercom announcement banner pinned to the top of the scene.
private struct CabinBannerView: View {
  let text: String

  var body: some View {
    Text(text)
      .font(.system(size: 12, weight: .bold, design: .monospaced))
      .foregroundStyle(Color(hex: "#9fdcff"))
      .multilineTextAlignment(.center)
      .padding(.horizontal, 12)
      .padding(.vertical, 8)
      .background(
        RoundedRectangle(cornerRadius: 8, style: .continuous)
          .fill(Color(hex: "#12283a").opacity(0.92))
      )
  }
}

/// Cabin-wide happiness readout for the galley row.
private struct CabinHappinessMeter: View {
  let happiness: Int

  var body: some View {
    HStack(spacing: 6) {
      Text(happiness >= 60 ? "😊" : happiness >= 30 ? "😐" : "😡")
      Capsule()
        .fill(CabinPalette.barColor(Double(happiness) / 100))
        .frame(width: 60 * Double(happiness) / 100, height: 6)
        .frame(width: 60, alignment: .leading)
        .background(Capsule().fill(CabinPalette.ink.opacity(0.15)))
      Text("\(happiness)%")
        .font(.system(size: 11, weight: .bold, design: .monospaced))
        .foregroundStyle(CabinPalette.ink)
    }
  }
}

/// Pre-flight welcome card (the web idle overlay).
private struct CabinOverlayCard: View {
  let title: String
  let message: String
  let buttonLabel: String
  let action: () -> Void

  var body: some View {
    VStack(spacing: 12) {
      Text(title)
        .font(.system(size: 18, weight: .bold, design: .monospaced))
        .foregroundStyle(CabinPalette.ink)
      Text(message)
        .font(.system(size: 12, design: .monospaced))
        .foregroundStyle(CabinPalette.ink.opacity(0.7))
        .multilineTextAlignment(.center)
      Button(buttonLabel, action: action)
        .buttonStyle(CabinChunkyButtonStyle(isLit: true))
    }
    .padding(20)
    .background(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .fill(CabinPalette.fuselage)
        .overlay(
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .stroke(CabinPalette.ink, lineWidth: 2)
        )
    )
    .padding(24)
  }
}

/// End-of-flight star rating card (the web landed overlay).
private struct CabinLandedCard: View {
  let stars: Int
  let served: Int
  let missed: Int
  let happiness: Int
  let isBest: Bool
  let action: () -> Void

  var body: some View {
    VStack(spacing: 12) {
      Text("🛬 Landed!")
        .font(.system(size: 18, weight: .bold, design: .monospaced))
        .foregroundStyle(CabinPalette.ink)
      Text(starString(stars))
        .font(.system(size: 30))
        .foregroundStyle(CabinPalette.warn)
      HStack(spacing: 20) {
        stat(label: "SERVED", value: "\(served)")
        stat(label: "MISSED", value: "\(missed)")
        stat(label: "CABIN", value: "\(happiness)%")
      }
      if isBest {
        Text("🏅 Best rating so far!")
          .font(.system(size: 12, design: .monospaced))
          .foregroundStyle(CabinPalette.ink.opacity(0.7))
      }
      Button("⟳ Fly Again", action: action)
        .buttonStyle(CabinChunkyButtonStyle(isLit: true))
    }
    .padding(20)
    .background(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .fill(CabinPalette.fuselage)
        .overlay(
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .stroke(CabinPalette.ink, lineWidth: 2)
        )
    )
    .padding(24)
  }

  private func stat(label: String, value: String) -> some View {
    VStack(spacing: 2) {
      Text(label)
        .font(.system(size: 10, weight: .bold, design: .monospaced))
        .foregroundStyle(CabinPalette.ink.opacity(0.6))
      Text(value)
        .font(.system(size: 16, weight: .bold, design: .monospaced))
        .foregroundStyle(CabinPalette.ink)
    }
  }
}

/// Chunky console button echoing the web page's toolbar buttons.
private struct CabinChunkyButtonStyle: ButtonStyle {
  let isLit: Bool

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 12, weight: .bold, design: .monospaced))
      .foregroundStyle(isLit ? Color.white : CabinPalette.ink)
      .padding(.horizontal, 12)
      .padding(.vertical, 8)
      .background(
        RoundedRectangle(cornerRadius: 6, style: .continuous)
          .fill(
            isLit
              ? CabinPalette.brand
              : (configuration.isPressed ? CabinPalette.fuselageDark : CabinPalette.fuselage)
          )
          .overlay(
            RoundedRectangle(cornerRadius: 6, style: .continuous)
              .stroke(CabinPalette.ink, lineWidth: 1)
          )
      )
  }
}

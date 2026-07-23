import Foundation

// MARK: - Look vocabulary
//
// These enums are the native twin of the web content tables in
// `web/app/src/View/Games/Salon/clients.ts`. Case order matters: client
// generation picks by index (`floor(random * count)`), so keeping the same
// order as the web arrays keeps the two ports statistically identical.

/// Hair lengths, in the web `HAIR_LENGTHS` order.
enum SalonHairLength: String, CaseIterable, Equatable {
  case short
  case medium
  case long

  /// Display label (web `LENGTH_LABELS`).
  var label: String {
    switch self {
    case .short: return "Short"
    case .medium: return "Medium"
    case .long: return "Long"
    }
  }

  /// Bottom y of the hair silhouette in head-view coordinates
  /// (web `BOTTOM_BY_LENGTH` in `ClientHead.tsx`). The engine needs it to
  /// place stray strands; the view reuses it to draw the hairdo.
  var silhouetteBottom: Double {
    switch self {
    case .short: return 222
    case .medium: return 272
    case .long: return 324
    }
  }
}

/// Dye colors, in the web `HAIR_COLORS` order. Fill/highlight are hex strings
/// (web `DYE_SWATCHES`) so the engine stays free of UI framework types.
enum SalonHairColor: String, CaseIterable, Equatable {
  case pink
  case blue
  case blonde
  case brown
  case black
  case red
  case purple
  case mint

  var label: String {
    switch self {
    case .pink: return "Pink"
    case .blue: return "Blue"
    case .blonde: return "Blonde"
    case .brown: return "Brown"
    case .black: return "Black"
    case .red: return "Red"
    case .purple: return "Purple"
    case .mint: return "Mint"
    }
  }

  /// Main hair fill color (web `DYE_SWATCHES[...].fill`).
  var fillHex: String {
    switch self {
    case .pink: return "#f06eaa"
    case .blue: return "#4f8fe6"
    case .blonde: return "#f2c94c"
    case .brown: return "#8a5a33"
    case .black: return "#3a3540"
    case .red: return "#cf4b32"
    case .purple: return "#9a6fd0"
    case .mint: return "#58c9a2"
    }
  }

  /// Shine streak color (web `DYE_SWATCHES[...].highlight`).
  var highlightHex: String {
    switch self {
    case .pink: return "#ffb8d9"
    case .blue: return "#a8ccf5"
    case .blonde: return "#ffe9a8"
    case .brown: return "#c08a55"
    case .black: return "#6e6879"
    case .red: return "#f0855f"
    case .purple: return "#cdb0ee"
    case .mint: return "#a8ebd2"
    }
  }
}

/// Styles, in the web `HAIR_TEXTURES` order (web `TEXTURE_LABELS`).
enum SalonHairTexture: String, CaseIterable, Equatable {
  case straight
  case curly
  case waves
  case updo
  case braids

  var label: String {
    switch self {
    case .straight: return "Straight"
    case .curly: return "Curly"
    case .waves: return "Waves"
    case .updo: return "Updo"
    case .braids: return "Braids"
    }
  }

  var emoji: String {
    switch self {
    case .straight: return "💇"
    case .curly: return "➿"
    case .waves: return "🌊"
    case .updo: return "🍥"
    case .braids: return "🪢"
    }
  }
}

/// Accessories, in the web `ACCESSORIES` order (web `ACCESSORY_META`).
/// `none` is a real pickable option at the finish station; a client request
/// with no accessory wish is modeled as `nil` instead (like web `null`).
enum SalonAccessory: String, CaseIterable, Equatable {
  case bow
  case flower
  case clip
  case tiara
  case none

  var label: String {
    switch self {
    case .bow: return "Bow"
    case .flower: return "Flower"
    case .clip: return "Clip"
    case .tiara: return "Tiara"
    case .none: return "None"
    }
  }

  var emoji: String {
    switch self {
    case .bow: return "🎀"
    case .flower: return "💐"
    case .clip: return "⭐"
    case .tiara: return "👑"
    case .none: return "🙅"
    }
  }
}

// MARK: - Client model

/// A complete hairdo as rendered on a client's head (web `HairLook`).
struct SalonHairLook: Equatable {
  var length: SalonHairLength
  var color: SalonHairColor
  var texture: SalonHairTexture
  var accessory: SalonAccessory
}

/// What the client asks for. `accessory` is nil when they have no wish
/// (web `ClientRequest` with its nullable accessory).
struct SalonClientRequest: Equatable {
  let length: SalonHairLength
  let color: SalonHairColor
  let texture: SalonHairTexture
  let accessory: SalonAccessory?
}

enum SalonSmile: String, Equatable {
  case soft
  case wide
}

/// What is stuck in the tangled walk-in hair.
enum SalonDebris: String, Equatable {
  case leaf
  case gum
}

/// One customer: face parameters, the messy walk-in look, and a request card
/// (web `Client`). Skin/eye colors are hex strings straight from the web
/// tables; views convert them to platform colors.
struct SalonClient: Equatable {
  let name: String
  let skinToneHex: String
  let eyeColorHex: String
  let smile: SalonSmile
  /// The tangled hairdo they walk in with.
  let startLook: SalonHairLook
  let debris: SalonDebris
  let request: SalonClientRequest
}

// MARK: - Station mini-game state

/// One soap bubble at the wash station (web `Bubble`). Coordinates are in the
/// 320x360 head-view space. A bubble pops after `SalonEngine.scrubsToPop`
/// scrub passes.
struct SalonWashBubble: Equatable, Identifiable {
  let id: Int
  let x: Double
  let y: Double
  let r: Double
  var scrubs: Int

  var isPopped: Bool { scrubs >= SalonEngine.scrubsToPop }
}

/// One stray strand poking out of the freshly cut silhouette (web `Stray`).
/// `direction` is +1 (right side) or -1 (left side).
struct SalonStrayStrand: Equatable, Identifiable {
  let id: Int
  let x: Double
  let y: Double
  let direction: Double
  var snipped: Bool
}

/// A shine-spritz sparkle (web `Sparkle`). Purely cosmetic; `delayMs` is the
/// web's animation stagger and may be ignored by a static renderer.
struct SalonSparkle: Equatable, Identifiable {
  let id: Int
  let x: Double
  let y: Double
  let size: Double
  let delayMs: Double
}

// MARK: - Scoring

/// Per-attribute match breakdown (web `Score`). `accessoryMatch` is nil when
/// the client had no accessory wish, in which case `max` shrinks by one match.
struct SalonScore: Equatable {
  let lengthMatch: Bool
  let colorMatch: Bool
  let textureMatch: Bool
  let accessoryMatch: Bool?
  let washBonus: Int
  let total: Int
  let max: Int
}

/// How the client feels about their reveal (web `Mood` + `REACTIONS`).
enum SalonMood: String, Equatable {
  case delighted
  case happy
  case grimace

  var emoji: String {
    switch self {
    case .delighted: return "😍"
    case .happy: return "🙂"
    case .grimace: return "😬"
    }
  }

  /// Reaction lines, verbatim from the web `REACTIONS` table.
  var lines: [String] {
    switch self {
    case .delighted:
      return [
        "I LOVE it! You're a wizard with scissors!",
        "Stunning! I'm never going anywhere else!",
        "Best. Hair. Ever. I could cry!",
      ]
    case .happy:
      return [
        "Pretty nice! I'd come back.",
        "Not exactly what I asked for, but cute!",
        "Solid work, stylist. Solid work.",
      ]
    case .grimace:
      return [
        "Um… did you read my request card?",
        "I asked for WHAT now?",
        "My hat is staying ON, thanks.",
      ]
    }
  }
}

// MARK: - Stations

/// Play flow position (web `Station` union). Progression is strictly linear:
/// wash → cut → color → style → finish → reveal, exactly like the web page.
enum SalonStation: String, CaseIterable, Equatable {
  case wash
  case cut
  case color
  case style
  case finish
  case reveal

  /// The five stations shown in the station strip (reveal is not a tab).
  static let workflow: [SalonStation] = [.wash, .cut, .color, .style, .finish]

  var label: String {
    switch self {
    case .wash: return "Wash"
    case .cut: return "Cut"
    case .color: return "Color"
    case .style: return "Style"
    case .finish: return "Finish"
    case .reveal: return "Reveal"
    }
  }

  var emoji: String {
    switch self {
    case .wash: return "🫧"
    case .cut: return "✂️"
    case .color: return "🎨"
    case .style: return "💈"
    case .finish: return "✨"
    case .reveal: return "🪞"
    }
  }

  /// Player hint (web `STAGE_HINTS`, reworded from mouse to touch).
  var hint: String {
    switch self {
    case .wash: return "Rub the bubbles with your finger (or tap them) to scrub!"
    case .cut: return "Pick a length below, then tap ✂️ on every stray strand"
    case .color: return "Choose a dye swatch — gorgeous!"
    case .style: return "Pick a style and the hair redraws"
    case .finish: return "Accessory? Spritz of shine? Then hit the big reveal!"
    case .reveal: return ""
    }
  }
}

// MARK: - Engine

/// Pure port of the web SalonBot game logic
/// (`web/app/src/View/Games/Salon/clients.ts` for content and scoring, plus
/// the station state machines that `SalonPage.tsx` keeps in React state and
/// the bubble/stray generators from `ClientHead.tsx`). No SwiftUI here: the
/// engine is a plain input-driven state machine so it can be unit-tested
/// headlessly and rendered by any frontend.
///
/// All randomness (client rolls, bubble/stray placement, reaction lines) goes
/// through an injected closure returning values in [0, 1), so tests can make
/// every roll fully deterministic.
final class SalonEngine {
  // Scoring constants — must stay in sync with the web `clients.ts` values.
  /// Points for each request attribute the finished look matches.
  static let pointsPerMatch = 25
  /// Extra points for a perfect scrub at the wash station.
  static let washBonusMax = 25
  /// score/max ratio at or above which the client is delighted (web `moodFor`).
  static let delightedRatio = 0.9
  /// score/max ratio at or above which the client is at least happy.
  static let happyRatio = 0.55
  /// Chance that a client has an accessory wish (web `ACCESSORY_WISH_CHANCE`).
  static let accessoryWishChance = 0.5

  // Mini-game constants — must stay in sync with the web `ClientHead.tsx`.
  /// How many scrub passes pop one wash bubble (web `SCRUBS_TO_POP`).
  static let scrubsToPop = 2
  /// Soap bubbles per wash (web `randomBubbles` length).
  static let bubbleCount = 10
  /// Head-view coordinate space the bubbles/strays are placed in.
  static let headViewWidth: Double = 320
  static let headViewHeight: Double = 360
  /// x of the hair silhouette edges (web `SIDE_LEFT` / `SIDE_RIGHT`); stray
  /// strands sprout from these edges.
  static let hairSideLeft: Double = 88
  static let hairSideRight: Double = 232

  // Content tables, verbatim from `clients.ts` (order matters for `pick`).
  static let names = [
    "Luna", "Milo", "Zoe", "Kai", "Pippa", "Ravi", "Nova", "Theo", "Mimi", "Ozzy", "Ida", "Beau",
  ]
  static let skinTones = ["#ffe0c7", "#f3c9a6", "#e0ac7e", "#c68a5a", "#9c6b43", "#71492c"]
  static let eyeColors = ["#4a3826", "#2f4a6e", "#3c6b4f", "#5a4a7a"]
  /// Walk-in hair colors; requests always ask for something different.
  static let walkInColors: [SalonHairColor] = [.brown, .black, .blonde, .red]

  // MARK: Session state (the web page's React state, minus sound/UI toggles)

  private(set) var client: SalonClient
  /// The hairdo currently on the client's head; mutated station by station.
  private(set) var look: SalonHairLook
  private(set) var station: SalonStation = .wash
  private(set) var bubbles: [SalonWashBubble]
  private(set) var strays: [SalonStrayStrand] = []
  private(set) var sparkles: [SalonSparkle] = []
  private(set) var lengthChosen = false
  private(set) var hasDyed = false
  private(set) var hasStyled = false
  private(set) var score: SalonScore?
  private(set) var mood: SalonMood = .happy
  private(set) var reactionLine = ""
  /// Consecutive non-grimace reveals (web streak; resets on a grimace).
  private(set) var streak = 0
  /// Best streak this session. The web persists it in localStorage; the
  /// native ports keep it in memory only (see PACK.md).
  private(set) var bestStreak = 0
  /// Status-bar message, verbatim web strings.
  private(set) var status = "A new client sits down. Read the request card!"

  private let random: () -> Double
  /// Monotonic id source for sparkles (web uses `Date.now()`; a counter keeps
  /// the engine pure).
  private var sparkleStamp = 0

  init(random: @escaping () -> Double = { Double.random(in: 0..<1) }) {
    self.random = random
    let fresh = Self.rollClient(random: random)
    self.client = fresh
    self.look = fresh.startLook
    self.bubbles = Self.rollBubbles(random: random)
  }

  // MARK: Derived state (web SalonPage derived consts)

  /// Fraction of bubbles popped; 1 when there are none (web `cleanliness`).
  var cleanliness: Double {
    guard !bubbles.isEmpty else { return 1 }
    let popped = bubbles.filter { $0.isPopped }.count
    return Double(popped) / Double(bubbles.count)
  }

  /// 0 = freshly washed, 1 = just walked in; forced clean at the reveal.
  var messiness: Double {
    station == .reveal ? 0 : 1 - cleanliness
  }

  var straysLeft: Int {
    strays.filter { !$0.snipped }.count
  }

  /// The cut station is done once a length is chosen and every stray snipped.
  var cutDone: Bool {
    lengthChosen && straysLeft == 0
  }

  // MARK: Wash station

  /// One scrub pass over a bubble (web `handleScrub`; a touch enter or tap is
  /// one pass). Returns true when this pass popped the bubble. Popping every
  /// bubble auto-advances to the cut station, like the web.
  @discardableResult
  func scrub(bubbleID: Int) -> Bool {
    guard station == .wash,
          let index = bubbles.firstIndex(where: { $0.id == bubbleID }),
          !bubbles[index].isPopped
    else { return false }

    bubbles[index].scrubs += 1
    let popped = bubbles[index].isPopped
    if bubbles.allSatisfy({ $0.isPopped }) {
      station = .cut
      status = "Squeaky clean! On to the cut. ✂️"
    } else {
      status = "Scrub-a-dub…"
    }
    return popped
  }

  // MARK: Cut station

  /// Choose the target length (web `chooseLength`): sets the look's length
  /// and rolls a fresh batch of 2-3 stray strands to snip. Re-picking a
  /// length re-rolls the strays, exactly like the web.
  func chooseLength(_ length: SalonHairLength) {
    guard station == .cut else { return }
    look.length = length
    strays = Self.rollStrays(length: length, random: random)
    lengthChosen = true
    status = "Nice cut — now snip those stray strands!"
  }

  /// Snip one stray strand (web `handleSnip`).
  func snip(strayID: Int) {
    guard station == .cut,
          let index = strays.firstIndex(where: { $0.id == strayID }),
          !strays[index].snipped
    else { return }

    strays[index].snipped = true
    let remaining = straysLeft
    status = remaining == 0
      ? "Sharp! Ready for color."
      : "\(remaining) stray strand\(remaining == 1 ? "" : "s") left…"
  }

  /// Leave the cut station once the cut is done (web "Next: Color" button).
  func advanceToColor() {
    guard station == .cut, cutDone else { return }
    station = .color
    status = "Pick a dye!"
  }

  // MARK: Color station

  /// Apply a dye swatch (web `applyDye`).
  func applyDye(_ color: SalonHairColor) {
    guard station == .color else { return }
    look.color = color
    hasDyed = true
    status = "\(color.label) dye — gorgeous!"
  }

  /// Leave the color station after at least one dye (web "Next: Style").
  func advanceToStyle() {
    guard station == .color, hasDyed else { return }
    station = .style
    status = "Pick a style!"
  }

  // MARK: Style station

  /// Pick a texture and the hair redraws (web `chooseTexture`).
  func chooseTexture(_ texture: SalonHairTexture) {
    guard station == .style else { return }
    look.texture = texture
    hasStyled = true
    status = "\(texture.label) it is!"
  }

  /// Leave the style station after at least one pick (web "Next: Finish").
  func advanceToFinish() {
    guard station == .style, hasStyled else { return }
    station = .finish
    status = "Final touches…"
  }

  // MARK: Finish station

  /// Place (or remove, via `.none`) an accessory (web `chooseAccessory`).
  func chooseAccessory(_ accessory: SalonAccessory) {
    guard station == .finish else { return }
    look.accessory = accessory
  }

  /// Spritz of shine: rolls a fresh batch of cosmetic sparkles (web `spritz`).
  func spritz() {
    guard station == .finish else { return }
    sparkles = rollSparkles(count: 12)
    status = "So shiny! ✨"
  }

  /// The big reveal (web `reveal`): scores the look, picks a mood and
  /// reaction line, and updates the happy streak.
  func reveal() {
    guard station == .finish else { return }
    let result = Self.scoreLook(request: client.request, look: look, cleanliness: cleanliness)
    score = result
    mood = Self.mood(for: result)
    reactionLine = pickReactionLine(for: mood)
    station = .reveal
    sparkles = rollSparkles(count: 14)

    let happy = mood != .grimace
    streak = happy ? streak + 1 : 0
    if streak > bestStreak {
      bestStreak = streak
    }
    status = happy ? "The mirror never lies — fabulous!" : "Oof. The next one will be better."
  }

  // MARK: Next client

  /// Roll a fresh client and reset every station (web `nextClient`). Also the
  /// toolbar "New Client" action, which the web allows at any time.
  func nextClient() {
    let fresh = Self.rollClient(random: random)
    client = fresh
    look = fresh.startLook
    station = .wash
    bubbles = Self.rollBubbles(random: random)
    strays = []
    sparkles = []
    lengthChosen = false
    hasDyed = false
    hasStyled = false
    score = nil
    reactionLine = ""
    status = "\(fresh.name) sits down. Read the request card!"
  }

  // MARK: Scoring (static, pure — web scoreLook / moodFor)

  /// Compare the finished look against the request card (web `scoreLook`).
  /// `cleanliness` in [0, 1] converts to up to `washBonusMax` bonus points.
  static func scoreLook(
    request: SalonClientRequest, look: SalonHairLook, cleanliness: Double
  ) -> SalonScore {
    let lengthMatch = look.length == request.length
    let colorMatch = look.color == request.color
    let textureMatch = look.texture == request.texture
    let accessoryMatch: Bool? = request.accessory.map { look.accessory == $0 }
    let washBonus = Int((cleanliness * Double(washBonusMax)).rounded())
    let matches = [lengthMatch, colorMatch, textureMatch].filter { $0 }.count
      + (accessoryMatch == true ? 1 : 0)
    let max = pointsPerMatch * (request.accessory == nil ? 3 : 4) + washBonusMax
    return SalonScore(
      lengthMatch: lengthMatch,
      colorMatch: colorMatch,
      textureMatch: textureMatch,
      accessoryMatch: accessoryMatch,
      washBonus: washBonus,
      total: pointsPerMatch * matches + washBonus,
      max: max
    )
  }

  /// How the client feels about their reveal (web `moodFor`).
  static func mood(for score: SalonScore) -> SalonMood {
    let ratio = Double(score.total) / Double(score.max)
    if ratio >= delightedRatio {
      return .delighted
    }
    if ratio >= happyRatio {
      return .happy
    }
    return .grimace
  }

  /// Random line from the mood's reaction table (web `pickReactionLine`).
  func pickReactionLine(for mood: SalonMood) -> String {
    pick(mood.lines)
  }

  // MARK: Random rolls (web randomClient / randomBubbles / randomStrays)

  /// Roll a fresh client (web `randomClient`). Random calls happen in the
  /// same order as the web function so a shared random stream produces the
  /// same client. Invariants: the walk-in look is always long/straight with
  /// no accessory, the requested color always differs from the walk-in color,
  /// and an accessory wish is never `.none` — every request is satisfiable.
  static func rollClient(random: () -> Double) -> SalonClient {
    let startColor = pick(walkInColors, random: random)
    let wantsAccessory = random() < accessoryWishChance
    return SalonClient(
      name: pick(names, random: random),
      skinToneHex: pick(skinTones, random: random),
      eyeColorHex: pick(eyeColors, random: random),
      smile: random() < 0.5 ? .soft : .wide,
      startLook: SalonHairLook(length: .long, color: startColor, texture: .straight, accessory: SalonAccessory.none),
      debris: random() < 0.5 ? .leaf : .gum,
      request: SalonClientRequest(
        length: pick(SalonHairLength.allCases, random: random),
        color: pick(SalonHairColor.allCases.filter { $0 != startColor }, random: random),
        texture: pick(SalonHairTexture.allCases, random: random),
        accessory: wantsAccessory
          ? pick(SalonAccessory.allCases.filter { $0 != SalonAccessory.none }, random: random)
          : nil
      )
    )
  }

  /// Soap bubbles scattered over the hair (web `randomBubbles`).
  static func rollBubbles(random: () -> Double) -> [SalonWashBubble] {
    (0..<bubbleCount).map { id in
      SalonWashBubble(
        id: id,
        x: 104 + random() * 112,
        y: 94 + random() * 116,
        r: 13 + random() * 8,
        scrubs: 0
      )
    }
  }

  /// 2-3 stray strands poking out of the cut silhouette (web `randomStrays`).
  /// Even ids sprout from the right edge, odd ids from the left, and the
  /// vertical span grows with the chosen length — same rules as the web.
  static func rollStrays(length: SalonHairLength, random: () -> Double) -> [SalonStrayStrand] {
    let bottom = length.silhouetteBottom
    let count = 2 + Int(random() * 2)
    return (0..<count).map { index in
      let direction: Double = index % 2 == 0 ? 1 : -1
      return SalonStrayStrand(
        id: index,
        x: direction == 1 ? hairSideRight : hairSideLeft,
        y: 155 + random() * Swift.max(20, bottom - 180),
        direction: direction,
        snipped: false
      )
    }
  }

  /// Shine-spritz sparkles (web `randomSparkles`); fresh ids each call.
  private func rollSparkles(count: Int) -> [SalonSparkle] {
    let stamp = sparkleStamp
    sparkleStamp += count
    return (0..<count).map { index in
      SalonSparkle(
        id: stamp + index,
        x: 70 + random() * 180,
        y: 56 + random() * 210,
        size: 14 + random() * 14,
        delayMs: random() * 500
      )
    }
  }

  // MARK: Helpers

  /// Web `pick`: uniform index by flooring `random * count`. Requires the
  /// random source to return values in [0, 1).
  private static func pick<T>(_ items: [T], random: () -> Double) -> T {
    items[Int(random() * Double(items.count))]
  }

  private func pick<T>(_ items: [T]) -> T {
    Self.pick(items, random: random)
  }
}

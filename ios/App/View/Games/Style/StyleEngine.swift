import Foundation

/// One of the five outfit slots on the model, top to bottom. Mirrors the web
/// `SlotId` union in `web/app/src/View/Games/Style/wardrobe.ts`.
enum StyleSlotId: String, CaseIterable, Identifiable {
  case hat
  case top
  case bottom
  case shoes
  case accessory

  var id: String { rawValue }
}

/// A closet item. `tags` drive judging: an item is on-theme when it shares at
/// least one tag with the round's theme. Same ids/tags as the web wardrobe.
struct StyleItem: Identifiable, Equatable {
  let id: String
  let name: String
  let emoji: String
  /// Themes whose tags overlap these count the item as on-theme.
  let tags: [String]
}

/// One tab of the closet: the slot it dresses plus its rack of items.
struct StyleSlot: Identifiable, Equatable {
  let id: StyleSlotId
  let label: String
  let icon: String
  let items: [StyleItem]
}

/// A runway theme. An item matches when it shares at least one tag.
struct StyleTheme: Equatable {
  let name: String
  let emoji: String
  let tags: [String]
  /// Judge one-liners, picked at random for the verdict card.
  let verdicts: [String]
}

/// What the model is currently wearing; a missing key means the slot is
/// empty (the web version uses an explicit null record).
typealias StyleOutfit = [StyleSlotId: StyleItem]

/// The judge's verdict for one finished round. Mirrors the web `RoundScore`.
struct StyleRoundScore: Equatable {
  /// How many of the five worn items match the theme.
  let matches: Int
  /// All five slots filled?
  let complete: Bool
  /// All five slots filled AND every item on-theme?
  let fullMatch: Bool
  let total: Int
  /// 0-5 stars for the verdict card.
  let stars: Int
}

/// A locked-in round result: the score plus the judge's one-liner.
struct StyleVerdict: Equatable {
  let score: StyleRoundScore
  let line: String
}

/// Wardrobe catalog + scoring rules, ported verbatim from the web
/// `wardrobe.ts`. Pure data — keep ids, tags, and constants byte-for-byte in
/// sync so both platforms judge outfits identically.
enum StyleWardrobe {
  // Tunables — must match the web constants exactly.

  /// Seconds on the clock each round.
  static let roundSeconds = 40
  /// Rounds in one season.
  static let roundsPerSeason = 3
  /// Points per item that matches the theme.
  static let matchPoints = 20
  /// Bonus when every single item matches the theme.
  static let fullMatchBonus = 20
  /// Small bonus just for filling all five slots — effort counts.
  static let completeOutfitBonus = 10
  /// Highest score a single round can earn.
  static let maxRoundScore = matchPoints * 5 + fullMatchBonus + completeOutfitBonus
  /// Persistence key for the best season score — the same string as the web
  /// localStorage key so the two stores stay conceptually aligned.
  static let bestScoreKey = "style.bestScore"

  /// The closet: five slots, each with its rack of items. Same order, ids,
  /// names, emoji, and tags as the web `SLOTS`.
  static let slots: [StyleSlot] = [
    StyleSlot(
      id: .hat,
      label: "Hats",
      icon: "🎩",
      items: [
        StyleItem(id: "top-hat", name: "Top Hat", emoji: "🎩", tags: ["gala", "concert"]),
        StyleItem(id: "sun-hat", name: "Sun Hat", emoji: "👒", tags: ["beach", "safari"]),
        StyleItem(id: "ball-cap", name: "Ball Cap", emoji: "🧢", tags: ["sport", "school"]),
        StyleItem(id: "trek-helmet", name: "Trek Helmet", emoji: "⛑️", tags: ["safari", "rain"]),
        StyleItem(id: "crown", name: "Crown", emoji: "👑", tags: ["gala"]),
        StyleItem(id: "grad-cap", name: "Grad Cap", emoji: "🎓", tags: ["school"]),
        StyleItem(id: "hair-bow", name: "Hair Bow", emoji: "🎀", tags: ["pajama", "school", "gala"]),
        StyleItem(id: "earmuff-phones", name: "Earmuff Phones", emoji: "🎧", tags: ["snow", "concert"]),
      ]
    ),
    StyleSlot(
      id: .top,
      label: "Tops",
      icon: "👗",
      items: [
        StyleItem(id: "ball-gown", name: "Ball Gown", emoji: "👗", tags: ["gala"]),
        StyleItem(id: "band-tee", name: "Band Tee", emoji: "👕", tags: ["concert", "school", "beach"]),
        StyleItem(id: "puffer-coat", name: "Puffer Coat", emoji: "🧥", tags: ["snow", "rain"]),
        StyleItem(id: "safari-vest", name: "Safari Vest", emoji: "🦺", tags: ["safari"]),
        StyleItem(id: "silk-robe", name: "Silk Robe", emoji: "👘", tags: ["pajama", "gala"]),
        StyleItem(id: "martial-gi", name: "Martial Gi", emoji: "🥋", tags: ["sport"]),
        StyleItem(id: "track-jersey", name: "Track Jersey", emoji: "🎽", tags: ["sport", "beach"]),
        StyleItem(id: "smart-shirt", name: "Smart Shirt", emoji: "👔", tags: ["school", "gala"]),
      ]
    ),
    StyleSlot(
      id: .bottom,
      label: "Bottoms",
      icon: "👖",
      items: [
        StyleItem(id: "blue-jeans", name: "Blue Jeans", emoji: "👖", tags: ["school", "concert", "safari"]),
        StyleItem(id: "board-shorts", name: "Board Shorts", emoji: "🩳", tags: ["beach", "sport"]),
        StyleItem(id: "swimsuit", name: "Swimsuit", emoji: "🩱", tags: ["beach"]),
        StyleItem(id: "silk-skirt", name: "Silk Skirt", emoji: "🥻", tags: ["gala"]),
        StyleItem(id: "ski-pants", name: "Ski Pants", emoji: "🎿", tags: ["snow"]),
        StyleItem(id: "sprint-shorts", name: "Sprint Shorts", emoji: "🩲", tags: ["sport"]),
        StyleItem(id: "flannel-pjs", name: "Flannel PJs", emoji: "💤", tags: ["pajama"]),
      ]
    ),
    StyleSlot(
      id: .shoes,
      label: "Shoes",
      icon: "👠",
      items: [
        StyleItem(id: "heels", name: "Heels", emoji: "👠", tags: ["gala"]),
        StyleItem(id: "sneakers", name: "Sneakers", emoji: "👟", tags: ["sport", "school", "concert"]),
        StyleItem(id: "hiking-boots", name: "Hiking Boots", emoji: "🥾", tags: ["safari", "rain"]),
        StyleItem(id: "flip-flops", name: "Flip-Flops", emoji: "🩴", tags: ["beach", "pajama"]),
        StyleItem(id: "tall-boots", name: "Tall Boots", emoji: "👢", tags: ["rain", "concert"]),
        StyleItem(id: "ice-skates", name: "Ice Skates", emoji: "⛸️", tags: ["snow"]),
        StyleItem(id: "fuzzy-socks", name: "Fuzzy Socks", emoji: "🧦", tags: ["pajama"]),
        StyleItem(id: "ballet-flats", name: "Ballet Flats", emoji: "🩰", tags: ["gala", "school"]),
      ]
    ),
    StyleSlot(
      id: .accessory,
      label: "Extras",
      icon: "👜",
      items: [
        StyleItem(id: "handbag", name: "Handbag", emoji: "👜", tags: ["gala", "school"]),
        StyleItem(id: "sunglasses", name: "Sunglasses", emoji: "🕶️", tags: ["beach", "sport", "concert"]),
        StyleItem(id: "scarf", name: "Scarf", emoji: "🧣", tags: ["snow"]),
        StyleItem(id: "umbrella", name: "Umbrella", emoji: "🌂", tags: ["rain"]),
        StyleItem(id: "diamond-ring", name: "Diamond Ring", emoji: "💍", tags: ["gala"]),
        StyleItem(id: "guitar", name: "Guitar", emoji: "🎸", tags: ["concert"]),
        StyleItem(id: "teddy-bear", name: "Teddy Bear", emoji: "🧸", tags: ["pajama"]),
        StyleItem(id: "camera", name: "Camera", emoji: "📷", tags: ["safari", "beach"]),
      ]
    ),
  ]

  /// The eight runway themes, same order and data as the web `THEMES`.
  static let themes: [StyleTheme] = [
    StyleTheme(
      name: "Beach Day",
      emoji: "🏖️",
      tags: ["beach"],
      verdicts: ["Sun-kissed and camera-ready!", "The sand called — it wants your autograph."]
    ),
    StyleTheme(
      name: "Gala Night",
      emoji: "💃",
      tags: ["gala"],
      verdicts: ["Red carpet? More like rolled out just for you.", "The chandeliers are jealous."]
    ),
    StyleTheme(
      name: "Snow Trip",
      emoji: "❄️",
      tags: ["snow"],
      verdicts: ["Frostbite could never touch this fit.", "Cooler than the slopes themselves."]
    ),
    StyleTheme(
      name: "Sport Star",
      emoji: "🏆",
      tags: ["sport"],
      verdicts: ["Gold medal in looking fast.", "The scoreboard just gave you extra points."]
    ),
    StyleTheme(
      name: "Rainy School Run",
      emoji: "🌧️",
      tags: ["rain", "school"],
      verdicts: ["Puddle-proof AND homework-proof.", "Even the rain stopped to stare."]
    ),
    StyleTheme(
      name: "Rock Concert",
      emoji: "🎸",
      tags: ["concert"],
      verdicts: [
        "Front row hearts you. Backstage wants you.",
        "That outfit shreds harder than the encore.",
      ]
    ),
    StyleTheme(
      name: "Safari Adventure",
      emoji: "🦁",
      tags: ["safari"],
      verdicts: ["The lions are taking style notes.", "Built for the bush, dressed for the cover shoot."]
    ),
    StyleTheme(
      name: "Pajama Party",
      emoji: "🌙",
      tags: ["pajama"],
      verdicts: ["Certified coziest look in the sleepover.", "Dream-sequence levels of comfy glamour."]
    ),
  ]

  /// True when the item shares at least one tag with the theme.
  static func itemMatchesTheme(_ item: StyleItem, theme: StyleTheme) -> Bool {
    item.tags.contains { theme.tags.contains($0) }
  }

  /// Applies the scoring rules above to a finished outfit — the same math as
  /// the web `scoreOutfit`, including the round-half-up star rating.
  static func scoreOutfit(_ outfit: StyleOutfit, theme: StyleTheme) -> StyleRoundScore {
    let worn = slots.compactMap { outfit[$0.id] }
    let matches = worn.filter { itemMatchesTheme($0, theme: theme) }.count
    let complete = worn.count == slots.count
    let fullMatch = complete && matches == slots.count
    let total = matches * matchPoints
      + (fullMatch ? fullMatchBonus : 0)
      + (complete ? completeOutfitBonus : 0)
    return StyleRoundScore(
      matches: matches,
      complete: complete,
      fullMatch: fullMatch,
      total: total,
      stars: Int((Double(total) / Double(maxRoundScore) * 5).rounded())
    )
  }
}

/// Where the game is in its round loop — the web `Phase` union.
enum StylePhase: Equatable {
  /// Backstage, before the first season starts.
  case idle
  /// The clock is running and the closet is open.
  case dressing
  /// The model is strutting; the score is already locked in.
  case walking
  /// The verdict card is up, waiting for a dismiss.
  case verdict
  /// All rounds played; season total is final.
  case seasonOver
}

/// Discrete things that happened during one `tick(dt:)` — the native twin of
/// the web page's timer/timeout effects. The view can use these for sounds or
/// haptics; tests use them to assert on round flow.
enum StyleEvent: Equatable {
  /// One whole second came off the dressing clock.
  case secondElapsed
  /// The clock hit zero and the round auto-finished.
  case timeExpired
  /// The runway walk completed; the verdict card is now showing.
  case verdictRevealed
}

/// Pure port of the web StyleBot round loop
/// (`web/app/src/View/Games/Style/StylePage.tsx` + `wardrobe.ts`). No SwiftUI
/// here: the engine is a tick-driven state machine so it can be unit-tested
/// headlessly and rendered by any frontend.
///
/// Unlike `PongEngine` (a class mutated by a 120fps canvas loop), this engine
/// is a value type: StyleBot's state changes are discrete (picks, ticks,
/// phase flips), so holding the engine in `@State` lets SwiftUI diff and
/// re-render on every mutation for free.
///
/// Randomness (theme shuffle, shuffle button, verdict line) goes through an
/// injected closure so tests can make a whole season deterministic. Timing is
/// tick-driven — the view owns the clock and calls `tick(dt:)`; the engine
/// never creates a `Timer`.
struct StyleEngine {
  /// How long the runway strut lasts before the verdict card appears —
  /// the web `WALK_DURATION_MS`.
  static let walkDuration: Double = 2.6

  private(set) var phase: StylePhase = .idle
  /// This season's theme order; `themes[roundIndex]` is tonight's theme.
  private(set) var themes: [StyleTheme] = []
  /// Zero-based round within the season.
  private(set) var roundIndex = 0
  private(set) var outfit: StyleOutfit = [:]
  private(set) var secondsLeft = StyleWardrobe.roundSeconds
  /// Locked-in totals for the rounds finished so far this season.
  private(set) var roundScores: [Int] = []
  /// The current round's result, set the moment the round finishes.
  private(set) var verdict: StyleVerdict?

  /// Fraction of the current dressing second that has already elapsed.
  private var dressingClock: Double = 0
  /// Seconds of runway walk completed so far.
  private var walkClock: Double = 0

  private let random: () -> Double

  var theme: StyleTheme? {
    themes.indices.contains(roundIndex) ? themes[roundIndex] : nil
  }

  var seasonTotal: Int { roundScores.reduce(0, +) }

  /// True when the verdict on screen is for the season's final round.
  var isFinalRound: Bool { roundIndex + 1 >= StyleWardrobe.roundsPerSeason }

  init(random: @escaping () -> Double = { Double.random(in: 0..<1) }) {
    self.random = random
  }

  // MARK: - Season flow

  /// Deals a fresh shuffled theme deck and opens round 1's closet. The web
  /// equivalent is `startSeason`.
  mutating func startSeason() {
    themes = shuffledThemes()
    roundIndex = 0
    roundScores = []
    beginRound()
  }

  /// Ends the dressing phase: locks in the score and sends the model down
  /// the runway. Called by the Done! button and by the clock hitting zero.
  mutating func finishRound() {
    guard phase == .dressing, let theme else { return }
    let score = StyleWardrobe.scoreOutfit(outfit, theme: theme)
    let line = theme.verdicts[randomIndex(theme.verdicts.count)]
    verdict = StyleVerdict(score: score, line: line)
    roundScores.append(score.total)
    walkClock = 0
    phase = .walking
  }

  /// Dismisses the verdict card: advances to the next round, or ends the
  /// season after the final round. The caller persists the best score.
  mutating func dismissVerdict() {
    guard phase == .verdict else { return }
    if isFinalRound {
      phase = .seasonOver
    } else {
      roundIndex += 1
      beginRound()
    }
  }

  /// Advance the clock. Drives the dressing countdown (1Hz decrements, auto
  /// finish at zero) and the runway walk (verdict reveal after 2.6s).
  /// Returns the discrete events that occurred so the caller can react.
  mutating func tick(dt: Double) -> [StyleEvent] {
    var events: [StyleEvent] = []
    switch phase {
    case .dressing:
      dressingClock += dt
      while dressingClock >= 1, secondsLeft > 0 {
        dressingClock -= 1
        secondsLeft -= 1
        events.append(.secondElapsed)
        if secondsLeft == 0 {
          finishRound()
          events.append(.timeExpired)
          break
        }
      }
    case .walking:
      walkClock += dt
      if walkClock >= Self.walkDuration {
        phase = .verdict
        events.append(.verdictRevealed)
      }
    case .idle, .verdict, .seasonOver:
      break
    }
    return events
  }

  // MARK: - Closet actions

  /// Puts the item in the slot, or takes it off when it is already worn —
  /// the same toggle as the web `pickItem`. Only valid while dressing.
  mutating func pick(_ item: StyleItem, in slot: StyleSlotId) {
    guard phase == .dressing else { return }
    if outfit[slot]?.id == item.id {
      outfit[slot] = nil
    } else {
      outfit[slot] = item
    }
  }

  /// A random item in every slot — the shuffle button.
  mutating func shuffleOutfit() {
    guard phase == .dressing else { return }
    for slot in StyleWardrobe.slots {
      outfit[slot.id] = slot.items[randomIndex(slot.items.count)]
    }
  }

  /// Empties every slot — the clear button.
  mutating func clearOutfit() {
    guard phase == .dressing else { return }
    outfit = [:]
  }

  // MARK: - Private

  private mutating func beginRound() {
    outfit = [:]
    secondsLeft = StyleWardrobe.roundSeconds
    dressingClock = 0
    verdict = nil
    phase = .dressing
  }

  /// The themes in a fresh random order — the web `shuffledThemes`
  /// Fisher–Yates, with the injected RNG standing in for `Math.random`.
  private func shuffledThemes() -> [StyleTheme] {
    var deck = StyleWardrobe.themes
    for i in stride(from: deck.count - 1, through: 1, by: -1) {
      let j = randomIndex(i + 1)
      deck.swapAt(i, j)
    }
    return deck
  }

  /// `Math.floor(random() * count)`, clamped so `random() == 1.0` from a
  /// misbehaving source can never index out of bounds.
  private func randomIndex(_ count: Int) -> Int {
    min(count - 1, Int(random() * Double(count)))
  }
}

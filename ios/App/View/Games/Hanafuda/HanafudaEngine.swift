import Foundation

/// Pure port of the web Koi-Koi engine
/// (`web/app/src/View/Games/Hanafuda/engine.ts`): the 48-card hanafuda deck,
/// dealing, the turn/match state machine, yaku evaluation, round scoring,
/// and the bot AI. No SwiftUI here — the engine is a plain state machine
/// driven by the view, so it can be unit-tested headlessly.
///
/// The deck layout, yaku table, scoring house rules, and bot heuristics
/// must stay in sync with the web engine (and the Android
/// `HanafudaEngine.kt`) so all three platforms play identically.
///
/// Randomness (the shuffle) goes through an injected closure so tests can
/// make every deal fully deterministic.

/// One of the four hanafuda card categories.
enum HanafudaKind: String {
  case bright
  case animal
  case ribbon
  case chaff
}

/// Ribbon flavor: red with poetry, plain red, or blue.
enum HanafudaRibbonColor: String {
  case poetry
  case plain
  case blue
}

struct HanafudaCard: Equatable, Identifiable {
  /// Stable id 0..47: `(month - 1) * 4 + slot` — same numbering as the web.
  let id: Int
  /// Month 1 (pine) through 12 (paulownia).
  let month: Int
  let kind: HanafudaKind
  /// English display name, e.g. "Crane and Sun".
  let name: String
  /// Set only on ribbon cards.
  let ribbon: HanafudaRibbonColor?
}

enum HanafudaSeat: Equatable {
  case player
  case bot

  var opponent: HanafudaSeat { self == .player ? .bot : .player }
}

/// A scored combination and its point value.
struct HanafudaYaku: Equatable {
  let key: String
  let label: String
  let points: Int
}

/// What the UI should show / ask for next — mirrors the web `Phase` union.
enum HanafudaPhase: Equatable {
  /// The player picks a hand card to play.
  case selectHand
  /// The played card matches exactly two field cards; pick one.
  case chooseFieldForHand
  /// The flipped deck card matches exactly two field cards; pick one.
  case chooseFieldForDraw
  /// The player formed a new yaku: koi-koi or shobu.
  case decision
  /// The bot is up; the view calls `botTakeTurn()` after a beat.
  case botTurn
  case roundOver
  case matchOver
}

/// Everything that happened in one completed turn, for logs and toasts.
struct HanafudaTurnReport {
  let seat: HanafudaSeat
  var played: HanafudaCard
  /// Cards moved to the capture pile by the hand play (empty on a discard).
  var playedCaptured: [HanafudaCard]
  var drawn: HanafudaCard?
  var drawnCaptured: [HanafudaCard]
  /// Yaku newly formed this turn (score strictly improved).
  var newYaku: [HanafudaYaku]
  /// Set when the bot formed a yaku and decided its own fate.
  var botDecision: String?
}

struct HanafudaRoundResult {
  let round: Int
  let winner: HanafudaSeat?
  let yaku: [HanafudaYaku]
  let basePoints: Int
  let score: Int
}

/// A full 6-round Koi-Koi match against the bot. Mutable state driven by the
/// view through `playHandCard` / `resolveFieldChoice` / `declareKoiKoi` /
/// `declareShobu` / `botTakeTurn`, exactly like the web `KoiKoiEngine`.
final class HanafudaEngine {
  /// Rounds in a full match; the dealer alternates every round.
  static let totalRounds = 6
  /// Cards dealt to each hand and to the field (the classic 8/8/8 deal).
  static let handSize = 8
  static let fieldSize = 8
  /// Winning with this many points or more doubles the round score.
  static let bigHandThreshold = 7

  // Ids of the cards individual yaku care about — slot 0 of each month.
  static let craneId = 0
  static let curtainId = 8
  static let moonId = 28
  static let rainManId = 40
  static let phoenixId = 44
  static let sakeCupId = 32
  static let boarId = 24
  static let deerId = 36
  static let butterfliesId = 20

  /// The full 48-card deck in id order: the canonical composition of 5
  /// brights, 9 animals, 10 ribbons, and 24 chaff — including the willow
  /// (November) oddities and the paulownia (December) extra chaff. Must
  /// match the web `DECK` table card for card.
  static let fullDeck: [HanafudaCard] = {
    // (flower, [(kind, name, ribbon)]) per month, in slot order.
    let months: [(String, [(HanafudaKind, String, HanafudaRibbonColor?)])] = [
      ("Pine", [
        (.bright, "Crane and Sun", nil),
        (.ribbon, "Pine Poetry Ribbon", .poetry),
        (.chaff, "Pine Chaff", nil),
        (.chaff, "Pine Chaff", nil),
      ]),
      ("Plum", [
        (.animal, "Bush Warbler", nil),
        (.ribbon, "Plum Poetry Ribbon", .poetry),
        (.chaff, "Plum Chaff", nil),
        (.chaff, "Plum Chaff", nil),
      ]),
      ("Cherry", [
        (.bright, "Flower-Viewing Curtain", nil),
        (.ribbon, "Cherry Poetry Ribbon", .poetry),
        (.chaff, "Cherry Chaff", nil),
        (.chaff, "Cherry Chaff", nil),
      ]),
      ("Wisteria", [
        (.animal, "Cuckoo", nil),
        (.ribbon, "Wisteria Ribbon", .plain),
        (.chaff, "Wisteria Chaff", nil),
        (.chaff, "Wisteria Chaff", nil),
      ]),
      ("Iris", [
        (.animal, "Eight-Plank Bridge", nil),
        (.ribbon, "Iris Ribbon", .plain),
        (.chaff, "Iris Chaff", nil),
        (.chaff, "Iris Chaff", nil),
      ]),
      ("Peony", [
        (.animal, "Butterflies", nil),
        (.ribbon, "Peony Blue Ribbon", .blue),
        (.chaff, "Peony Chaff", nil),
        (.chaff, "Peony Chaff", nil),
      ]),
      ("Clover", [
        (.animal, "Boar", nil),
        (.ribbon, "Clover Ribbon", .plain),
        (.chaff, "Clover Chaff", nil),
        (.chaff, "Clover Chaff", nil),
      ]),
      ("Pampas", [
        (.bright, "Full Moon", nil),
        (.animal, "Geese in Flight", nil),
        (.chaff, "Pampas Chaff", nil),
        (.chaff, "Pampas Chaff", nil),
      ]),
      ("Chrysanthemum", [
        (.animal, "Sake Cup", nil),
        (.ribbon, "Chrysanthemum Blue Ribbon", .blue),
        (.chaff, "Chrysanthemum Chaff", nil),
        (.chaff, "Chrysanthemum Chaff", nil),
      ]),
      ("Maple", [
        (.animal, "Deer", nil),
        (.ribbon, "Maple Blue Ribbon", .blue),
        (.chaff, "Maple Chaff", nil),
        (.chaff, "Maple Chaff", nil),
      ]),
      ("Willow", [
        (.bright, "Rain Man", nil),
        (.animal, "Swallow", nil),
        (.ribbon, "Willow Ribbon", .plain),
        (.chaff, "Lightning", nil),
      ]),
      ("Paulownia", [
        (.bright, "Phoenix", nil),
        (.chaff, "Paulownia Chaff", nil),
        (.chaff, "Paulownia Chaff", nil),
        (.chaff, "Paulownia Chaff", nil),
      ]),
    ]
    var deck: [HanafudaCard] = []
    for (monthIndex, month) in months.enumerated() {
      for (slotIndex, slot) in month.1.enumerated() {
        deck.append(HanafudaCard(
          id: monthIndex * 4 + slotIndex,
          month: monthIndex + 1,
          kind: slot.0,
          name: slot.1,
          ribbon: slot.2
        ))
      }
    }
    return deck
  }()

  // MARK: - Yaku evaluation (must mirror the web `evaluateYaku` exactly)

  /// Evaluates every yaku in a pile of captured cards. Bright yaku are
  /// mutually exclusive (only the best applies); akatan/aotan stack with
  /// the tan count, and the sake cup counts as an animal only (house rule,
  /// see PACK.md).
  static func evaluateYaku(_ captured: [HanafudaCard]) -> [HanafudaYaku] {
    var yaku: [HanafudaYaku] = []
    let ids = Set(captured.map(\.id))

    let brights = captured.filter { $0.kind == .bright }.count
    let hasRain = ids.contains(rainManId)
    let dryBrights = brights - (hasRain ? 1 : 0)
    if brights == 5 {
      yaku.append(HanafudaYaku(key: "goko", label: "Goko (Five Brights)", points: 15))
    } else if brights == 4 && !hasRain {
      yaku.append(HanafudaYaku(key: "shiko", label: "Shiko (Four Brights)", points: 8))
    } else if brights == 4 {
      yaku.append(HanafudaYaku(key: "ame-shiko", label: "Ame-Shiko (Rainy Four Brights)", points: 7))
    } else if dryBrights == 3 {
      yaku.append(HanafudaYaku(key: "sanko", label: "Sanko (Three Brights)", points: 6))
    }

    if ids.contains(curtainId) && ids.contains(sakeCupId) {
      yaku.append(HanafudaYaku(key: "hanami-zake", label: "Hanami-zake (Flower Viewing)", points: 5))
    }
    if ids.contains(moonId) && ids.contains(sakeCupId) {
      yaku.append(HanafudaYaku(key: "tsukimi-zake", label: "Tsukimi-zake (Moon Viewing)", points: 5))
    }
    if ids.contains(boarId) && ids.contains(deerId) && ids.contains(butterfliesId) {
      yaku.append(HanafudaYaku(
        key: "inoshikacho", label: "Ino-Shika-Cho (Boar, Deer, Butterfly)", points: 5
      ))
    }

    let ribbons = captured.filter { $0.kind == .ribbon }
    let poetry = ribbons.filter { $0.ribbon == .poetry }.count
    let blue = ribbons.filter { $0.ribbon == .blue }.count
    if poetry == 3 {
      yaku.append(HanafudaYaku(key: "akatan", label: "Akatan (Poetry Ribbons)", points: 5))
    }
    if blue == 3 {
      yaku.append(HanafudaYaku(key: "aotan", label: "Aotan (Blue Ribbons)", points: 5))
    }
    if ribbons.count >= 5 {
      yaku.append(HanafudaYaku(key: "tan", label: "Tan (Ribbons)", points: 1 + (ribbons.count - 5)))
    }

    let animals = captured.filter { $0.kind == .animal }.count
    if animals >= 5 {
      yaku.append(HanafudaYaku(key: "tane", label: "Tane (Animals)", points: 1 + (animals - 5)))
    }

    let chaff = captured.filter { $0.kind == .chaff }.count
    if chaff >= 10 {
      yaku.append(HanafudaYaku(key: "kasu", label: "Kasu (Chaff)", points: 1 + (chaff - 10)))
    }

    return yaku
  }

  static func yakuPoints(_ yaku: [HanafudaYaku]) -> Int {
    yaku.reduce(0) { $0 + $1.points }
  }

  /// Final round score for a winner holding `points` yaku points. House
  /// rules (see PACK.md): 7+ points doubles, and winning after the
  /// *opponent* called koi-koi doubles again; the multipliers stack. The
  /// winner's own koi-koi carries no extra multiplier.
  static func roundScore(points: Int, opponentCalledKoiKoi: Bool) -> Int {
    var score = points
    if points >= bigHandThreshold {
      score *= 2
    }
    if opponentCalledKoiKoi {
      score *= 2
    }
    return score
  }

  // MARK: - Match state

  private(set) var round = 1
  /// The dealer leads; the player deals odd rounds (round 1 first).
  private(set) var dealer: HanafudaSeat = .player
  var phase: HanafudaPhase = .selectHand
  private(set) var turn: HanafudaSeat = .player

  private(set) var deck: [HanafudaCard] = []
  private(set) var field: [HanafudaCard] = []
  private(set) var playerHand: [HanafudaCard] = []
  private(set) var botHand: [HanafudaCard] = []
  private(set) var playerCaptured: [HanafudaCard] = []
  private(set) var botCaptured: [HanafudaCard] = []

  /// Whether each seat has called koi-koi this round (drives doubling).
  var playerCalledKoiKoi = false
  var botCalledKoiKoi = false
  /// Yaku points at the seat's last decision — used to detect *new* yaku.
  private var playerBankedPoints = 0
  private var botBankedPoints = 0

  /// Per-round scores banked so far.
  private(set) var playerScores: [Int] = []
  private(set) var botScores: [Int] = []
  private(set) var results: [HanafudaRoundResult] = []
  /// Set at match end; nil means the match drew.
  private(set) var matchWinner: HanafudaSeat?
  private(set) var isMatchDecided = false

  /// The most recently completed turn, for the UI log / toasts.
  private(set) var lastReport: HanafudaTurnReport?

  /// Hand card awaiting a two-way field choice.
  private(set) var pendingHandCard: HanafudaCard?
  /// Flipped deck card awaiting a two-way field choice.
  private(set) var pendingDrawnCard: HanafudaCard?
  /// In-progress report accumulated across the choice sub-phases.
  private var draftReport: HanafudaTurnReport?

  private let random: () -> Double

  init(random: @escaping () -> Double = { Double.random(in: 0..<1) }) {
    self.random = random
    startMatch()
  }

  var playerTotal: Int { playerScores.reduce(0, +) }
  var botTotal: Int { botScores.reduce(0, +) }

  func hand(for seat: HanafudaSeat) -> [HanafudaCard] {
    seat == .player ? playerHand : botHand
  }

  func captured(for seat: HanafudaSeat) -> [HanafudaCard] {
    seat == .player ? playerCaptured : botCaptured
  }

  func startMatch() {
    round = 1
    playerScores = []
    botScores = []
    results = []
    matchWinner = nil
    isMatchDecided = false
    startRound()
  }

  /// Deals 8/8/8 and hands the lead to the round's dealer.
  func startRound() {
    dealer = round % 2 == 1 ? .player : .bot
    deck = shuffledDeck()
    dealFromDeck()
  }

  func startNextRound() {
    guard phase == .roundOver else { return }
    round += 1
    startRound()
  }

  /// Field cards the given card would capture (same month).
  func fieldMatches(_ card: HanafudaCard) -> [HanafudaCard] {
    field.filter { $0.month == card.month }
  }

  /// Test hook: replaces the shuffled deal with an arranged one. `deck` is
  /// consumed front-first: 8 player hand, 8 bot hand, 8 field, 24 draw pile.
  func dealArranged(_ arranged: [HanafudaCard]) {
    deck = arranged
    dealFromDeck()
  }

  /// Test hook: injects a capture pile mid-round so yaku/scoring paths can
  /// be exercised without scripting every turn.
  func setCaptured(_ cards: [HanafudaCard], for seat: HanafudaSeat) {
    if seat == .player {
      playerCaptured = cards
    } else {
      botCaptured = cards
    }
  }

  /// Player plays a hand card. If it matches exactly two field cards the
  /// engine parks in `chooseFieldForHand` until `resolveFieldChoice` names
  /// one; otherwise the play (and then the deck flip) resolve immediately.
  func playHandCard(_ cardId: Int) {
    guard phase == .selectHand, turn == .player,
          let index = playerHand.firstIndex(where: { $0.id == cardId })
    else { return }
    let card = playerHand[index]
    let matches = fieldMatches(card)
    if matches.count == 2 {
      playerHand.remove(at: index)
      pendingHandCard = card
      phase = .chooseFieldForHand
      return
    }
    playerHand.remove(at: index)
    let capturedNow = placeCard(seat: .player, card: card, targets: matches)
    beginDraft(seat: .player, played: card, playedCaptured: capturedNow)
    flipDeckCard(seat: .player)
  }

  /// Resolves a two-way field choice for either the hand play or the flip.
  func resolveFieldChoice(_ fieldCardId: Int) {
    if phase == .chooseFieldForHand, let pending = pendingHandCard {
      guard let target = field.first(where: { $0.id == fieldCardId }),
            target.month == pending.month
      else { return }
      pendingHandCard = nil
      let capturedNow = placeCard(seat: .player, card: pending, targets: [target])
      beginDraft(seat: .player, played: pending, playedCaptured: capturedNow)
      flipDeckCard(seat: .player)
    } else if phase == .chooseFieldForDraw, let pending = pendingDrawnCard, draftReport != nil {
      guard let target = field.first(where: { $0.id == fieldCardId }),
            target.month == pending.month
      else { return }
      pendingDrawnCard = nil
      let capturedNow = placeCard(seat: .player, card: pending, targets: [target])
      draftReport?.drawn = pending
      draftReport?.drawnCaptured = capturedNow
      finishTurn(seat: .player)
    }
  }

  /// Player elects to keep going after forming a yaku.
  func declareKoiKoi() {
    guard phase == .decision else { return }
    playerCalledKoiKoi = true
    playerBankedPoints = Self.yakuPoints(Self.evaluateYaku(playerCaptured))
    passTurn(from: .player)
  }

  /// Player banks the round.
  func declareShobu() {
    guard phase == .decision else { return }
    endRound(winner: .player)
  }

  /// Runs the bot's whole turn: pick the best play, resolve any two-way
  /// choice greedily, flip the deck card, then make its own koi-koi/shobu
  /// call. Returns the report (also stored in `lastReport`).
  @discardableResult
  func botTakeTurn() -> HanafudaTurnReport? {
    guard phase == .botTurn, turn == .bot else { return nil }
    let play = Self.chooseBotPlay(
      hand: botHand, field: field, botCaptured: botCaptured, playerCaptured: playerCaptured
    )
    guard let index = botHand.firstIndex(where: { $0.id == play.card.id }) else { return nil }
    botHand.remove(at: index)
    let capturedNow = placeCard(seat: .bot, card: play.card, targets: play.targets)
    beginDraft(seat: .bot, played: play.card, playedCaptured: capturedNow)
    flipDeckCard(seat: .bot)
    return lastReport
  }

  // MARK: - Internals

  private func dealFromDeck() {
    playerHand = Array(deck.prefix(Self.handSize))
    botHand = Array(deck.dropFirst(Self.handSize).prefix(Self.handSize))
    field = Array(deck.dropFirst(Self.handSize * 2).prefix(Self.fieldSize))
    deck.removeFirst(Self.handSize * 2 + Self.fieldSize)
    playerCaptured = []
    botCaptured = []
    playerCalledKoiKoi = false
    botCalledKoiKoi = false
    playerBankedPoints = 0
    botBankedPoints = 0
    pendingHandCard = nil
    pendingDrawnCard = nil
    draftReport = nil
    lastReport = nil
    turn = dealer
    phase = dealer == .player ? .selectHand : .botTurn
  }

  /// Fisher-Yates over the full deck using the injected random source.
  private func shuffledDeck() -> [HanafudaCard] {
    var cards = Self.fullDeck
    for i in stride(from: cards.count - 1, to: 0, by: -1) {
      let j = Int(random() * Double(i + 1))
      cards.swapAt(i, min(j, i))
    }
    return cards
  }

  private func beginDraft(seat: HanafudaSeat, played: HanafudaCard, playedCaptured: [HanafudaCard]) {
    draftReport = HanafudaTurnReport(
      seat: seat,
      played: played,
      playedCaptured: playedCaptured,
      drawn: nil,
      drawnCaptured: [],
      newYaku: [],
      botDecision: nil
    )
  }

  /// Places a card against the chosen field targets: captures the pair (or
  /// all four on a triple month match), or lays the card on the field.
  /// Returns the cards that entered the capture pile.
  private func placeCard(
    seat: HanafudaSeat, card: HanafudaCard, targets: [HanafudaCard]
  ) -> [HanafudaCard] {
    if targets.isEmpty {
      field.append(card)
      return []
    }
    // A triple month match sweeps all three field cards with the fourth.
    let taken = targets.count >= 3 ? fieldMatches(card) : [targets[0]]
    field.removeAll { fieldCard in taken.contains { $0.id == fieldCard.id } }
    let capturedNow = [card] + taken
    if seat == .player {
      playerCaptured.append(contentsOf: capturedNow)
    } else {
      botCaptured.append(contentsOf: capturedNow)
    }
    return capturedNow
  }

  /// Flips the top deck card and resolves it (or parks on a player choice).
  private func flipDeckCard(seat: HanafudaSeat) {
    guard !deck.isEmpty, draftReport != nil else {
      finishTurn(seat: seat)
      return
    }
    let drawn = deck.removeFirst()
    let matches = fieldMatches(drawn)
    if matches.count == 2 {
      if seat == .player {
        pendingDrawnCard = drawn
        phase = .chooseFieldForDraw
        return
      }
      // Bot resolves its own choice greedily: take the richer card.
      let best = matches.max { a, b in
        Self.captureValue(a, captured: botCaptured) + Self.denyValue(a, playerCaptured: playerCaptured)
          < Self.captureValue(b, captured: botCaptured)
            + Self.denyValue(b, playerCaptured: playerCaptured)
      }!
      let capturedNow = placeCard(seat: seat, card: drawn, targets: [best])
      draftReport?.drawn = drawn
      draftReport?.drawnCaptured = capturedNow
      finishTurn(seat: seat)
      return
    }
    let capturedNow = placeCard(seat: seat, card: drawn, targets: matches)
    draftReport?.drawn = drawn
    draftReport?.drawnCaptured = capturedNow
    finishTurn(seat: seat)
  }

  /// Closes out a turn: detect newly formed yaku, run the decision (player
  /// prompt / bot heuristic), and otherwise pass play or end a drawn round.
  private func finishTurn(seat: HanafudaSeat) {
    guard var report = draftReport else { return }
    draftReport = nil
    let pile = captured(for: seat)
    let yaku = Self.evaluateYaku(pile)
    let points = Self.yakuPoints(yaku)
    let banked = seat == .player ? playerBankedPoints : botBankedPoints
    if points > banked {
      report.newYaku = yaku
      if hand(for: seat).isEmpty {
        // No cards left to koi-koi with: the yaku auto-banks.
        if seat == .bot {
          report.botDecision = "shobu"
        }
        lastReport = report
        endRound(winner: seat)
        return
      }
      if seat == .player {
        lastReport = report
        phase = .decision
        return
      }
      let decision = Self.chooseBotDecision(
        points: points,
        handSize: botHand.count,
        botCaptured: botCaptured,
        playerCaptured: playerCaptured
      )
      report.botDecision = decision
      lastReport = report
      if decision == "shobu" {
        endRound(winner: .bot)
        return
      }
      botCalledKoiKoi = true
      botBankedPoints = points
      passTurn(from: seat)
      return
    }
    lastReport = report
    passTurn(from: seat)
  }

  private func passTurn(from seat: HanafudaSeat) {
    if playerHand.isEmpty && botHand.isEmpty {
      endRound(winner: nil)
      return
    }
    let next = seat.opponent
    turn = next
    phase = next == .player ? .selectHand : .botTurn
  }

  /// Banks the round for `winner` (nil = drawn round) and advances phases.
  private func endRound(winner: HanafudaSeat?) {
    let result: HanafudaRoundResult
    if let winner {
      let yaku = Self.evaluateYaku(captured(for: winner))
      let basePoints = Self.yakuPoints(yaku)
      let opponentKoiKoi = winner == .player ? botCalledKoiKoi : playerCalledKoiKoi
      let score = Self.roundScore(points: basePoints, opponentCalledKoiKoi: opponentKoiKoi)
      playerScores.append(winner == .player ? score : 0)
      botScores.append(winner == .bot ? score : 0)
      result = HanafudaRoundResult(
        round: round, winner: winner, yaku: yaku, basePoints: basePoints, score: score
      )
    } else {
      playerScores.append(0)
      botScores.append(0)
      result = HanafudaRoundResult(round: round, winner: nil, yaku: [], basePoints: 0, score: 0)
    }
    results.append(result)
    if round >= Self.totalRounds {
      matchWinner = playerTotal == botTotal ? nil : (playerTotal > botTotal ? .player : .bot)
      isMatchDecided = true
      phase = .matchOver
    } else {
      phase = .roundOver
    }
  }

  // MARK: - Bot AI (must mirror the web heuristics exactly)

  struct BotPlay {
    let card: HanafudaCard
    let targets: [HanafudaCard]
  }

  /// How much capturing `card` advances the pile: a base value per kind
  /// plus bonuses for every partially-collected yaku the card belongs to.
  static func captureValue(_ card: HanafudaCard, captured: [HanafudaCard]) -> Int {
    let ids = Set(captured.map(\.id))
    var value: Int
    switch card.kind {
    case .bright: value = 10
    case .animal: value = 4
    case .ribbon: value = 3
    case .chaff: value = 1
    }

    if card.kind == .bright {
      let brightsHeld = captured.filter { $0.kind == .bright }.count
      value += brightsHeld * 3
    }
    if card.id == sakeCupId {
      value += 4 // hanami/tsukimi hinge card
      if ids.contains(curtainId) || ids.contains(moonId) {
        value += 5
      }
    }
    if (card.id == curtainId || card.id == moonId) && ids.contains(sakeCupId) {
      value += 5
    }
    let trio = [boarId, deerId, butterfliesId]
    if trio.contains(card.id) {
      value += trio.filter { ids.contains($0) }.count * 3
    }
    if card.ribbon == .poetry || card.ribbon == .blue {
      let sameColor = captured.filter { $0.ribbon == card.ribbon }.count
      value += sameColor * 2
    }
    return value
  }

  /// Denial bonus: how much the *player* would want this card, judged from
  /// their public capture pile. The bot leans toward taking those first.
  static func denyValue(_ card: HanafudaCard, playerCaptured: [HanafudaCard]) -> Int {
    let value = captureValue(card, captured: playerCaptured)
    let baseline = captureValue(card, captured: [])
    return max(0, value - baseline)
  }

  /// Picks the bot's hand play: the capture maximizing advance + denial,
  /// or — with no capture available — the discard that risks the least.
  static func chooseBotPlay(
    hand: [HanafudaCard],
    field: [HanafudaCard],
    botCaptured: [HanafudaCard],
    playerCaptured: [HanafudaCard]
  ) -> BotPlay {
    var best: BotPlay?
    var bestValue = Int.min
    for card in hand {
      let matches = field.filter { $0.month == card.month }
      if matches.isEmpty { continue }
      if matches.count >= 3 {
        let value = matches.reduce(captureValue(card, captured: botCaptured)) { sum, target in
          sum + captureValue(target, captured: botCaptured)
            + denyValue(target, playerCaptured: playerCaptured)
        }
        if value > bestValue {
          bestValue = value
          best = BotPlay(card: card, targets: matches)
        }
        continue
      }
      for target in matches {
        let value = captureValue(card, captured: botCaptured)
          + captureValue(target, captured: botCaptured)
          + denyValue(target, playerCaptured: playerCaptured)
        if value > bestValue {
          bestValue = value
          best = BotPlay(card: card, targets: [target])
        }
      }
    }
    if let best {
      return best
    }

    // No captures: discard the card whose loss (own value + what it could
    // hand the player) is smallest.
    var discard = hand[0]
    var discardRisk = Int.max
    for card in hand {
      let risk = captureValue(card, captured: botCaptured)
        + denyValue(card, playerCaptured: playerCaptured)
      if risk < discardRisk {
        discardRisk = risk
        discard = card
      }
    }
    return BotPlay(card: discard, targets: [])
  }

  /// One capture away from a listed yaku? Used both for the bot's own
  /// ambition (keep going) and to read the player as a threat (bank now).
  static func isCloseToYaku(_ captured: [HanafudaCard]) -> Bool {
    let ids = Set(captured.map(\.id))
    let dryBrights = captured.filter { $0.kind == .bright && $0.id != rainManId }.count
    let poetry = captured.filter { $0.ribbon == .poetry }.count
    let blue = captured.filter { $0.ribbon == .blue }.count
    let ribbons = captured.filter { $0.kind == .ribbon }.count
    let animals = captured.filter { $0.kind == .animal }.count
    let chaff = captured.filter { $0.kind == .chaff }.count
    let trioHeld = [boarId, deerId, butterfliesId].filter { ids.contains($0) }.count
    let hasSake = ids.contains(sakeCupId)
    return dryBrights == 2
      || poetry == 2
      || blue == 2
      || trioHeld == 2
      || ribbons == 4
      || animals == 4
      || chaff == 9
      || (hasSake && (!ids.contains(curtainId) || !ids.contains(moonId)))
      || (!hasSake && (ids.contains(curtainId) || ids.contains(moonId)))
  }

  /// The bot's koi-koi/shobu call after forming a yaku: bank big hands and
  /// threatened positions; press on only with cards in hand and a bigger
  /// yaku in sight.
  static func chooseBotDecision(
    points: Int,
    handSize: Int,
    botCaptured: [HanafudaCard],
    playerCaptured: [HanafudaCard]
  ) -> String {
    if points >= bigHandThreshold {
      return "shobu"
    }
    if handSize <= 1 {
      return "shobu"
    }
    if isCloseToYaku(playerCaptured) {
      return "shobu"
    }
    return isCloseToYaku(botCaptured) ? "koikoi" : "shobu"
  }
}

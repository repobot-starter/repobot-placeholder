import Foundation

/// Card suits. Raw values are the same glyphs the web version renders, so the
/// native card faces look identical.
enum BlackjackSuit: String, CaseIterable, Equatable {
  case spades = "♠"
  case hearts = "♥"
  case diamonds = "♦"
  case clubs = "♣"

  /// Hearts and diamonds print red, like the web `isRed`.
  var isRed: Bool { self == .hearts || self == .diamonds }
}

/// Card ranks in the order the web builds each deck (A first, K last). The
/// build order matters: it makes shuffles byte-for-byte reproducible across
/// platforms under the same injected RNG sequence.
enum BlackjackRank: String, CaseIterable, Equatable {
  case ace = "A"
  case two = "2"
  case three = "3"
  case four = "4"
  case five = "5"
  case six = "6"
  case seven = "7"
  case eight = "8"
  case nine = "9"
  case ten = "10"
  case jack = "J"
  case queen = "Q"
  case king = "K"

  /// Blackjack value; aces count 11 here and are demoted to 1 by
  /// `handTotal(of:)` when the hand would otherwise bust (web `rankValue`).
  var value: Int {
    switch self {
    case .ace: return 11
    case .jack, .queen, .king, .ten: return 10
    case .two: return 2
    case .three: return 3
    case .four: return 4
    case .five: return 5
    case .six: return 6
    case .seven: return 7
    case .eight: return 8
    case .nine: return 9
    }
  }
}

struct BlackjackCard: Equatable {
  let rank: BlackjackRank
  let suit: BlackjackSuit

  var isRed: Bool { suit.isRed }
}

/// Best total for a hand, plus whether an ace is currently counted as 11
/// (e.g. A+6 is "soft 17") — the web `HandTotal`.
struct BlackjackHandTotal: Equatable {
  let total: Int
  let soft: Bool
}

enum BlackjackResultKind: Equatable {
  case blackjack
  case win
  case push
  case bust
  case lose
}

/// Outcome of a settled hand; `net` is the profit (negative on a loss),
/// mirroring the web `HandResult`.
struct BlackjackHandResult: Equatable {
  let kind: BlackjackResultKind
  let net: Double
}

/// Where the hand currently is. The web also has a transient "dealing" phase
/// for its deal choreography; the engine settles synchronously and leaves
/// pacing (card-by-card reveals, dealer draw delays) to the view.
enum BlackjackPhase: Equatable {
  case betting
  case player
  case dealer
  case settled
}

/// Per-session table stats, the native twin of the web `SessionStats` panel.
struct BlackjackSessionStats: Equatable {
  var hands = 0
  var wins = 0
  var pushes = 0
  var biggestWin: Double = 0
}

/// Pure port of the web blackjack table
/// (`web/app/src/View/Games/Blackjack/cards.ts` + the game flow in
/// `BlackjackPage.tsx`). No SwiftUI here: the engine is a plain state machine
/// driven by the player actions below, so it can be unit-tested headlessly
/// and rendered by any frontend.
///
/// Rules, in lockstep with the web constants: six-deck shoe reshuffled once
/// 25% or fewer cards remain, dealer stands on all 17s (soft included — the
/// draw condition is `total < 17`, and a soft 17 already totals 17), natural
/// blackjack pays 3:2, double down on the first two cards doubles the bet and
/// draws exactly one card.
///
/// Randomness (the Fisher-Yates shuffle) goes through an injected closure so
/// tests can make deals fully deterministic.
final class BlackjackEngine {
  // House rules — must stay byte-for-byte in sync with the web `cards.ts`.
  static let deckCount = 6
  static let shoeSize = deckCount * 52
  static let reshuffleFraction = 0.25
  /// The shoe is rebuilt before a draw once this many (or fewer) cards remain.
  static let reshuffleAt = Int(Double(shoeSize) * reshuffleFraction)
  static let dealerStandsOn = 17
  /// A natural pays this multiple of the bet on top of the returned stake.
  static let blackjackPayout = 1.5
  static let startingBankroll: Double = 500
  static let chipDenominations = [5, 25, 100]
  /// Persistence key — same name as the web's localStorage key so the two
  /// platforms describe the same concept, even though the stores differ.
  static let bankrollStorageKey = "blackjack.bankroll"

  /// Cash on hand. Fractional cents appear only from 3:2 payouts on odd bets
  /// (e.g. a $5 natural pays $7.50), exactly like the web.
  private(set) var bankroll: Double
  /// Current wager. Doubles in place on double down, like the web `bet` state.
  private(set) var bet = 0
  private(set) var phase: BlackjackPhase = .betting
  private(set) var playerCards: [BlackjackCard] = []
  private(set) var dealerCards: [BlackjackCard] = []
  /// While true the dealer's second card renders face-down.
  private(set) var holeHidden = true
  private(set) var result: BlackjackHandResult?
  private(set) var stats = BlackjackSessionStats()
  /// Incremented on every reshuffle; the view watches it to flash the
  /// "shuffling the shoe" note, tests use it to assert the reshuffle point.
  private(set) var shuffleCount = 0

  /// Cards remaining; drawn from the end like the web `shoe.pop()`. Starts
  /// empty so the very first draw triggers a shuffle, mirroring the web ref.
  private var shoe: [BlackjackCard] = []
  var shoeCount: Int { shoe.count }

  /// Web `broke`: nothing left to bet with — offer the house credit reset.
  var isBroke: Bool { bankroll == 0 && bet == 0 }
  /// Web `canDouble`: first decision of the hand, and the bankroll can cover
  /// a second stake of the same size.
  var canDouble: Bool { phase == .player && playerCards.count == 2 && bankroll >= Double(bet) }

  private let random: () -> Double

  /// - Parameters:
  ///   - bankroll: opening cash; the view passes the persisted value.
  ///   - random: uniform source in [0, 1), injectable for deterministic tests
  ///     (used only by the Fisher-Yates shuffle, like web `Math.random()`).
  init(
    bankroll: Double = BlackjackEngine.startingBankroll,
    random: @escaping () -> Double = { Double.random(in: 0..<1) }
  ) {
    self.bankroll = bankroll
    self.random = random
  }

  // MARK: - Betting

  /// Adds a chip to the wager. Ignored unless betting and the bankroll covers
  /// the raised bet — the same conditions that disable the web chip buttons.
  func addChip(_ denomination: Int) {
    guard phase == .betting, Double(bet + denomination) <= bankroll else { return }
    bet += denomination
  }

  func clearBet() {
    guard phase == .betting else { return }
    bet = 0
  }

  /// Web "house credit": resets an empty bankroll back to the starting stake.
  func takeHouseCredit() {
    guard phase == .betting, isBroke else { return }
    bankroll = Self.startingBankroll
  }

  // MARK: - Hand flow

  /// Takes the bet and deals in casino order: player, dealer up, player,
  /// dealer hole. Naturals settle immediately (hole revealed); otherwise the
  /// hand moves to the player's decision.
  func deal() {
    guard phase == .betting, bet > 0 else { return }
    bankroll -= Double(bet)
    result = nil
    holeHidden = true

    let first = drawCard()
    let upcard = drawCard()
    let second = drawCard()
    let hole = drawCard()
    playerCards = [first, second]
    dealerCards = [upcard, hole]

    if Self.isBlackjack(playerCards) || Self.isBlackjack(dealerCards) {
      holeHidden = false
      settle()
    } else {
      phase = .player
    }
  }

  /// Draws one card. Busting settles immediately against the dealer's dealt
  /// hand (the dealer never draws into a busted player, like web
  /// `settleBust`); landing exactly on 21 auto-stands into the dealer turn.
  func hit() {
    guard phase == .player else { return }
    playerCards.append(drawCard())
    let total = Self.handTotal(of: playerCards).total
    if total > 21 {
      holeHidden = false
      settle()
    } else if total == 21 {
      beginDealerTurn()
    }
  }

  func stand() {
    guard phase == .player else { return }
    beginDealerTurn()
  }

  /// Doubles the wager (taking the second stake from the bankroll) and draws
  /// exactly one card: a bust settles immediately, anything else auto-stands.
  func doubleDown() {
    guard canDouble else { return }
    bankroll -= Double(bet)
    bet *= 2
    playerCards.append(drawCard())
    if Self.handTotal(of: playerCards).total > 21 {
      holeHidden = false
      settle()
    } else {
      beginDealerTurn()
    }
  }

  /// One dealer action, so the view can pace the draws like the web's timed
  /// choreography: draws a card while under `dealerStandsOn` (17 — soft 17s
  /// stand because they already total 17) and returns true; otherwise settles
  /// the hand and returns false. Call in a loop to finish the turn.
  @discardableResult
  func dealerStep() -> Bool {
    guard phase == .dealer else { return false }
    if Self.handTotal(of: dealerCards).total < Self.dealerStandsOn {
      dealerCards.append(drawCard())
      return true
    }
    settle()
    return false
  }

  /// Clears the table back to the betting phase (web `newHand`).
  func newHand() {
    guard phase == .settled else { return }
    playerCards = []
    dealerCards = []
    result = nil
    holeHidden = true
    bet = 0
    phase = .betting
  }

  // MARK: - Valuation (web cards.ts pure helpers)

  /// Best total for a hand, counting aces as 11 where possible without
  /// busting — a straight port of the web `handTotal`.
  static func handTotal(of cards: [BlackjackCard]) -> BlackjackHandTotal {
    var total = 0
    var elevenAces = 0
    for card in cards {
      total += card.rank.value
      if card.rank == .ace {
        elevenAces += 1
      }
    }
    while total > 21 && elevenAces > 0 {
      total -= 10
      elevenAces -= 1
    }
    return BlackjackHandTotal(total: total, soft: elevenAces > 0)
  }

  /// A natural: 21 from the first two cards.
  static func isBlackjack(_ cards: [BlackjackCard]) -> Bool {
    cards.count == 2 && handTotal(of: cards).total == 21
  }

  /// Human-friendly total, e.g. "17" or "soft 17" (web `formatTotal`).
  static func formatTotal(of cards: [BlackjackCard]) -> String {
    let value = handTotal(of: cards)
    return value.soft ? "soft \(value.total)" : String(value.total)
  }

  /// Formats a dollar amount, keeping cents only when needed — 3:2 payouts on
  /// odd bets are the one source of cents (web `formatMoney`).
  static func formatMoney(_ amount: Double) -> String {
    if amount.truncatingRemainder(dividingBy: 1) == 0 {
      return "$\(Int(amount))"
    }
    return String(format: "$%.2f", amount)
  }

  // MARK: - Internals

  /// Test hook: replace the shoe outright. Cards are drawn from the END of
  /// the array (like the web `shoe.pop()`), so append the desired draw order
  /// reversed. Keep more than `reshuffleAt` cards to avoid a reshuffle.
  func setShoe(_ cards: [BlackjackCard]) {
    shoe = cards
  }

  /// Draws the next card, rebuilding and reshuffling the shoe first when
  /// `reshuffleAt` (25% of the shoe) or fewer cards remain — web `drawCard`.
  private func drawCard() -> BlackjackCard {
    if shoe.count <= Self.reshuffleAt {
      shoe = buildShoe()
      shuffleCount += 1
    }
    return shoe.removeLast()
  }

  /// Builds a freshly shuffled six-deck shoe. Deck construction order and the
  /// Fisher-Yates loop (with `floor(random * (i + 1))`) match the web
  /// `buildShoe` exactly so identical RNG sequences yield identical shoes.
  private func buildShoe() -> [BlackjackCard] {
    var cards: [BlackjackCard] = []
    cards.reserveCapacity(Self.shoeSize)
    for _ in 0..<Self.deckCount {
      for suit in BlackjackSuit.allCases {
        for rank in BlackjackRank.allCases {
          cards.append(BlackjackCard(rank: rank, suit: suit))
        }
      }
    }
    for i in stride(from: cards.count - 1, through: 1, by: -1) {
      let j = Int(random() * Double(i + 1))
      cards.swapAt(i, j)
    }
    return cards
  }

  private func beginDealerTurn() {
    phase = .dealer
    holeHidden = false
  }

  /// Pays out the hand and updates the session stats — a straight port of the
  /// web `settle`, including the both-naturals-push fallthrough (21 vs 21).
  private func settle() {
    let playerTotal = Self.handTotal(of: playerCards).total
    let dealerTotal = Self.handTotal(of: dealerCards).total
    let playerNatural = Self.isBlackjack(playerCards)
    let dealerNatural = Self.isBlackjack(dealerCards)
    let wagered = Double(bet)

    let kind: BlackjackResultKind
    var payout: Double = 0
    if playerTotal > 21 {
      kind = .bust
    } else if playerNatural && !dealerNatural {
      kind = .blackjack
      payout = wagered + wagered * Self.blackjackPayout
    } else if dealerNatural && !playerNatural {
      kind = .lose
    } else if dealerTotal > 21 || playerTotal > dealerTotal {
      kind = .win
      payout = wagered * 2
    } else if playerTotal == dealerTotal {
      kind = .push
      payout = wagered
    } else {
      kind = .lose
    }

    let net = payout - wagered
    bankroll += payout
    result = BlackjackHandResult(kind: kind, net: net)
    stats.hands += 1
    if net > 0 {
      stats.wins += 1
    }
    if kind == .push {
      stats.pushes += 1
    }
    stats.biggestWin = max(stats.biggestWin, net)
    phase = .settled
  }
}

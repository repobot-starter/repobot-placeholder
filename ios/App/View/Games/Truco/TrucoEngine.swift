import Foundation

/// Suits in manilha order (weakest to strongest): ouros ♦ < espadas ♠ <
/// copas ♥ < zap ♣. The raw value IS the manilha suit ranking — must stay in
/// sync with the web `MANILHA_SUIT_ORDER`.
enum TrucoSuit: Int, CaseIterable, Equatable {
  case diamonds = 0
  case spades = 1
  case hearts = 2
  case clubs = 3

  var symbol: String {
    switch self {
    case .diamonds: return "♦"
    case .spades: return "♠"
    case .hearts: return "♥"
    case .clubs: return "♣"
    }
  }

  var isRed: Bool { self == .diamonds || self == .hearts }
}

/// The 10 truco ranks (no 8/9/10 in the 40-card deck). The raw value is the
/// plain-card strength order — 4 5 6 7 Q J K A 2 3 — and must stay in sync
/// with the web `RANK_ORDER`.
enum TrucoRank: Int, CaseIterable, Equatable {
  case four = 0
  case five = 1
  case six = 2
  case seven = 3
  case queen = 4
  case jack = 5
  case king = 6
  case ace = 7
  case two = 8
  case three = 9

  var label: String {
    switch self {
    case .four: return "4"
    case .five: return "5"
    case .six: return "6"
    case .seven: return "7"
    case .queen: return "Q"
    case .jack: return "J"
    case .king: return "K"
    case .ace: return "A"
    case .two: return "2"
    case .three: return "3"
    }
  }

  /// The rank above this one, wrapping 3 → 4 (how the vira picks the manilha).
  var next: TrucoRank {
    TrucoRank(rawValue: (rawValue + 1) % TrucoRank.allCases.count) ?? .four
  }
}

struct TrucoCard: Equatable {
  let rank: TrucoRank
  let suit: TrucoSuit
}

enum TrucoSeat: Equatable {
  case player
  case bot

  var other: TrucoSeat { self == .player ? .bot : .player }
}

/// Outcome of one trick: a winner, or a tie ("empate").
enum TrucoTrickResult: Equatable {
  case player
  case bot
  case tie
}

enum TrucoPhase: Equatable {
  /// Player sits at 11: choose play (worth 3) or fold (bot +1).
  case maoDeOnze
  case playerTurn
  case botTurn
  /// The bot raised: player must accept / re-raise / fold.
  case respond
  /// Hand settled: call `startHand()` for the next deal.
  case handOver
  /// Someone reached 12: call `newGame()`.
  case gameOver
}

enum TrucoRaiseResponse {
  case accept
  case raise
  case fold
}

/// Discrete things an action caused — the native twin of the web engine's
/// `TrucoEvent` union. The view uses these for speech bubbles; tests use them
/// to assert on game flow.
enum TrucoEvent: Equatable {
  case handStarted
  case botSpoke(String)
  case botPlayed(TrucoCard)
  case trickResolved(TrucoTrickResult)
  case botRaised(toStake: Int)
  case botAccepted(stake: Int)
  case botFolded
  case handEnded(winner: TrucoSeat, points: Int)
  case gameEnded(winner: TrucoSeat)
}

/// Both cards of a resolved trick, kept so the view can linger on the reveal.
struct TrucoResolvedTrick: Equatable {
  let playerCard: TrucoCard
  let botCard: TrucoCard
  let result: TrucoTrickResult
}

/// Pure port of the web Truco Paulista engine
/// (`web/app/src/View/Games/Truco/engine.ts`). No SwiftUI here: the engine is
/// a plain state machine whose mutating methods return the events they
/// caused, so it can be unit-tested headlessly and rendered by any frontend.
///
/// The rank tables, empate rules, raise ladder, and every bot threshold must
/// stay byte-for-byte in sync with the web engine; change them together.
///
/// Randomness (shuffle, bot decisions, table-talk lines) goes through an
/// injected closure so tests can make the game fully deterministic.
final class TrucoEngine {
  /// The raise ladder: 1 (hand) → 3 (Truco) → 6 (Seis) → 9 (Nove) → 12 (Doze).
  static let stakeLadder = [1, 3, 6, 9, 12]
  /// First to this many points wins (and triggers mão de onze at 11).
  static let winningScore = 12
  /// Portuguese announcement for each raised stake.
  static let raiseCall: [Int: String] = [3: "Truco!", 6: "Seis!", 9: "Nove!", 12: "Doze!"]

  // Table-talk lines — same strings as the web engine.
  private static let acceptLines = ["Cai dentro!", "Bora, então!", "Segura essa!"]
  private static let foldLines = ["Corro!", "Tô fora...", "Fica pra ti."]
  private static let handWinLines = ["É nóis!", "O boteco é meu!", "Mais uma pro bot!"]
  private static let handLoseLines = ["Ah, não...", "Sorte sua, hein.", "Essa doeu."]
  private static let maoDeOnzePlayLines = ["Na mão de onze eu vou!", "Confia no bot."]

  // Bot decision thresholds — mirrored verbatim from the web engine.
  private static let botReRaiseStrength = 0.72
  private static let botAcceptStrength = 0.45
  private static let botMaoDeOnzeStrength = 0.5

  /// Bluff rate 0..1 — the "Cara de pau" slider (honest → shameless).
  var bluff: Double

  private(set) var playerScore = 0
  private(set) var botScore = 0
  private(set) var gameWinner: TrucoSeat?

  private(set) var phase: TrucoPhase = .handOver
  private(set) var playerHand: [TrucoCard] = []
  private(set) var botHand: [TrucoCard] = []
  private(set) var vira = TrucoCard(rank: .four, suit: .diamonds)
  private(set) var manilhaRank: TrucoRank = .five

  /// Accepted stake for this hand (what a fold concedes right now).
  private(set) var stake = 1
  /// Pending raise awaiting the player's response (phase == .respond).
  private(set) var proposedStake: Int?
  /// Who made the last accepted raise; that seat cannot raise again next.
  private(set) var raisedBy: TrucoSeat?
  /// True on mão de onze hands: the raise ladder is locked.
  private(set) var trucoLocked = false

  /// Who led the first trick of this hand (the "mão"); alternates per hand.
  private(set) var handLeader: TrucoSeat = .player
  /// Who leads the current trick (ties keep the same leader).
  private(set) var leader: TrucoSeat = .player
  private(set) var trickResults: [TrucoTrickResult] = []
  private(set) var playerTrickCard: TrucoCard?
  private(set) var botTrickCard: TrucoCard?
  private(set) var lastTrick: TrucoResolvedTrick?
  private(set) var handWinner: TrucoSeat?
  /// Points the settled hand transferred (for the hand-over banner).
  private(set) var handPoints = 0

  private let random: () -> Double
  /// Alternates the mão between hands; `startHand` flips it.
  private var nextHandLeader: TrucoSeat = .player

  init(bluff: Double = 0.35, random: @escaping () -> Double = { Double.random(in: 0..<1) }) {
    self.bluff = bluff
    self.random = random
  }

  // MARK: - Static rule tables (shared with tests and the view)

  /// The manilha rank is the rank above the vira, wrapping 3 → 4.
  static func manilhaRank(forVira viraRank: TrucoRank) -> TrucoRank {
    viraRank.next
  }

  /// Total ordering used to resolve tricks. Plain cards score their rank
  /// index (0..9) — equal ranks tie regardless of suit. Manilhas score
  /// 100 + suit order, so any manilha beats any plain card and manilhas
  /// never tie.
  static func cardStrength(_ card: TrucoCard, manilhaRank: TrucoRank) -> Int {
    card.rank == manilhaRank ? 100 + card.suit.rawValue : card.rank.rawValue
  }

  /// Next rung of the raise ladder, or nil when the stake is already 12.
  static func nextStake(_ stake: Int) -> Int? {
    guard let index = stakeLadder.firstIndex(of: stake), index < stakeLadder.count - 1 else {
      return nil
    }
    return stakeLadder[index + 1]
  }

  /// 0..1 hand-strength score the bot bets with: each card is worth its rank
  /// index scaled to 0..0.75, or 0.85 + 0.05·suit for a manilha (zap = 1.0).
  /// The best card dominates (70%) with the rest as support (30%) — the same
  /// formula as the web `handStrength`.
  static func handStrength(_ cards: [TrucoCard], manilhaRank: TrucoRank) -> Double {
    guard !cards.isEmpty else { return 0 }
    let points = cards
      .map { card -> Double in
        card.rank == manilhaRank
          ? 0.85 + 0.05 * Double(card.suit.rawValue)
          : Double(card.rank.rawValue) / 12
      }
      .sorted(by: >)
    let support = points.count > 1
      ? points.dropFirst().reduce(0, +) / Double(points.count - 1)
      : 0
    return 0.7 * points[0] + 0.3 * support
  }

  /// Builds the 40-card truco deck in a deterministic order.
  static func buildDeck() -> [TrucoCard] {
    TrucoSuit.allCases.flatMap { suit in
      TrucoRank.allCases.map { rank in TrucoCard(rank: rank, suit: suit) }
    }
  }

  // MARK: - Actions

  /// Full match reset, then deals the first hand.
  @discardableResult
  func newGame() -> [TrucoEvent] {
    playerScore = 0
    botScore = 0
    gameWinner = nil
    nextHandLeader = .player
    return startHand()
  }

  /// Deals the next hand: shuffles, flips the vira, resets the stake, and
  /// runs the mão de onze gate before anyone plays.
  @discardableResult
  func startHand() -> [TrucoEvent] {
    guard gameWinner == nil else { return [] }
    var deck = Self.buildDeck()
    // Fisher-Yates through the injected RNG, matching the web shuffle.
    for i in stride(from: deck.count - 1, to: 0, by: -1) {
      let j = Int(random() * Double(i + 1))
      deck.swapAt(i, min(j, i))
    }
    handLeader = nextHandLeader
    nextHandLeader = nextHandLeader.other
    resetHandState(
      playerHand: Array(deck[0..<3]),
      botHand: Array(deck[3..<6]),
      vira: deck[6]
    )

    var events: [TrucoEvent] = [.handStarted]
    let playerAtEleven = playerScore == Self.winningScore - 1
    let botAtEleven = botScore == Self.winningScore - 1
    if playerAtEleven && botAtEleven {
      // Simplification (documented in PACK.md): both at 11 plays a normal
      // hand locked at 3 points.
      stake = 3
      trucoLocked = true
    } else if playerAtEleven {
      phase = .maoDeOnze
    } else if botAtEleven {
      // The bot decides its own mão de onze immediately.
      let strength = Self.handStrength(botHand, manilhaRank: manilhaRank)
      if strength >= Self.botMaoDeOnzeStrength || random() < bluff {
        stake = 3
        trucoLocked = true
        events.append(.botSpoke(pick(Self.maoDeOnzePlayLines)))
      } else {
        events.append(.botSpoke(pick(Self.foldLines)))
        events.append(contentsOf: endHand(winner: .player, points: 1))
      }
    }
    return events
  }

  /// Test/remix hook: pin both hands and the vira, then play normally.
  func setHands(playerHand: [TrucoCard], botHand: [TrucoCard], vira: TrucoCard) {
    resetHandState(playerHand: playerHand, botHand: botHand, vira: vira)
  }

  /// Test/remix hook: set the score line (call before startHand/setHands).
  func setScores(player: Int, bot: Int) {
    playerScore = player
    botScore = bot
  }

  /// Mão de onze choice for the player at 11: play at 3, or concede 1.
  @discardableResult
  func decideMaoDeOnze(play: Bool) -> [TrucoEvent] {
    guard phase == .maoDeOnze else { return [] }
    if play {
      stake = 3
      trucoLocked = true
      phase = leader == .player ? .playerTurn : .botTurn
      return []
    }
    return endHand(winner: .bot, points: 1)
  }

  /// Whether `seat` could legally raise right now (their turn to act).
  func canRaise(_ seat: TrucoSeat) -> Bool {
    let myTurn = phase == (seat == .player ? .playerTurn : .botTurn)
    return myTurn && !trucoLocked && raisedBy != seat && Self.nextStake(stake) != nil
  }

  /// Player plays their hand card at `index` (phase must be .playerTurn).
  @discardableResult
  func playCard(at index: Int) -> [TrucoEvent] {
    guard phase == .playerTurn, playerHand.indices.contains(index) else { return [] }
    let card = playerHand.remove(at: index)
    playerTrickCard = card
    if botTrickCard != nil {
      return resolveTrick()
    }
    phase = .botTurn
    return []
  }

  /// The bot takes its turn: it may call a raise (ending the action — the
  /// player must respond), otherwise it plays a card.
  @discardableResult
  func botAct() -> [TrucoEvent] {
    guard phase == .botTurn else { return [] }
    let strength = Self.handStrength(botHand, manilhaRank: manilhaRank)
    if canRaise(.bot) {
      // Call proportionally to strength, plus a bluff kicker.
      let urge = min(1, max(0, (strength - 0.5) * 1.6)) * 0.8 + bluff * 0.25
      if random() < urge, let proposed = Self.nextStake(stake) {
        proposedStake = proposed
        phase = .respond
        return [
          .botSpoke(Self.raiseCall[proposed] ?? "Truco!"),
          .botRaised(toStake: proposed),
        ]
      }
    }
    let card = chooseBotCard()
    if let position = botHand.firstIndex(of: card) {
      botHand.remove(at: position)
    }
    botTrickCard = card
    var events: [TrucoEvent] = [.botPlayed(card)]
    if playerTrickCard != nil {
      events.append(contentsOf: resolveTrick())
    } else {
      phase = .playerTurn
    }
    return events
  }

  /// Player calls the next rung (Truco/Seis/Nove/Doze). The bot answers
  /// immediately: fold (player wins the pre-raise stake), accept, or
  /// re-raise (which puts the player in the .respond phase).
  @discardableResult
  func playerCallRaise() -> [TrucoEvent] {
    guard canRaise(.player), let proposed = Self.nextStake(stake) else { return [] }
    return botAnswerRaise(proposed: proposed)
  }

  /// Player answers a pending bot raise (phase must be .respond).
  @discardableResult
  func respondToRaise(_ response: TrucoRaiseResponse) -> [TrucoEvent] {
    guard phase == .respond, let proposed = proposedStake else { return [] }
    if response == .fold {
      // "Correr": concede the stake that was in force before the raise.
      proposedStake = nil
      return endHand(winner: .bot, points: stake)
    }
    // Accepting (or re-raising, which implies acceptance) locks in the
    // proposed stake; the bot made this raise so it cannot raise next.
    stake = proposed
    raisedBy = .bot
    proposedStake = nil
    if response == .accept {
      resumeAfterRaise()
      return []
    }
    guard let higher = Self.nextStake(stake) else {
      resumeAfterRaise()
      return []
    }
    return botAnswerRaise(proposed: higher)
  }

  // MARK: - Internals

  private func resetHandState(playerHand: [TrucoCard], botHand: [TrucoCard], vira: TrucoCard) {
    self.playerHand = playerHand
    self.botHand = botHand
    self.vira = vira
    manilhaRank = Self.manilhaRank(forVira: vira.rank)
    stake = 1
    proposedStake = nil
    raisedBy = nil
    trucoLocked = false
    leader = handLeader
    trickResults = []
    playerTrickCard = nil
    botTrickCard = nil
    lastTrick = nil
    handWinner = nil
    handPoints = 0
    phase = leader == .player ? .playerTurn : .botTurn
  }

  /// The bot answers a raise proposed by the player (call or re-raise).
  private func botAnswerRaise(proposed: Int) -> [TrucoEvent] {
    let strength = Self.handStrength(botHand, manilhaRank: manilhaRank)
    let bluffing = random() < bluff * 0.5
    if strength >= Self.botReRaiseStrength || (bluffing && random() < 0.5) {
      // Accept the player's raise; re-raise on top if the ladder allows.
      stake = proposed
      raisedBy = .player
      if let higher = Self.nextStake(stake) {
        proposedStake = higher
        phase = .respond
        return [
          .botSpoke(Self.raiseCall[higher] ?? "Truco!"),
          .botRaised(toStake: higher),
        ]
      }
      resumeAfterRaise()
      return [.botSpoke(pick(Self.acceptLines)), .botAccepted(stake: stake)]
    }
    if strength >= Self.botAcceptStrength || bluffing {
      stake = proposed
      raisedBy = .player
      resumeAfterRaise()
      return [.botSpoke(pick(Self.acceptLines)), .botAccepted(stake: stake)]
    }
    // Fold: the raiser wins the stake in force before this raise.
    var events: [TrucoEvent] = [.botSpoke(pick(Self.foldLines)), .botFolded]
    events.append(contentsOf: endHand(winner: .player, points: stake))
    return events
  }

  /// After a raise settles, play resumes with whoever still has to act.
  private func resumeAfterRaise() {
    if playerTrickCard != nil && botTrickCard == nil {
      phase = .botTurn
    } else if botTrickCard != nil && playerTrickCard == nil {
      phase = .playerTurn
    } else {
      phase = leader == .player ? .playerTurn : .botTurn
    }
  }

  /// Bot card choice. Leading: strongest card with a strong hand, weakest
  /// otherwise. Following: the cheapest card that wins the trick, else the
  /// weakest card (dumping). Same heuristic as the web `chooseBotCard`.
  private func chooseBotCard() -> TrucoCard {
    let byStrength = botHand.sorted {
      Self.cardStrength($0, manilhaRank: manilhaRank)
        < Self.cardStrength($1, manilhaRank: manilhaRank)
    }
    guard let playerCard = playerTrickCard else {
      let strength = Self.handStrength(botHand, manilhaRank: manilhaRank)
      return strength >= 0.55 ? byStrength[byStrength.count - 1] : byStrength[0]
    }
    let target = Self.cardStrength(playerCard, manilhaRank: manilhaRank)
    let winning = byStrength.first { Self.cardStrength($0, manilhaRank: manilhaRank) > target }
    return winning ?? byStrength[0]
  }

  /// Resolves a completed trick and, when decisive, the hand and game.
  private func resolveTrick() -> [TrucoEvent] {
    guard let playerCard = playerTrickCard, let botCard = botTrickCard else { return [] }
    let playerPower = Self.cardStrength(playerCard, manilhaRank: manilhaRank)
    let botPower = Self.cardStrength(botCard, manilhaRank: manilhaRank)
    let result: TrucoTrickResult =
      playerPower > botPower ? .player : (botPower > playerPower ? .bot : .tie)
    trickResults.append(result)
    lastTrick = TrucoResolvedTrick(playerCard: playerCard, botCard: botCard, result: result)
    playerTrickCard = nil
    botTrickCard = nil

    var events: [TrucoEvent] = [.trickResolved(result)]
    if let winner = handWinnerFromTricks() {
      events.append(contentsOf: endHand(winner: winner, points: stake))
      return events
    }
    // Next trick: the winner leads; a tie keeps the same leader.
    if result == .player {
      leader = .player
    } else if result == .bot {
      leader = .bot
    }
    phase = leader == .player ? .playerTurn : .botTurn
    return events
  }

  /// Truco Paulista hand resolution with the empate rules (see the web
  /// `handWinnerFromTricks` and PACK.md):
  /// - two clean trick wins take the hand;
  /// - once any trick has tied, the winner of the first non-tied trick
  ///   takes the hand;
  /// - all three tricks tied: the hand goes to the mão (`handLeader`).
  /// Returns nil while the hand is still undecided.
  private func handWinnerFromTricks() -> TrucoSeat? {
    let playerWins = trickResults.filter { $0 == .player }.count
    let botWins = trickResults.filter { $0 == .bot }.count
    let ties = trickResults.filter { $0 == .tie }.count
    if playerWins >= 2 { return .player }
    if botWins >= 2 { return .bot }
    if ties > 0 {
      if let firstDecided = trickResults.first(where: { $0 != .tie }) {
        return firstDecided == .player ? .player : .bot
      }
      if trickResults.count == 3 {
        return handLeader
      }
    }
    return nil
  }

  /// Transfers points, checks for game over, and parks in .handOver.
  private func endHand(winner: TrucoSeat, points: Int) -> [TrucoEvent] {
    handWinner = winner
    handPoints = points
    if winner == .player {
      playerScore = min(Self.winningScore, playerScore + points)
    } else {
      botScore = min(Self.winningScore, botScore + points)
    }
    var events: [TrucoEvent] = [
      .botSpoke(pick(winner == .bot ? Self.handWinLines : Self.handLoseLines)),
      .handEnded(winner: winner, points: points),
    ]
    if playerScore >= Self.winningScore || botScore >= Self.winningScore {
      gameWinner = playerScore >= Self.winningScore ? .player : .bot
      phase = .gameOver
      events.append(.gameEnded(winner: gameWinner ?? .player))
    } else {
      phase = .handOver
    }
    return events
  }

  private func pick(_ lines: [String]) -> String {
    lines[min(lines.count - 1, Int(random() * Double(lines.count)))]
  }
}

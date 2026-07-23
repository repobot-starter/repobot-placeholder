import XCTest

@testable import AppIOS

/// Content-integrity tests for the flashcard pack: card fronts double as
/// stable identifiers for saved progress, so duplicates are a build failure.
final class FlashContentTests: XCTestCase {
  func testAppIdentityIsPresent() {
    XCTAssertFalse(FlashContent.title.isEmpty)
    XCTAssertFalse(FlashContent.tagline.isEmpty)
  }

  func testEveryDeckIsWellFormedWithUniqueIds() {
    XCTAssertFalse(FlashContent.decks.isEmpty)
    let ids = FlashContent.decks.map(\.id)
    XCTAssertEqual(Set(ids).count, ids.count, "deck ids must be unique")
    for deck in FlashContent.decks {
      XCTAssertFalse(deck.title.isEmpty)
      XCTAssertFalse(deck.cards.isEmpty, "\(deck.id): decks can't be empty")
    }
  }

  func testCardFrontsAreUniqueWithinEachDeck() {
    for deck in FlashContent.decks {
      let fronts = deck.cards.map(\.front)
      XCTAssertEqual(
        Set(fronts).count, fronts.count,
        "\(deck.id): card fronts are progress keys and must be unique")
      for card in deck.cards {
        XCTAssertFalse(card.front.isEmpty)
        XCTAssertFalse(card.back.isEmpty)
      }
    }
  }
}

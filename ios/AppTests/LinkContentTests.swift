import XCTest

@testable import AppIOS

/// LinkBot has no engine — its correctness is content integrity. These tests
/// keep the agent-editable content file honest: every link must be openable
/// and the theme swatches must stay distinct.
final class LinkContentTests: XCTestCase {
  func testProfileFieldsArePresent() {
    XCTAssertFalse(LinkContent.profile.name.isEmpty)
    XCTAssertTrue(LinkContent.profile.handle.hasPrefix("@"))
    XCTAssertFalse(LinkContent.profile.bio.isEmpty)
    XCTAssertFalse(LinkContent.profile.avatarEmoji.isEmpty)
  }

  func testEveryLinkHasHttpsUrlAndUniqueLabel() {
    XCTAssertFalse(LinkContent.links.isEmpty)
    var seenLabels = Set<String>()
    for link in LinkContent.links {
      XCTAssertFalse(link.label.isEmpty)
      XCTAssertFalse(link.note.isEmpty)
      let url = URL(string: link.url)
      XCTAssertNotNil(url, "\(link.label) has an unparseable URL")
      XCTAssertEqual(url?.scheme, "https", "\(link.label) must use https")
      XCTAssertTrue(seenLabels.insert(link.label).inserted, "duplicate label \(link.label)")
    }
  }

  func testEverySocialHasHttpsUrl() {
    XCTAssertFalse(LinkContent.socials.isEmpty)
    for social in LinkContent.socials {
      XCTAssertEqual(URL(string: social.url)?.scheme, "https", "\(social.label) must use https")
      XCTAssertFalse(social.monogram.isEmpty)
    }
  }

  func testThemesHaveUniqueKeysAndGradientStops() {
    XCTAssertGreaterThanOrEqual(LinkContent.themes.count, 2)
    let keys = LinkContent.themes.map(\.key)
    XCTAssertEqual(Set(keys).count, keys.count, "theme keys must be unique")
    for theme in LinkContent.themes {
      XCTAssertGreaterThanOrEqual(
        theme.backgroundColors.count, 2,
        "\(theme.key) needs at least two gradient stops")
    }
  }
}

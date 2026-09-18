import XCTest

@testable import AppIOS

/// LaunchBot has no engine — its correctness is content integrity. These
/// tests keep the agent-editable content file honest, especially the pricing
/// table (a wrong yearly price is the most embarrassing landing-page bug).
final class LaunchContentTests: XCTestCase {
  func testProductCopyIsPresent() {
    XCTAssertFalse(LaunchContent.product.name.isEmpty)
    XCTAssertFalse(LaunchContent.product.headline.isEmpty)
    XCTAssertFalse(LaunchContent.product.subheadline.isEmpty)
    XCTAssertFalse(LaunchContent.product.waitlistCta.isEmpty)
  }

  func testFeaturesAndStepsAreCompleteWithUniqueTitles() {
    XCTAssertGreaterThanOrEqual(LaunchContent.features.count, 3)
    let featureTitles = LaunchContent.features.map(\.title)
    XCTAssertEqual(Set(featureTitles).count, featureTitles.count)
    XCTAssertEqual(LaunchContent.steps.count, 3, "the how-it-works row is designed for 3 steps")
  }

  func testPricingTiersAreCoherent() {
    XCTAssertFalse(LaunchContent.pricing.isEmpty)
    let names = LaunchContent.pricing.map(\.name)
    XCTAssertEqual(Set(names).count, names.count)
    XCTAssertEqual(
      LaunchContent.pricing.filter(\.highlighted).count, 1,
      "exactly one tier should carry the highlight")
    for tier in LaunchContent.pricing {
      XCTAssertGreaterThanOrEqual(tier.monthly, 0)
      XCTAssertLessThanOrEqual(
        tier.yearlyPerMonth, tier.monthly,
        "\(tier.name): yearly per-month price must not exceed monthly")
      XCTAssertFalse(tier.features.isEmpty)
    }
  }

  func testFaqEntriesAreComplete() {
    XCTAssertFalse(LaunchContent.faq.isEmpty)
    for item in LaunchContent.faq {
      XCTAssertFalse(item.question.isEmpty)
      XCTAssertFalse(item.answer.isEmpty)
    }
  }
}

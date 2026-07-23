import XCTest

@testable import AppIOS

/// FolioBot has no engine — its correctness is content integrity. These tests
/// keep the agent-editable content file honest.
final class FolioContentTests: XCTestCase {
  func testProfileFieldsArePresent() {
    XCTAssertFalse(FolioContent.profile.name.isEmpty)
    XCTAssertFalse(FolioContent.profile.statement.isEmpty)
    XCTAssertTrue(FolioContent.profile.email.contains("@"))
  }

  func testEveryProjectIsCompleteWithUniqueTitleAndHttpsUrl() {
    XCTAssertFalse(FolioContent.projects.isEmpty)
    var seenTitles = Set<String>()
    for project in FolioContent.projects {
      XCTAssertFalse(project.title.isEmpty)
      XCTAssertFalse(project.description.isEmpty)
      XCTAssertFalse(project.tags.isEmpty, "\(project.title) needs at least one tag")
      XCTAssertEqual(URL(string: project.url)?.scheme, "https", "\(project.title) must use https")
      XCTAssertTrue(seenTitles.insert(project.title).inserted, "duplicate title \(project.title)")
    }
  }

  func testAllTagsPreservesFirstAppearanceOrderWithoutDuplicates() {
    let tags = FolioContent.allTags()
    XCTAssertEqual(Set(tags).count, tags.count, "tags must be unique")
    // First project's first tag leads the chip row.
    XCTAssertEqual(tags.first, FolioContent.projects.first?.tags.first)
    // Every project tag is represented.
    let everyTag = Set(FolioContent.projects.flatMap(\.tags))
    XCTAssertEqual(Set(tags), everyTag)
  }

  func testAboutAndSocialsArePresent() {
    XCTAssertFalse(FolioContent.aboutParagraphs.isEmpty)
    XCTAssertFalse(FolioContent.skills.isEmpty)
    for social in FolioContent.socials {
      XCTAssertEqual(URL(string: social.url)?.scheme, "https")
    }
  }
}

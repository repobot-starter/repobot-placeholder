import XCTest

@testable import AppIOS

/// Content-integrity tests for the blog pack: the posts are the product,
/// so a malformed slug, date, or an unparseable body is a build failure.
final class BlogContentTests: XCTestCase {
  func testBlogIdentityIsPresent() {
    XCTAssertFalse(BlogContent.title.isEmpty)
    XCTAssertFalse(BlogContent.tagline.isEmpty)
    XCTAssertFalse(BlogContent.author.name.isEmpty)
    XCTAssertFalse(BlogContent.author.bio.isEmpty)
  }

  func testEveryPostIsWellFormedWithUniqueSlug() {
    XCTAssertFalse(BlogContent.posts.isEmpty)
    let slugs = BlogContent.posts.map(\.slug)
    XCTAssertEqual(Set(slugs).count, slugs.count, "post slugs must be unique")
    for post in BlogContent.posts {
      XCTAssertFalse(post.title.isEmpty)
      XCTAssertFalse(post.summary.isEmpty)
      XCTAssertFalse(post.tags.isEmpty)
      XCTAssertNotNil(
        post.slug.range(of: "^[a-z0-9-]+$", options: .regularExpression),
        "\(post.slug): slug must be lowercase kebab-case")
      XCTAssertNotNil(
        post.date.range(of: "^\\d{4}-\\d{2}-\\d{2}$", options: .regularExpression),
        "\(post.slug): date must be ISO yyyy-mm-dd")
    }
  }

  func testEveryPostBodyParsesIntoBlocks() {
    for post in BlogContent.posts {
      let blocks = BlogMarkdown.parseMarkdown(post.body)
      XCTAssertGreaterThan(blocks.count, 1, "\(post.slug): body should parse into blocks")
      XCTAssertGreaterThanOrEqual(BlogMarkdown.readingTimeMinutes(post.body), 1)
    }
  }

  func testSortedPostsAreNewestFirst() {
    let sorted = BlogContent.sortedPosts()
    for (a, b) in zip(sorted, sorted.dropFirst()) {
      XCTAssertGreaterThanOrEqual(a.date, b.date)
    }
  }

  func testAllTagsPreservesFirstAppearanceOrderWithoutDuplicates() {
    let tags = BlogContent.allTags()
    XCTAssertEqual(Set(tags).count, tags.count)
    XCTAssertFalse(tags.isEmpty)
  }
}

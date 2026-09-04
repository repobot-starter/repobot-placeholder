import XCTest

@testable import AppIOS

/// Mirrors the web pack's markdown.test.ts — the parser is the blog's
/// "engine", and all three platforms must produce the same block structure
/// from the same post bodies.
final class BlogMarkdownTests: XCTestCase {
  func testParsesTheFourInlineMarksAroundPlainText() {
    let inlines = BlogMarkdown.parseInlines("a **b** c *d* e `f` g [h](https://x.test) i")
    XCTAssertEqual(
      inlines,
      [
        .text("a "),
        .bold("b"),
        .text(" c "),
        .italic("d"),
        .text(" e "),
        .code("f"),
        .text(" g "),
        .link(text: "h", href: "https://x.test"),
        .text(" i"),
      ])
  }

  func testTreatsUnterminatedMarksAsPlainText() {
    XCTAssertEqual(BlogMarkdown.parseInlines("a **b and *c"), [.text("a **b and *c")])
    XCTAssertEqual(BlogMarkdown.parseInlines("[label](no-close"), [.text("[label](no-close")])
  }

  func testParsesEveryBlockKind() {
    let markdown = [
      "### Title",
      "",
      "One line",
      "wrapped onto two.",
      "",
      "> quoted first",
      "> quoted second",
      "",
      "- alpha",
      "- beta",
      "",
      "1. first",
      "2. second",
      "",
      "---",
      "",
      "```ts",
      "const x = 1",
      "```",
    ].joined(separator: "\n")

    let blocks = BlogMarkdown.parseMarkdown(markdown)
    XCTAssertEqual(blocks.count, 7)
    XCTAssertEqual(blocks[0], .heading(level: 3, inlines: [.text("Title")]))
    XCTAssertEqual(blocks[1], .paragraph([.text("One line wrapped onto two.")]))
    XCTAssertEqual(blocks[2], .quote([.text("quoted first quoted second")]))
    XCTAssertEqual(
      blocks[3], .list(ordered: false, items: [[.text("alpha")], [.text("beta")]]))
    XCTAssertEqual(
      blocks[4], .list(ordered: true, items: [[.text("first")], [.text("second")]]))
    XCTAssertEqual(blocks[5], .divider)
    XCTAssertEqual(blocks[6], .code(language: "ts", text: "const x = 1"))
  }

  func testKeepsCodeFenceContentsVerbatim() {
    let blocks = BlogMarkdown.parseMarkdown("```\n# not a heading\n- not a list\n```")
    XCTAssertEqual(blocks, [.code(language: "", text: "# not a heading\n- not a list")])
  }

  func testReadingTimeRoundsUpWithOneMinuteFloor() {
    XCTAssertEqual(BlogMarkdown.readingTimeMinutes("hi"), 1)
    let long = Array(repeating: "word", count: 221).joined(separator: " ")
    XCTAssertEqual(BlogMarkdown.readingTimeMinutes(long), 2)
  }
}

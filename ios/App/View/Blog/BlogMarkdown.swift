import Foundation

/// The blog's markdown subset, mirrored line-for-line from the web pack's
/// markdown.ts (and BlogMarkdown.kt on Android): headings #–###, paragraphs,
/// fenced code, > quotes, flat lists, --- dividers, and the four inline
/// marks (**bold**, *italic*, `code`, [link](url)). All three platforms
/// parse the same post bodies into the same block structure.
enum BlogInline: Equatable {
  case text(String)
  case bold(String)
  case italic(String)
  case code(String)
  case link(text: String, href: String)
}

enum BlogBlock: Equatable {
  case heading(level: Int, inlines: [BlogInline])
  case paragraph([BlogInline])
  case code(language: String, text: String)
  case quote([BlogInline])
  case list(ordered: Bool, items: [[BlogInline]])
  case divider
}

enum BlogMarkdown {
  /// Parse the inline marks of a single line of text.
  static func parseInlines(_ text: String) -> [BlogInline] {
    let chars = Array(text)
    var inlines: [BlogInline] = []
    var plain = ""
    var i = 0

    func flush() {
      if !plain.isEmpty {
        inlines.append(.text(plain))
        plain = ""
      }
    }

    func find(_ marker: [Character], from: Int) -> Int? {
      guard marker.count <= chars.count else { return nil }
      var j = from
      while j <= chars.count - marker.count {
        if Array(chars[j..<(j + marker.count)]) == marker { return j }
        j += 1
      }
      return nil
    }

    // A closing * or ** only counts when the span is non-empty and doesn't
    // end in a space — stray asterisks stay plain text.
    func closes(_ end: Int, _ contentStart: Int) -> Bool {
      end > contentStart && chars[end - 1] != " "
    }

    while i < chars.count {
      if i + 1 < chars.count, chars[i] == "*", chars[i + 1] == "*" {
        if let end = find(["*", "*"], from: i + 2), closes(end, i + 2) {
          flush()
          inlines.append(.bold(String(chars[(i + 2)..<end])))
          i = end + 2
          continue
        }
      }
      if chars[i] == "*" {
        if let end = find(["*"], from: i + 1), closes(end, i + 1) {
          flush()
          inlines.append(.italic(String(chars[(i + 1)..<end])))
          i = end + 1
          continue
        }
      }
      if chars[i] == "`" {
        if let end = find(["`"], from: i + 1), end > i + 1 {
          flush()
          inlines.append(.code(String(chars[(i + 1)..<end])))
          i = end + 1
          continue
        }
      }
      if chars[i] == "[" {
        if let close = find(["]", "("], from: i + 1),
          let end = find([")"], from: close + 2), end > close
        {
          flush()
          inlines.append(
            .link(
              text: String(chars[(i + 1)..<close]),
              href: String(chars[(close + 2)..<end])))
          i = end + 1
          continue
        }
      }
      plain.append(chars[i])
      i += 1
    }
    flush()
    return inlines
  }

  private static func isUnordered(_ s: String) -> Bool { s.hasPrefix("- ") }

  private static func isOrdered(_ s: String) -> Bool {
    guard let dot = s.firstIndex(of: ".") else { return false }
    let digits = s[s.startIndex..<dot]
    guard !digits.isEmpty, digits.allSatisfy({ $0.isNumber }) else { return false }
    return s[dot...].hasPrefix(". ")
  }

  /// Parse a markdown document into a flat list of blocks.
  static func parseMarkdown(_ markdown: String) -> [BlogBlock] {
    var blocks: [BlogBlock] = []
    let lines = markdown.components(separatedBy: "\n")
    var i = 0
    while i < lines.count {
      let trimmed = lines[i].trimmingCharacters(in: .whitespaces)

      if trimmed.isEmpty {
        i += 1
        continue
      }

      if trimmed.hasPrefix("```") {
        let language = String(trimmed.dropFirst(3)).trimmingCharacters(in: .whitespaces)
        var body: [String] = []
        i += 1
        while i < lines.count,
          !lines[i].trimmingCharacters(in: .whitespaces).hasPrefix("```")
        {
          body.append(lines[i])
          i += 1
        }
        i += 1  // closing fence
        blocks.append(.code(language: language, text: body.joined(separator: "\n")))
        continue
      }

      if trimmed.hasPrefix("#") {
        let level = trimmed.prefix(while: { $0 == "#" }).count
        if level <= 3, trimmed.dropFirst(level).hasPrefix(" ") {
          let text = String(trimmed.dropFirst(level + 1))
          blocks.append(.heading(level: level, inlines: parseInlines(text)))
          i += 1
          continue
        }
      }

      if trimmed == "---" {
        blocks.append(.divider)
        i += 1
        continue
      }

      if trimmed.hasPrefix("> ") {
        var parts: [String] = []
        while i < lines.count {
          let line = lines[i].trimmingCharacters(in: .whitespaces)
          guard line.hasPrefix("> ") else { break }
          parts.append(String(line.dropFirst(2)))
          i += 1
        }
        blocks.append(.quote(parseInlines(parts.joined(separator: " "))))
        continue
      }

      if isUnordered(trimmed) || isOrdered(trimmed) {
        let ordered = isOrdered(trimmed)
        var items: [[BlogInline]] = []
        while i < lines.count {
          let line = lines[i].trimmingCharacters(in: .whitespaces)
          guard ordered ? isOrdered(line) : isUnordered(line) else { break }
          let text: String
          if ordered {
            let dot = line.firstIndex(of: ".")!
            text = String(line[line.index(dot, offsetBy: 2)...])
          } else {
            text = String(line.dropFirst(2))
          }
          items.append(parseInlines(text))
          i += 1
        }
        blocks.append(.list(ordered: ordered, items: items))
        continue
      }

      // Paragraph: merge consecutive plain lines.
      var parts: [String] = [trimmed]
      i += 1
      while i < lines.count {
        let next = lines[i].trimmingCharacters(in: .whitespaces)
        let isBlockStart =
          next.isEmpty || next.hasPrefix("```") || next.hasPrefix("#")
          || next.hasPrefix("> ") || next == "---" || isUnordered(next) || isOrdered(next)
        if isBlockStart { break }
        parts.append(next)
        i += 1
      }
      blocks.append(.paragraph(parseInlines(parts.joined(separator: " "))))
    }
    return blocks
  }

  /// Estimated reading time at 220 words per minute; never below one minute.
  static func readingTimeMinutes(_ markdown: String) -> Int {
    let words = markdown.split(whereSeparator: { $0.isWhitespace }).count
    return max(1, Int(ceil(Double(words) / 220.0)))
  }
}

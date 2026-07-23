import SwiftUI

/// The blog's reading palette, mirrored from BlogPage.styles.css.ts.
private enum BlogPalette {
  static let paper = Color(red: 0.988, green: 0.984, blue: 0.965)
  static let ink = Color(red: 0.125, green: 0.129, blue: 0.110)
  static let inkSoft = Color(red: 0.443, green: 0.443, blue: 0.416)
  static let line = Color(red: 0.898, green: 0.890, blue: 0.847)
  static let accent = Color(red: 0.243, green: 0.420, blue: 0.310)
  static let accentSoft = Color(red: 0.933, green: 0.949, blue: 0.918)
  static let codeBg = Color(red: 0.949, green: 0.941, blue: 0.910)
}

struct BlogView: View {
  @State private var activeTag: String?
  @State private var openSlug: String?

  private var orderedPosts: [BlogContent.Post] { BlogContent.sortedPosts() }

  private var visiblePosts: [BlogContent.Post] {
    guard let tag = activeTag else { return orderedPosts }
    return orderedPosts.filter { $0.tags.contains(tag) }
  }

  var body: some View {
    ZStack {
      BlogPalette.paper.ignoresSafeArea()
      if let slug = openSlug, let post = orderedPosts.first(where: { $0.slug == slug }) {
        articleView(post)
      } else {
        listView
      }
    }
  }

  // MARK: - List

  private var listView: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 0) {
        masthead
        tagRow
          .padding(.vertical, 14)
        ForEach(visiblePosts) { post in
          postCard(post)
        }
        Text("\(BlogContent.title) — written by \(BlogContent.author.name). Built with Repobot.")
          .font(.footnote)
          .foregroundStyle(BlogPalette.inkSoft)
          .padding(.top, 28)
      }
      .padding(.horizontal, 22)
      .padding(.bottom, 48)
    }
  }

  private var masthead: some View {
    VStack(alignment: .leading, spacing: 10) {
      Text(BlogContent.title)
        .font(.system(size: 36, weight: .bold, design: .serif))
        .foregroundStyle(BlogPalette.ink)
        .padding(.top, 26)
      Text(BlogContent.tagline)
        .font(.subheadline)
        .foregroundStyle(BlogPalette.inkSoft)
      HStack(spacing: 12) {
        Text(BlogContent.author.initials)
          .font(.footnote.weight(.bold))
          .foregroundStyle(BlogPalette.paper)
          .frame(width: 40, height: 40)
          .background(BlogPalette.accent, in: Circle())
        VStack(alignment: .leading, spacing: 2) {
          Text(BlogContent.author.name)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(BlogPalette.ink)
          Text(BlogContent.author.role)
            .font(.caption)
            .foregroundStyle(BlogPalette.inkSoft)
        }
      }
      .padding(.top, 6)
      Rectangle()
        .fill(BlogPalette.line)
        .frame(height: 1)
        .padding(.top, 16)
    }
  }

  private var tagRow: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: 8) {
        tagChip(label: "All", isActive: activeTag == nil) { activeTag = nil }
        ForEach(BlogContent.allTags(in: orderedPosts), id: \.self) { tag in
          tagChip(label: tag, isActive: activeTag == tag) {
            activeTag = activeTag == tag ? nil : tag
          }
        }
      }
    }
  }

  private func tagChip(label: String, isActive: Bool, action: @escaping () -> Void) -> some View {
    Button(action: action) {
      Text(label)
        .font(.footnote.weight(.semibold))
        .foregroundStyle(isActive ? BlogPalette.paper : BlogPalette.inkSoft)
        .padding(.horizontal, 14)
        .padding(.vertical, 7)
        .background(
          Capsule().fill(isActive ? BlogPalette.accent : Color.clear))
        .overlay(
          Capsule().strokeBorder(isActive ? BlogPalette.accent : BlogPalette.line))
    }
    .buttonStyle(.plain)
  }

  private func postCard(_ post: BlogContent.Post) -> some View {
    Button {
      openSlug = post.slug
    } label: {
      VStack(alignment: .leading, spacing: 8) {
        postMeta(post, showTags: false)
        Text(post.title)
          .font(.system(size: 22, weight: .semibold, design: .serif))
          .foregroundStyle(BlogPalette.ink)
          .multilineTextAlignment(.leading)
        Text(post.summary)
          .font(.subheadline)
          .foregroundStyle(BlogPalette.inkSoft)
          .multilineTextAlignment(.leading)
        Rectangle()
          .fill(BlogPalette.line)
          .frame(height: 1)
          .padding(.top, 14)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(.top, 18)
    }
    .buttonStyle(.plain)
  }

  private func postMeta(_ post: BlogContent.Post, showTags: Bool) -> some View {
    HStack(spacing: 8) {
      Text(Self.formatDate(post.date))
      Text("·")
      Text("\(BlogMarkdown.readingTimeMinutes(post.body)) min read")
      if showTags {
        ForEach(post.tags, id: \.self) { tag in
          Text(tag)
            .font(.caption2.weight(.semibold))
            .foregroundStyle(BlogPalette.accent)
            .padding(.horizontal, 9)
            .padding(.vertical, 2)
            .background(Capsule().fill(BlogPalette.accentSoft))
        }
      }
    }
    .font(.caption)
    .foregroundStyle(BlogPalette.inkSoft)
  }

  // MARK: - Article

  private func articleView(_ post: BlogContent.Post) -> some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 0) {
        Button {
          openSlug = nil
        } label: {
          Label("All posts", systemImage: "arrow.left")
            .font(.footnote.weight(.semibold))
            .foregroundStyle(BlogPalette.accent)
        }
        .buttonStyle(.plain)
        .padding(.top, 22)

        Text(post.title)
          .font(.system(size: 30, weight: .bold, design: .serif))
          .foregroundStyle(BlogPalette.ink)
          .padding(.top, 14)
        postMeta(post, showTags: true)
          .padding(.top, 8)

        VStack(alignment: .leading, spacing: 16) {
          ForEach(Array(BlogMarkdown.parseMarkdown(post.body).enumerated()), id: \.offset) {
            _, block in
            blockView(block)
          }
        }
        .padding(.top, 24)

        Rectangle()
          .fill(BlogPalette.line)
          .frame(height: 1)
          .padding(.vertical, 24)
        Text("\(BlogContent.author.name) — \(BlogContent.author.bio)")
          .font(.footnote)
          .foregroundStyle(BlogPalette.inkSoft)
      }
      .padding(.horizontal, 22)
      .padding(.bottom, 48)
    }
  }

  @ViewBuilder
  private func blockView(_ block: BlogBlock) -> some View {
    switch block {
    case .heading(let level, let inlines):
      Text(Self.attributed(inlines))
        .font(.system(size: level == 1 ? 26 : level == 2 ? 22 : 19, weight: .semibold, design: .serif))
        .foregroundStyle(BlogPalette.ink)
        .padding(.top, 12)
    case .paragraph(let inlines):
      Text(Self.attributed(inlines))
        .font(.body)
        .foregroundStyle(BlogPalette.ink)
        .lineSpacing(5)
    case .quote(let inlines):
      HStack(alignment: .top, spacing: 12) {
        RoundedRectangle(cornerRadius: 2)
          .fill(BlogPalette.accent)
          .frame(width: 3)
        Text(Self.attributed(inlines))
          .font(.body.italic())
          .foregroundStyle(BlogPalette.inkSoft)
          .lineSpacing(5)
      }
      .padding(.vertical, 4)
    case .code(_, let text):
      ScrollView(.horizontal, showsIndicators: false) {
        Text(text)
          .font(.system(size: 13, design: .monospaced))
          .foregroundStyle(BlogPalette.ink)
          .padding(14)
      }
      .background(
        RoundedRectangle(cornerRadius: 10)
          .fill(BlogPalette.codeBg))
      .overlay(
        RoundedRectangle(cornerRadius: 10)
          .strokeBorder(BlogPalette.line))
    case .list(let ordered, let items):
      VStack(alignment: .leading, spacing: 8) {
        ForEach(Array(items.enumerated()), id: \.offset) { index, item in
          HStack(alignment: .top, spacing: 10) {
            Text(ordered ? "\(index + 1)." : "•")
              .font(.body.weight(.semibold))
              .foregroundStyle(BlogPalette.accent)
            Text(Self.attributed(item))
              .font(.body)
              .foregroundStyle(BlogPalette.ink)
              .lineSpacing(4)
          }
        }
      }
    case .divider:
      Rectangle()
        .fill(BlogPalette.line)
        .frame(width: 96, height: 1)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }
  }

  /// Render the parsed inline marks into one AttributedString.
  private static func attributed(_ inlines: [BlogInline]) -> AttributedString {
    var result = AttributedString()
    for inline in inlines {
      switch inline {
      case .text(let s):
        result += AttributedString(s)
      case .bold(let s):
        var a = AttributedString(s)
        a.font = .body.weight(.bold)
        result += a
      case .italic(let s):
        var a = AttributedString(s)
        a.font = .body.italic()
        result += a
      case .code(let s):
        var a = AttributedString(s)
        a.font = .system(size: 15, design: .monospaced)
        a.backgroundColor = BlogPalette.codeBg
        result += a
      case .link(let text, let href):
        var a = AttributedString(text)
        a.link = URL(string: href)
        a.foregroundColor = BlogPalette.accent
        a.underlineStyle = .single
        result += a
      }
    }
    return result
  }

  private static func formatDate(_ iso: String) -> String {
    let parser = DateFormatter()
    parser.dateFormat = "yyyy-MM-dd"
    parser.locale = Locale(identifier: "en_US_POSIX")
    guard let date = parser.date(from: iso) else { return iso }
    let formatter = DateFormatter()
    formatter.dateStyle = .long
    formatter.locale = Locale(identifier: "en_US")
    return formatter.string(from: date)
  }
}

#Preview {
  BlogView()
}

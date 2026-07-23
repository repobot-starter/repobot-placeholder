import SwiftUI

/// Editorial paper-and-ink palette mirroring the web FolioPage styles.
private enum FolioPalette {
  static let paper = Color(hex: "#FAF6EF")
  static let card = Color(hex: "#FFFDF8")
  static let ink = Color(hex: "#221D15")
  static let inkSoft = Color(hex: "#6F6759")
  static let line = Color(hex: "#E2DACA")
  static let accent = Color(hex: "#D4552B")
  static let availabilityText = Color(hex: "#2F7A45")
  static let availabilityFill = Color(hex: "#E5F2E3")
}

/// Home surface for the `folio` pack: a one-page portfolio rendered entirely
/// from `FolioContent` — hero statement, filterable project list, about, and
/// a contact CTA. Owners edit FolioContent.swift.
struct FolioView: View {
  @State private var activeTag: String?
  @Environment(\.openURL) private var openURL

  private var visibleProjects: [FolioContent.Project] {
    guard let activeTag else { return FolioContent.projects }
    return FolioContent.projects.filter { $0.tags.contains(activeTag) }
  }

  var body: some View {
    ZStack {
      FolioPalette.paper.ignoresSafeArea()

      ScrollView {
        VStack(alignment: .leading, spacing: 36) {
          hero
          workSection
          aboutSection
          contactSection
        }
        .padding(.horizontal, 22)
        .padding(.top, 32)
        .padding(.bottom, 28)
        .frame(maxWidth: 700)
      }
    }
  }

  private var hero: some View {
    VStack(alignment: .leading, spacing: 14) {
      if !FolioContent.profile.availability.isEmpty {
        HStack(spacing: 8) {
          Circle()
            .fill(FolioPalette.availabilityText)
            .frame(width: 8, height: 8)
          Text(FolioContent.profile.availability)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(FolioPalette.availabilityText)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 6)
        .background(Capsule().fill(FolioPalette.availabilityFill))
      }

      Text(FolioContent.profile.statement)
        .font(.system(size: 34, weight: .semibold, design: .serif))
        .foregroundStyle(FolioPalette.ink)
        .lineSpacing(2)

      HStack(spacing: 8) {
        Text(FolioContent.profile.role)
        Text("·")
        Text(FolioContent.profile.location)
      }
      .font(.subheadline)
      .foregroundStyle(FolioPalette.inkSoft)
    }
  }

  private var workSection: some View {
    VStack(alignment: .leading, spacing: 16) {
      sectionHeader(kicker: "Selected work", title: "Things I'm proud of")

      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: 8) {
          filterChip(label: "All", isActive: activeTag == nil) { activeTag = nil }
          ForEach(FolioContent.allTags(), id: \.self) { tag in
            filterChip(label: tag, isActive: activeTag == tag) {
              activeTag = activeTag == tag ? nil : tag
            }
          }
        }
      }

      VStack(spacing: 16) {
        ForEach(visibleProjects) { project in
          projectCard(project)
        }
      }
    }
  }

  private func projectCard(_ project: FolioContent.Project) -> some View {
    Button {
      open(project.url)
    } label: {
      VStack(alignment: .leading, spacing: 0) {
        Text(project.emoji)
          .font(.system(size: 52))
          .frame(maxWidth: .infinity)
          .frame(height: 120)
          .background(project.accent)

        VStack(alignment: .leading, spacing: 8) {
          HStack(alignment: .firstTextBaseline) {
            Text(project.title)
              .font(.system(size: 20, weight: .semibold, design: .serif))
              .foregroundStyle(FolioPalette.ink)
            Spacer()
            Text(project.year)
              .font(.footnote)
              .foregroundStyle(FolioPalette.inkSoft)
          }

          Text(project.description)
            .font(.subheadline)
            .foregroundStyle(FolioPalette.inkSoft)
            .lineSpacing(3)
            .multilineTextAlignment(.leading)

          HStack(spacing: 6) {
            ForEach(project.tags, id: \.self) { tag in
              Text(tag)
                .font(.caption.weight(.semibold))
                .foregroundStyle(FolioPalette.inkSoft)
                .padding(.horizontal, 10)
                .padding(.vertical, 3)
                .background(Capsule().fill(FolioPalette.paper))
                .overlay(Capsule().stroke(FolioPalette.line, lineWidth: 1))
            }
          }
        }
        .padding(18)
      }
      .background(
        RoundedRectangle(cornerRadius: 18, style: .continuous)
          .fill(FolioPalette.card)
      )
      .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: 18, style: .continuous)
          .stroke(FolioPalette.line, lineWidth: 1)
      )
    }
    .buttonStyle(.plain)
  }

  private var aboutSection: some View {
    VStack(alignment: .leading, spacing: 14) {
      sectionHeader(kicker: "About", title: "The short version")

      ForEach(FolioContent.aboutParagraphs, id: \.self) { paragraph in
        Text(paragraph)
          .font(.subheadline)
          .foregroundStyle(FolioPalette.inkSoft)
          .lineSpacing(4)
      }

      FlowChips(items: FolioContent.skills)
    }
  }

  private var contactSection: some View {
    VStack(spacing: 18) {
      Text("Let's make something.")
        .font(.system(size: 30, weight: .semibold, design: .serif))
        .foregroundStyle(FolioPalette.ink)

      Button {
        open("mailto:\(FolioContent.profile.email)")
      } label: {
        Text(FolioContent.profile.email)
          .font(.callout.weight(.semibold))
          .foregroundStyle(FolioPalette.paper)
          .padding(.horizontal, 28)
          .padding(.vertical, 13)
          .background(Capsule().fill(FolioPalette.ink))
      }
      .buttonStyle(.plain)

      HStack(spacing: 14) {
        ForEach(FolioContent.socials) { social in
          Button(social.label) { open(social.url) }
            .font(.footnote)
            .foregroundStyle(FolioPalette.inkSoft)
            .buttonStyle(.plain)
        }
        Text("·").foregroundStyle(FolioPalette.inkSoft)
        Text("Made with FolioBot")
          .font(.footnote)
          .foregroundStyle(FolioPalette.inkSoft)
      }
    }
    .frame(maxWidth: .infinity)
    .padding(.top, 22)
  }

  private func sectionHeader(kicker: String, title: String) -> some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(kicker.uppercased())
        .font(.caption.weight(.bold))
        .kerning(1.4)
        .foregroundStyle(FolioPalette.accent)
      Text(title)
        .font(.system(size: 24, weight: .semibold, design: .serif))
        .foregroundStyle(FolioPalette.ink)
    }
    .padding(.top, 10)
    .frame(maxWidth: .infinity, alignment: .leading)
    .overlay(Rectangle().fill(FolioPalette.line).frame(height: 1), alignment: .top)
  }

  private func filterChip(label: String, isActive: Bool, action: @escaping () -> Void)
    -> some View
  {
    Button(action: action) {
      Text(label)
        .font(.footnote.weight(.semibold))
        .foregroundStyle(isActive ? FolioPalette.paper : FolioPalette.inkSoft)
        .padding(.horizontal, 16)
        .padding(.vertical, 7)
        .background(Capsule().fill(isActive ? FolioPalette.ink : Color.clear))
        .overlay(Capsule().stroke(isActive ? FolioPalette.ink : FolioPalette.line, lineWidth: 1))
    }
    .buttonStyle(.plain)
  }

  private func open(_ url: String) {
    guard let parsed = URL(string: url) else { return }
    openURL(parsed)
  }
}

/// A simple wrapping chip layout for the skills cloud.
private struct FlowChips: View {
  let items: [String]

  var body: some View {
    var width: CGFloat = 0
    var height: CGFloat = 0

    return GeometryReader { geometry in
      ZStack(alignment: .topLeading) {
        ForEach(items, id: \.self) { item in
          chip(item)
            .alignmentGuide(.leading) { dimensions in
              if abs(width - dimensions.width) > geometry.size.width {
                width = 0
                height -= dimensions.height + 8
              }
              let result = width
              if item == items.last {
                width = 0
              } else {
                width -= dimensions.width + 8
              }
              return result
            }
            .alignmentGuide(.top) { _ in
              let result = height
              if item == items.last {
                height = 0
              }
              return result
            }
        }
      }
    }
    .frame(height: chipCloudHeight)
  }

  /// Conservative fixed height: chips wrap within ~3 rows on phones.
  private var chipCloudHeight: CGFloat { 130 }

  private func chip(_ label: String) -> some View {
    Text(label)
      .font(.subheadline.weight(.semibold))
      .foregroundStyle(FolioPalette.ink)
      .padding(.horizontal, 16)
      .padding(.vertical, 8)
      .background(Capsule().fill(FolioPalette.card))
      .overlay(Capsule().stroke(FolioPalette.line, lineWidth: 1))
  }
}

#Preview {
  FolioView()
}

import SwiftUI

/// Home surface for the `link` pack: a link-in-bio page rendered entirely
/// from `LinkContent`. Visitors cycle theme palettes (persisted via
/// AppStorage) and share the page; owners edit LinkContent.swift.
struct LinkView: View {
  @AppStorage("linkbot-theme") private var themeKey = LinkContent.themes[0].key
  @Environment(\.openURL) private var openURL

  private var theme: LinkContent.Theme {
    LinkContent.themes.first { $0.key == themeKey } ?? LinkContent.themes[0]
  }

  var body: some View {
    ZStack {
      LinearGradient(
        colors: theme.backgroundColors,
        startPoint: .topLeading,
        endPoint: .bottomTrailing
      )
      .ignoresSafeArea()

      ScrollView {
        VStack(spacing: 24) {
          header
          socialRow
          linkList
          shareButton
          footer
        }
        .padding(.horizontal, 20)
        .padding(.top, 40)
        .padding(.bottom, 24)
        .frame(maxWidth: 560)
      }
    }
    .animation(.easeInOut(duration: 0.25), value: themeKey)
  }

  private var header: some View {
    VStack(spacing: 6) {
      Text(LinkContent.profile.avatarEmoji)
        .font(.system(size: 44))
        .frame(width: 96, height: 96)
        .background(Circle().fill(theme.surface))
        .overlay(Circle().stroke(theme.accent, lineWidth: 3))
        .padding(.bottom, 8)

      Text(LinkContent.profile.name)
        .font(.system(size: 26, weight: .bold))
        .foregroundStyle(theme.text)

      Text(LinkContent.profile.handle)
        .font(.subheadline.weight(.semibold))
        .foregroundStyle(theme.accent)

      Text(LinkContent.profile.bio)
        .font(.subheadline)
        .foregroundStyle(theme.subtleText)
        .multilineTextAlignment(.center)
        .padding(.top, 2)

      Text("📍 \(LinkContent.profile.location)")
        .font(.footnote)
        .foregroundStyle(theme.subtleText)
    }
  }

  private var socialRow: some View {
    HStack(spacing: 10) {
      ForEach(LinkContent.socials) { social in
        Button {
          open(social.url)
        } label: {
          Text(social.monogram)
            .font(.footnote.weight(.bold))
            .foregroundStyle(theme.text)
            .frame(width: 40, height: 40)
            .background(Circle().fill(theme.surface))
            .overlay(Circle().stroke(theme.surfaceBorder, lineWidth: 1))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(social.label)
      }
    }
  }

  private var linkList: some View {
    VStack(spacing: 12) {
      ForEach(LinkContent.links) { link in
        Button {
          open(link.url)
        } label: {
          HStack(spacing: 14) {
            Text(link.emoji)
              .font(.system(size: 24))

            VStack(alignment: .leading, spacing: 2) {
              Text(link.label)
                .font(.callout.weight(.semibold))
                .foregroundStyle(theme.text)
              Text(link.note)
                .font(.footnote)
                .foregroundStyle(theme.subtleText)
                .lineLimit(1)
            }

            Spacer(minLength: 0)

            Image(systemName: "arrow.up.right")
              .font(.footnote.weight(.semibold))
              .foregroundStyle(theme.subtleText)
          }
          .padding(.horizontal, 18)
          .padding(.vertical, 14)
          .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
              .fill(theme.surface)
          )
          .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
              .stroke(theme.surfaceBorder, lineWidth: 1)
          )
        }
        .buttonStyle(.plain)
      }
    }
  }

  private var shareButton: some View {
    ShareLink(item: URL(string: "https://robo.example")!) {
      Text("Share this page")
        .font(.footnote.weight(.semibold))
        .foregroundStyle(theme.text)
        .padding(.horizontal, 22)
        .padding(.vertical, 10)
        .background(Capsule().fill(theme.surface))
        .overlay(Capsule().stroke(theme.surfaceBorder, lineWidth: 1))
    }
  }

  private var footer: some View {
    VStack(spacing: 12) {
      HStack(spacing: 10) {
        ForEach(LinkContent.themes) { candidate in
          Button {
            themeKey = candidate.key
          } label: {
            Circle()
              .fill(
                LinearGradient(
                  colors: candidate.backgroundColors,
                  startPoint: .topLeading,
                  endPoint: .bottomTrailing
                )
              )
              .frame(width: 26, height: 26)
              .overlay(
                Circle().stroke(
                  candidate.key == themeKey ? theme.accent : theme.surfaceBorder,
                  lineWidth: 2
                )
              )
              .scaleEffect(candidate.key == themeKey ? 1.12 : 1.0)
          }
          .buttonStyle(.plain)
          .accessibilityLabel("\(candidate.label) theme")
          .accessibilityAddTraits(candidate.key == themeKey ? [.isSelected] : [])
        }
      }

      Text("Made with LinkBot")
        .font(.caption)
        .foregroundStyle(theme.subtleText)
    }
    .padding(.top, 4)
  }

  private func open(_ url: String) {
    guard let parsed = URL(string: url) else { return }
    openURL(parsed)
  }
}

#Preview {
  LinkView()
}

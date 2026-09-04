import SwiftUI

/// Everything the LinkBot surface renders — the native twin of
/// `web/app/src/View/Link/content.ts`. Edit this file (or ask the agent to)
/// and the app updates; there is no backend and no CMS.
enum LinkContent {
  struct Profile {
    let name: String
    let handle: String
    let bio: String
    let avatarEmoji: String
    let location: String
  }

  struct LinkItem: Identifiable {
    let emoji: String
    let label: String
    let note: String
    let url: String
    var id: String { label }
  }

  struct SocialLink: Identifiable {
    let label: String
    let monogram: String
    let url: String
    var id: String { label }
  }

  static let profile = Profile(
    name: "Robo Rivera",
    handle: "@robo",
    bio: "Creative technologist building tiny, joyful things on the internet.",
    avatarEmoji: "🤖",
    location: "Lisbon, Portugal"
  )

  static let links: [LinkItem] = [
    LinkItem(
      emoji: "🎨", label: "Portfolio",
      note: "Selected projects & case studies",
      url: "https://robo.example/work"),
    LinkItem(
      emoji: "✉️", label: "Weekly newsletter",
      note: "One tiny idea every Friday",
      url: "https://robo.example/letters"),
    LinkItem(
      emoji: "🎬", label: "Latest video",
      note: "Building a synth in the browser",
      url: "https://robo.example/video"),
    LinkItem(
      emoji: "🎧", label: "Studio playlist",
      note: "What I code to",
      url: "https://robo.example/playlist"),
    LinkItem(
      emoji: "📅", label: "Book a call",
      note: "15 minutes — let's talk shop",
      url: "https://robo.example/call"),
    LinkItem(
      emoji: "☕", label: "Buy me a coffee",
      note: "Fuel the next project",
      url: "https://robo.example/coffee"),
  ]

  static let socials: [SocialLink] = [
    SocialLink(label: "GitHub", monogram: "gh", url: "https://github.com"),
    SocialLink(label: "X", monogram: "𝕏", url: "https://x.com"),
    SocialLink(label: "Instagram", monogram: "ig", url: "https://instagram.com"),
    SocialLink(label: "YouTube", monogram: "▶", url: "https://youtube.com"),
  ]

  struct Theme: Identifiable {
    let key: String
    let label: String
    /// Page background gradient, top-leading to bottom-trailing.
    let backgroundColors: [Color]
    let surface: Color
    let surfaceBorder: Color
    let text: Color
    let subtleText: Color
    let accent: Color
    var id: String { key }
  }

  /// Palette presets cycled by the swatches in the footer; the pick persists
  /// via AppStorage. Mirrors the `themes` array on web.
  static let themes: [Theme] = [
    Theme(
      key: "midnight", label: "Midnight",
      backgroundColors: [Color(hex: "#2B1A4D"), Color(hex: "#120A24"), Color(hex: "#0A0614")],
      surface: Color.white.opacity(0.06),
      surfaceBorder: Color.white.opacity(0.14),
      text: Color(hex: "#F1EAFF"),
      subtleText: Color(hex: "#A898CC"),
      accent: Color(hex: "#9D7BFF")),
    Theme(
      key: "sunrise", label: "Sunrise",
      backgroundColors: [Color(hex: "#FFE8D6"), Color(hex: "#FFD0B0"), Color(hex: "#FFB4A2")],
      surface: Color.white.opacity(0.65),
      surfaceBorder: Color(hex: "#945233").opacity(0.25),
      text: Color(hex: "#4A2513"),
      subtleText: Color(hex: "#96604A"),
      accent: Color(hex: "#E2711D")),
    Theme(
      key: "meadow", label: "Meadow",
      backgroundColors: [Color(hex: "#EAF7E4"), Color(hex: "#CDEBC9"), Color(hex: "#A9D9B0")],
      surface: Color.white.opacity(0.7),
      surfaceBorder: Color(hex: "#2F5D3A").opacity(0.22),
      text: Color(hex: "#1E3A26"),
      subtleText: Color(hex: "#5B7D64"),
      accent: Color(hex: "#2F9E57")),
    Theme(
      key: "paper", label: "Paper",
      backgroundColors: [Color(hex: "#F5F2EC"), Color(hex: "#F5F2EC")],
      surface: Color.white,
      surfaceBorder: Color(hex: "#D8D2C4"),
      text: Color(hex: "#26221A"),
      subtleText: Color(hex: "#7D766A"),
      accent: Color(hex: "#26221A")),
  ]
}

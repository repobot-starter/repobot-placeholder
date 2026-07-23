import SwiftUI

/// Everything the FolioBot surface renders — the native twin of
/// `web/app/src/View/Folio/content.ts`. Edit this file (or ask the agent to)
/// and the app updates; there is no backend and no CMS.
enum FolioContent {
  struct Profile {
    let name: String
    let role: String
    let statement: String
    let availability: String
    let location: String
    let email: String
  }

  struct Project: Identifiable {
    let title: String
    let year: String
    let description: String
    let tags: [String]
    let emoji: String
    /// Accent tint behind the emoji artwork.
    let accent: Color
    let url: String
    var id: String { title }
  }

  struct SocialLink: Identifiable {
    let label: String
    let url: String
    var id: String { label }
  }

  static let profile = Profile(
    name: "Mina Okafor",
    role: "Product designer who codes",
    statement: "I design and build interfaces that feel obvious in hindsight.",
    availability: "Open to freelance projects",
    location: "Toronto, Canada",
    email: "mina@example.com"
  )

  static let projects: [Project] = [
    Project(
      title: "Tidepool", year: "2026",
      description:
        "A calm budgeting app that rounds every balance to feelings, not cents. Led design and shipped the React front end.",
      tags: ["Product", "Mobile"], emoji: "🌊",
      accent: Color(hex: "#CFE3F7"), url: "https://mina.example/tidepool"),
    Project(
      title: "Letterloop", year: "2025",
      description:
        "A group-newsletter tool for families. Designed the prompt system that gets grandparents to actually write back.",
      tags: ["Product", "Brand"], emoji: "💌",
      accent: Color(hex: "#F7D9CF"), url: "https://mina.example/letterloop"),
    Project(
      title: "Wayfare", year: "2025",
      description:
        "Design system for a travel startup: 84 components, dark mode, and docs the engineers actually read.",
      tags: ["Design systems"], emoji: "🧭",
      accent: Color(hex: "#D9F0D5"), url: "https://mina.example/wayfare"),
    Project(
      title: "Perch", year: "2024",
      description:
        "A tiny window-seat reservation app for a café chain. Two weeks from sketch to launch; tripled weekday bookings.",
      tags: ["Product", "Mobile"], emoji: "🪑",
      accent: Color(hex: "#F2E4C9"), url: "https://mina.example/perch"),
    Project(
      title: "Field Notes for Figma", year: "2024",
      description:
        "A plugin that turns annotation chaos into a tidy handoff doc. 12k installs and a lifetime supply of thank-you DMs.",
      tags: ["Tools"], emoji: "🗒️",
      accent: Color(hex: "#E3D7F4"), url: "https://mina.example/field-notes"),
    Project(
      title: "The Long Way", year: "2023",
      description:
        "A personal essay series on slow software, hand-illustrated. Featured in three design newsletters I admire.",
      tags: ["Writing", "Brand"], emoji: "🚲",
      accent: Color(hex: "#F6D3E0"), url: "https://mina.example/long-way"),
  ]

  static let aboutParagraphs: [String] = [
    "I spent five years at agencies making things look right, then five more at startups learning why they break. Now I sit in the middle: close enough to the pixels to care, close enough to the code to ship.",
    "When I'm not working I'm restoring a 1978 road bike, learning Yoruba, and losing gracefully at chess.",
  ]

  static let skills: [String] = [
    "Product design", "Design systems", "Prototyping", "React & TypeScript",
    "SwiftUI", "Illustration", "Design ops", "Workshop facilitation",
  ]

  static let socials: [SocialLink] = [
    SocialLink(label: "GitHub", url: "https://github.com"),
    SocialLink(label: "Dribbble", url: "https://dribbble.com"),
    SocialLink(label: "LinkedIn", url: "https://linkedin.com"),
  ]

  /// Union of all project tags, in first-appearance order — the filter chips.
  static func allTags(in list: [Project] = projects) -> [String] {
    var seen: [String] = []
    for project in list {
      for tag in project.tags where !seen.contains(tag) {
        seen.append(tag)
      }
    }
    return seen
  }
}

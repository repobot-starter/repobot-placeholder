import Foundation

/// Everything the LaunchBot surface renders — the native twin of
/// `web/app/src/View/Launch/content.ts`. Edit this file (or ask the agent
/// to) and the app updates; there is no backend and no CMS.
enum LaunchContent {
  struct Product {
    let name: String
    let logoEmoji: String
    let headline: String
    let subheadline: String
    let waitlistCta: String
    let waitlistPlaceholder: String
    let trustedBy: [String]
  }

  struct Feature: Identifiable {
    let emoji: String
    let title: String
    let description: String
    var id: String { title }
  }

  struct Step: Identifiable {
    let title: String
    let description: String
    var id: String { title }
  }

  struct PricingTier: Identifiable {
    let name: String
    /// Monthly price in dollars; 0 renders "Free".
    let monthly: Int
    /// Yearly price per month in dollars (the discount price).
    let yearlyPerMonth: Int
    let description: String
    let features: [String]
    var highlighted = false
    var badge: String?
    var id: String { name }
  }

  struct FaqItem: Identifiable {
    let question: String
    let answer: String
    var id: String { question }
  }

  static let product = Product(
    name: "Sundial",
    logoEmoji: "☀️",
    headline: "Your team's time, finally visible.",
    subheadline:
      "Sundial turns your calendar chaos into a clear picture: where the hours go, which meetings earn their keep, and what to cut first.",
    waitlistCta: "Join the waitlist",
    waitlistPlaceholder: "you@company.com",
    trustedBy: ["Northwind", "Fogline", "Basalt", "Meridian Labs", "Pocketworks"]
  )

  static let features: [Feature] = [
    Feature(
      emoji: "🗺️", title: "The time map",
      description:
        "One glance shows the week's true shape: deep work, meetings, and the gaps too small to use."),
    Feature(
      emoji: "⚖️", title: "Meeting scorecards",
      description:
        "Every recurring meeting gets a cost and a keep/kill score based on who attends and what it displaces."),
    Feature(
      emoji: "🔕", title: "Focus guardrails",
      description:
        "Sundial blocks fragmentation before it happens — it declines the 3:30 that would split your last deep-work window."),
    Feature(
      emoji: "📈", title: "Weekly digest",
      description:
        "Monday morning, every teammate gets one email: what changed, what it cost, and one suggestion to try."),
    Feature(
      emoji: "🤝", title: "Team agreements",
      description:
        "Codify no-meeting Wednesdays and quiet hours; Sundial enforces them politely so nobody has to."),
    Feature(
      emoji: "🔌", title: "Works with your stack",
      description:
        "Google Calendar and Outlook today; the API is open for whatever your team lives in."),
  ]

  static let steps: [Step] = [
    Step(
      title: "Connect your calendar",
      description: "Read-only at first. Sundial never moves anything without asking."),
    Step(
      title: "See the real picture",
      description: "Within a day you get the time map and every meeting's true cost."),
    Step(
      title: "Reclaim your week",
      description:
        "Accept a suggestion, watch the hours come back. Most teams save 4+ hours per person."),
  ]

  static let pricing: [PricingTier] = [
    PricingTier(
      name: "Solo", monthly: 0, yearlyPerMonth: 0,
      description: "Your own calendar, mapped.",
      features: ["Time map", "Weekly digest", "One calendar"]),
    PricingTier(
      name: "Pro", monthly: 12, yearlyPerMonth: 10,
      description: "For people who run their own week.",
      features: [
        "Everything in Solo", "Meeting scorecards", "Focus guardrails", "Unlimited calendars",
      ],
      highlighted: true, badge: "Most popular"),
    PricingTier(
      name: "Team", monthly: 49, yearlyPerMonth: 41,
      description: "Agreements and analytics for the whole team.",
      features: [
        "Everything in Pro", "Team agreements", "Org-wide analytics", "Priority support",
      ]),
  ]

  static let faq: [FaqItem] = [
    FaqItem(
      question: "Do you read the contents of my meetings?",
      answer:
        "No. Sundial only uses event metadata — times, attendees, and recurrence. Titles are processed on your device and never stored."),
    FaqItem(
      question: "Will it start declining meetings on its own?",
      answer:
        "Never by default. Guardrails are suggestions until you flip a specific rule to automatic, and every automatic action is logged and reversible."),
    FaqItem(
      question: "What calendars do you support?",
      answer:
        "Google Calendar and Outlook at launch. ICS import works for everything else, and the API is open."),
    FaqItem(
      question: "When does the beta open?",
      answer:
        "We onboard a new group from the waitlist every two weeks, smallest teams first. Joining today puts you in the next cohort draw."),
  ]
}

import Foundation

/// Everything the LaunchBot surface renders — the native twin of
/// `web/app/src/View/Launch/content.ts`. Edit this file (or ask the agent
/// to) and the app updates; there is no backend and no CMS.
///
/// The demo product is Lumina, a smart night light that tells dad jokes —
/// the copy speaks in the lamp's own first-person voice on purpose.
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
    name: "Lumina",
    logoEmoji: "💡",
    headline: "Hi, I'm Lumina. Your nights, fully lit.",
    subheadline:
      "I'm a smart night light that knows the bedtime routine: warm glow on schedule, a soft path for 2 a.m. missions, and exactly one dad joke at tuck-in. That last part is non-negotiable.",
    waitlistCta: "Join the glow list",
    waitlistPlaceholder: "night.owl@example.com",
    trustedBy: [
      "Bedtime Weekly", "The Tuck-In Times", "Glow Report", "Nightstand Quarterly",
      "Dad Joke Digest",
    ]
  )

  static let features: [Feature] = [
    Feature(
      emoji: "🕯️", title: "Glow that reads the room",
      description:
        "Warm amber light that starts below candlelight and dims as eyes adjust — bright enough to comfort, never enough to wake."),
    Feature(
      emoji: "⏰", title: "Bedtime on schedule",
      description:
        "Set the routine once. I ease on at story time, hold through the night, and fade myself out when morning takes over."),
    Feature(
      emoji: "🥸", title: "Certified dad jokes",
      description:
        "One vetted joke at tuck-in, every night. Fresh packs weekly — puns, knock-knocks, and the occasional groaner you'll pretend not to love."),
    Feature(
      emoji: "🛡️", title: "The night-shift guardian",
      description:
        "Motion wakes a soft floor path to the bathroom and back. No overhead lights, no stubbed toes, no drama."),
    Feature(
      emoji: "🎚️", title: "Yours to tune",
      description:
        "Warmth, brightness, joke frequency, wake-up fade — every knob lives in an app your thumb can find at 2 a.m."),
    Feature(
      emoji: "🌅", title: "Gentle wake-ups",
      description:
        "A slow sunrise glow instead of an alarm: I brighten over ten minutes so mornings start on your side for once."),
  ]

  static let steps: [Step] = [
    Step(
      title: "Plug me in",
      description:
        "Any outlet works. I read the room's darkness in about a minute and pick a glow that won't wake anyone."),
    Step(
      title: "Tell me the routine",
      description:
        "Bedtime and wake-up go in the app once. Dimming, the midnight hallway glow, and the dawn fade are on me."),
    Step(
      title: "Lights out, joke on",
      description:
        "One dad joke at tuck-in — that's the deal. Then I hold the night shift so you don't have to."),
  ]

  static let pricing: [PricingTier] = [
    PricingTier(
      name: "Nightlight", monthly: 0, yearlyPerMonth: 0,
      description: "Everything the lamp does out of the box, free forever.",
      features: ["Warm glow with auto dimming", "Sunrise fade-out", "Seven starter dad jokes"]),
    PricingTier(
      name: "Pro", monthly: 4, yearlyPerMonth: 3,
      description: "Fresh puns and a smarter night shift.",
      features: [
        "Everything in Nightlight", "Weekly dad-joke packs", "Custom bedtime schedules",
        "Vacation mode",
      ],
      highlighted: true, badge: "Most popular"),
    PricingTier(
      name: "Family", monthly: 9, yearlyPerMonth: 7,
      description: "Every room in the house, one glow.",
      features: [
        "Everything in Pro", "Up to six lamps in sync", "Per-kid routines", "Hallway path mode",
      ]),
  ]

  static let faq: [FaqItem] = [
    FaqItem(
      question: "Are the dad jokes optional?",
      answer:
        "Technically yes — there's a switch in the app. No household has ever flipped it, but it's there, gathering dust, as it should."),
    FaqItem(
      question: "Will it wake the baby?",
      answer:
        "No. The glow starts below candlelight and I never speak after lights-out — jokes are strictly a tuck-in feature, delivered at storybook volume."),
    FaqItem(
      question: "What happens when the WiFi goes down?",
      answer:
        "I keep glowing. Schedules run on the lamp itself; the network is only for fetching new jokes and app tweaks. Puns resume when the router does."),
    FaqItem(
      question: "How bright does it get?",
      answer:
        "Anywhere from “is it even on?” to “found the brick before my foot did.” The hallway path setting is the consistent family favorite."),
  ]
}

import Foundation

/// All content for the local-business site, mirrored from the web pack's
/// content.ts. To make this template yours, replace the business below —
/// nothing else needs to change.
enum MenuContent {
  enum Dietary: String, CaseIterable {
    case vegetarian = "V"
    case vegan = "VG"
    case glutenFree = "GF"

    var label: String {
      switch self {
      case .vegetarian: return "Vegetarian"
      case .vegan: return "Vegan"
      case .glutenFree: return "Gluten-free"
      }
    }
  }

  struct Item: Identifiable {
    let name: String
    let description: String
    /// Price in cents so arithmetic and formatting stay exact.
    let priceCents: Int
    let dietary: [Dietary]
    var popular: Bool = false
    var id: String { name }
  }

  struct Section: Identifiable {
    let title: String
    var note: String?
    let items: [Item]
    var id: String { title }
  }

  static let name = "The Copper Kettle"
  static let tagline = "Neighborhood café & all-day kitchen"
  static let about =
    "Slow mornings, honest coffee, and a short menu we cook from scratch every day. Counter service, sunny corner windows, and the same four soups our regulars won't let us retire."
  static let address = "214 Alder Street, Portland, OR 97204"
  static let phone = "(503) 555-0184"
  static let email = "hello@copperkettle.example"
  static let instagram = "https://instagram.com/example"
  static let mapsQuery = "214 Alder Street Portland OR"

  /// 0 = Sunday … 6 = Saturday. Minutes since midnight.
  static let weeklyHours: [MenuHours.DayHours] = [
    .init(day: 0, intervals: [(9 * 60, 14 * 60)]),
    .init(day: 2, intervals: [(7 * 60, 15 * 60)]),
    .init(day: 3, intervals: [(7 * 60, 15 * 60)]),
    .init(day: 4, intervals: [(7 * 60, 15 * 60)]),
    .init(day: 5, intervals: [(7 * 60, 15 * 60), (17 * 60, 21 * 60)]),
    .init(day: 6, intervals: [(8 * 60, 15 * 60), (17 * 60, 21 * 60)]),
    // Monday: closed (no entry).
  ]

  static let hoursNote = "Closed Mondays. Friday & Saturday supper service 5–9 PM."

  static let menu: [Section] = [
    Section(
      title: "Breakfast",
      note: "Served till 11:30, eggs from Meadowlark Farm",
      items: [
        Item(
          name: "Copper Kettle breakfast",
          description: "Two eggs any style, sourdough toast, herbed potatoes, greens",
          priceCents: 1400, dietary: [.vegetarian], popular: true),
        Item(
          name: "Oat porridge",
          description: "Steel-cut oats, poached pear, toasted hazelnuts, maple",
          priceCents: 950, dietary: [.vegan, .glutenFree]),
        Item(
          name: "Smoked trout toast",
          description: "Rye, whipped crème fraîche, pickled shallot, dill",
          priceCents: 1550, dietary: []),
        Item(
          name: "Buttermilk pancakes",
          description: "Three cakes, whipped butter, warm blueberry compote",
          priceCents: 1250, dietary: [.vegetarian], popular: true),
      ]),
    Section(
      title: "Lunch",
      note: "From 11:30, soup changes daily",
      items: [
        Item(
          name: "Soup + half sandwich",
          description: "Today's soup with a half grilled cheese on sourdough",
          priceCents: 1300, dietary: [.vegetarian], popular: true),
        Item(
          name: "Roast chicken sandwich",
          description: "Garlic aioli, pickles, butter lettuce, ciabatta",
          priceCents: 1500, dietary: []),
        Item(
          name: "Farro bowl",
          description: "Roasted squash, kale, feta, pepitas, lemon vinaigrette",
          priceCents: 1400, dietary: [.vegetarian]),
        Item(
          name: "Kettle burger",
          description: "Smashed patty, sharp cheddar, onion jam, fries",
          priceCents: 1700, dietary: []),
      ]),
    Section(
      title: "Drinks",
      items: [
        Item(
          name: "Drip coffee",
          description: "Bottomless with any plate — Heart Roasters",
          priceCents: 400, dietary: [.vegan, .glutenFree]),
        Item(
          name: "Cappuccino",
          description: "Double shot, oat milk on request",
          priceCents: 550, dietary: [.vegetarian], popular: true),
        Item(
          name: "Chai",
          description: "House-spiced, steamed milk, lightly sweet",
          priceCents: 525, dietary: [.vegetarian]),
        Item(
          name: "Fresh lemonade",
          description: "Pressed daily, mint from the planter out back",
          priceCents: 450, dietary: [.vegan, .glutenFree]),
      ]),
    Section(
      title: "Sweets",
      note: "Baked each morning",
      items: [
        Item(
          name: "Cardamom bun",
          description: "Twisted, buttery, pearl sugar",
          priceCents: 525, dietary: [.vegetarian], popular: true),
        Item(
          name: "Olive oil cake",
          description: "Citrus glaze, whipped cream",
          priceCents: 650, dietary: [.vegetarian]),
        Item(
          name: "Flourless chocolate cookie",
          description: "Crackly top, sea salt",
          priceCents: 400, dietary: [.vegetarian, .glutenFree]),
      ]),
  ]

  /// "$14" / "$9.50" — trims trailing zero cents.
  static func formatPrice(_ priceCents: Int) -> String {
    let dollars = priceCents / 100
    let cents = priceCents % 100
    return cents == 0 ? "$\(dollars)" : "$\(dollars).\(String(format: "%02d", cents))"
  }
}

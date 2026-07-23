import Foundation

/// All decks for the flashcard app, mirrored from the web pack's content.ts.
/// To make this template yours, replace the decks below — the scheduler,
/// progress, and UI adapt to whatever cards you define. Card fronts must be
/// unique within a deck (they double as identifiers for saved progress).
enum FlashContent {
  struct Flashcard {
    let front: String
    let back: String
    /// Optional extra shown under the answer — mnemonic, example, context.
    var hint: String?
  }

  struct Deck: Identifiable {
    let id: String
    let title: String
    let emoji: String
    let description: String
    let cards: [Flashcard]
  }

  static let title = "FlashBot"
  static let tagline = "A few honest minutes a day. The boxes do the rest."

  static let decks: [Deck] = [
    Deck(
      id: "spanish-essentials",
      title: "Spanish essentials",
      emoji: "🇪🇸",
      description: "The first fifty words you'll actually say out loud.",
      cards: [
        Flashcard(front: "hello", back: "hola"),
        Flashcard(front: "please", back: "por favor"),
        Flashcard(front: "thank you", back: "gracias"),
        Flashcard(front: "yes / no", back: "sí / no"),
        Flashcard(front: "excuse me", back: "perdón", hint: "Also works as 'sorry'."),
        Flashcard(front: "where is…?", back: "¿dónde está…?"),
        Flashcard(front: "how much does it cost?", back: "¿cuánto cuesta?"),
        Flashcard(front: "the bill, please", back: "la cuenta, por favor"),
        Flashcard(front: "I would like…", back: "quisiera…", hint: "Politer than 'quiero'."),
        Flashcard(front: "water", back: "agua"),
        Flashcard(front: "good morning", back: "buenos días"),
        Flashcard(front: "good night", back: "buenas noches"),
        Flashcard(front: "I don't understand", back: "no entiendo"),
        Flashcard(front: "do you speak English?", back: "¿habla inglés?"),
        Flashcard(front: "my name is…", back: "me llamo…"),
        Flashcard(front: "nice to meet you", back: "mucho gusto"),
      ]),
    Deck(
      id: "world-capitals",
      title: "World capitals",
      emoji: "🌍",
      description: "The ones that come up — and the ones that trip everyone.",
      cards: [
        Flashcard(front: "Australia", back: "Canberra", hint: "Not Sydney."),
        Flashcard(front: "Canada", back: "Ottawa", hint: "Not Toronto."),
        Flashcard(front: "Türkiye", back: "Ankara", hint: "Not Istanbul."),
        Flashcard(front: "Brazil", back: "Brasília", hint: "Not Rio."),
        Flashcard(front: "Switzerland", back: "Bern", hint: "Not Zurich or Geneva."),
        Flashcard(front: "Morocco", back: "Rabat", hint: "Not Casablanca."),
        Flashcard(front: "New Zealand", back: "Wellington", hint: "Not Auckland."),
        Flashcard(front: "Vietnam", back: "Hanoi", hint: "Not Ho Chi Minh City."),
        Flashcard(
          front: "South Africa", back: "Pretoria (executive)",
          hint: "Three capitals in total."),
        Flashcard(front: "Nigeria", back: "Abuja", hint: "Not Lagos."),
        Flashcard(front: "Kazakhstan", back: "Astana"),
        Flashcard(front: "Kenya", back: "Nairobi"),
        Flashcard(front: "Argentina", back: "Buenos Aires"),
        Flashcard(front: "Egypt", back: "Cairo"),
        Flashcard(front: "South Korea", back: "Seoul"),
        Flashcard(front: "Indonesia", back: "Jakarta", hint: "Nusantara is on the way."),
      ]),
    Deck(
      id: "tricky-words",
      title: "Words people mix up",
      emoji: "✒️",
      description: "Sound smart in writing — the pairs that autocorrect won't save.",
      cards: [
        Flashcard(
          front: "affect vs effect",
          back: "Affect is (usually) the verb, effect the noun.",
          hint: "The rain affected the game; the effect was a delay."),
        Flashcard(
          front: "complement vs compliment",
          back: "Complement completes; compliment flatters."),
        Flashcard(
          front: "principal vs principle",
          back: "Principal is a person or main thing; principle is a rule.",
          hint: "The principal is your pal (allegedly)."),
        Flashcard(
          front: "stationary vs stationery",
          back: "Stationary means not moving; stationery is paper.",
          hint: "E for envelope."),
        Flashcard(front: "imply vs infer", back: "Speakers imply; listeners infer."),
        Flashcard(
          front: "fewer vs less",
          back: "Fewer for countable things, less for quantities.",
          hint: "Fewer coins, less money."),
        Flashcard(
          front: "discreet vs discrete", back: "Discreet is tactful; discrete is separate."),
        Flashcard(front: "elicit vs illicit", back: "Elicit draws out; illicit is illegal."),
        Flashcard(
          front: "everyday vs every day",
          back: "Everyday is an adjective; every day is when it happens.",
          hint: "I wear everyday shoes every day."),
        Flashcard(
          front: "lie vs lay",
          back: "You lie down; you lay something down.",
          hint: "Lay needs an object."),
        Flashcard(front: "its vs it's", back: "It's is always 'it is' or 'it has'."),
        Flashcard(front: "who's vs whose", back: "Who's is 'who is'; whose shows possession."),
      ]),
  ]
}

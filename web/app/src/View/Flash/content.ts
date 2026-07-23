/**
 * All decks for the flashcard app live here. To make this template yours,
 * replace the decks below — the scheduler, progress, and UI adapt to
 * whatever cards you define. Card fronts must be unique within a deck
 * (they double as stable identifiers for saved progress).
 */

export interface Flashcard {
    front: string
    back: string
    /** Optional extra shown under the answer — mnemonic, example, context. */
    hint?: string
}

export interface Deck {
    id: string
    title: string
    emoji: string
    description: string
    cards: Flashcard[]
}

export const app = {
    title: "FlashBot",
    tagline: "A few honest minutes a day. The boxes do the rest.",
}

export const decks: Deck[] = [
    {
        id: "spanish-essentials",
        title: "Spanish essentials",
        emoji: "🇪🇸",
        description: "The first fifty words you'll actually say out loud.",
        cards: [
            { front: "hello", back: "hola" },
            { front: "please", back: "por favor" },
            { front: "thank you", back: "gracias" },
            { front: "yes / no", back: "sí / no" },
            { front: "excuse me", back: "perdón", hint: "Also works as 'sorry'." },
            { front: "where is…?", back: "¿dónde está…?" },
            { front: "how much does it cost?", back: "¿cuánto cuesta?" },
            { front: "the bill, please", back: "la cuenta, por favor" },
            { front: "I would like…", back: "quisiera…", hint: "Politer than 'quiero'." },
            { front: "water", back: "agua" },
            { front: "good morning", back: "buenos días" },
            { front: "good night", back: "buenas noches" },
            { front: "I don't understand", back: "no entiendo" },
            { front: "do you speak English?", back: "¿habla inglés?" },
            { front: "my name is…", back: "me llamo…" },
            { front: "nice to meet you", back: "mucho gusto" },
        ],
    },
    {
        id: "world-capitals",
        title: "World capitals",
        emoji: "🌍",
        description: "The ones that come up — and the ones that trip everyone.",
        cards: [
            { front: "Australia", back: "Canberra", hint: "Not Sydney." },
            { front: "Canada", back: "Ottawa", hint: "Not Toronto." },
            { front: "Türkiye", back: "Ankara", hint: "Not Istanbul." },
            { front: "Brazil", back: "Brasília", hint: "Not Rio." },
            { front: "Switzerland", back: "Bern", hint: "Not Zurich or Geneva." },
            { front: "Morocco", back: "Rabat", hint: "Not Casablanca." },
            { front: "New Zealand", back: "Wellington", hint: "Not Auckland." },
            { front: "Vietnam", back: "Hanoi", hint: "Not Ho Chi Minh City." },
            { front: "South Africa", back: "Pretoria (executive)", hint: "Three capitals in total." },
            { front: "Nigeria", back: "Abuja", hint: "Not Lagos." },
            { front: "Kazakhstan", back: "Astana" },
            { front: "Kenya", back: "Nairobi" },
            { front: "Argentina", back: "Buenos Aires" },
            { front: "Egypt", back: "Cairo" },
            { front: "South Korea", back: "Seoul" },
            { front: "Indonesia", back: "Jakarta", hint: "Nusantara is on the way." },
        ],
    },
    {
        id: "tricky-words",
        title: "Words people mix up",
        emoji: "✒️",
        description: "Sound smart in writing — the pairs that autocorrect won't save.",
        cards: [
            {
                front: "affect vs effect",
                back: "Affect is (usually) the verb, effect the noun.",
                hint: "The rain affected the game; the effect was a delay.",
            },
            {
                front: "complement vs compliment",
                back: "Complement completes; compliment flatters.",
            },
            {
                front: "principal vs principle",
                back: "Principal is a person or main thing; principle is a rule.",
                hint: "The principal is your pal (allegedly).",
            },
            {
                front: "stationary vs stationery",
                back: "Stationary means not moving; stationery is paper.",
                hint: "E for envelope.",
            },
            {
                front: "imply vs infer",
                back: "Speakers imply; listeners infer.",
            },
            {
                front: "fewer vs less",
                back: "Fewer for countable things, less for quantities.",
                hint: "Fewer coins, less money.",
            },
            {
                front: "discreet vs discrete",
                back: "Discreet is tactful; discrete is separate.",
            },
            {
                front: "elicit vs illicit",
                back: "Elicit draws out; illicit is illegal.",
            },
            {
                front: "everyday vs every day",
                back: "Everyday is an adjective; every day is when it happens.",
                hint: "I wear everyday shoes every day.",
            },
            {
                front: "lie vs lay",
                back: "You lie down; you lay something down.",
                hint: "Lay needs an object.",
            },
            {
                front: "its vs it's",
                back: "It's is always 'it is' or 'it has'.",
            },
            {
                front: "who's vs whose",
                back: "Who's is 'who is'; whose shows possession.",
            },
        ],
    },
]

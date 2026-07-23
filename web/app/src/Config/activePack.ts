import activePackJson from "../../../../packs/active.json"

export type PackKey =
    | "blank"
    | "paint"
    | "pong"
    | "snake"
    | "astro"
    | "blackjack"
    | "chess"
    | "style"
    | "cabin"
    | "salon"
    | "sitter"
    | "code"
    | "ludo"
    | "gomoku"
    | "tawla"
    | "carrom"
    | "hanafuda"
    | "truco"
    | "race"
    | "chimney"
    | "link"
    | "folio"
    | "launch"
    | "blog"
    | "menu"
    | "flash"
    | "quiz"
    | "sugar"
    | "trade"
    | "chat"
    | "talk"
    | "auth"
    | "shop"

export interface ActivePack {
    key: PackKey
}

/** Which pack owns `/` — mirrors packs/active.json (set on project create when a pack is applied). */
export const activePack = activePackJson as ActivePack

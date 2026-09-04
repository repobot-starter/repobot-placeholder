import { createDomainDatabase } from "./BaseDatabase.js"
import { idempotencyKeysTable } from "./IdempotencyKeys.js"
import { pitchDecksTable } from "./Pitch/PitchDeck.js"
import { pitchSlidesTable } from "./Pitch/PitchSlide.js"

// The pitch domain's database handle. Shares the common pool today; can be
// pointed at a dedicated database later without touching services or
// resolvers.
export const pitchDb = createDomainDatabase({
    pitchDecksTable,
    pitchSlidesTable,
    idempotencyKeysTable,
})

export type PitchDatabase = typeof pitchDb

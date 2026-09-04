import { SQL, sql } from "drizzle-orm"
import { createDomainDatabase } from "./BaseDatabase.js"
import { songsTable } from "./Songs/Song.js"
import { idempotencyKeysTable } from "./IdempotencyKeys.js"

// The Songs domain's database handle. Shares the common pool today; can be
// pointed at a dedicated database later without touching services or resolvers.
export const songsDb = createDomainDatabase({
    songsTable,
    idempotencyKeysTable,
})

export type SongsDatabase = typeof songsDb

/**
 * Case-insensitive substring match across title, artist, genre, and notes.
 * Raw SQL lives here in the domain's database module, never in the service.
 */
export function songSearchCondition(search: string): SQL {
    const pattern = `%${search}%`
    return sql`(
        ${songsTable.title} ILIKE ${pattern}
        OR ${songsTable.artist} ILIKE ${pattern}
        OR ${songsTable.genre} ILIKE ${pattern}
        OR COALESCE(${songsTable.notes}, '') ILIKE ${pattern}
    )`
}

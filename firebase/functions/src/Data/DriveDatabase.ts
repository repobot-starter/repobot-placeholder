import { SQL, sql } from "drizzle-orm"
import { createDomainDatabase } from "./BaseDatabase.js"
import { driveAlbumEntriesTable, driveAlbumsTable } from "./Drive/DriveAlbum.js"
import { driveEntriesTable } from "./Drive/DriveEntry.js"
import { idempotencyKeysTable } from "./IdempotencyKeys.js"

// The Drive domain's database handle. Shares the common pool today; can be
// pointed at a dedicated database later without touching services or resolvers.
export const driveDb = createDomainDatabase({
    driveEntriesTable,
    driveAlbumsTable,
    driveAlbumEntriesTable,
    idempotencyKeysTable,
})

export type DriveDatabase = typeof driveDb

/**
 * Owner scoping for the drive tables: rows created by a principal without an
 * application user row carry a null userId and only match a null acting id
 * (the storage kernel's assertOwner semantics). Raw SQL lives here in the
 * domain's database module, never in the service.
 */
export function driveOwnerCondition(userId: string | undefined): SQL {
    if (userId === undefined) {
        return sql`${driveEntriesTable.userId} IS NULL`
    }
    return sql`${driveEntriesTable.userId} = ${userId}`
}

export function driveAlbumOwnerCondition(userId: string | undefined): SQL {
    if (userId === undefined) {
        return sql`${driveAlbumsTable.userId} IS NULL`
    }
    return sql`${driveAlbumsTable.userId} = ${userId}`
}

/** Case-insensitive substring match across an entry's name and caption. */
export function driveEntrySearchCondition(search: string): SQL {
    const pattern = `%${search}%`
    return sql`(
        ${driveEntriesTable.name} ILIKE ${pattern}
        OR COALESCE(${driveEntriesTable.caption}, '') ILIKE ${pattern}
    )`
}

/** Membership filter: entries that appear in the given album. */
export function driveEntryInAlbumCondition(albumId: string): SQL {
    return sql`EXISTS (
        SELECT 1 FROM ${driveAlbumEntriesTable}
        WHERE ${driveAlbumEntriesTable.albumId} = ${albumId}
        AND ${driveAlbumEntriesTable.entryId} = ${driveEntriesTable.id}
    )`
}

/**
 * The ids of an entry and every descendant under it (folders recurse),
 * oldest ancestors first. Used by trash/restore/delete to act on subtrees.
 */
export async function listSubtreeEntryIds(entryId: string): Promise<string[]> {
    const result = await driveDb.execute(sql`
        WITH RECURSIVE subtree AS (
            SELECT id FROM ${driveEntriesTable} WHERE ${driveEntriesTable.id} = ${entryId}
            UNION ALL
            SELECT child.id
            FROM ${driveEntriesTable} child
            JOIN subtree ON child.parent_id = subtree.id
        )
        SELECT id FROM subtree
    `)
    return result.rows.map((row) => (row as { id: string }).id)
}

/** How many entries an album holds, for the album shelf's counts. */
export async function countAlbumEntries(albumIds: readonly string[]): Promise<Map<string, number>> {
    if (albumIds.length === 0) {
        return new Map()
    }
    const result = await driveDb.execute(sql`
        SELECT album_id, COUNT(*)::int AS entry_count
        FROM ${driveAlbumEntriesTable}
        WHERE album_id IN (${sql.join(
            albumIds.map((id) => sql`${id}`),
            sql`, `,
        )})
        GROUP BY album_id
    `)
    const counts = new Map<string, number>()
    for (const row of result.rows as { album_id: string; entry_count: number }[]) {
        counts.set(row.album_id, row.entry_count)
    }
    return counts
}

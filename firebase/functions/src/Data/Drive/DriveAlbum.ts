import { text, unique } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

/**
 * A named, owner-scoped photo album. Membership lives in
 * driveAlbumEntriesTable so one entry can appear in any number of albums;
 * deleting an album removes only the memberships, never the entries.
 */
export const driveAlbumsTable = baseTable("drive_albums", {
    /**
     * References users.id by convention only. Null when the album was
     * created by an authenticated principal without an application user row.
     */
    userId: text("user_id"),
    name: text("name").notNull(),
})

export type DriveAlbum = typeof driveAlbumsTable.$inferSelect
export type NewDriveAlbum = typeof driveAlbumsTable.$inferInsert

export const driveAlbumInsertSchema = createInsertSchema(driveAlbumsTable, {
    name: (schema) => schema.trim().min(1).max(255),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })

export const driveAlbumUpdateSchema = driveAlbumInsertSchema.omit({ userId: true }).partial()

/**
 * One album membership: this entry appears in this album. Both sides live
 * in the drive domain; ownership of both is asserted in the service layer.
 */
export const driveAlbumEntriesTable = baseTable(
    "drive_album_entries",
    {
        albumId: text("album_id").notNull(),
        entryId: text("entry_id").notNull(),
    },
    (table) => [unique("drive_album_entries_album_entry_unique").on(table.albumId, table.entryId)],
)

export type DriveAlbumEntry = typeof driveAlbumEntriesTable.$inferSelect
export type NewDriveAlbumEntry = typeof driveAlbumEntriesTable.$inferInsert

export const driveAlbumEntryInsertSchema = createInsertSchema(driveAlbumEntriesTable).omit({
    id: true,
    rowCreatedAt: true,
    rowUpdatedAt: true,
})

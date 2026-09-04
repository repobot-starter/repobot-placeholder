import { sql } from "drizzle-orm"
import { boolean, check, text, timestamp, unique } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

export const allDriveEntryKinds = ["FILE", "FOLDER"] as const
export type DriveEntryKind = (typeof allDriveEntryKinds)[number]

/**
 * One node in a user's drive: a FILE binding a finalized storage-kernel
 * upload, or a FOLDER holding children through parentId. Everything is
 * owner-scoped through userId; the Files and Photos packs are two lenses
 * over the same rows. Trash is the nullable trashedAt timestamp — restore
 * clears it, permanent deletion removes the row (and the object, through
 * the storage kernel). The photo columns (capturedAt, caption,
 * thumbUploadId) stay null for plain files.
 */
export const driveEntriesTable = baseTable(
    "drive_entries",
    {
        /**
         * References users.id by convention only. Null when the entry was
         * created by an authenticated principal without an application user
         * row (e.g. the test harness principal).
         */
        userId: text("user_id"),
        /** References uploads.id by convention only. Null exactly for folders. */
        uploadId: text("upload_id"),
        /** The parent folder within the same table; null at the library root. */
        parentId: text("parent_id"),
        name: text("name").notNull(),
        kind: text("kind", { enum: allDriveEntryKinds }).notNull(),
        starred: boolean("starred").notNull().default(false),
        trashedAt: timestamp("trashed_at", { withTimezone: true }),
        /** Photo lens: EXIF capture time, extracted client-side before finalize. */
        capturedAt: timestamp("captured_at", { withTimezone: true }),
        caption: text("caption"),
        /** The sibling WebP thumbnail upload (references uploads.id by convention). */
        thumbUploadId: text("thumb_upload_id"),
    },
    (table) => [
        unique("drive_entries_upload_id_unique").on(table.uploadId),
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("drive_entries_kind_check", sql`${table.kind} IN ('FILE', 'FOLDER')`),
        check(
            "drive_entries_kind_upload_check",
            sql`(${table.kind} = 'FILE' AND ${table.uploadId} IS NOT NULL) OR (${table.kind} = 'FOLDER' AND ${table.uploadId} IS NULL)`,
        ),
    ],
)

export type DriveEntry = typeof driveEntriesTable.$inferSelect
export type NewDriveEntry = typeof driveEntriesTable.$inferInsert

export const driveEntryInsertSchema = createInsertSchema(driveEntriesTable, {
    name: (schema) => schema.trim().min(1).max(255),
    caption: (schema) => schema.trim().max(2000),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })

export const driveEntryUpdateSchema = driveEntryInsertSchema.omit({ userId: true, kind: true }).partial()

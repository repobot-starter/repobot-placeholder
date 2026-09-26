import { sql } from "drizzle-orm"
import { bigint, check, text, unique } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

export const allUploadVisibilities = ["PUBLIC", "PRIVATE"] as const
export type UploadVisibility = (typeof allUploadVisibilities)[number]

export const allUploadStatuses = ["PENDING", "READY"] as const
export type UploadStatus = (typeof allUploadStatuses)[number]

export const allUploadProfiles = ["DEFAULT", "DRIVE"] as const
export type UploadProfile = (typeof allUploadProfiles)[number]

/**
 * One upload slot, owned by the storage kernel. Rows are created PENDING
 * when a client requests an upload URL and flip to READY exactly once when
 * the bytes are verified (local mode: the storage function received them;
 * gcs mode: the object exists in the bucket). Download surfaces only ever
 * serve READY rows; PRIVATE rows are only served to their owner.
 */
export const uploadsTable = baseTable(
    "uploads",
    {
        /**
         * References users.id by convention only. Null when the upload was
         * created by an authenticated principal without an application user
         * row (e.g. the test harness principal).
         */
        userId: text("user_id"),
        /**
         * Object key relative to the storage root (local data dir or the
         * STORAGE_PREFIX inside the GCS bucket), e.g. "uploads/upld_<uuid>".
         */
        storageKey: text("storage_key").notNull(),
        contentType: text("content_type").notNull(),
        /** Declared at create time; overwritten with the actual count at finalize. */
        sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
        visibility: text("visibility", { enum: allUploadVisibilities }).notNull(),
        status: text("status", { enum: allUploadStatuses }).notNull(),
        /**
         * The admission profile the slot was created under (StorageConfig.ts):
         * finalize and the local-mode ingest verify arriving bytes against the
         * same cap that admitted the declaration.
         */
        profile: text("profile", { enum: allUploadProfiles }).notNull().default("DEFAULT"),
        /**
         * Download-friendly name the caller filed the bytes with (server-side
         * writes carry one, e.g. a generated document's); null for browser
         * uploads, which never declare one.
         */
        fileName: text("file_name"),
    },
    (table) => [
        unique("uploads_storage_key_unique").on(table.storageKey),
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("uploads_visibility_check", sql`${table.visibility} IN ('PUBLIC', 'PRIVATE')`),
        check("uploads_status_check", sql`${table.status} IN ('PENDING', 'READY')`),
        check("uploads_profile_check", sql`${table.profile} IN ('DEFAULT', 'DRIVE')`),
    ],
)

export type Upload = typeof uploadsTable.$inferSelect
export type NewUpload = typeof uploadsTable.$inferInsert

export const uploadInsertSchema = createInsertSchema(uploadsTable, {
    storageKey: (schema) => schema.trim().min(1),
    contentType: (schema) => schema.trim().min(1),
    sizeBytes: (schema) => schema.int().positive(),
    fileName: (schema) => schema.trim().min(1).max(255),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })

export const uploadUpdateSchema = uploadInsertSchema
    .pick({ status: true, sizeBytes: true, visibility: true })
    .partial()

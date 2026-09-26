import { text } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

/**
 * An investor deck: brand (company, tagline, logo, accent) plus a fixed
 * outline of slides (pitch_slides). The numbers on chart slides are never
 * stored — they are computed from the owner's live books at read and export
 * time, so the deck is always current.
 */
export const pitchDecksTable = baseTable("pitch_decks", {
    // The member who owns the deck; rows are strictly per-user.
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    companyName: text("company_name").notNull(),
    tagline: text("tagline"),
    // References uploads.id by convention (the uploaded logo), or null.
    logoUploadId: text("logo_upload_id"),
    // Hex accent color for slide accents, e.g. "#1f6feb".
    accentColor: text("accent_color").notNull().default("#1f6feb"),
})

export type PitchDeck = typeof pitchDecksTable.$inferSelect
export type NewPitchDeck = typeof pitchDecksTable.$inferInsert

export const pitchDeckInsertSchema = createInsertSchema(pitchDecksTable, {
    userId: (schema) => schema.trim().min(1),
    name: (schema) => schema.trim().min(1).max(120),
    companyName: (schema) => schema.trim().min(1).max(120),
    accentColor: (schema) => schema.regex(/^#[0-9a-fA-F]{6}$/),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })

import { sql } from "drizzle-orm"
import { boolean, check, integer, text } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

export const allPitchSlideKinds = ["COVER", "TRACTION", "REVENUE", "MARGINS", "RUNWAY", "ASK"] as const
export type PitchSlideKind = (typeof allPitchSlideKinds)[number]

/**
 * One slide of a deck's fixed outline. Only the copy (title/body) and the
 * include toggle are stored; chart slides get their numbers from the live
 * books at read and export time.
 */
export const pitchSlidesTable = baseTable(
    "pitch_slides",
    {
        deckId: text("deck_id").notNull(),
        position: integer("position").notNull(),
        kind: text("kind", { enum: allPitchSlideKinds }).notNull(),
        title: text("title").notNull(),
        body: text("body").notNull(),
        included: boolean("included").notNull().default(true),
    },
    (table) => [
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check(
            "pitch_slides_kind_check",
            sql`${table.kind} IN ('COVER', 'TRACTION', 'REVENUE', 'MARGINS', 'RUNWAY', 'ASK')`,
        ),
    ],
)

export type PitchSlide = typeof pitchSlidesTable.$inferSelect
export type NewPitchSlide = typeof pitchSlidesTable.$inferInsert

export const pitchSlideInsertSchema = createInsertSchema(pitchSlidesTable, {
    deckId: (schema) => schema.trim().min(1),
    position: (schema) => schema.int().min(0),
    title: (schema) => schema.trim().min(1).max(120),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })

import { sql } from "drizzle-orm"
import { check, doublePrecision, integer, text, unique } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

/**
 * One row on the living songs chart the AI agent reads and writes.
 * `chartRank` 1 is the top of the list.
 */
export const songsTable = baseTable(
    "songs",
    {
        chartRank: integer("chart_rank").notNull(),
        title: text("title").notNull(),
        artist: text("artist").notNull(),
        year: integer("year").notNull(),
        genre: text("genre").notNull(),
        streamsBillions: doublePrecision("streams_billions"),
        notes: text("notes"),
    },
    (table) => [
        unique("songs_chart_rank_unique").on(table.chartRank),
        check("songs_chart_rank_positive", sql`${table.chartRank} >= 1`),
        check("songs_year_check", sql`${table.year} >= 1900 AND ${table.year} <= 2100`),
    ],
)

export type Song = typeof songsTable.$inferSelect
export type NewSong = typeof songsTable.$inferInsert

export const songInsertSchema = createInsertSchema(songsTable, {
    title: (schema) => schema.trim().min(1),
    artist: (schema) => schema.trim().min(1),
    genre: (schema) => schema.trim().min(1),
    notes: (schema) => schema.trim().min(1).optional(),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })

export const songUpdateSchema = songInsertSchema.partial()

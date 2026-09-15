import { sql } from "drizzle-orm"
import { check, index, text, timestamp, unique } from "drizzle-orm/pg-core"
import { baseTable } from "../BaseTable.js"

export const allPushDevicePlatforms = ["WEB", "IOS", "ANDROID"] as const
export type PushDevicePlatform = (typeof allPushDevicePlatforms)[number]

/**
 * The push kernel's device registry (docs/push.md): one row per push
 * destination an app user has enabled. The endpoint is the transport
 * identity — the Web Push subscription endpoint today, native device tokens
 * in the C1b follow-up — and its unique constraint gives registration its
 * upsert semantics: re-registering an endpoint rotates the row (new owner,
 * fresh subscription JSON, bumped rotated_at) instead of duplicating it.
 */
export const pushDevicesTable = baseTable(
    "push_devices",
    {
        /** References users.id by convention only (see docs/data-layer.md). */
        userId: text("user_id").notNull(),
        platform: text("platform", { enum: allPushDevicePlatforms }).notNull(),
        /** Unique per browser/device; registrations upsert on it. */
        endpoint: text("endpoint").notNull(),
        /** The full PushSubscription JSON (endpoint + keys) for WEB rows. */
        subscriptionJson: text("subscription_json").notNull(),
        /** Bumped every time the endpoint is (re-)registered. */
        rotatedAt: timestamp("rotated_at", { withTimezone: true }).notNull(),
    },
    (table) => [
        unique("push_devices_endpoint_unique").on(table.endpoint),
        index("push_devices_user_id_idx").on(table.userId),
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("push_devices_platform_check", sql`${table.platform} IN ('WEB', 'IOS', 'ANDROID')`),
    ],
)

export type PushDevice = typeof pushDevicesTable.$inferSelect
export type NewPushDevice = typeof pushDevicesTable.$inferInsert

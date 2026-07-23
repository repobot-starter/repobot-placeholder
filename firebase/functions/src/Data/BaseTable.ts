import crypto from "node:crypto"
import { BuildColumns, BuildExtraConfigColumns, HasDefault, NotNull } from "drizzle-orm/column-builder"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { PgColumnBuilderBase, PgTableExtraConfigValue, PgTableWithColumns } from "drizzle-orm/pg-core"
import { getTablePrefix, TableName, TablePrefix } from "./TablePrefix.js"

export type BaseColumnsMap = Record<string, PgColumnBuilderBase>

type TAutoColumnsMap = {
    id: NotNull<HasDefault<ReturnType<typeof text>>>
    rowCreatedAt: NotNull<HasDefault<ReturnType<typeof timestamp>>>
    rowUpdatedAt: NotNull<HasDefault<ReturnType<typeof timestamp>>>
}
type TAllColumnsMap<TColumnsMap extends BaseColumnsMap> = TColumnsMap & TAutoColumnsMap

export type BaseTable<TColumnsMap extends BaseColumnsMap> = PgTableWithColumns<{
    name: string
    schema: undefined
    columns: BuildColumns<string, TAllColumnsMap<TColumnsMap>, "pg">
    dialect: "pg"
}>

/**
 * Generates a new prefixed row id, for example "proj_5f0c...".
 */
export function newRowId(prefix: TablePrefix): string {
    return `${prefix}_${crypto.randomUUID()}`
}

const prefixByTable = new WeakMap<object, TablePrefix>()

/**
 * Generates a new row id using the prefix that the table was registered with.
 */
export function newRowIdForTable(table: object): string {
    const prefix = prefixByTable.get(table)
    if (prefix === undefined) {
        throw new Error("Table was not created via baseTable(); no id prefix is registered for it.")
    }
    return newRowId(prefix)
}

/**
 * This wrapper for drizzle's pgTable automatically defines "id",
 * "rowCreatedAt", and "rowUpdatedAt" columns:
 *   - id: text primary key, generated in the application at insert time as
 *     `${prefix}_${uuid}` (NOT a database default; the migrations declare a
 *     plain `text PRIMARY KEY`).
 *   - rowCreatedAt / rowUpdatedAt: timestamptz NOT NULL DEFAULT now();
 *     rowUpdatedAt is also refreshed app-side on drizzle updates.
 */
export function baseTable<TColumnsMap extends BaseColumnsMap>(
    name: TableName,
    columnsMap: TColumnsMap,
    extraConfig?: (
        columns: BuildExtraConfigColumns<string, TAllColumnsMap<TColumnsMap>, "pg">,
    ) => PgTableExtraConfigValue[],
): BaseTable<TColumnsMap> {
    const prefix = getTablePrefix(name)
    const autoColumns = {
        id: text("id")
            .primaryKey()
            .$default(() => newRowId(prefix)),
        rowCreatedAt: timestamp("row_created_at", { withTimezone: true }).notNull().defaultNow(),
        rowUpdatedAt: timestamp("row_updated_at", { withTimezone: true })
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    }

    const table = pgTable(
        name as string,
        { ...autoColumns, ...columnsMap },
        extraConfig,
    ) as unknown as BaseTable<TColumnsMap>
    prefixByTable.set(table, prefix)
    return table
}

import { eq, getTableName, inArray, Table } from "drizzle-orm"
import { RpcError, check } from "../../Utils/RpcError.js"
import { newRowIdForTable } from "../BaseTable.js"
import { idempotencyKeysTable } from "../IdempotencyKeys.js"
import { DatabaseOrTransaction, TInsertValue, TSelectValue, TUpdateValue } from "./DrizzleUtils.js"

interface TableWithId extends Table {
    id: Table["_"]["columns"][string]
}

/**
 * Gets a row by id or throws NOT_FOUND.
 */
export async function getRowByIdOrThrow<TTable extends Table>(
    db: DatabaseOrTransaction,
    table: TTable,
    rowId: string,
): Promise<TSelectValue<TTable>> {
    const idColumn = (table as unknown as TableWithId).id
    const [row] = (await db
        .select()
        .from(table as Table)
        .where(eq(idColumn, rowId))) as TSelectValue<TTable>[]

    if (row === undefined) {
        throw new RpcError("NOT_FOUND", `No row found in ${getTableName(table)} with id ${rowId}`)
    }
    return row
}

/**
 * Updates a row by id and returns the updated row, or throws NOT_FOUND.
 * Passing an update value with no defined properties returns the row as-is.
 */
export async function updateRowReturning<TTable extends Table>(
    db: DatabaseOrTransaction,
    table: TTable,
    rowId: string,
    updateValue: TUpdateValue<TTable>,
): Promise<TSelectValue<TTable>> {
    const definedEntries = Object.entries(updateValue).filter(([, value]) => value !== undefined)
    if (definedEntries.length === 0) {
        return getRowByIdOrThrow(db, table, rowId)
    }

    const idColumn = (table as unknown as TableWithId).id
    const rows = (await db
        .update(table as Table)
        .set(Object.fromEntries(definedEntries))
        .where(eq(idColumn, rowId))
        .returning()) as TSelectValue<TTable>[]

    if (rows.length === 0) {
        throw new RpcError("NOT_FOUND", `No row updated in ${getTableName(table)} with id ${rowId}`)
    }
    check(rows.length === 1, `Expected to update a single row; updated ${rows.length}.`)
    return rows[0]
}

/**
 * Idempotently inserts a row and returns it.
 *
 * The first call with a given idempotency key inserts the row and records
 * key -> row id in idempotency_keys. Any retry with the same key (client
 * retry, at-least-once message redelivery, ...) returns the original row
 * instead of inserting a duplicate. Concurrent first calls are serialized by
 * the primary key on idempotency_keys.
 */
export async function idempotentInsertAndGet<TTable extends Table>(
    db: DatabaseOrTransaction,
    table: TTable,
    insertValue: TInsertValue<TTable>,
    idempotencyKey: string,
): Promise<TSelectValue<TTable>> {
    check(idempotencyKey.length > 0, "idempotencyKey must not be empty.")

    return await db.transaction(async (tx) => {
        const rowId = (insertValue as { id?: string }).id ?? newRowIdForTable(table)

        // Claim the idempotency key. On conflict (key already used), the insert
        // returns no rows and we return the existing row instead.
        const claimed = await tx
            .insert(idempotencyKeysTable)
            .values({ key: idempotencyKey, rowId })
            .onConflictDoNothing({ target: idempotencyKeysTable.key })
            .returning()

        if (claimed.length === 0) {
            const [existingKey] = await tx
                .select()
                .from(idempotencyKeysTable)
                .where(eq(idempotencyKeysTable.key, idempotencyKey))
            check(existingKey !== undefined, "Idempotency key vanished during idempotent insert.")
            return await getRowByIdOrThrow(tx, table, existingKey.rowId)
        }

        const rows = (await tx
            .insert(table as Table)
            .values({ ...insertValue, id: rowId })
            .returning()) as TSelectValue<TTable>[]
        check(rows.length === 1, `Expected to insert a single row; inserted ${rows.length}.`)
        return rows[0]
    })
}

/**
 * Batch-loads rows by id, preserving the order of the requested ids. Missing
 * ids yield NOT_FOUND errors in their positions, matching the dataloader
 * contract (see Utils/DataLoaderUtils.ts).
 */
export async function orderedBatchLoadRowsByIds<TTable extends Table>(
    db: DatabaseOrTransaction,
    table: TTable,
    ids: readonly string[],
): Promise<(TSelectValue<TTable> | RpcError)[]> {
    if (ids.length === 0) {
        return []
    }

    const idColumn = (table as unknown as TableWithId).id
    const rows = (await db
        .select()
        .from(table as Table)
        .where(inArray(idColumn, [...ids]))) as TSelectValue<TTable>[]

    const rowsById = new Map(rows.map((row) => [(row as { id: string }).id, row]))
    return ids.map(
        (id) =>
            rowsById.get(id) ??
            new RpcError("NOT_FOUND", `No row found in ${getTableName(table)} with id ${id}`),
    )
}

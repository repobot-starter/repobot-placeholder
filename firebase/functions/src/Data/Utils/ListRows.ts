import { and, asc, desc, eq, getTableColumns, gt, lt, or, SQL, Table } from "drizzle-orm"
import { PgColumn } from "drizzle-orm/pg-core"
import { RpcError, checkArgument } from "../../Utils/RpcError.js"
import { DatabaseOrTransaction, TSelectValue } from "./DrizzleUtils.js"

export type SortDirection = "asc" | "desc"

export interface SortOrder {
    fieldName: string
    direction: SortDirection
}

/**
 * Mirrors the GraphQL ConnectionInput contract.
 */
export interface ConnectionParameters {
    pagination: { first: number; after?: string | null }
    sort: SortOrder[]
}

export interface PageInfo {
    hasPreviousPage: boolean
    hasNextPage: boolean
    startCursor?: string
    endCursor?: string
}

export interface ListRowsResult<TRow> {
    nodes: TRow[]
    pageInfo: PageInfo
}

export interface ListRowsOptions {
    /**
     * Extra WHERE conditions (built by the calling service from its filters).
     */
    filters?: (SQL | undefined)[]

    /**
     * The column keys that are acceptable to sort on. Defaults to all columns.
     */
    sortColumnKeys?: string[]
}

/**
 * Lists rows with cursor (keyset) pagination.
 *
 * The cursor is the base64url-encoded JSON array of the row's sort-column
 * values with the row id appended as a final unique tiebreaker, so pagination
 * is stable under concurrent inserts and works for any sort order.
 */
export async function listRows<TTable extends Table>(
    db: DatabaseOrTransaction,
    table: TTable,
    parameters: ConnectionParameters,
    options?: ListRowsOptions,
): Promise<ListRowsResult<TSelectValue<TTable>>> {
    const { first, after } = parameters.pagination
    checkArgument(first > 0, "pagination.first must be greater than 0.")

    const columns = getTableColumns(table) as Record<string, PgColumn>
    const sortOrders = normalizeSortOrders(parameters.sort, columns, options?.sortColumnKeys)

    const conditions: (SQL | undefined)[] = [...(options?.filters ?? [])]
    if (after !== undefined && after !== null) {
        conditions.push(keysetCondition(decodeCursor(after, sortOrders.length), sortOrders, columns))
    }

    const orderBy = sortOrders.map(({ fieldName, direction }) =>
        direction === "asc" ? asc(columns[fieldName]) : desc(columns[fieldName]),
    )

    const rows = (await db
        .select()
        .from(table as Table)
        .where(and(...conditions))
        .orderBy(...orderBy)
        .limit(first + 1)) as TSelectValue<TTable>[]

    const hasNextPage = rows.length > first
    const nodes = hasNextPage ? rows.slice(0, first) : rows

    return {
        nodes,
        pageInfo: {
            hasNextPage,
            hasPreviousPage: after !== undefined && after !== null,
            startCursor: nodes.length > 0 ? encodeCursor(nodes[0], sortOrders) : undefined,
            endCursor: nodes.length > 0 ? encodeCursor(nodes[nodes.length - 1], sortOrders) : undefined,
        },
    }
}

/**
 * Validates the requested sort orders and appends "id asc" as the unique
 * tiebreaker that keyset pagination requires.
 */
function normalizeSortOrders(
    requested: SortOrder[],
    columns: Record<string, PgColumn>,
    sortColumnKeys?: string[],
): SortOrder[] {
    const allowed = new Set(sortColumnKeys ?? Object.keys(columns))
    allowed.add("id")

    const sortOrders: SortOrder[] = []
    for (const sortOrder of requested) {
        checkArgument(
            columns[sortOrder.fieldName] !== undefined && allowed.has(sortOrder.fieldName),
            `Cannot sort on field "${sortOrder.fieldName}".`,
        )
        sortOrders.push(sortOrder)
    }
    if (!sortOrders.some((sortOrder) => sortOrder.fieldName === "id")) {
        sortOrders.push({ fieldName: "id", direction: "asc" })
    }
    return sortOrders
}

type CursorValue = string | number | boolean

function encodeCursor(row: Record<string, unknown>, sortOrders: SortOrder[]): string {
    const values = sortOrders.map(({ fieldName }) => {
        const value = row[fieldName]
        return value instanceof Date ? value.toISOString() : value
    })
    return Buffer.from(JSON.stringify(values)).toString("base64url")
}

function decodeCursor(cursor: string, expectedLength: number): CursorValue[] {
    let values: unknown
    try {
        values = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"))
    } catch {
        throw new RpcError("INVALID_ARGUMENT", "Malformed pagination cursor.")
    }
    if (!Array.isArray(values) || values.length !== expectedLength) {
        throw new RpcError("INVALID_ARGUMENT", "Pagination cursor does not match the requested sort.")
    }
    for (const value of values) {
        if (
            value === null ||
            (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean")
        ) {
            throw new RpcError("INVALID_ARGUMENT", "Pagination cursor contains an unsupported value.")
        }
    }
    return values as CursorValue[]
}

/**
 * Builds the keyset "rows after this cursor" condition:
 *   OR over i of (sort columns before i are equal AND column i is past value i)
 */
function keysetCondition(
    cursorValues: CursorValue[],
    sortOrders: SortOrder[],
    columns: Record<string, PgColumn>,
): SQL | undefined {
    const branches: (SQL | undefined)[] = sortOrders.map((sortOrder, index) => {
        const equalities = sortOrders
            .slice(0, index)
            .map((previous, previousIndex) =>
                eq(
                    columns[previous.fieldName],
                    columnValue(columns[previous.fieldName], cursorValues[previousIndex]),
                ),
            )
        const column = columns[sortOrder.fieldName]
        const boundary =
            sortOrder.direction === "asc"
                ? gt(column, columnValue(column, cursorValues[index]))
                : lt(column, columnValue(column, cursorValues[index]))
        return and(...equalities, boundary)
    })
    return or(...branches)
}

function columnValue(column: PgColumn, value: CursorValue): CursorValue | Date {
    if (column.dataType === "date" && typeof value === "string") {
        return new Date(value)
    }
    return value
}

import { asc, eq } from "drizzle-orm"
import {
    EntryField,
    entryFieldInsertSchema,
    entryFieldsTable,
    EntryFieldType,
    entryFieldUpdateSchema,
} from "../../Data/Entry/EntryField.js"
import {
    EntryRecord,
    entryRecordInsertSchema,
    entryRecordsTable,
    entryRecordUpdateSchema,
    EntryRecordValues,
} from "../../Data/Entry/EntryRecord.js"
import { entryDb, entryRecordValuesSearchCondition } from "../../Data/EntryDatabase.js"
import {
    ConnectionParameters,
    getRowByIdOrThrow,
    idempotentInsertAndGet,
    listRows,
    ListRowsResult,
    updateRowReturning,
} from "../../Data/Utils/index.js"
import { RpcError } from "../../Utils/RpcError.js"

class EntryService {
    /**
     * The workbook's field definitions in column order — the live schema that
     * the dynamic record form is built from.
     */
    async listEntryFields(): Promise<EntryField[]> {
        return await entryDb
            .select()
            .from(entryFieldsTable)
            .orderBy(asc(entryFieldsTable.position), asc(entryFieldsTable.id))
    }

    async getEntryFieldByIdOrThrow(fieldId: string): Promise<EntryField> {
        return await getRowByIdOrThrow(entryDb, entryFieldsTable, fieldId)
    }

    /**
     * Creates a field. The fieldKey is derived from the label (lowercased,
     * non-alphanumeric runs become "_") and made unique against the existing
     * fields by appending _2, _3, ...; it never changes afterwards. The new
     * field lands at the end of the column order.
     */
    async createEntryField(request: CreateEntryFieldRequest): Promise<EntryField> {
        const existingFields = await this.listEntryFields()
        const fieldType = request.fields.fieldType
        const newField = entryFieldInsertSchema.parse({
            label: request.fields.label,
            fieldKey: deriveFieldKey(
                request.fields.label,
                existingFields.map((field) => field.fieldKey),
            ),
            fieldType,
            required: request.fields.required ?? false,
            // Options only mean something for SELECT fields; drop them otherwise.
            options: fieldType === "SELECT" ? (request.fields.options ?? null) : null,
            position: Math.max(0, ...existingFields.map((field) => field.position)) + 1,
        })
        return await idempotentInsertAndGet(entryDb, entryFieldsTable, newField, request.idempotencyKey)
    }

    /**
     * Updates a field's label, required flag, and (for SELECT fields) its
     * options. The fieldKey is immutable so existing cells stay addressed.
     */
    async updateEntryField(request: UpdateEntryFieldRequest): Promise<EntryField> {
        const field = await this.getEntryFieldByIdOrThrow(request.objectId)
        const updateValue = entryFieldUpdateSchema.parse({
            label: request.fields.label ?? undefined,
            required: request.fields.required ?? undefined,
            ...(field.fieldType === "SELECT" && request.fields.options != null
                ? { options: request.fields.options }
                : {}),
        })
        return await updateRowReturning(entryDb, entryFieldsTable, request.objectId, updateValue)
    }

    /**
     * Hard-deletes a field definition. Existing records keep the (now
     * orphaned) cell values under the deleted field's key by design.
     */
    async deleteEntryField(request: DeleteEntryFieldRequest): Promise<void> {
        await this.getEntryFieldByIdOrThrow(request.objectId)
        await entryDb.delete(entryFieldsTable).where(eq(entryFieldsTable.id, request.objectId))
    }

    async listEntryRecords(request: ListEntryRecordsRequest): Promise<ListRowsResult<EntryRecord>> {
        const search = request.filters?.search
        return await listRows(entryDb, entryRecordsTable, request.connection, {
            filters: [
                search != null && search.length > 0 ? entryRecordValuesSearchCondition(search) : undefined,
            ],
            sortColumnKeys: ["rowCreatedAt"],
        })
    }

    async getEntryRecordByIdOrThrow(recordId: string): Promise<EntryRecord> {
        return await getRowByIdOrThrow(entryDb, entryRecordsTable, recordId)
    }

    async createEntryRecord(request: CreateEntryRecordRequest): Promise<EntryRecord> {
        const newRecord = entryRecordInsertSchema.parse({
            values: parseValuesJson(request.fields.valuesJson),
        })
        return await idempotentInsertAndGet(entryDb, entryRecordsTable, newRecord, request.idempotencyKey)
    }

    async updateEntryRecord(request: UpdateEntryRecordRequest): Promise<EntryRecord> {
        const updateValue = entryRecordUpdateSchema.parse({
            values: parseValuesJson(request.fields.valuesJson),
        })
        return await updateRowReturning(entryDb, entryRecordsTable, request.objectId, updateValue)
    }

    async deleteEntryRecord(request: DeleteEntryRecordRequest): Promise<void> {
        await this.getEntryRecordByIdOrThrow(request.objectId)
        await entryDb.delete(entryRecordsTable).where(eq(entryRecordsTable.id, request.objectId))
    }
}

/**
 * label -> stable cell key: lowercased, every non-alphanumeric run becomes
 * "_", trimmed of leading/trailing "_"; uniqueness against the taken keys by
 * appending _2, _3, ... ("Follow up" -> "follow_up", a second "Name" ->
 * "name_2").
 */
function deriveFieldKey(label: string, takenKeys: readonly string[]): string {
    const base = label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    const candidate = base.length > 0 ? base : "field"
    const taken = new Set(takenKeys)
    if (!taken.has(candidate)) {
        return candidate
    }
    for (let suffix = 2; ; suffix += 1) {
        const suffixed = `${candidate}_${suffix}`
        if (!taken.has(suffixed)) {
            return suffixed
        }
    }
}

/**
 * valuesJson (the wire encoding of a record's cells) -> the jsonb object.
 * Rejects malformed JSON and any JSON that is not an object.
 */
function parseValuesJson(valuesJson: string): EntryRecordValues {
    let parsed: unknown
    try {
        parsed = JSON.parse(valuesJson)
    } catch {
        throw new RpcError("INVALID_ARGUMENT", "valuesJson is not valid JSON.")
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new RpcError("INVALID_ARGUMENT", "valuesJson must encode a JSON object.")
    }
    return parsed as EntryRecordValues
}

export const entryService = new EntryService()

export interface CreateEntryFieldRequest {
    idempotencyKey: string
    fields: {
        label: string
        fieldType: EntryFieldType
        required?: boolean | null
        options?: string[] | null
    }
}

export interface UpdateEntryFieldRequest {
    objectId: string
    idempotencyKey: string
    fields: {
        label?: string | null
        required?: boolean | null
        options?: string[] | null
    }
}

export interface DeleteEntryFieldRequest {
    objectId: string
}

export interface ListEntryRecordsRequest {
    connection: ConnectionParameters
    filters?: {
        search?: string | null
    } | null
}

export interface CreateEntryRecordRequest {
    idempotencyKey: string
    fields: {
        valuesJson: string
    }
}

export interface UpdateEntryRecordRequest {
    objectId: string
    idempotencyKey: string
    fields: {
        valuesJson: string
    }
}

export interface DeleteEntryRecordRequest {
    objectId: string
}

import type { EntryFieldFieldsFragment } from "../../generated/graphql/types"

/** One workbook row's cells, keyed by fieldKey (parsed from valuesJson). */
export type EntryValues = Record<string, unknown>

export function parseEntryValues(valuesJson: string): EntryValues {
    try {
        const parsed: unknown = JSON.parse(valuesJson)
        if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed as EntryValues
        }
    } catch {
        // Fall through: a malformed row renders as empty cells rather than crashing the table.
    }
    return {}
}

/** A cell value formatted for table display (booleans handled by the column's Badge). */
export function formatEntryCell(field: EntryFieldFieldsFragment, value: unknown): string {
    if (value === undefined || value === null || value === "") {
        return ""
    }
    if (field.fieldType === "NUMBER" && typeof value === "number") {
        return value.toLocaleString()
    }
    if (field.fieldType === "YESNO") {
        return value === true ? "Yes" : "No"
    }
    return String(value)
}

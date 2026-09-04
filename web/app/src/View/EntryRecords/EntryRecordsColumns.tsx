import { Badge, type DataTableColumn } from "@ui"
import { formatInstant } from "../../Utils/Dates"
import type { EntryFieldFieldsFragment } from "../../generated/graphql/types"
import { formatEntryCell, type EntryValues } from "./entryValues"

export interface EntryRecordRow {
    id: string
    values: EntryValues
    createdTime: string
}

/**
 * The table IS the user's schema: one column per field definition (in the
 * designer's order), plus the created timestamp. Only `created` is sortable —
 * cell values live inside a jsonb document, so the server sorts by row age.
 */
export function buildEntryRecordsColumns(
    fields: EntryFieldFieldsFragment[],
): DataTableColumn<EntryRecordRow>[] {
    const fieldColumns = fields.map((field): DataTableColumn<EntryRecordRow> => ({
        id: field.fieldKey,
        header: field.label,
        render: (row) => {
            const value = row.values[field.fieldKey]
            if (field.fieldType === "YESNO") {
                if (value === undefined || value === null) {
                    return ""
                }
                return (
                    <Badge tone={value === true ? "success" : "neutral"}>
                        {value === true ? "Yes" : "No"}
                    </Badge>
                )
            }
            if (field.fieldType === "SELECT") {
                const label = formatEntryCell(field, value)
                return label === "" ? "" : <Badge tone="accent">{label}</Badge>
            }
            return formatEntryCell(field, value)
        },
    }))
    return [
        ...fieldColumns,
        {
            id: "created",
            header: "Created",
            width: 140,
            sortable: true,
            render: (row) => formatInstant(row.createdTime),
        },
    ]
}

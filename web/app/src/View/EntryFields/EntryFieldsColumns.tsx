import { Badge, type DataTableColumn } from "@ui"
import type { EntryFieldType } from "../../generated/graphql/types"

export interface EntryFieldRow {
    id: string
    label: string
    fieldKey: string
    fieldType: EntryFieldType
    required: boolean
    options?: string[]
}

const TYPE_LABELS: Record<EntryFieldType, string> = {
    TEXT: "Text",
    NUMBER: "Number",
    DATE: "Date",
    YESNO: "Yes / no",
    SELECT: "Select",
}

export function buildEntryFieldsColumns(): DataTableColumn<EntryFieldRow>[] {
    return [
        { id: "label", header: "Label", render: (row) => row.label },
        {
            id: "fieldType",
            header: "Type",
            width: 110,
            render: (row) => <Badge tone="accent">{TYPE_LABELS[row.fieldType]}</Badge>,
        },
        {
            id: "required",
            header: "Required",
            width: 100,
            render: (row) => (row.required ? <Badge tone="warning">Required</Badge> : ""),
        },
        {
            id: "options",
            header: "Choices",
            render: (row) => row.options?.join(", ") ?? "",
        },
        {
            id: "fieldKey",
            header: "Key",
            width: 140,
            render: (row) => row.fieldKey,
        },
    ]
}

import { Badge, type DataTableColumn } from "@ui"
import { formatInstant } from "../../../../Utils/Dates"
import type { UserStatus } from "../../../../generated/graphql/types"

export interface UserRow {
    id: string
    displayName: string
    email: string
    status: UserStatus
    createdTime: string
}

export function buildUsersColumns(): DataTableColumn<UserRow>[] {
    return [
        { id: "displayName", header: "Display name", render: (row) => row.displayName },
        { id: "email", header: "Email", render: (row) => row.email },
        {
            id: "status",
            header: "Status",
            width: 110,
            render: (row) => (
                <Badge tone={row.status === "ACTIVE" ? "success" : "neutral"}>
                    {row.status === "ACTIVE" ? "Active" : "Disabled"}
                </Badge>
            ),
        },
        { id: "createdTime", header: "Created", width: 140, render: (row) => formatInstant(row.createdTime) },
    ]
}

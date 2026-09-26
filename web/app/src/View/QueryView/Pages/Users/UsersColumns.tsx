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

// Sortable columns re-query server-side: the view model maps these column
// ids to the connection's sort fieldNames (see UsersViewModel).
export function buildUsersColumns(): DataTableColumn<UserRow>[] {
    return [
        { id: "displayName", header: "Display name", render: (row) => row.displayName, sortable: true },
        { id: "email", header: "Email", render: (row) => row.email, sortable: true },
        {
            id: "status",
            header: "Status",
            width: 110,
            sortable: true,
            render: (row) => (
                <Badge tone={row.status === "ACTIVE" ? "success" : "neutral"}>
                    {row.status === "ACTIVE" ? "Active" : "Disabled"}
                </Badge>
            ),
        },
        {
            id: "createdTime",
            header: "Created",
            width: 140,
            sortable: true,
            render: (row) => formatInstant(row.createdTime),
        },
    ]
}

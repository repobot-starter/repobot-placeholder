import { Badge, type DataTableColumn } from "@ui"
import { formatInstant } from "../../../../Utils/Dates"
import type { ProjectStatus } from "../../../../generated/graphql/types"

export interface ProjectRow {
    id: string
    name: string
    description: string
    status: ProjectStatus
    createdTime: string
}

// Sortable columns re-query server-side: the view model maps these column
// ids to the connection's sort fieldNames (see ProjectsViewModel).
export function buildProjectsColumns(): DataTableColumn<ProjectRow>[] {
    return [
        { id: "name", header: "Name", render: (row) => row.name, sortable: true },
        { id: "description", header: "Description", render: (row) => row.description },
        {
            id: "status",
            header: "Status",
            width: 110,
            sortable: true,
            render: (row) => (
                <Badge tone={row.status === "ACTIVE" ? "success" : "neutral"}>
                    {row.status === "ACTIVE" ? "Active" : "Archived"}
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

import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { Button } from "../primitives/Button"
import { FiltersToolbar } from "./FiltersToolbar"

const meta: Meta<typeof FiltersToolbar> = {
    title: "Components/FiltersToolbar",
    component: FiltersToolbar,
}
export default meta

type Story = StoryObj<typeof FiltersToolbar>

function Demo(): React.ReactElement {
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState<string | undefined>("open")
    const [channel, setChannel] = useState<string | undefined>(undefined)
    const [sort, setSort] = useState("newest")
    return (
        <FiltersToolbar
            search={{ value: search, onChange: setSearch, placeholder: "Search orders..." }}
            filters={[
                {
                    id: "status",
                    label: "Status",
                    value: status,
                    onChange: setStatus,
                    allLabel: "All statuses",
                    options: [
                        { id: "open", label: "Open" },
                        { id: "shipped", label: "Shipped" },
                        { id: "refunded", label: "Refunded" },
                    ],
                },
                {
                    id: "channel",
                    label: "Channel",
                    value: channel,
                    onChange: setChannel,
                    options: [
                        { id: "online", label: "Online" },
                        { id: "in-store", label: "In store" },
                    ],
                },
            ]}
            sort={{
                value: sort,
                onChange: setSort,
                options: [
                    { value: "newest", label: "Newest first" },
                    { value: "oldest", label: "Oldest first" },
                    { value: "total", label: "Highest total" },
                ],
            }}
            trailing={<Button variant="secondary">Export</Button>}
        />
    )
}

export const Default: Story = {
    render: () => <Demo />,
}

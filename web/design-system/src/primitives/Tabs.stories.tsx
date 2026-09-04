import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Tabs } from "./Tabs"

const meta: Meta<typeof Tabs> = {
    title: "Primitives/Tabs",
    component: Tabs,
}
export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = {
    args: {
        "aria-label": "Order detail",
        items: [
            { id: "overview", label: "Overview", content: <p>Line items, totals, customer.</p> },
            { id: "documents", label: "Documents", content: <p>Filed invoices and packing lists.</p> },
            { id: "history", label: "History", content: <p>Status changes over time.</p> },
            { id: "billing", label: "Billing", content: <p>Locked.</p>, disabled: true },
        ],
    },
}

export const Controlled: Story = {
    render: function ControlledStory() {
        const [tab, setTab] = React.useState("documents")
        return (
            <Tabs
                aria-label="Order detail"
                value={tab}
                onValueChange={setTab}
                items={[
                    { id: "overview", label: "Overview", content: <p>Overview panel.</p> },
                    { id: "documents", label: "Documents", content: <p>Documents panel.</p> },
                ]}
            />
        )
    },
}

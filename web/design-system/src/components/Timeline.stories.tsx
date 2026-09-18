import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Button } from "../primitives/Button"
import { Dialog } from "../primitives/Dialog"
import { Timeline } from "./Timeline"

const meta: Meta<typeof Timeline> = {
    title: "Components/Timeline",
    component: Timeline,
}
export default meta

type Story = StoryObj<typeof Timeline>

const ENTRIES = [
    {
        id: "1",
        timestamp: "Mar 28, 09:14",
        actor: "Dana Reyes",
        title: "Order delivered",
        tone: "success" as const,
    },
    {
        id: "2",
        timestamp: "Mar 12, 16:40",
        actor: "Dana Reyes",
        title: "Rate amended",
        description: "Quarterly cost sheet update.",
        tone: "warning" as const,
        changes: [
            { label: "Rate", before: "$2,140.00", after: "$2,320.00" },
            { label: "Valid until", before: "Mar 31", after: "Jun 30" },
        ],
    },
    {
        id: "3",
        timestamp: "Mar 4, 14:02",
        actor: "Morgan Lee",
        title: "Status changed",
        changes: [{ label: "Status", before: "Draft", after: "Booked" }],
    },
    {
        id: "4",
        timestamp: "Mar 4, 11:30",
        title: "Order created",
        tone: "accent" as const,
    },
]

export const ChangeLog: Story = {
    args: { entries: ENTRIES },
}

export const Empty: Story = {
    args: {
        entries: [],
        emptyState: { title: "No history yet", description: "Changes to this record land here." },
    },
}

// The same component inside a dialog — the reference apps' "change log" popup.
export const InDialog: Story = {
    render: function InDialogStory() {
        const [open, setOpen] = React.useState(false)
        return (
            <>
                <Button variant="secondary" onClick={() => setOpen(true)}>
                    View history
                </Button>
                <Dialog open={open} onOpenChange={setOpen} title="Change log">
                    <Timeline entries={ENTRIES} />
                </Dialog>
            </>
        )
    },
}

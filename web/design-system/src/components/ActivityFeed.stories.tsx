import type { Meta, StoryObj } from "@storybook/react"
import { ActivityFeed } from "./ActivityFeed"

const meta: Meta<typeof ActivityFeed> = {
    title: "Components/ActivityFeed",
    component: ActivityFeed,
}
export default meta

type Story = StoryObj<typeof ActivityFeed>

export const Default: Story = {
    args: {
        items: [
            {
                id: "1",
                title: "Order #1042 shipped",
                meta: "by Dana Reyes",
                timestamp: "2h ago",
                badge: { label: "Shipped", tone: "success" },
            },
            {
                id: "2",
                title: "New member joined",
                meta: "morgan@harborlane.coffee",
                timestamp: "5h ago",
            },
            {
                id: "3",
                title: "Order #1041 refunded",
                meta: "by Dana Reyes",
                timestamp: "Yesterday",
                badge: { label: "Refunded", tone: "danger" },
            },
            {
                id: "4",
                title: "Weekly digest sent",
                meta: "86 recipients",
                timestamp: "Monday",
            },
        ],
    },
}

export const Empty: Story = {
    args: {
        items: [],
        emptyState: {
            title: "No activity yet",
            description: "Events show up here as your workspace gets used.",
        },
    },
}

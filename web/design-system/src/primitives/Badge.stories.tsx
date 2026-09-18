import type { Meta, StoryObj } from "@storybook/react"
import { Badge } from "./Badge"

const meta: Meta<typeof Badge> = {
    title: "Primitives/Badge",
    component: Badge,
    args: { children: "Badge" },
}
export default meta

type Story = StoryObj<typeof Badge>

export const Neutral: Story = { args: { tone: "neutral", children: "Disabled" } }
export const Success: Story = { args: { tone: "success", children: "Active" } }
export const Danger: Story = { args: { tone: "danger", children: "Failed" } }
export const Accent: Story = { args: { tone: "accent", children: "In review" } }

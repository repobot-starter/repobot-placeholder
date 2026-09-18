import type { Meta, StoryObj } from "@storybook/react"
import { Avatar } from "./Avatar"

const meta: Meta<typeof Avatar> = {
    title: "Primitives/Avatar",
    component: Avatar,
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Default: Story = {
    args: { name: "Priya Raman" },
}

export const Sizes: Story = {
    render: () => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name="Priya Raman" size="xs" />
            <Avatar name="Priya Raman" size="sm" />
            <Avatar name="Priya Raman" size="md" />
            <Avatar name="Priya Raman" size="lg" />
        </div>
    ),
}

export const DeterministicHues: Story = {
    render: () => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name="Priya Raman" />
            <Avatar name="Jonah Reyes" />
            <Avatar name="Nell Okafor" />
            <Avatar name="Tomas Lindqvist" />
            <Avatar name="Ada Kaplan" />
            <Avatar name="Miles Grant" />
        </div>
    ),
}

export const MerchantMonograms: Story = {
    render: () => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name="Fieldnote Analytics" size="sm" />
            <Avatar name="Northwind Travel" size="sm" />
            <Avatar name="Copperline Coffee" size="sm" />
            <Avatar name="Beacon Cloud" size="sm" />
        </div>
    ),
}

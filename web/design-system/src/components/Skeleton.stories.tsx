import type { Meta, StoryObj } from "@storybook/react"
import { Skeleton } from "./Skeleton"

const meta: Meta<typeof Skeleton> = {
    title: "Components/Skeleton",
    component: Skeleton,
}
export default meta

type Story = StoryObj<typeof Skeleton>

export const Line: Story = { args: { width: 240, height: 16 } }
export const Block: Story = { args: { width: 320, height: 96 } }
export const Rows: Story = {
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 360 }}>
            <Skeleton height={20} />
            <Skeleton height={20} width="80%" />
            <Skeleton height={20} width="60%" />
        </div>
    ),
}

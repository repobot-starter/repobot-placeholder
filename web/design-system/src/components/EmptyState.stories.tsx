import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "../primitives/Button"
import { EmptyState } from "./EmptyState"

const meta: Meta<typeof EmptyState> = {
    title: "Components/EmptyState",
    component: EmptyState,
    args: {
        title: "No projects yet",
        description: "Create your first project to get started.",
    },
}
export default meta

type Story = StoryObj<typeof EmptyState>

export const Default: Story = {}
export const WithAction: Story = {
    args: { action: <Button>Create project</Button> },
}

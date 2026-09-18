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

// The framed first-run treatment: accent wash, dashed hairline, pictogram.
export const Wash: Story = {
    args: {
        variant: "wash",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        action: <Button>Create project</Button>,
    },
}

import type { Meta, StoryObj } from "@storybook/react"
import { MarketingPage } from "./MarketingPage"
import { MarketingSteps } from "./MarketingSteps"

const meta: Meta<typeof MarketingSteps> = {
    title: "Marketing/Steps",
    component: MarketingSteps,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingSteps>

const steps = [
    {
        title: "Connect your calendar",
        description: "Read-only at first. Sundial never moves anything without asking.",
    },
    {
        title: "See the real picture",
        description: "Within a day you get the time map and every meeting's true cost.",
    },
    {
        title: "Reclaim your week",
        description: "Accept a suggestion, watch the hours come back.",
    },
]

export const NumberedCards: Story = {
    args: {
        variant: "numbered-cards",
        kicker: "How it works",
        title: "Three steps, one honest week",
        steps,
    },
}

export const Timeline: Story = {
    args: {
        variant: "timeline",
        kicker: "How it works",
        title: "Three steps, one honest week",
        steps,
    },
}

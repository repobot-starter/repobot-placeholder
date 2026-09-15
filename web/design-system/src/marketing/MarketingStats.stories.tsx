import type { Meta, StoryObj } from "@storybook/react"
import { MarketingPage } from "./MarketingPage"
import { MarketingStats } from "./MarketingStats"

const meta: Meta<typeof MarketingStats> = {
    title: "Marketing/Stats",
    component: MarketingStats,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingStats>

const stats = [
    {
        value: "4.2h",
        label: "reclaimed per person, per week",
        description: "Median across teams after their first month on Sundial.",
    },
    {
        value: "31%",
        label: "fewer recurring meetings",
        description: "Standing meetings killed or shortened after scorecard review.",
    },
    {
        value: "12,000+",
        label: "calendars connected",
        description: "Across 340 engineering and product organizations.",
    },
]

export const Row: Story = {
    args: {
        variant: "row",
        kicker: "The numbers",
        title: "What a month of Sundial looks like",
        stats,
    },
}

export const Cards: Story = {
    args: {
        variant: "cards",
        kicker: "The numbers",
        title: "What a month of Sundial looks like",
        stats,
    },
}

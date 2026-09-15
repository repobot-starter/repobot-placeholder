import type { Meta, StoryObj } from "@storybook/react"
import { MarketingFeatureGrid } from "./MarketingFeatureGrid"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingFeatureGrid> = {
    title: "Marketing/FeatureGrid",
    component: MarketingFeatureGrid,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingFeatureGrid>

const features = [
    {
        emoji: "🗺️",
        title: "The time map",
        description:
            "One glance shows the week's true shape: deep work, meetings, and the gaps too small to use.",
    },
    {
        emoji: "⚖️",
        title: "Meeting scorecards",
        description: "Every recurring meeting gets a cost and a keep/kill score.",
    },
    {
        emoji: "🔕",
        title: "Focus guardrails",
        description: "Declines the 3:30 that would split your last deep-work window.",
    },
    {
        emoji: "📈",
        title: "Weekly digest",
        description: "One email: what changed, what it cost, one suggestion to try.",
    },
    {
        emoji: "🤝",
        title: "Team agreements",
        description: "Codify no-meeting Wednesdays; Sundial enforces them politely.",
    },
    {
        emoji: "🔌",
        title: "Works with your stack",
        description: "Google Calendar and Outlook today; the API is open.",
    },
]

export const Cards3Up: Story = {
    args: {
        variant: "cards-3up",
        kicker: "Features",
        title: "Everything your week is hiding",
        features,
    },
}

export const IconList: Story = {
    args: {
        variant: "icon-list",
        kicker: "Features",
        title: "Everything your week is hiding",
        features: features.slice(0, 4),
    },
}

/**
 * Mixed-size cells over a 4-column grid; wide cells carry product crops
 * that bleed off the bottom-right — features shown, not told.
 */
export const Bento: Story = {
    args: {
        variant: "bento",
        kicker: "Features",
        title: "Everything your week is hiding",
        features: features.map((feature, index) =>
            index === 0 || index === features.length - 1
                ? {
                      ...feature,
                      media: {
                          kind: "image" as const,
                          src: `https://picsum.photos/seed/bento-${index}/900/520`,
                          alt: `${feature.title} in the product`,
                          width: 900,
                          height: 520,
                      },
                  }
                : feature,
        ),
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="luxe-light">
                <Story />
            </MarketingPage>
        ),
    ],
}

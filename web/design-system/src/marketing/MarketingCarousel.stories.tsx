import type { Meta, StoryObj } from "@storybook/react"
import { MarketingCarousel } from "./MarketingCarousel"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingCarousel> = {
    title: "Marketing/Carousel",
    component: MarketingCarousel,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingCarousel>

const slides = [
    {
        media: { kind: "emoji", emoji: "🗺️" } as const,
        title: "The time map",
        body: "The whole week on one canvas — deep work, meetings, and the gaps too small to use.",
        cta: { label: "Learn more", anchor: "feature-grid" },
    },
    {
        media: { kind: "emoji", emoji: "⚖️" } as const,
        title: "Meeting scorecards",
        body: "Every recurring meeting gets a person-hour cost and a keep/kill score.",
        cta: { label: "Learn more", anchor: "feature-grid" },
    },
    {
        media: { kind: "emoji", emoji: "🔕" } as const,
        title: "Focus guardrails",
        body: "Declines the 3:30 that would split your last deep-work window.",
        cta: { label: "Learn more", anchor: "feature-grid" },
    },
    {
        media: { kind: "emoji", emoji: "📈" } as const,
        title: "Weekly digest",
        body: "One email: what changed, what it cost, one suggestion to try.",
        cta: { label: "Learn more", anchor: "feature-grid" },
    },
    {
        media: { kind: "emoji", emoji: "🤝" } as const,
        title: "Team agreements",
        body: "Codify no-meeting Wednesdays; Sundial enforces them politely.",
        cta: { label: "Learn more", anchor: "feature-grid" },
    },
]

export const Cards: Story = {
    args: {
        variant: "cards",
        kicker: "The lineup",
        title: "Everything in the toolkit",
        slides,
    },
}

export const Spotlight: Story = {
    args: {
        variant: "spotlight",
        kicker: "The lineup",
        title: "Everything in the toolkit",
        slides: slides.slice(0, 3),
    },
}

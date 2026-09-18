import type { Meta, StoryObj } from "@storybook/react"
import { MarketingHighlights } from "./MarketingHighlights"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingHighlights> = {
    title: "Marketing/Highlights",
    component: MarketingHighlights,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingHighlights>

const highlights = [
    {
        media: { kind: "emoji", emoji: "🗺️" } as const,
        headline: "See the week's true shape",
        body: "The time map lays every meeting, focus block, and dead gap on one canvas. Most teams find four hours they didn't know they were losing — usually to the same two recurring meetings.",
        cta: { label: "See a sample map", anchor: "showcase" },
    },
    {
        media: { kind: "emoji", emoji: "⚖️" } as const,
        headline: "Score every recurring meeting",
        body: "Each standing meeting gets a cost in person-hours and a keep/kill score from attendance, overrun, and follow-through. The weekly review takes five minutes and pays for itself immediately.",
    },
    {
        media: { kind: "emoji", emoji: "🔕" } as const,
        headline: "Guard the deep-work windows",
        body: "Sundial declines the 3:30 that would split your last long block, and suggests the slot that costs the team nothing. Politely, automatically, every time.",
        cta: { label: "How guardrails work", anchor: "faq" },
    },
]

export const Alternating: Story = {
    args: {
        variant: "alternating",
        kicker: "A closer look",
        title: "Three ways your calendar gets better",
        highlights,
    },
}

export const Stacked: Story = {
    args: {
        variant: "stacked",
        kicker: "A closer look",
        title: "Three ways your calendar gets better",
        highlights,
    },
}

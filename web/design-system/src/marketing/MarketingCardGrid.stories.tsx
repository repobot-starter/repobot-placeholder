import type { Meta, StoryObj } from "@storybook/react"
import { MarketingCardGrid } from "./MarketingCardGrid"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingCardGrid> = {
    title: "Marketing/CardGrid",
    component: MarketingCardGrid,
    decorators: [
        (Story) => (
            <MarketingPage preset="soft-saas">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingCardGrid>

const cards = [
    {
        media: { kind: "emoji", emoji: "🏢" } as const,
        title: "For engineering leads",
        body: "See which recurring meetings your team can kill this quarter, with the person-hour cost attached to each.",
        cta: { label: "See the playbook", anchor: "faq" },
    },
    {
        media: { kind: "emoji", emoji: "🎯" } as const,
        title: "For product managers",
        body: "Protect discovery time without going invisible — Sundial keeps you reachable in the slots that cost the least.",
        cta: { label: "See the playbook", anchor: "faq" },
    },
    {
        media: { kind: "emoji", emoji: "🧑‍💼" } as const,
        title: "For executives",
        body: "One dashboard for how the org actually spends its week, and where the next four focused hours come from.",
        cta: { label: "See the playbook", anchor: "faq" },
    },
    {
        media: { kind: "emoji", emoji: "🌍" } as const,
        title: "For distributed teams",
        body: "Overlap windows across time zones are precious. Sundial spends them on decisions, not status updates.",
        cta: { label: "See the playbook", anchor: "faq" },
    },
]

export const ThreeUp: Story = {
    args: {
        variant: "3up",
        kicker: "Use cases",
        title: "Built for the people who run the week",
        cards: cards.slice(0, 3),
    },
}

export const TwoUp: Story = {
    args: {
        variant: "2up",
        kicker: "Use cases",
        title: "Built for the people who run the week",
        cards: cards.slice(0, 2),
    },
}

export const FourUp: Story = {
    args: {
        variant: "4up",
        kicker: "Use cases",
        title: "Built for the people who run the week",
        cards,
    },
}

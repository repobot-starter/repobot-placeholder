import type { Meta, StoryObj } from "@storybook/react"
import { MarketingPage } from "./MarketingPage"
import { MarketingTeam } from "./MarketingTeam"

const meta: Meta<typeof MarketingTeam> = {
    title: "Marketing/Team",
    component: MarketingTeam,
    decorators: [
        (Story) => (
            <MarketingPage preset="soft-saas">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingTeam>

const members = [
    {
        media: { kind: "emoji", emoji: "👩‍💻" } as const,
        name: "Mara Lindqvist",
        role: "Co-founder & CEO",
        bio: "Ran platform engineering at a 400-person company and got tired of watching Tuesdays disappear.",
    },
    {
        media: { kind: "emoji", emoji: "👨‍🔬" } as const,
        name: "Dev Okafor",
        role: "Co-founder & CTO",
        bio: "Previously built calendar infrastructure used by two of the tools Sundial now replaces.",
    },
    {
        media: { kind: "emoji", emoji: "🎨" } as const,
        name: "June Park",
        role: "Head of design",
        bio: "Believes a calendar should be read like a map, not a spreadsheet.",
    },
    {
        media: { kind: "emoji", emoji: "📣" } as const,
        name: "Tomás Rivera",
        role: "Head of customer teams",
        bio: "Has personally helped 200 teams kill their least useful standing meeting.",
    },
]

export const Grid: Story = {
    args: {
        variant: "grid",
        kicker: "The team",
        title: "Small on purpose",
        members,
    },
}

export const List: Story = {
    args: {
        variant: "list",
        kicker: "The team",
        title: "Small on purpose",
        members,
    },
}

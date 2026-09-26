import type { Meta, StoryObj } from "@storybook/react"
import { MarketingLogos } from "./MarketingLogos"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingLogos> = {
    title: "Marketing/Logos",
    component: MarketingLogos,
    decorators: [
        (Story) => (
            <MarketingPage preset="soft-saas">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingLogos>

const logos = [
    { name: "Northwind", media: { kind: "emoji", emoji: "🧭" } as const },
    { name: "Fogline" },
    { name: "Basalt", media: { kind: "emoji", emoji: "🪨" } as const },
    { name: "Meridian Labs" },
    { name: "Quayside" },
    { name: "Alder & Ash", media: { kind: "emoji", emoji: "🌳" } as const },
]

export const Strip: Story = {
    args: {
        variant: "strip",
        kicker: "Trusted by teams at",
        logos,
    },
}

export const Grid: Story = {
    args: {
        variant: "grid",
        kicker: "Trusted by teams at",
        logos,
    },
}

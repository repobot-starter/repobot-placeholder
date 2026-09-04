import type { Meta, StoryObj } from "@storybook/react"
import { MarketingPage } from "./MarketingPage"
import { MarketingRichProse } from "./MarketingRichProse"

const meta: Meta<typeof MarketingRichProse> = {
    title: "Marketing/RichProse",
    component: MarketingRichProse,
    decorators: [
        (Story) => (
            <MarketingPage preset="editorial">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingRichProse>

const paragraphs = [
    "We started the studio in 2019 with one conviction: most brands don't need more design, they need fewer decisions made better. A shelf full of logo options is not a brand. One right answer, argued for and committed to, is.",
    "That conviction shapes how we work. We take on six projects a year, never more than two at once, and we stay through launch. You get the two of us — no account layer, no handoff to a junior team you never met — from the first workshop to the day it ships.",
    "It also shapes what we say no to. We don't do trend work, we don't enter award schemes, and we won't redesign something that isn't broken. If your brand needs a steward more than a revolution, we'll tell you that in the first call, free of charge.",
    "The work that follows is slower than an agency sprint and better for it. Naming takes the time naming takes. We'd rather show you three routes we believe in than thirty we don't, and every deliverable arrives with the reasoning written down, so the thinking survives us.",
]

export const Narrow: Story = {
    args: {
        variant: "narrow",
        kicker: "About the studio",
        title: "Fewer decisions, made better",
        paragraphs,
    },
}

export const TwoColumn: Story = {
    args: {
        variant: "two-column",
        kicker: "About the studio",
        title: "Fewer decisions, made better",
        paragraphs,
    },
}

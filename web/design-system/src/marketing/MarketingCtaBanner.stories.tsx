import type { Meta, StoryObj } from "@storybook/react"
import { MarketingCtaBanner } from "./MarketingCtaBanner"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingCtaBanner> = {
    title: "Marketing/CtaBanner",
    component: MarketingCtaBanner,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingCtaBanner>

export const Card: Story = {
    args: {
        variant: "card",
        title: "See where your week really goes.",
        cta: { label: "Join the waitlist", anchor: "lead-form" },
    },
}

/** Edge-to-edge tinted band — the closing statement without card chrome. */
export const FullBleed: Story = {
    args: {
        variant: "full-bleed",
        title: "Planning a portrait or a commission?",
        cta: { label: "Start an inquiry", href: "https://example.com/inquire" },
    },
}

export const WithBody: Story = {
    args: {
        variant: "card",
        title: "Ready when you are.",
        body: "Set up takes two minutes and the first time map arrives within a day.",
        cta: { label: "Get started", href: "https://example.com/signup" },
    },
}

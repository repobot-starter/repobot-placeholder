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

/** A boxed newspaper classified: tab, headline, price between rules, fine print, and a signed box. */
export const Classified: Story = {
    args: {
        variant: "classified",
        kicker: "Classifieds",
        title: "Now booking spring",
        price: "Full day from $2,400",
        body: "Two shooters, every frame edited, a gallery inside three weeks.",
        cta: { label: "Place your order", href: "https://example.com/inquire" },
        finePrint: "Deposit holds the date. Travel within the city included.",
        signoff: { name: "Ask for Mo", note: "Replies within a day" },
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="tabloid">
                <Story />
            </MarketingPage>
        ),
    ],
}

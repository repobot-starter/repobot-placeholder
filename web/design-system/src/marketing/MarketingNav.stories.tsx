import type { Meta, StoryObj } from "@storybook/react"
import { MarketingNav } from "./MarketingNav"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingNav> = {
    title: "Marketing/Nav",
    component: MarketingNav,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingNav>

const logo = { emoji: "☀️", name: "Sundial" }

export const Inline: Story = {
    args: {
        variant: "inline",
        logo,
        links: [
            { label: "Features", anchor: "feature-grid" },
            { label: "Pricing", anchor: "pricing" },
            { label: "FAQ", anchor: "faq" },
        ],
        cta: { label: "Join the waitlist", anchor: "lead-form" },
    },
}

export const Minimal: Story = {
    args: {
        variant: "minimal",
        logo,
        cta: { label: "Get in touch", href: "mailto:hello@example.com" },
    },
}

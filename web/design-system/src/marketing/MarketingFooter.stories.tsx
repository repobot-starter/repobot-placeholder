import type { Meta, StoryObj } from "@storybook/react"
import { MarketingFooter } from "./MarketingFooter"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingFooter> = {
    title: "Marketing/Footer",
    component: MarketingFooter,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingFooter>

export const SingleRow: Story = {
    args: {
        variant: "single-row",
        blurb: "Built by three ex-calendar-admins who have seen things.",
        links: [
            { label: "Manifesto", href: "https://example.com/manifesto" },
            { label: "Contact", href: "mailto:hello@example.com" },
        ],
        note: "· Made with Sundial",
    },
}

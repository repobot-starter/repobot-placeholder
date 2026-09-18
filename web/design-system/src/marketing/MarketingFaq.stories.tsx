import type { Meta, StoryObj } from "@storybook/react"
import { MarketingFaq } from "./MarketingFaq"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingFaq> = {
    title: "Marketing/Faq",
    component: MarketingFaq,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingFaq>

export const Accordion: Story = {
    args: {
        variant: "accordion",
        kicker: "FAQ",
        title: "Fair questions",
        items: [
            {
                question: "Do you read the contents of my meetings?",
                answer: "No. Only event metadata — times, attendees, and recurrence.",
            },
            {
                question: "Will it start declining meetings on its own?",
                answer: "Never by default. Every automatic action is logged and reversible.",
            },
            {
                question: "Can I cancel anytime?",
                answer: "Yes — one click, and exports stay available for 30 days.",
            },
        ],
    },
}

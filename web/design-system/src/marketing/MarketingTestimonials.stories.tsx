import type { Meta, StoryObj } from "@storybook/react"
import { MarketingPage } from "./MarketingPage"
import { MarketingTestimonials } from "./MarketingTestimonials"

const meta: Meta<typeof MarketingTestimonials> = {
    title: "Marketing/Testimonials",
    component: MarketingTestimonials,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingTestimonials>

/** One voice, given the whole room — features the first quote. */
export const SingleFeatured: Story = {
    args: {
        variant: "single-featured",
        kicker: "Kind words",
        quotes: [
            {
                quote: "She made a photograph of my mother I will keep for the rest of my life.",
                author: "Elena Marsh",
                title: "Family portrait, 2025",
            },
        ],
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="atelier">
                <Story />
            </MarketingPage>
        ),
    ],
}

export const QuoteGrid: Story = {
    args: {
        variant: "quote-grid",
        kicker: "Testimonials",
        title: "Teams that got their week back",
        quotes: [
            {
                quote: "We killed four recurring meetings in the first month. Nobody misses them, and nobody had to be the villain.",
                author: "Maya Okafor",
                title: "VP Engineering, Northwind",
            },
            {
                quote: "The time map was the first calendar view my leadership team actually argued about. That's a compliment.",
                author: "Jonas Lindqvist",
                title: "COO, Fogline",
            },
            {
                quote: "Sundial declined a meeting for me and the requester thanked me for the alternative slot. Witchcraft.",
                author: "Priya Raman",
                title: "Staff Engineer, Basalt",
            },
        ],
    },
}

import type { Meta, StoryObj } from "@storybook/react"
import { MarketingBlogList } from "./MarketingBlogList"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingBlogList> = {
    title: "Marketing/BlogList",
    component: MarketingBlogList,
    decorators: [
        (Story) => (
            <MarketingPage preset="editorial">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingBlogList>

const posts = [
    {
        title: "The meeting that survived four reorgs",
        date: "Jun 2026",
        excerpt:
            "A forensic look at one standing meeting nobody remembered scheduling — and the framework for finding yours.",
        href: "#",
        media: { kind: "emoji", emoji: "🧟" } as const,
    },
    {
        title: "Why 25-minute meetings don't work",
        date: "May 2026",
        excerpt:
            "Shaving five minutes off every meeting sounds like a win. The data says the gaps are too small to use.",
        href: "#",
        media: { kind: "emoji", emoji: "⏱️" } as const,
    },
    {
        title: "No-meeting Wednesday, six months in",
        date: "Apr 2026",
        excerpt:
            "What 40 teams learned when they actually enforced it — including the two that gave it up, and why.",
        href: "#",
        media: { kind: "emoji", emoji: "🗓️" } as const,
    },
]

export const Cards: Story = {
    args: {
        variant: "cards",
        kicker: "From the blog",
        title: "Notes on how teams spend time",
        posts,
    },
}

export const List: Story = {
    args: {
        variant: "list",
        kicker: "From the blog",
        title: "Notes on how teams spend time",
        posts,
    },
}

import type { Meta, StoryObj } from "@storybook/react"
import { MarketingPage } from "./MarketingPage"
import { MarketingSteps } from "./MarketingSteps"

const meta: Meta<typeof MarketingSteps> = {
    title: "Marketing/Steps",
    component: MarketingSteps,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingSteps>

const steps = [
    {
        title: "Connect your calendar",
        description: "Read-only at first. Sundial never moves anything without asking.",
    },
    {
        title: "See the real picture",
        description: "Within a day you get the time map and every meeting's true cost.",
    },
    {
        title: "Reclaim your week",
        description: "Accept a suggestion, watch the hours come back.",
    },
]

export const NumberedCards: Story = {
    args: {
        variant: "numbered-cards",
        kicker: "How it works",
        title: "Three steps, one honest week",
        steps,
    },
}

export const Timeline: Story = {
    args: {
        variant: "timeline",
        kicker: "How it works",
        title: "Three steps, one honest week",
        steps,
    },
}

const buildLog = [
    {
        label: "Mar",
        title: "Survey & geotech",
        description: "Bluff setbacks staked, soils bored.",
        seed: "survey",
    },
    {
        label: "Jun",
        title: "Foundation",
        description: "Helical piers below the slide plane.",
        seed: "foundation",
    },
    {
        label: "Oct",
        title: "Timber frame",
        description: "Douglas fir, pegged and raised in two days.",
        seed: "frame",
    },
    {
        label: "Feb",
        title: "Glass & envelope",
        description: "Storm-rated glazing, rainscreen cedar.",
        seed: "glass",
    },
    { label: "May", title: "Keys", description: "Walkthrough, punch list, the first fire.", seed: "keys" },
].map(({ seed, ...step }) => ({
    ...step,
    media: {
        kind: "image" as const,
        src: `https://picsum.photos/seed/rail-${seed}/1024/768`,
        alt: step.title,
        width: 1024,
        height: 768,
    },
}))

/**
 * The build log: photo cards on one hairline, each hung from its month.
 * Narrow the viewport to see the scroll-snapped strip.
 */
export const HorizontalRail: Story = {
    args: {
        variant: "horizontal-rail",
        kicker: "The build log",
        title: "Twenty-six months, one house.",
        steps: buildLog,
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="tideline">
                <Story />
            </MarketingPage>
        ),
    ],
}

/** Without labels or media the rail still reads: numbered marks, text only. */
export const HorizontalRailPlain: Story = {
    args: {
        variant: "horizontal-rail",
        kicker: "How it works",
        title: "Three steps, one honest week",
        steps,
    },
}

/**
 * The first ninety days under `boreal` + `frost`: labeled steps on one
 * quiet track, the last node in peach. Narrow the viewport to see the
 * track turn vertical.
 */
export const FirstNinetyDays: Story = {
    args: {
        variant: "horizontal-rail",
        kicker: "Your first 90 days",
        title: "Five appointments, one plan that fits.",
        steps: [
            {
                label: "Day 1",
                title: "A 60-minute evaluation",
                description: "Your story, then what we think is going on.",
            },
            {
                label: "Week 2",
                title: "Your plan, in writing",
                description: "What we suggest, why, and what to expect.",
            },
            {
                label: "Week 4",
                title: "First check-in",
                description: "Sleep, mood, side effects, a first adjustment.",
            },
            {
                label: "Week 8",
                title: "Adjust together",
                description: "The next step decided with you, not for you.",
            },
            {
                label: "Day 90",
                title: "Review: what's working",
                description: "A look back, and the pace of visits from here.",
            },
        ],
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="boreal">
                <Story />
            </MarketingPage>
        ),
    ],
}

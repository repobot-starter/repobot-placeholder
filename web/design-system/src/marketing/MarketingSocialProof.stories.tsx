import type { Meta, StoryObj } from "@storybook/react"
import { MarketingPage } from "./MarketingPage"
import { MarketingSocialProof } from "./MarketingSocialProof"

const meta: Meta<typeof MarketingSocialProof> = {
    title: "Marketing/SocialProof",
    component: MarketingSocialProof,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingSocialProof>

export const TextLogos: Story = {
    args: {
        variant: "text-logos",
        items: ["Northwind", "Fogline", "Basalt", "Meridian Labs", "Pocketworks"],
    },
}

export const WithLabel: Story = {
    args: {
        variant: "text-logos",
        label: "Trusted by teams at",
        items: ["Northwind", "Fogline", "Basalt", "Meridian Labs"],
    },
}

/**
 * The name strip on a continuous scroll behind edge-fade masks. Hover
 * pauses it; reduced-motion falls back to a static centered wrap.
 */
export const Marquee: Story = {
    args: {
        variant: "marquee",
        label: "Trusted by finance teams at",
        items: [
            "Northwind",
            "Fogline",
            "Basalt",
            "Meridian Labs",
            "Pocketworks",
            "Halyard",
            "Coppermine",
            "Statice",
        ],
    },
}

export const MetricsRow: Story = {
    args: {
        variant: "metrics-row",
        metrics: [
            { value: "1,200+", label: "jobs completed" },
            { value: "4.9★", label: "average rating" },
            { value: "18 yrs", label: "in business" },
            { value: "24 hr", label: "callback promise" },
        ],
    },
}

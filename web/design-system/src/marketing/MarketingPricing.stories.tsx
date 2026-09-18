import type { Meta, StoryObj } from "@storybook/react"
import { MarketingPage } from "./MarketingPage"
import { MarketingPricing } from "./MarketingPricing"

const meta: Meta<typeof MarketingPricing> = {
    title: "Marketing/Pricing",
    component: MarketingPricing,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingPricing>

export const Tiers: Story = {
    args: {
        variant: "tiers",
        kicker: "Pricing",
        title: "Pay for the hours you get back",
        tiers: [
            {
                name: "Solo",
                monthly: 0,
                yearlyPerMonth: 0,
                description: "Your own calendar, mapped.",
                features: ["Time map", "Weekly digest", "One calendar"],
            },
            {
                name: "Pro",
                monthly: 12,
                yearlyPerMonth: 10,
                description: "For people who run their own week.",
                features: ["Everything in Solo", "Meeting scorecards", "Focus guardrails"],
                highlighted: true,
                badge: "Most popular",
            },
            {
                name: "Team",
                monthly: 49,
                yearlyPerMonth: 41,
                description: "Agreements and analytics for the whole team.",
                features: ["Everything in Pro", "Team agreements", "Org-wide analytics"],
            },
        ],
    },
}

/** One-off service packages: `period: ""` drops the "/mo" suffix, and equal
 * monthly/yearly prices drop the billing toggle — flat prices, plainly. */
export const ServicePackages: Story = {
    args: {
        variant: "tiers",
        kicker: "Packages",
        title: "Three ways to work together",
        period: "",
        tiers: [
            {
                name: "The elopement",
                monthly: 2400,
                yearlyPerMonth: 2400,
                description: "Two people, an officiant, and somewhere that matters.",
                features: ["Three hours of coverage", "Permit and timing help", "Gallery in two weeks"],
            },
            {
                name: "The wedding day",
                monthly: 5200,
                yearlyPerMonth: 5200,
                description: "Eight hours, getting ready through the dance floor.",
                features: ["Two photographers", "Engagement session", "Gallery in three weeks"],
                highlighted: true,
                badge: "Most chosen",
            },
            {
                name: "The whole weekend",
                monthly: 7800,
                yearlyPerMonth: 7800,
                description: "Rehearsal dinner through morning-after brunch.",
                features: ["Two photographers throughout", "Heirloom album", "Priority date holds"],
            },
        ],
    },
}

export const FlatPricingNoToggle: Story = {
    args: {
        variant: "tiers",
        kicker: "Pricing",
        title: "One plan, no surprises",
        tiers: [
            {
                name: "Everything",
                monthly: 19,
                yearlyPerMonth: 19,
                description: "All features, every calendar, no tiers to compare.",
                features: ["Time map", "Scorecards", "Guardrails", "Priority support"],
                highlighted: true,
            },
        ],
    },
}

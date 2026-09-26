import type { Meta, StoryObj } from "@storybook/react"
import { MarketingLeadForm } from "./MarketingLeadForm"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingLeadForm> = {
    title: "Marketing/LeadForm",
    component: MarketingLeadForm,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingLeadForm>

const content = {
    kicker: "Waitlist",
    title: "Be first in line",
    placeholder: "you@company.com",
    cta: "Join the waitlist",
    confirmation: "You're on the list — watch your inbox for the next cohort.",
}

export const InlineEmail: Story = {
    args: { variant: "inline-email", ...content, joined: false, onSubmit: () => {} },
}

export const Confirmed: Story = {
    args: { variant: "inline-email", ...content, joined: true, onSubmit: () => {} },
}

export const ContactBlock: Story = {
    args: {
        variant: "contact-block",
        kicker: "Contact",
        title: "Come say hello",
        body: "We're at the harbor end of Skólavörðustígur, seven days a week.",
        channels: [
            { label: "Email", value: "hello@studio.example", href: "mailto:hello@studio.example" },
            { label: "Phone", value: "+354 555 0192", href: "tel:+3545550192" },
            { label: "Studio", value: "Skólavörðustígur 12, Reykjavik" },
            { label: "Instagram", value: "@ateliernorth", href: "https://instagram.com" },
        ],
        joined: false,
        onSubmit: () => {},
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="warm-boutique">
                <Story />
            </MarketingPage>
        ),
    ],
}

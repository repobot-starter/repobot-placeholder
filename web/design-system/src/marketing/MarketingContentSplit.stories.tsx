import type { Meta, StoryObj } from "@storybook/react"
import { MarketingContentSplit } from "./MarketingContentSplit"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingContentSplit> = {
    title: "Marketing/ContentSplit",
    component: MarketingContentSplit,
    decorators: [
        (Story) => (
            <MarketingPage preset="soft-saas">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingContentSplit>

const content = {
    kicker: "Why it works",
    headline: "Your calendar already knows the answer",
    body: "Sundial doesn't ask your team to change how it works. It reads the calendar you already have, finds the patterns that cost you focus, and proposes the smallest change that fixes each one.",
    bullets: [
        "Connects to Google Calendar or Outlook in under a minute",
        "No new rituals — suggestions arrive in the tools you already use",
        "Every change is reversible with one click",
    ],
    cta: { label: "Start the free trial", anchor: "lead-form" },
    media: { kind: "emoji", emoji: "🧭" } as const,
}

export const MediaRight: Story = {
    args: {
        variant: "media-right",
        ...content,
    },
}

export const MediaLeft: Story = {
    args: {
        variant: "media-left",
        ...content,
    },
}

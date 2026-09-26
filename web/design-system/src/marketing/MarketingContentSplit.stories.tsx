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

/**
 * The `report` spread under `colophon` + `marginalia`: the title centered
 * over a sample page on paper (stamped, undated), the bullets as numbered
 * margin notes led in by hairlines.
 */
export const AnnotatedReport: Story = {
    args: {
        variant: "report",
        kicker: "The report",
        headline: "A language-first way to see strengths and needs.",
        body: "Every report is individual. This sample shows our structure and tone — no real patient, no real scores.",
        bullets: [
            "Summary of findings — a plain-language overview of what the evaluation shows.",
            "Domain summaries — each area tested, with the key result and a short note.",
            "Recommendations — specific, practical steps for school, home, and work.",
            "Scores, with context — interpreted so they inform rather than define.",
        ],
        report: {
            label: "Report of assessment",
            issuer: "Cambridge Neuropsychology",
            title: "Summary of findings",
            location:
                "Strengths in verbal reasoning and visual problem-solving; attention and processing speed sit below age expectation.",
            rows: [
                { label: "Verbal reasoning", value: "A clear strength" },
                { label: "Working memory", value: "A relative weakness" },
                { label: "Sustained attention", value: "Below age expectation" },
            ],
            signature: { name: "Examiner: Ji-woo Seo, PhD" },
            stamp: "Sample",
        },
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="colophon">
                <Story />
            </MarketingPage>
        ),
    ],
}

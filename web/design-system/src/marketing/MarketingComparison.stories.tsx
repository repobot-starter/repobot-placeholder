import type { Meta, StoryObj } from "@storybook/react"
import { MarketingComparison } from "./MarketingComparison"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingComparison> = {
    title: "Marketing/Comparison",
    component: MarketingComparison,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingComparison>

const columns = ["", "Sundial", "Calendar analytics tools", "Doing it by hand"]

const rows = [
    { label: "Sees the whole team's week", values: [true, true, false] },
    { label: "Scores meetings by cost", values: [true, false, false] },
    { label: "Declines conflicts for you", values: [true, false, false] },
    { label: "Enforces team agreements", values: [true, false, true] },
    { label: "Setup time", values: ["Under a minute", "An afternoon", "Every Sunday night"] },
    { label: "Native mobile app", values: [false, true, true] },
]

export const Table: Story = {
    args: {
        variant: "table",
        kicker: "The honest comparison",
        title: "Why teams pick Sundial",
        columns,
        rows,
    },
}

export const Cards: Story = {
    args: {
        variant: "cards",
        kicker: "The honest comparison",
        title: "Why teams pick Sundial",
        columns: columns.slice(0, 3),
        rows: rows.map((row) => ({ ...row, values: row.values.slice(0, 2) })),
    },
}

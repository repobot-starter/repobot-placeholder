import type { Meta, StoryObj } from "@storybook/react"
import { ChartCard, type ChartSeries } from "./ChartCard"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]

const REVENUE: ChartSeries = {
    id: "revenue",
    label: "Revenue",
    points: MONTHS.map((month, index) => ({ x: month, y: 4200 + index * 900 + (index % 3) * 400 })),
}

const EXPENSES: ChartSeries = {
    id: "expenses",
    label: "Expenses",
    points: MONTHS.map((month, index) => ({ x: month, y: 3100 + index * 350 + (index % 2) * 500 })),
}

const meta: Meta<typeof ChartCard> = {
    title: "Components/ChartCard",
    component: ChartCard,
}
export default meta

type Story = StoryObj<typeof ChartCard>

const currency = (value: number): string => `$${value.toLocaleString()}`

export const Line: Story = {
    args: {
        kind: "line",
        title: "Revenue",
        description: "Monthly recurring revenue, year to date",
        series: [REVENUE, EXPENSES],
        valueFormatter: currency,
    },
}

export const Area: Story = {
    args: {
        kind: "area",
        title: "Active members",
        series: [
            {
                id: "members",
                label: "Members",
                points: MONTHS.map((month, index) => ({ x: month, y: 40 + index * 12 })),
            },
        ],
    },
}

export const StackedBars: Story = {
    args: {
        kind: "bar",
        title: "Orders by channel",
        series: [
            {
                id: "online",
                label: "Online",
                points: MONTHS.map((month, index) => ({ x: month, y: 120 + index * 14 })),
            },
            {
                id: "in-store",
                label: "In store",
                points: MONTHS.map((month, index) => ({ x: month, y: 80 + (index % 4) * 22 })),
            },
        ],
        stacked: true,
    },
}

// Donut with the value legend: label, amount, and share per segment.
export const DonutWithValues: Story = {
    args: {
        kind: "donut",
        title: "Spend by category",
        series: [
            {
                id: "categories",
                label: "Categories",
                points: [
                    { x: "Software", y: 48650 },
                    { x: "Marketing", y: 27350 },
                    { x: "Travel", y: 18420 },
                    { x: "Meals", y: 14200 },
                    { x: "Office", y: 9780 },
                ],
            },
        ],
        valueFormatter: currency,
        showLegend: true,
        legendValues: true,
        height: 220,
    },
}

export const Donut: Story = {
    args: {
        kind: "donut",
        title: "Plan mix",
        series: [
            {
                id: "plans",
                label: "Plans",
                points: [
                    { x: "Free", y: 412 },
                    { x: "Pro", y: 186 },
                    { x: "Team", y: 74 },
                    { x: "Enterprise", y: 12 },
                ],
            },
        ],
        height: 240,
    },
}

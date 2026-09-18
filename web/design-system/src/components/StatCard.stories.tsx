import type { Meta, StoryObj } from "@storybook/react"
import { StatCard, StatCardRow } from "./StatCard"

const meta: Meta<typeof StatCard> = {
    title: "Components/StatCard",
    component: StatCard,
}
export default meta

type Story = StoryObj<typeof StatCard>

export const Default: Story = {
    args: {
        label: "Monthly revenue",
        value: "$12,480",
        hint: "Last 30 days",
        delta: { value: "+8.2%", direction: "up" },
    },
}

export const NegativeDelta: Story = {
    args: {
        label: "Churn",
        value: "2.4%",
        hint: "Rolling 30 days",
        delta: { value: "+0.3pt", direction: "up", upIsPositive: false },
    },
}

// Colored top-border accents: the revenue/costs/profit KPI strip treatment.
export const Tones: Story = {
    render: () => (
        <StatCardRow>
            <StatCard label="Accrued revenue" value="$123,524" tone="danger" />
            <StatCard label="Accrued costs" value="$108,741" tone="info" />
            <StatCard label="Accrued profit" value="$14,783" hint="12.0% margin" tone="success" />
            <StatCard label="Open contracts" value="7" tone="accent" />
        </StatCardRow>
    ),
}

// The fintech-dashboard read: value, delta chip, and a trend sparkline.
export const WithTrend: Story = {
    render: () => (
        <StatCardRow>
            <StatCard
                label="Spend this month"
                value="$128,400"
                delta={{ value: "+12%", direction: "up", upIsPositive: false }}
                hint="vs last month"
                trend={[52, 61, 58, 74, 69, 88, 84, 97, 92, 110, 104, 128]}
            />
            <StatCard
                label="Budget remaining"
                value="$71,600"
                hint="56% of $200,000"
                trend={[180, 168, 161, 149, 140, 128, 117, 103, 96, 88, 79, 72]}
                tone="success"
            />
            <StatCard
                label="Pending approvals"
                value="23"
                delta={{ value: "+6", direction: "up", upIsPositive: false }}
                trend={[8, 12, 9, 14, 11, 17, 15, 21, 18, 25, 20, 23]}
                tone="warning"
            />
        </StatCardRow>
    ),
}

export const Row: Story = {
    render: () => (
        <StatCardRow>
            <StatCard
                label="Orders"
                value="1,208"
                hint="This month"
                delta={{ value: "+12%", direction: "up" }}
            />
            <StatCard
                label="Active members"
                value="86"
                hint="Signed in this week"
                delta={{ value: "-4", direction: "down" }}
            />
            <StatCard label="Open tickets" value="7" hint="Awaiting reply" />
            <StatCard
                label="Conversion"
                value="3.1%"
                hint="Visitors to sign-ups"
                delta={{ value: "0.0pt", direction: "flat" }}
            />
        </StatCardRow>
    ),
}

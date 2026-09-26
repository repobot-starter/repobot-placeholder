import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "../primitives/Button"
import { DetailPage } from "./DetailPage"
import { StatCard, StatCardRow } from "./StatCard"

const meta: Meta<typeof DetailPage> = {
    title: "Components/DetailPage",
    component: DetailPage,
}
export default meta

type Story = StoryObj<typeof DetailPage>

export const OrderDetail: Story = {
    args: {
        title: "Order #1042",
        subtitle: "Dana Reyes — Shanghai to Rotterdam",
        status: { label: "In transit", tone: "info" },
        onBack: () => {},
        backLabel: "Back to orders",
        actions: (
            <>
                <Button variant="secondary">Print</Button>
                <Button>Ship order</Button>
            </>
        ),
        meta: [
            { label: "Created", value: "Mar 4, 2026" },
            { label: "ETA", value: "Mar 28, 2026" },
            { label: "Total", value: "$12,840.00" },
        ],
        tabs: [
            {
                id: "overview",
                label: "Overview",
                content: (
                    <StatCardRow>
                        <StatCard label="Containers" value="3" />
                        <StatCard label="Weight" value="41.2t" />
                        <StatCard label="Days at sea" value="11" />
                    </StatCardRow>
                ),
            },
            { id: "documents", label: "Documents", content: <p>Filed invoices and packing lists.</p> },
            { id: "history", label: "History", content: <p>Status changes over time.</p> },
        ],
    },
}

export const WithoutTabs: Story = {
    args: {
        title: "Lane SHA-RTM",
        status: { label: "Active", tone: "success" },
        meta: [{ label: "Carrier", value: "Evergreen" }],
        children: <p>Un-tabbed detail body: pass children instead of tabs.</p>,
    },
}

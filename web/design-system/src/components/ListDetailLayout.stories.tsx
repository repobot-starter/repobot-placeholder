import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { Badge } from "../primitives/Badge"
import { ListDetailLayout } from "./ListDetailLayout"
import { SettingsGroup } from "./SettingsGroups"

interface DemoOrder {
    id: string
    customer: string
    total: string
    status: "Open" | "Shipped"
}

const ORDERS: DemoOrder[] = [
    { id: "#1042", customer: "Dana Reyes", total: "$84.00", status: "Open" },
    { id: "#1041", customer: "Morgan Lee", total: "$32.50", status: "Shipped" },
    { id: "#1040", customer: "Sam Ortiz", total: "$126.75", status: "Shipped" },
]

function Demo(): React.ReactElement {
    const [selectedId, setSelectedId] = useState<string | undefined>(ORDERS[0].id)
    const selected = ORDERS.find((order) => order.id === selectedId)
    return (
        <ListDetailLayout
            detailOpen={selected !== undefined}
            onBack={() => setSelectedId(undefined)}
            list={
                <div style={{ display: "grid", gap: 8 }}>
                    {ORDERS.map((order) => (
                        <button
                            key={order.id}
                            type="button"
                            onClick={() => setSelectedId(order.id)}
                            style={{
                                textAlign: "left",
                                padding: 12,
                                cursor: "pointer",
                                border: "1px solid transparent",
                                background: order.id === selectedId ? "rgba(31,111,235,0.1)" : "transparent",
                                borderRadius: 8,
                            }}
                        >
                            <strong>{order.id}</strong> — {order.customer}
                        </button>
                    ))}
                </div>
            }
            detail={
                selected ? (
                    <SettingsGroup title={`Order ${selected.id}`} description={selected.customer}>
                        <p style={{ margin: 0 }}>
                            Total {selected.total} <Badge tone="success">{selected.status}</Badge>
                        </p>
                    </SettingsGroup>
                ) : undefined
            }
            emptyDetail={{ title: "Select an order", description: "Details show up here." }}
        />
    )
}

const meta: Meta<typeof ListDetailLayout> = {
    title: "Components/ListDetailLayout",
    component: ListDetailLayout,
}
export default meta

type Story = StoryObj<typeof ListDetailLayout>

export const Default: Story = {
    render: () => <Demo />,
}

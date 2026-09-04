import type { Meta, StoryObj } from "@storybook/react"
import React, { useEffect, useState } from "react"
import { Button } from "../primitives/Button"
import { PageLoadingGate } from "./PageLoadingGate"
import { Skeleton } from "./Skeleton"

function Demo({ style }: { style: "gate" | "progressive" }): React.ReactElement {
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        if (!loading) return
        const timer = setTimeout(() => setLoading(false), 1500)
        return () => clearTimeout(timer)
    }, [loading])
    return (
        <div style={{ display: "grid", gap: 16 }}>
            <Button variant="secondary" onClick={() => setLoading(true)}>
                Reload
            </Button>
            <PageLoadingGate
                loading={loading}
                style={style}
                skeleton={
                    <div style={{ display: "grid", gap: 12 }}>
                        <Skeleton height={28} width="40%" />
                        <Skeleton height={96} />
                        <Skeleton height={96} />
                    </div>
                }
            >
                <h2 style={{ margin: 0 }}>Bookings</h2>
                <p>Everything appears at once when the data is ready.</p>
            </PageLoadingGate>
        </div>
    )
}

const meta: Meta<typeof PageLoadingGate> = {
    title: "Components/PageLoadingGate",
    component: PageLoadingGate,
}
export default meta

type Story = StoryObj<typeof PageLoadingGate>

export const Gate: Story = { render: () => <Demo style="gate" /> }
export const Progressive: Story = { render: () => <Demo style="progressive" /> }

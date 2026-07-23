import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Button } from "../primitives/Button"
import { ErrorBoundary, ErrorPanel } from "./ErrorBoundary"

const meta: Meta<typeof ErrorBoundary> = {
    title: "Components/ErrorBoundary",
    component: ErrorBoundary,
}
export default meta

type Story = StoryObj<typeof ErrorBoundary>

function Bomb(): React.ReactElement {
    const [exploded, setExploded] = React.useState(false)
    if (exploded) {
        throw new Error("Kaboom: a render error occurred.")
    }
    return <Button onClick={() => setExploded(true)}>Trigger render error</Button>
}

export const CatchesRenderErrors: Story = {
    render: () => (
        <ErrorBoundary>
            <Bomb />
        </ErrorBoundary>
    ),
}

export const ErrorPanelOnly: Story = {
    render: () => <ErrorPanel message="Network request failed with status 500." onRetry={() => {}} />,
}

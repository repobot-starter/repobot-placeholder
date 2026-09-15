import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "../primitives/Button"
import { ToastProvider, useToast } from "./Toast"

function Demo(): React.ReactElement {
    const toast = useToast()
    return (
        <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => toast.publish({ title: "Order saved", tone: "success" })}>
                Success toast
            </Button>
            <Button
                variant="secondary"
                onClick={() =>
                    toast.publish({
                        title: "Export started",
                        description: "You'll get an email when it's ready.",
                    })
                }
            >
                Neutral toast
            </Button>
            <Button
                variant="danger"
                onClick={() =>
                    toast.publish({
                        title: "Delete failed",
                        description: "The order is referenced by an open invoice.",
                        tone: "danger",
                    })
                }
            >
                Danger toast
            </Button>
        </div>
    )
}

const meta: Meta<typeof ToastProvider> = {
    title: "Components/Toast",
    component: ToastProvider,
}
export default meta

type Story = StoryObj<typeof ToastProvider>

export const Default: Story = {
    render: () => (
        <ToastProvider>
            <Demo />
        </ToastProvider>
    ),
}

import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "../primitives/Button"
import { GlobalErrors } from "./GlobalErrors"
import { publishGlobalError } from "./globalErrorStore"

function Demo(): React.ReactElement {
    return (
        <div style={{ display: "flex", gap: 8 }}>
            <Button
                variant="danger"
                onClick={() => publishGlobalError("Could not save the booking. Please try again.")}
            >
                Publish error
            </Button>
            <Button
                variant="secondary"
                onClick={() =>
                    publishGlobalError({
                        title: "Sync failed",
                        message: "The order list could not be refreshed.",
                        detail: 'POST /graphql 500\n{"errors":[{"message":"upstream timeout"}]}',
                    })
                }
            >
                Publish with detail
            </Button>
        </div>
    )
}

const meta: Meta<typeof GlobalErrors> = {
    title: "Components/GlobalErrors",
    component: GlobalErrors,
}
export default meta

type Story = StoryObj<typeof GlobalErrors>

// Errors stack: publish several, then page through them with prev/next.
export const Modal: Story = {
    render: () => (
        <>
            <Demo />
            <GlobalErrors presentation="modal" />
        </>
    ),
}

export const Corner: Story = {
    render: () => (
        <>
            <Demo />
            <GlobalErrors presentation="corner" />
        </>
    ),
}

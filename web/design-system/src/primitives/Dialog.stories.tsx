import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Button } from "./Button"
import { Dialog } from "./Dialog"

const meta: Meta<typeof Dialog> = {
    title: "Primitives/Dialog",
    component: Dialog,
}
export default meta

type Story = StoryObj<typeof Dialog>

export const Default: Story = {
    render: function DefaultStory() {
        const [open, setOpen] = React.useState(false)
        return (
            <>
                <Button onClick={() => setOpen(true)}>Open dialog</Button>
                <Dialog
                    open={open}
                    onOpenChange={setOpen}
                    title="Example dialog"
                    description="A short description of what this dialog does."
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setOpen(false)}>Confirm</Button>
                        </>
                    }
                >
                    <p style={{ margin: 0 }}>Dialog body content goes here.</p>
                </Dialog>
            </>
        )
    },
}

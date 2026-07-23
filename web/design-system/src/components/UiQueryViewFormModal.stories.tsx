import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { sampleSchemaFormPayload } from "../forms/sampleSchemaForm"
import { Button } from "../primitives/Button"
import { UiQueryViewFormModal } from "./UiQueryViewFormModal"

const meta: Meta<typeof UiQueryViewFormModal> = {
    title: "Components/UiQueryViewFormModal",
    component: UiQueryViewFormModal,
}
export default meta

type Story = StoryObj<typeof UiQueryViewFormModal>

export const CreateFlow: Story = {
    render: function CreateFlowStory() {
        const [open, setOpen] = React.useState(false)
        const [submitting, setSubmitting] = React.useState(false)
        return (
            <>
                <Button onClick={() => setOpen(true)}>Create User</Button>
                <UiQueryViewFormModal
                    open={open}
                    title="Create User"
                    schemaForm={sampleSchemaFormPayload}
                    submitting={submitting}
                    onSubmit={async () => {
                        setSubmitting(true)
                        await new Promise((resolve) => setTimeout(resolve, 800))
                        setSubmitting(false)
                        setOpen(false)
                    }}
                    onClose={() => setOpen(false)}
                />
            </>
        )
    },
}

export const SchemaLoading: Story = {
    args: {
        open: true,
        title: "Create User",
        loading: true,
        onSubmit: () => {},
        onClose: () => {},
    },
}

export const SchemaError: Story = {
    args: {
        open: true,
        title: "Create User",
        error: "userCreateFormSchema query failed.",
        onSubmit: () => {},
        onClose: () => {},
    },
}

export const SubmitError: Story = {
    args: {
        open: true,
        title: "Create User",
        schemaForm: sampleSchemaFormPayload,
        submitError: "A user with this email already exists.",
        onSubmit: () => {},
        onClose: () => {},
    },
}

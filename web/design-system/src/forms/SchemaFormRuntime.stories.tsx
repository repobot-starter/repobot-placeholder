import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Button } from "../primitives/Button"
import { parseSchemaForm } from "./parseSchemaForm"
import { sampleSchemaFormPayload } from "./sampleSchemaForm"
import { SchemaFormRuntime, type SchemaFormData } from "./SchemaFormRuntime"

const meta: Meta<typeof SchemaFormRuntime> = {
    title: "Forms/SchemaFormRuntime",
    component: SchemaFormRuntime,
}
export default meta

type Story = StoryObj<typeof SchemaFormRuntime>

export const SampleSchema: Story = {
    render: function SampleSchemaStory() {
        const parsed = React.useMemo(() => parseSchemaForm(sampleSchemaFormPayload), [])
        const [formData, setFormData] = React.useState<SchemaFormData>(parsed.defaultData)
        const [submitted, setSubmitted] = React.useState<SchemaFormData | null>(null)
        return (
            <div style={{ maxWidth: 420 }}>
                <SchemaFormRuntime
                    id="sample-schema-form"
                    schemaForm={parsed}
                    formData={formData}
                    onFormDataChange={setFormData}
                    onSubmit={setSubmitted}
                />
                <Button type="submit" form="sample-schema-form">
                    Submit
                </Button>
                {submitted ? <pre style={{ fontSize: 12 }}>{JSON.stringify(submitted, null, 2)}</pre> : null}
            </div>
        )
    },
}

export const Disabled: Story = {
    render: function DisabledStory() {
        const parsed = React.useMemo(() => parseSchemaForm(sampleSchemaFormPayload), [])
        return (
            <div style={{ maxWidth: 420 }}>
                <SchemaFormRuntime
                    schemaForm={parsed}
                    formData={parsed.defaultData}
                    onFormDataChange={() => {}}
                    disabled
                />
            </div>
        )
    },
}

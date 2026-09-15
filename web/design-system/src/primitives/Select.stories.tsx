import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Select } from "./Select"

const OPTIONS = [
    { value: "ACTIVE", label: "Active" },
    { value: "DISABLED", label: "Disabled" },
    { value: "ARCHIVED", label: "Archived", disabled: true },
]

const meta: Meta<typeof Select> = {
    title: "Primitives/Select",
    component: Select,
}
export default meta

type Story = StoryObj<typeof Select>

export const Default: Story = {
    render: function DefaultStory() {
        const [value, setValue] = React.useState<string | undefined>(undefined)
        return (
            <div style={{ width: 260 }}>
                <Select
                    value={value}
                    onValueChange={setValue}
                    options={OPTIONS}
                    placeholder="Pick a status"
                />
            </div>
        )
    },
}

export const Preselected: Story = {
    render: () => (
        <div style={{ width: 260 }}>
            <Select value="ACTIVE" options={OPTIONS} />
        </div>
    ),
}

export const Disabled: Story = {
    render: () => (
        <div style={{ width: 260 }}>
            <Select value="ACTIVE" options={OPTIONS} disabled />
        </div>
    ),
}

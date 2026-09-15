import type { Meta, StoryObj } from "@storybook/react"
import React, { useState } from "react"
import { Checkbox } from "./Checkbox"

const meta: Meta<typeof Checkbox> = {
    title: "Primitives/Checkbox",
    component: Checkbox,
}
export default meta

type Story = StoryObj<typeof Checkbox>

function Controlled(props: Partial<React.ComponentProps<typeof Checkbox>>): React.ReactElement {
    const [checked, setChecked] = useState(props.checked ?? false)
    return <Checkbox label="Email me updates" {...props} checked={checked} onCheckedChange={setChecked} />
}

export const Default: Story = { render: () => <Controlled /> }
export const Checked: Story = { render: () => <Controlled checked /> }
export const WithDescription: Story = {
    render: () => <Controlled description="A Monday summary of everything that changed." />,
}
export const Invalid: Story = { render: () => <Controlled invalid /> }
export const Disabled: Story = { render: () => <Controlled disabled checked /> }

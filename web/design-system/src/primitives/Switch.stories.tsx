import type { Meta, StoryObj } from "@storybook/react"
import React, { useState } from "react"
import { Switch } from "./Switch"

const meta: Meta<typeof Switch> = {
    title: "Primitives/Switch",
    component: Switch,
}
export default meta

type Story = StoryObj<typeof Switch>

function Controlled(props: Partial<React.ComponentProps<typeof Switch>>): React.ReactElement {
    const [checked, setChecked] = useState(props.checked ?? false)
    return <Switch label="Beta features" {...props} checked={checked} onCheckedChange={setChecked} />
}

export const Default: Story = { render: () => <Controlled /> }
export const On: Story = { render: () => <Controlled checked /> }
export const Disabled: Story = { render: () => <Controlled disabled /> }

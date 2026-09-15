import type { Meta, StoryObj } from "@storybook/react"
import React, { useState } from "react"
import { RadioGroup } from "./RadioGroup"

const meta: Meta<typeof RadioGroup> = {
    title: "Primitives/RadioGroup",
    component: RadioGroup,
}
export default meta

type Story = StoryObj<typeof RadioGroup>

const options = [
    { value: "starter", label: "Starter", description: "For trying things out." },
    { value: "growth", label: "Growth", description: "For growing teams." },
    { value: "scale", label: "Scale", description: "For serious volume." },
]

function Controlled(props: Partial<React.ComponentProps<typeof RadioGroup>>): React.ReactElement {
    const [value, setValue] = useState<string | undefined>("growth")
    return <RadioGroup options={options} {...props} value={value} onValueChange={setValue} />
}

export const Default: Story = { render: () => <Controlled /> }
export const Horizontal: Story = {
    render: () => (
        <Controlled
            orientation="horizontal"
            options={options.map(({ value, label }) => ({ value, label }))}
        />
    ),
}
export const Invalid: Story = { render: () => <Controlled invalid /> }
export const Disabled: Story = { render: () => <Controlled disabled /> }

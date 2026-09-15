import type { Meta, StoryObj } from "@storybook/react"
import { Input } from "./Input"

const meta: Meta<typeof Input> = {
    title: "Primitives/Input",
    component: Input,
    args: { placeholder: "Type something..." },
}
export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {}
export const Invalid: Story = { args: { invalid: true, defaultValue: "bad value" } }
export const Disabled: Story = { args: { disabled: true, defaultValue: "Disabled" } }

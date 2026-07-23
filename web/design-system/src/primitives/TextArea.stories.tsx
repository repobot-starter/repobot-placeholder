import type { Meta, StoryObj } from "@storybook/react"
import { TextArea } from "./TextArea"

const meta: Meta<typeof TextArea> = {
    title: "Primitives/TextArea",
    component: TextArea,
    args: { placeholder: "Longer text goes here..." },
}
export default meta

type Story = StoryObj<typeof TextArea>

export const Default: Story = {}
export const Invalid: Story = { args: { invalid: true } }
export const Disabled: Story = { args: { disabled: true } }

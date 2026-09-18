import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "./Button"
import { DropdownMenu } from "./DropdownMenu"

const meta: Meta<typeof DropdownMenu> = {
    title: "Primitives/DropdownMenu",
    component: DropdownMenu,
}
export default meta

type Story = StoryObj<typeof DropdownMenu>

export const Default: Story = {
    render: () => (
        <DropdownMenu
            trigger={<Button variant="secondary">Actions</Button>}
            items={[
                { id: "edit", label: "Edit", onSelect: () => {} },
                { id: "duplicate", label: "Duplicate", onSelect: () => {} },
                { id: "archive", label: "Archive", danger: true, onSelect: () => {} },
            ]}
        />
    ),
}

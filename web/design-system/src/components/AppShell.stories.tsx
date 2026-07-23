import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "../primitives/Button"
import { AppShell } from "./AppShell"

const meta: Meta<typeof AppShell> = {
    title: "Components/AppShell",
    component: AppShell,
    parameters: { layout: "fullscreen" },
}
export default meta

type Story = StoryObj<typeof AppShell>

export const Default: Story = {
    render: () => (
        <AppShell
            title="Base App"
            navItems={[
                { id: "projects", label: "Projects", active: true, onSelect: () => {} },
                { id: "users", label: "Users", onSelect: () => {} },
            ]}
            userSlot={
                <>
                    <span>dev@local.test</span>
                    <Button variant="secondary" size="sm">
                        Sign out
                    </Button>
                </>
            }
        >
            <h1 style={{ marginTop: 0 }}>Page content</h1>
            <p>Main content renders here.</p>
        </AppShell>
    ),
}

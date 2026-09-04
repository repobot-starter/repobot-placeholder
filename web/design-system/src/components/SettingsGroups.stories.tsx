import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "../primitives/Button"
import { Input } from "../primitives/Input"
import { Select } from "../primitives/Select"
import { SettingsGroup, SettingsGroups, SettingsRow } from "./SettingsGroups"

const meta: Meta<typeof SettingsGroups> = {
    title: "Components/SettingsGroups",
    component: SettingsGroups,
}
export default meta

type Story = StoryObj<typeof SettingsGroups>

export const Default: Story = {
    render: () => (
        <SettingsGroups>
            <SettingsGroup
                title="Profile"
                description="How you appear to the rest of the workspace."
                footer={<Button size="sm">Save changes</Button>}
            >
                <SettingsRow label="Display name" htmlFor="settings-name">
                    <Input id="settings-name" defaultValue="Dana Reyes" />
                </SettingsRow>
                <SettingsRow
                    label="Email"
                    description="Sign-in codes and notifications go here."
                    htmlFor="settings-email"
                >
                    <Input id="settings-email" type="email" defaultValue="dana@example.com" />
                </SettingsRow>
            </SettingsGroup>
            <SettingsGroup title="Preferences">
                <SettingsRow label="Weekly digest" description="A summary email every Monday.">
                    <Select
                        value="on"
                        onValueChange={() => {}}
                        options={[
                            { value: "on", label: "On" },
                            { value: "off", label: "Off" },
                        ]}
                    />
                </SettingsRow>
            </SettingsGroup>
            <SettingsGroup title="Danger zone" description="These actions can't be undone." danger>
                <SettingsRow label="Delete account" description="Removes your data permanently.">
                    <Button variant="danger" size="sm">
                        Delete account
                    </Button>
                </SettingsRow>
            </SettingsGroup>
        </SettingsGroups>
    ),
}

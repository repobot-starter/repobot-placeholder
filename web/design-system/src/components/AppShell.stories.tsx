import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { AppShell, type AppShellNavSection } from "./AppShell"

const meta: Meta<typeof AppShell> = {
    title: "Components/AppShell",
    component: AppShell,
    parameters: { layout: "fullscreen" },
}
export default meta

type Story = StoryObj<typeof AppShell>

function Icon({ d }: { d: string }): React.ReactElement {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
                d={d}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

const folderIcon = <Icon d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
const usersIcon = <Icon d="M16 21v-2a4 4 0 0 0-8 0v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
const settingsIcon = (
    <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19 12a7 7 0 0 1-.1 1.2l2 1.6-2 3.4-2.4-1a7 7 0 0 1-2 1.2L14 21h-4l-.5-2.6a7 7 0 0 1-2-1.2l-2.4 1-2-3.4 2-1.6A7 7 0 0 1 5 12a7 7 0 0 1 .1-1.2l-2-1.6 2-3.4 2.4 1a7 7 0 0 1 2-1.2L10 3h4l.5 2.6a7 7 0 0 1 2 1.2l2.4-1 2 3.4-2 1.6A7 7 0 0 1 19 12" />
)
const chartIcon = <Icon d="M4 20V10 M10 20V4 M16 20v-7 M22 20H2" />

const basicSections: AppShellNavSection[] = [
    {
        id: "workspace",
        items: [
            { id: "/projects", label: "Projects", icon: folderIcon, badgeText: "3" },
            { id: "/users", label: "Users", icon: usersIcon },
        ],
    },
    {
        id: "insights",
        title: "Insights",
        items: [
            { id: "/reports", label: "Reports", icon: chartIcon },
            {
                id: "/settings",
                label: "Settings",
                icon: settingsIcon,
                children: [
                    { id: "/settings/general", label: "General" },
                    { id: "/settings/integrations", label: "Integrations", badgeText: "New" },
                ],
            },
        ],
    },
]

const hotkeyLabels = { "/projects": "⌘⇧P", "/users": "⌘⇧U" }

function DemoShell({
    layout,
    contentMode,
    collapsed,
    drillUp,
    initialActiveId = "/projects",
}: {
    layout?:
        "sidebar" | "top-nav" | "minimal" | "sidebar-inset" | "sidebar-topbar" | "sidebar-only" | "logo-rail"
    contentMode?: "full" | "centered" | "flush"
    collapsed?: boolean
    drillUp?: boolean
    initialActiveId?: string
}): React.ReactElement {
    const [activeItemId, setActiveItemId] = React.useState(initialActiveId)
    return (
        <AppShell
            layout={layout}
            contentMode={contentMode}
            title="Base App"
            sections={basicSections}
            activeItemId={activeItemId}
            onItemSelect={(item) => setActiveItemId(item.id)}
            collapsed={collapsed}
            hotkeyLabelByItemId={hotkeyLabels}
            drillUp={drillUp ? { label: "All projects", onSelect: () => {} } : undefined}
            profile={{
                label: "Dev User",
                sublabel: "dev@local.test",
                items: [{ id: "settings", label: "Account settings", onSelect: () => {} }],
                onSignOut: () => {},
            }}
        >
            <h1 style={{ marginTop: 0 }}>Page content</h1>
            <p>Main content renders here. Active item: {activeItemId}</p>
        </AppShell>
    )
}

export const Default: Story = {
    render: () => <DemoShell />,
}

export const Collapsed: Story = {
    render: () => <DemoShell collapsed />,
}

export const ExpandedChildren: Story = {
    render: () => <DemoShell initialActiveId="/settings/integrations" />,
}

export const WithDrillUp: Story = {
    render: () => <DemoShell drillUp />,
}

export const TopNavLayout: Story = {
    render: () => <DemoShell layout="top-nav" />,
}

export const MinimalLayout: Story = {
    render: () => <DemoShell layout="minimal" />,
}

export const SidebarInset: Story = {
    render: () => <DemoShell layout="sidebar-inset" />,
}

export const SidebarInsetCollapsed: Story = {
    render: () => <DemoShell layout="sidebar-inset" collapsed />,
}

export const SidebarTopbar: Story = {
    render: () => <DemoShell layout="sidebar-topbar" />,
}

export const SidebarOnly: Story = {
    render: () => <DemoShell layout="sidebar-only" />,
}

export const LogoRail: Story = {
    render: () => <DemoShell layout="logo-rail" />,
}

export const LogoRailCollapsed: Story = {
    render: () => <DemoShell layout="logo-rail" collapsed />,
}

export const CenteredContent: Story = {
    render: () => <DemoShell contentMode="centered" />,
}

export const FlushContent: Story = {
    render: () => <DemoShell layout="sidebar-only" contentMode="flush" />,
}

export const NoProfile: Story = {
    render: () => (
        <AppShell
            title="Base App"
            sections={[basicSections[0]]}
            activeItemId="/users"
            onItemSelect={() => {}}
        >
            <h1 style={{ marginTop: 0 }}>Page content</h1>
        </AppShell>
    ),
}

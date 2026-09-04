import type { Meta, StoryObj } from "@storybook/react"
import { AuthCard } from "./AuthCard"
import { AuthShell } from "./AuthShell"
import { StatCard } from "./StatCard"

const meta: Meta<typeof AuthShell> = {
    title: "Components/AuthShell",
    component: AuthShell,
    parameters: { layout: "fullscreen" },
}
export default meta

type Story = StoryObj<typeof AuthShell>

function DemoBrand(): React.ReactElement {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "#1f6feb",
                    color: "#fff",
                    fontWeight: 800,
                }}
            >
                A
            </span>
            Acme
        </span>
    )
}

export const Default: Story = {
    render: () => (
        <AuthShell
            brand={<DemoBrand />}
            headline="Everything your team ships, in one place."
            subheadline="Track projects, invite your team, and see progress at a glance."
            highlights={[
                "Free while you evaluate — no card required",
                "Invite unlimited teammates",
                "Your data stays in your own database",
            ]}
            panelFooter={<span>Trusted by teams at Harbor Lane, Sugarline, and Northwind.</span>}
        >
            <AuthCard
                appName="Acme"
                brand={null}
                methods={["email-code", "password"]}
                sandbox
                onSendCode={async () => "Storybook — no email sent."}
            />
        </AuthShell>
    ),
}

// Real components as panel art: a live StatCard fragment plus a customer
// quote — always theme-correct, never a stale screenshot.
export const WithPanelSlot: Story = {
    render: () => (
        <AuthShell
            brand={<DemoBrand />}
            headline="Every dollar, accounted for."
            subheadline="Real-time visibility and control over team spend."
            panelSlot={
                <StatCard
                    label="Spend this month"
                    value="$128,400"
                    delta={{ value: "+12%", direction: "up", upIsPositive: false }}
                    hint="vs last month"
                    trend={[52, 61, 58, 74, 69, 88, 84, 97, 92, 110, 104, 128]}
                />
            }
            panelFooter={
                <span>
                    “Outlay gives us complete visibility without slowing the team down.” — Mara Chen, VP
                    Finance
                </span>
            }
        >
            <AuthCard
                appName="Acme"
                brand={null}
                methods={["email-code", "password"]}
                sandbox
                onSendCode={async () => "Storybook — no email sent."}
            />
        </AuthShell>
    ),
}

export const SignUpEntry: Story = {
    render: () => (
        <AuthShell
            brand={<DemoBrand />}
            headline="Create your workspace in under a minute."
            highlights={["No card required", "Cancel anytime"]}
        >
            <AuthCard appName="Acme" brand={null} methods={["password", "email-code"]} initialView="signup" />
        </AuthShell>
    ),
}

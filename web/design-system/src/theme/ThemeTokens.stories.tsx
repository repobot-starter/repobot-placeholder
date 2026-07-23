import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { themeConfig } from "./themeConfig"
import { vars } from "./tokens.css"

/**
 * Live view of the theme contract: every swatch and scale below renders from
 * the CSS variables derived from the root `repobot.theme.json`. Use the
 * Storybook theme toolbar to flip light/dark.
 */
function TokensOverview(): React.ReactElement {
    const colors: Array<[string, string]> = [
        ["accent", vars.color.accent],
        ["accentHover", vars.color.accentHover],
        ["background", vars.color.background],
        ["surface", vars.color.surface],
        ["surfaceHover", vars.color.surfaceHover],
        ["border", vars.color.border],
        ["danger", vars.color.danger],
        ["success", vars.color.success],
    ]
    const radii: Array<[string, string]> = [
        ["sm", vars.radius.sm],
        ["md", vars.radius.md],
        ["lg", vars.radius.lg],
    ]
    const spaces: Array<[string, string]> = [
        ["xxs", vars.space.xxs],
        ["xs", vars.space.xs],
        ["sm", vars.space.sm],
        ["md", vars.space.md],
        ["lg", vars.space.lg],
        ["xl", vars.space.xl],
        ["xxl", vars.space.xxl],
    ]
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: vars.space.lg,
                fontFamily: vars.fontFamily.body,
                color: vars.color.textPrimary,
            }}
        >
            <div style={{ fontFamily: vars.fontFamily.mono, fontSize: vars.fontSize.xs }}>
                repobot.theme.json → brand {themeConfig.brand.primary} · radius {themeConfig.radius} · density{" "}
                {themeConfig.density} · font {themeConfig.fontFamily}
            </div>
            <div style={{ display: "flex", gap: vars.space.md, flexWrap: "wrap" }}>
                {colors.map(([label, value]) => (
                    <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div
                            style={{
                                width: 96,
                                height: 44,
                                backgroundColor: value,
                                borderRadius: vars.radius.md,
                                border: `1px solid ${vars.color.border}`,
                            }}
                        />
                        <span style={{ fontSize: vars.fontSize.xs, color: vars.color.textSecondary }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: vars.space.lg, alignItems: "flex-end" }}>
                {radii.map(([label, value]) => (
                    <div key={label} style={{ textAlign: "center" }}>
                        <div
                            style={{
                                width: 72,
                                height: 48,
                                backgroundColor: vars.color.surfaceHover,
                                border: `1px solid ${vars.color.border}`,
                                borderRadius: value,
                            }}
                        />
                        <span style={{ fontSize: vars.fontSize.xs, color: vars.color.textSecondary }}>
                            radius.{label}
                        </span>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: vars.space.md, alignItems: "flex-end" }}>
                {spaces.map(([label, value]) => (
                    <div key={label} style={{ textAlign: "center" }}>
                        <div
                            style={{
                                width: 20,
                                height: value,
                                backgroundColor: vars.color.accent,
                                borderRadius: vars.radius.sm,
                            }}
                        />
                        <span style={{ fontSize: vars.fontSize.xs, color: vars.color.textSecondary }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

const meta: Meta<typeof TokensOverview> = {
    title: "Theme/Tokens",
    component: TokensOverview,
}
export default meta

type Story = StoryObj<typeof TokensOverview>

export const Overview: Story = {}

import {
    AppShell,
    AuthCard,
    AuthShell,
    Badge,
    DataTable,
    Label,
    Select,
    StatCard,
    StatCardRow,
    Button,
    SchemaFormRuntime,
    appShellLayouts,
    darkTheme,
    lightTheme,
    resolveTreatments,
    themeCharacterPresets,
    vars,
    type AppShellLayout,
    type AppShellNavSection,
    type AuthCardView,
    type DataTableColumn,
    type ParsedSchemaForm,
    type SchemaFormData,
    type SchemaFormReferenceOption,
    type SchemaFormReferenceResolvers,
    type SchemaFormWizardState,
    type ThemeCharacterPreset,
    type ThemeColorSet,
    type ThemeShadowSet,
} from "@ui"
import React, { useEffect, useId, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import * as styles from "../MarketingGallery/MarketingGalleryPage.styles.css"

/**
 * Live gallery for the signed-in chrome — the app-side sibling of
 * /theme/marketing. Dashboard tiles render the real `AppShell` in every
 * layout variant around fixture content (stats, a data table), and auth
 * tiles render the real `AuthShell` + `AuthCard` in each view, so what you
 * see is exactly what a generated app ships. The mode knob flips every tile
 * between the light and dark theme contract. Iterating on the shell or auth
 * card? Edit the design-system component and this page hot-reloads.
 */

const PREVIEW_WIDTH = 1280
const PREVIEW_HEIGHT = 800

type Surface = "dashboard" | "auth" | "forms"
type Mode = "light" | "dark"

const AUTH_VIEWS: { value: AuthCardView; label: string }[] = [
    { value: "start", label: "Sign in" },
    { value: "signup", label: "Sign up" },
    { value: "code", label: "Email code" },
    { value: "reset", label: "Password reset" },
]

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

const navSections: AppShellNavSection[] = [
    {
        id: "workspace",
        items: [
            {
                id: "/projects",
                label: "Projects",
                icon: <Icon d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
                badgeText: "3",
            },
            {
                id: "/customers",
                label: "Customers",
                icon: <Icon d="M16 21v-2a4 4 0 0 0-8 0v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />,
            },
        ],
    },
    {
        id: "insights",
        title: "Insights",
        items: [
            { id: "/reports", label: "Reports", icon: <Icon d="M4 20V10 M10 20V4 M16 20v-7 M22 20H2" /> },
            {
                id: "/settings",
                label: "Settings",
                icon: (
                    <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
                ),
            },
        ],
    },
]

interface FixtureRow {
    id: string
    name: string
    owner: string
    status: "Active" | "Paused" | "Draft"
    updated: string
}

const fixtureRows: FixtureRow[] = [
    { id: "1", name: "Onboarding revamp", owner: "Dana Whitmore", status: "Active", updated: "2h ago" },
    { id: "2", name: "Billing migration", owner: "Marcus Reed", status: "Active", updated: "Yesterday" },
    { id: "3", name: "Churn dashboards", owner: "Priya Nair", status: "Paused", updated: "3d ago" },
    { id: "4", name: "Mobile deep links", owner: "Tom Okafor", status: "Draft", updated: "Last week" },
    { id: "5", name: "SSO rollout", owner: "Dana Whitmore", status: "Active", updated: "Last week" },
]

const fixtureColumns: DataTableColumn<FixtureRow>[] = [
    { id: "name", header: "Project", render: (row) => <strong>{row.name}</strong> },
    { id: "owner", header: "Owner", render: (row) => row.owner },
    {
        id: "status",
        header: "Status",
        render: (row) => (
            <Badge
                tone={row.status === "Active" ? "success" : row.status === "Paused" ? "warning" : "neutral"}
            >
                {row.status}
            </Badge>
        ),
    },
    { id: "updated", header: "Updated", render: (row) => row.updated },
]

/** The page a dashboard preview wraps: enough real furniture to judge the chrome. */
function FixtureDashboardContent(): React.ReactElement {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22 }}>Projects</h1>
            <StatCardRow>
                <StatCard label="Active projects" value="12" delta={{ direction: "up", value: "+3" }} />
                <StatCard label="Team members" value="28" hint="4 pending invites" />
                <StatCard label="Tasks shipped" value="164" delta={{ direction: "up", value: "+12%" }} />
                <StatCard
                    label="Overdue"
                    value="3"
                    delta={{ direction: "down", value: "-2", upIsPositive: false }}
                />
            </StatCardRow>
            <DataTable columns={fixtureColumns} rows={fixtureRows} />
        </div>
    )
}

function DemoDashboard({ layout }: { layout: AppShellLayout }): React.ReactElement {
    const [activeItemId, setActiveItemId] = useState("/projects")
    return (
        <AppShell
            layout={layout}
            title="Waypoint"
            sections={navSections}
            activeItemId={activeItemId}
            onItemSelect={(item) => setActiveItemId(item.id)}
            profile={{
                label: "Dev User",
                sublabel: "dev@local.test",
                items: [{ id: "settings", label: "Account settings", onSelect: () => {} }],
                onSignOut: () => {},
            }}
        >
            <FixtureDashboardContent />
        </AppShell>
    )
}

function DemoAuth({ view }: { view: AuthCardView }): React.ReactElement {
    return (
        <AuthShell
            brand={<strong style={{ fontSize: 18 }}>Waypoint</strong>}
            headline="Onboarding your customers actually finish."
            subheadline="Checklists, tours, and nudges that adapt to what each customer already did."
            highlights={["Live in minutes, not sprints", "Adapts per customer", "No engineering ticket"]}
            panelFooter={<span>“Activation went from 46% to 71%.” — Fieldnote</span>}
            // The surrounding ThemedFrame owns the theme class; re-applying it
            // here would re-declare the token vars and cancel the frame's
            // character overrides.
            themeClassName=""
        >
            <AuthCard appName="Waypoint" methods={["email-code", "password", "google"]} initialView={view} />
        </AuthShell>
    )
}

/**
 * Kitchen-sink SchemaForm: every widget the runtime renders — text/email/
 * url/number/date/datetime inputs, select, radio, checkbox, switch,
 * multi-select checkbox group, textarea, a two-column layout, a nested
 * object section, and an editable array — exactly as a backend-driven
 * entity form would ship it.
 */
const kitchenSinkForm: ParsedSchemaForm = {
    schema: {
        type: "object",
        required: ["name", "email", "plan"],
        properties: {
            name: { type: "string", title: "Full name" },
            email: { type: "string", format: "email", title: "Work email" },
            website: { type: "string", format: "uri", title: "Website" },
            seats: { type: "integer", title: "Seats", minimum: 1 },
            plan: {
                type: "string",
                title: "Plan",
                oneOf: [
                    { const: "starter", title: "Starter" },
                    { const: "growth", title: "Growth" },
                    { const: "scale", title: "Scale" },
                ],
            },
            priority: {
                type: "string",
                title: "Priority",
                oneOf: [
                    { const: "low", title: "Low" },
                    { const: "normal", title: "Normal" },
                    { const: "high", title: "High" },
                ],
            },
            launchDate: { type: "string", format: "date", title: "Launch date" },
            kickoffAt: { type: "string", format: "date-time", title: "Kickoff call" },
            channels: {
                type: "array",
                title: "Notify via",
                uniqueItems: true,
                items: {
                    type: "string",
                    oneOf: [
                        { const: "email", title: "Email" },
                        { const: "sms", title: "SMS" },
                        { const: "slack", title: "Slack" },
                    ],
                },
            },
            digest: {
                type: "boolean",
                title: "Weekly digest",
                description: "A Monday summary of everything that changed.",
            },
            beta: { type: "boolean", title: "Beta features" },
            notes: { type: "string", title: "Notes" },
            address: {
                type: "object",
                title: "Billing address",
                properties: {
                    street: { type: "string", title: "Street" },
                    city: { type: "string", title: "City" },
                    zip: { type: "string", title: "Postal code" },
                },
            },
            teammates: {
                type: "array",
                title: "Teammates",
                items: {
                    type: "object",
                    properties: {
                        name: { type: "string", title: "Name" },
                        role: {
                            type: "string",
                            title: "Role",
                            oneOf: [
                                { const: "admin", title: "Admin" },
                                { const: "member", title: "Member" },
                            ],
                        },
                    },
                },
            },
        },
    },
    uiSchema: {
        "ui:options": { columns: 2 },
        priority: { "ui:widget": "radio", "ui:options": { inline: true, fullWidth: true } },
        channels: { "ui:options": { inline: true, fullWidth: true } },
        digest: { "ui:options": { fullWidth: true } },
        beta: { "ui:widget": "switch", "ui:options": { fullWidth: true } },
        notes: { "ui:widget": "textarea" },
        address: { "ui:options": { columns: 2 } },
        teammates: { items: { "ui:options": { columns: 2 } } },
    },
    defaultData: {
        plan: "growth",
        priority: "normal",
        channels: ["email"],
        digest: true,
        teammates: [{ name: "Dana Whitmore", role: "admin" }],
    },
}

/** Three-page wizard via `ui:steps` — per-step validation, one submit at the end. */
const wizardForm: ParsedSchemaForm = {
    schema: {
        type: "object",
        required: ["name", "email", "plan", "terms"],
        properties: {
            name: { type: "string", title: "Full name" },
            email: { type: "string", format: "email", title: "Work email" },
            company: { type: "string", title: "Company" },
            plan: {
                type: "string",
                title: "Plan",
                oneOf: [
                    { const: "starter", title: "Starter — $0" },
                    { const: "growth", title: "Growth — $49" },
                    { const: "scale", title: "Scale — $199" },
                ],
            },
            seats: { type: "integer", title: "Seats", minimum: 1 },
            notes: { type: "string", title: "Anything we should know?" },
            terms: { type: "boolean", title: "I agree to the terms of service" },
        },
    },
    uiSchema: {
        "ui:steps": [
            { title: "Account", description: "Who's setting this up?", fields: ["name", "email", "company"] },
            {
                title: "Plan",
                description: "Pick a plan; you can change it later.",
                fields: ["plan", "seats"],
            },
            { title: "Review", fields: ["notes", "terms"] },
        ],
        plan: { "ui:widget": "radio" },
        notes: { "ui:widget": "textarea" },
    },
    defaultData: { seats: 5 },
}

/**
 * Reactive order form: the full `ui:derived` vocabulary in one fixture — a
 * container-count stepper drives the array's length (`arraySize`), each
 * container derives a templated reference (`template`), per-row totals
 * compute as you type (`expr`), the freight rate only shows when freight is
 * billable (`visibleWhen`), an `entityRef` customer picker searches live
 * options with a quick-create link, and a `ui:summary` band recomputes the
 * line economics under the form.
 */
const orderForm: ParsedSchemaForm = {
    schema: {
        type: "object",
        required: ["customerId", "contractNumber"],
        properties: {
            customerId: { type: "string", title: "Customer" },
            contractNumber: { type: "string", title: "Contract #" },
            containerCount: { type: "integer", title: "Containers", minimum: 0, maximum: 8 },
            freightBillable: { type: "boolean", title: "Freight billable to customer" },
            freightRatePerContainer: { type: "number", title: "Freight rate per container" },
            containers: {
                type: "array",
                title: "Containers",
                items: {
                    type: "object",
                    properties: {
                        reference: { type: "string", title: "Reference" },
                        description: { type: "string", title: "Description" },
                        qty: { type: "integer", title: "Qty" },
                        sellPrice: { type: "number", title: "Sell price" },
                        lineTotal: { type: "number", title: "Line total" },
                    },
                },
            },
        },
    },
    uiSchema: {
        "ui:options": { columns: 2 },
        customerId: {
            "ui:widget": "entityRef",
            "ui:options": { reference: "customers", allowCreate: true },
        },
        freightBillable: { "ui:options": { fullWidth: true } },
        containers: {
            "ui:options": { addLabel: "+ Container" },
            items: { "ui:options": { columns: 2 } },
        },
        "ui:derived": [
            { target: "containers", arraySize: "containerCount" },
            { target: "containers[].reference", template: "${contractNumber}.C${index + 1}" },
            { target: "containers[].lineTotal", expr: "qty * sellPrice" },
            { target: "freightRatePerContainer", visibleWhen: "freightBillable" },
        ],
        "ui:summary": {
            title: "Line economics",
            columns: [
                { key: "line", title: "Line" },
                { key: "qty", title: "Qty", align: "right" },
                { key: "total", title: "Total", align: "right" },
            ],
            rows: [
                {
                    forEach: "containers[]",
                    cells: {
                        line: "${reference}",
                        qty: "${qty}",
                        total: "${currency(lineTotal)}",
                    },
                },
                {
                    cells: {
                        line: "Total",
                        qty: "${sum(containers[].qty)}",
                        total: "${currency(sum(containers[].lineTotal) + freightBillable * freightRatePerContainer * count(containers[]))}",
                    },
                    emphasis: true,
                },
            ],
        },
    },
    defaultData: { contractNumber: "C0003", containerCount: 2, freightBillable: false },
}

const demoCustomers: SchemaFormReferenceOption[] = [
    { value: "cus_1", label: "BuildCo Supply", description: "Portland, OR" },
    { value: "cus_2", label: "Cascade Millworks", description: "Tacoma, WA" },
    { value: "cus_3", label: "Highline Cabinets", description: "Boise, ID" },
]

/** In-memory stand-in for the Apollo-backed resolvers a real page wires up. */
const demoReferenceResolvers: SchemaFormReferenceResolvers = {
    customers: {
        search: async (query) =>
            demoCustomers.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())),
        resolve: async (value) => demoCustomers.find((option) => option.value === value) ?? null,
        create: {
            label: "+ Add customer",
            run: async () => {
                const name = window.prompt("Customer name")
                if (name === null || name.trim() === "") {
                    return null
                }
                const option = { value: `cus_${Date.now()}`, label: name.trim() }
                demoCustomers.push(option)
                return option
            },
        },
    },
}

/** An interactive form fixture in a card, with a footer that mirrors the modal's. */
function DemoForm({
    fixture,
    referenceResolvers,
}: {
    fixture: ParsedSchemaForm
    referenceResolvers?: SchemaFormReferenceResolvers
}): React.ReactElement {
    const formId = useId()
    const [formData, setFormData] = useState<SchemaFormData>(fixture.defaultData)
    const [wizardState, setWizardState] = useState<SchemaFormWizardState | null>(null)
    const [submitted, setSubmitted] = useState<SchemaFormData | null>(null)
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                padding: 24,
                background: vars.color.surface,
                border: `1px solid ${vars.color.border}`,
                borderRadius: vars.radius.lg,
                boxShadow: vars.treatment.cardShadow,
            }}
        >
            <SchemaFormRuntime
                id={formId}
                schemaForm={fixture}
                formData={formData}
                onFormDataChange={setFormData}
                onSubmit={setSubmitted}
                onWizardStateChange={setWizardState}
                referenceResolvers={referenceResolvers}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button type="submit" form={formId}>
                    {wizardState !== null && !wizardState.isLastStep ? "Next" : "Save"}
                </Button>
            </div>
            {submitted !== null ? (
                <pre
                    style={{
                        margin: 0,
                        padding: 12,
                        background: vars.color.muted,
                        borderRadius: vars.radius.md,
                        fontSize: 12,
                        overflow: "auto",
                    }}
                >
                    {JSON.stringify(submitted, null, 2)}
                </pre>
            ) : null}
        </div>
    )
}

/** A full app screen scaled into a tile (same treatment as /theme/marketing). */
function ScaledPreview({ children }: { children: React.ReactNode }): React.ReactElement {
    const viewportRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0.3)
    useEffect(() => {
        const viewport = viewportRef.current
        if (viewport === null) {
            return
        }
        const measure = (): void => setScale(viewport.clientWidth / PREVIEW_WIDTH)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(viewport)
        return () => observer.disconnect()
    }, [])
    return (
        <div
            ref={viewportRef}
            className={styles.previewViewport}
            style={{ height: `${Math.round(PREVIEW_HEIGHT * scale)}px` }}
        >
            <div
                className={styles.previewCanvas}
                style={{
                    width: `${PREVIEW_WIDTH}px`,
                    height: `${PREVIEW_HEIGHT}px`,
                    transform: `scale(${scale})`,
                }}
            >
                {children}
            </div>
        </div>
    )
}

/** `var(--x)` → `--x`, so a token reference can be overridden inline. */
function cssVarName(reference: string): string {
    return reference.replace(/^var\((.*)\)$/, "$1")
}

/**
 * Treatment tokens for a character, re-resolved at runtime so the gallery
 * can preview every character without rebuilding the theme. Passing the
 * token *references* as the color/shadow sets works because treatments are
 * pure string recipes (color-mix over the accent), never color math.
 */
function characterOverrides(character: ThemeCharacterPreset, mode: Mode): React.CSSProperties {
    const colors = { accent: vars.color.accent, ring: vars.color.ring } as ThemeColorSet
    const shadows = { md: vars.shadow.md, lg: vars.shadow.lg } as ThemeShadowSet
    const treatment = resolveTreatments(character, colors, shadows, mode === "dark")
    return {
        [cssVarName(vars.treatment.pageWash)]: treatment.pageWash,
        [cssVarName(vars.treatment.panelWash)]: treatment.panelWash,
        [cssVarName(vars.treatment.cardShadow)]: treatment.cardShadow,
        [cssVarName(vars.treatment.focusRing)]: treatment.focusRing,
    } as React.CSSProperties
}

/** Theme scope for a preview: applies the mode's token class and ground color. */
function ThemedFrame({
    mode,
    character,
    children,
}: {
    mode: Mode
    character: ThemeCharacterPreset
    children: React.ReactNode
}): React.ReactElement {
    return (
        <div
            className={mode === "dark" ? darkTheme : lightTheme}
            style={{
                background: vars.color.background,
                // Unthemed fixture text (headings, the brand slot) must
                // inherit the mode's ink, not the gallery page's.
                color: vars.color.textPrimary,
                height: "100%",
                overflow: "hidden",
                ...characterOverrides(character, mode),
            }}
        >
            {children}
        </div>
    )
}

export default function AppChromeGalleryPage(): React.ReactElement {
    const [searchParams, setSearchParams] = useSearchParams()
    const surfaceParam = searchParams.get("surface")
    const surface: Surface =
        surfaceParam === "auth" ? "auth" : surfaceParam === "forms" ? "forms" : "dashboard"
    const mode: Mode = searchParams.get("mode") === "dark" ? "dark" : "light"
    const compare = searchParams.get("view") !== "single"
    const layoutParam = searchParams.get("layout")
    const layout: AppShellLayout = appShellLayouts.includes(layoutParam as AppShellLayout)
        ? (layoutParam as AppShellLayout)
        : "sidebar"
    const authViewParam = searchParams.get("authView")
    const authView: AuthCardView = AUTH_VIEWS.some((option) => option.value === authViewParam)
        ? (authViewParam as AuthCardView)
        : "start"
    const characterParam = searchParams.get("character")
    const character: ThemeCharacterPreset = themeCharacterPresets.includes(
        characterParam as ThemeCharacterPreset,
    )
        ? (characterParam as ThemeCharacterPreset)
        : "plain"

    const setParams = (updates: Record<string, string>): void => {
        const next = new URLSearchParams(searchParams)
        for (const [key, value] of Object.entries(updates)) {
            next.set(key, value)
        }
        setSearchParams(next, { replace: true })
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>App chrome</h1>
                    <p className={styles.subtitle}>
                        The signed-in shell and auth screens, rendered by the real components. Marketing
                        presets live at <a href="/theme/marketing">/theme/marketing</a>, app tokens at{" "}
                        <a href="/theme">/theme</a>.
                    </p>
                </div>
                <div className={styles.controls}>
                    <div className={styles.controlStack}>
                        <Label htmlFor="chrome-surface">Surface</Label>
                        <Select
                            id="chrome-surface"
                            value={surface}
                            onValueChange={(value) => setParams({ surface: value })}
                            options={[
                                { value: "dashboard", label: "Dashboard shell" },
                                { value: "auth", label: "Auth screens" },
                                { value: "forms", label: "Forms" },
                            ]}
                        />
                    </div>
                    <div className={styles.controlStack}>
                        <Label htmlFor="chrome-mode">Mode</Label>
                        <Select
                            id="chrome-mode"
                            value={mode}
                            onValueChange={(value) => setParams({ mode: value })}
                            options={[
                                { value: "light", label: "Light" },
                                { value: "dark", label: "Dark" },
                            ]}
                        />
                    </div>
                    <div className={styles.controlStack}>
                        <Label htmlFor="chrome-character">Character</Label>
                        <Select
                            id="chrome-character"
                            value={character}
                            onValueChange={(value) => setParams({ character: value })}
                            options={themeCharacterPresets.map((name) => ({ value: name, label: name }))}
                        />
                    </div>
                    <div className={styles.controlStack}>
                        <Label htmlFor="chrome-view">View</Label>
                        <Select
                            id="chrome-view"
                            value={compare ? "compare" : "single"}
                            onValueChange={(value) => setParams({ view: value })}
                            options={[
                                { value: "compare", label: "Compare all" },
                                { value: "single", label: "Single full size" },
                            ]}
                        />
                    </div>
                    {!compare && surface === "dashboard" && (
                        <div className={styles.controlStack}>
                            <Label htmlFor="chrome-layout">Shell layout</Label>
                            <Select
                                id="chrome-layout"
                                value={layout}
                                onValueChange={(value) => setParams({ layout: value })}
                                options={appShellLayouts.map((name) => ({ value: name, label: name }))}
                            />
                        </div>
                    )}
                    {!compare && surface === "auth" && (
                        <div className={styles.controlStack}>
                            <Label htmlFor="chrome-auth-view">Auth view</Label>
                            <Select
                                id="chrome-auth-view"
                                value={authView}
                                onValueChange={(value) => setParams({ authView: value })}
                                options={AUTH_VIEWS.map((option) => ({
                                    value: option.value,
                                    label: option.label,
                                }))}
                            />
                        </div>
                    )}
                </div>
            </header>
            {surface === "forms" ? (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))",
                        gap: 24,
                        alignItems: "start",
                    }}
                >
                    {[
                        { title: "Entity form — every widget", fixture: kitchenSinkForm },
                        { title: "Multi-step wizard — ui:steps", fixture: wizardForm },
                        {
                            title: "Reactive order form — ui:derived, entityRef, ui:summary",
                            fixture: orderForm,
                            referenceResolvers: demoReferenceResolvers,
                        },
                    ].map((entry) => (
                        <div
                            key={entry.title}
                            className={mode === "dark" ? darkTheme : lightTheme}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                                padding: 20,
                                borderRadius: 12,
                                background: vars.color.background,
                                color: vars.color.textPrimary,
                                ...characterOverrides(character, mode),
                            }}
                        >
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{entry.title}</span>
                            <DemoForm fixture={entry.fixture} referenceResolvers={entry.referenceResolvers} />
                        </div>
                    ))}
                </div>
            ) : compare ? (
                <div className={styles.compareGrid}>
                    {surface === "dashboard"
                        ? appShellLayouts.map((name) => (
                              <button
                                  key={name}
                                  type="button"
                                  className={styles.compareTile}
                                  onClick={() => setParams({ layout: name, view: "single" })}
                                  title={`Open ${name} full size`}
                              >
                                  <span className={styles.tileLabel}>{name}</span>
                                  <ScaledPreview>
                                      <ThemedFrame mode={mode} character={character}>
                                          <DemoDashboard layout={name} />
                                      </ThemedFrame>
                                  </ScaledPreview>
                              </button>
                          ))
                        : AUTH_VIEWS.map((option) => (
                              <button
                                  key={option.value}
                                  type="button"
                                  className={styles.compareTile}
                                  onClick={() => setParams({ authView: option.value, view: "single" })}
                                  title={`Open ${option.label} full size`}
                              >
                                  <span className={styles.tileLabel}>{option.label}</span>
                                  <ScaledPreview>
                                      <ThemedFrame mode={mode} character={character}>
                                          <DemoAuth view={option.value} />
                                      </ThemedFrame>
                                  </ScaledPreview>
                              </button>
                          ))}
                </div>
            ) : (
                <div className={styles.singleFrame}>
                    <ThemedFrame mode={mode} character={character}>
                        {surface === "dashboard" ? (
                            <div style={{ height: "85vh" }}>
                                <DemoDashboard layout={layout} />
                            </div>
                        ) : (
                            <DemoAuth view={authView} />
                        )}
                    </ThemedFrame>
                </div>
            )}
        </div>
    )
}

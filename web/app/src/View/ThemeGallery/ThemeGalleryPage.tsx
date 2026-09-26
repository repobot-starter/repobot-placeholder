import {
    ActivityFeed,
    AiChatThread,
    AuthCard,
    Badge,
    Button,
    ChartCard,
    DataTable,
    DetailPage,
    EmptyState,
    FiltersToolbar,
    Input,
    Label,
    Select,
    SettingsGroup,
    SettingsGroups,
    SettingsRow,
    Skeleton,
    Spinner,
    StatCard,
    StatCardRow,
    TextArea,
    ThemeToggle,
    Timeline,
    themeConfig,
    vars,
} from "@ui"
import React, { useState } from "react"
import * as styles from "./ThemeGalleryPage.styles.css"

/**
 * Live style guide for the project's design system. Every primitive and
 * component below renders with the current theme tokens, so edits to
 * `repobot.theme.json` (by you or your agent) re-skin this page instantly.
 *
 * This is a kernel exemplar page (like /login): keep it in sync when adding
 * design-system components so agents and users can always preview the theme.
 */

const COLOR_SWATCHES: Array<{ label: string; value: string; border?: boolean }> = [
    { label: "accent", value: vars.color.accent },
    { label: "accentHover", value: vars.color.accentHover },
    { label: "background", value: vars.color.background, border: true },
    { label: "surface", value: vars.color.surface, border: true },
    { label: "surfaceHover", value: vars.color.surfaceHover, border: true },
    { label: "ring", value: vars.color.ring, border: true },
    { label: "border", value: vars.color.border },
    { label: "danger", value: vars.color.danger },
    { label: "success", value: vars.color.success },
]

const SHADOW_SAMPLES: Array<{ label: string; value: string }> = [
    { label: "shadow.sm", value: vars.shadow.sm },
    { label: "shadow.md", value: vars.shadow.md },
    { label: "shadow.lg", value: vars.shadow.lg },
    { label: "shadow.xl", value: vars.shadow.xl },
]

const RADIUS_SAMPLES: Array<{ label: string; value: string }> = [
    { label: "radius.sm", value: vars.radius.sm },
    { label: "radius.md", value: vars.radius.md },
    { label: "radius.lg", value: vars.radius.lg },
    { label: "radius.pill", value: vars.radius.pill },
]

const SPACING_SAMPLES: Array<{ label: string; value: string }> = [
    { label: "xxs", value: vars.space.xxs },
    { label: "xs", value: vars.space.xs },
    { label: "sm", value: vars.space.sm },
    { label: "md", value: vars.space.md },
    { label: "lg", value: vars.space.lg },
    { label: "xl", value: vars.space.xl },
    { label: "xxl", value: vars.space.xxl },
]

interface SampleRow {
    id: string
    name: string
    status: "Active" | "Invited" | "Disabled"
    role: string
}

const SAMPLE_ROWS: SampleRow[] = [
    { id: "1", name: "Amelia Chen", status: "Active", role: "Owner" },
    { id: "2", name: "Diego Ramos", status: "Invited", role: "Editor" },
    { id: "3", name: "Priya Patel", status: "Disabled", role: "Viewer" },
]

const STATUS_TONE: Record<SampleRow["status"], "success" | "accent" | "neutral"> = {
    Active: "success",
    Invited: "accent",
    Disabled: "neutral",
}

// One finished exchange so the chat surface previews with the current theme
// (the machinery chip, an answer with a list, and the composer).
const CHAT_PREVIEW_RESPONSES: React.ComponentProps<typeof AiChatThread>["responses"] = [
    {
        requestId: "preview-1",
        requestMessage: "What can this theme do?",
        responseId: "preview-response-1",
        responseItems: [
            {
                functionCall: {
                    id: "preview-tool-1",
                    name: "get_current_time",
                    arguments: "{}",
                    output: "{}",
                    status: "COMPLETED",
                },
                elapsedSeconds: 1,
            },
        ],
        assistantMessage: {
            message: [
                { format: "PARAGRAPH", content: "Every color here comes from your theme tokens:" },
                { format: "LIST_ITEM", content: "Accent drives the send button and markers." },
                { format: "LIST_ITEM", content: "Surface and border shape the chips." },
            ],
            status: "COMPLETED",
        },
    },
]

const CHART_PREVIEW_SERIES = [
    {
        id: "signups",
        label: "Sign-ups",
        points: [
            { x: "Mon", y: 12 },
            { x: "Tue", y: 18 },
            { x: "Wed", y: 15 },
            { x: "Thu", y: 24 },
            { x: "Fri", y: 21 },
            { x: "Sat", y: 9 },
            { x: "Sun", y: 7 },
        ],
    },
]

const ACTIVITY_PREVIEW_ITEMS = [
    {
        id: "1",
        title: "Amelia Chen joined",
        meta: "Invited by you",
        timestamp: "2h ago",
        badge: { label: "New", tone: "accent" as const },
    },
    { id: "2", title: "Weekly report sent", meta: "12 recipients", timestamp: "Yesterday" },
    {
        id: "3",
        title: "Diego Ramos changed a setting",
        meta: "Notifications off",
        timestamp: "Monday",
    },
]

const PROMPT_IDEAS = [
    'Set brand.primary to "#0f766e" in repobot.theme.json',
    'Change radius to "round" and density to "spacious"',
    'Switch fontFamily to "serif" and mode to "light"',
    "Customize the Button component (ejects a copy to Theme/overrides via the @ui registry)",
]

export default function ThemeGalleryPage(): React.ReactElement {
    const [selectValue, setSelectValue] = useState("editor")
    const [gallerySearch, setGallerySearch] = useState("")
    const [galleryStatus, setGalleryStatus] = useState<string | undefined>(undefined)

    return (
        <div className={styles.page}>
            <div className={styles.inner}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Theme</h1>
                    <span className={styles.contractPill}>brand {themeConfig.brand.primary}</span>
                    <span className={styles.contractPill}>radius {themeConfig.radius}</span>
                    <span className={styles.contractPill}>density {themeConfig.density}</span>
                    <span className={styles.contractPill}>font {themeConfig.fontFamily}</span>
                    <span className={styles.contractPill}>motion {themeConfig.motion}</span>
                    {themeConfig.palette !== null && (
                        <span className={styles.contractPill}>
                            palette {Object.keys(themeConfig.palette).length} tokens
                        </span>
                    )}
                    <span className={styles.headerSpacer} />
                    <ThemeToggle />
                    <p className={styles.subtitle}>
                        Everything on this page renders from the design-system tokens. Edit{" "}
                        <code>repobot.theme.json</code> — or ask your agent to — and watch it re-skin.
                    </p>
                </header>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Tokens</h2>
                    <div className={styles.panel}>
                        <div className={styles.swatchRow}>
                            {COLOR_SWATCHES.map((swatch) => (
                                <div key={swatch.label} className={styles.swatch}>
                                    <div
                                        className={styles.swatchChip}
                                        style={{
                                            backgroundColor: swatch.value,
                                            borderColor: swatch.border ? undefined : swatch.value,
                                        }}
                                    />
                                    <span className={styles.swatchLabel}>{swatch.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className={styles.radiusRow}>
                            {RADIUS_SAMPLES.map((sample) => (
                                <div key={sample.label} className={styles.scaleItem}>
                                    <div
                                        className={styles.radiusSample}
                                        style={{ borderRadius: sample.value }}
                                    />
                                    <span className={styles.swatchLabel}>{sample.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className={styles.radiusRow}>
                            {SHADOW_SAMPLES.map((sample) => (
                                <div key={sample.label} className={styles.scaleItem}>
                                    <div
                                        className={styles.radiusSample}
                                        style={{ boxShadow: sample.value, border: "none" }}
                                    />
                                    <span className={styles.swatchLabel}>{sample.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className={styles.spacingRow}>
                            {SPACING_SAMPLES.map((sample) => (
                                <div key={sample.label} className={styles.scaleItem}>
                                    <div className={styles.spacingBar} style={{ height: sample.value }} />
                                    <span className={styles.swatchLabel}>{sample.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className={styles.typeRow}>
                            <span style={{ fontSize: vars.fontSize.xl, fontWeight: 700 }}>
                                Heading — fontSize.xl
                            </span>
                            <span style={{ fontSize: vars.fontSize.lg, fontWeight: 600 }}>
                                Subheading — fontSize.lg
                            </span>
                            <span style={{ fontSize: vars.fontSize.md }}>Body copy — fontSize.md</span>
                            <span
                                style={{
                                    fontSize: vars.fontSize.sm,
                                    color: vars.color.textSecondary,
                                }}
                            >
                                Secondary — fontSize.sm
                            </span>
                            <span
                                style={{
                                    fontSize: vars.fontSize.xs,
                                    fontFamily: vars.fontFamily.mono,
                                    color: vars.color.textSecondary,
                                }}
                            >
                                mono caption — fontSize.xs
                            </span>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Primitives</h2>
                    <div className={styles.panel}>
                        <div className={styles.inlineRow}>
                            <Button variant="primary">Primary</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="danger">Danger</Button>
                            <Button variant="primary" disabled>
                                Disabled
                            </Button>
                            <Button variant="primary" size="sm">
                                Small
                            </Button>
                            <Button variant="primary" size="lg">
                                Large
                            </Button>
                        </div>
                        <div className={styles.inlineRow}>
                            <Badge tone="neutral">Neutral</Badge>
                            <Badge tone="accent">Accent</Badge>
                            <Badge tone="success">Success</Badge>
                            <Badge tone="danger">Danger</Badge>
                            <Spinner size="sm" />
                            <Spinner size="md" />
                        </div>
                        <div className={styles.controlsGrid}>
                            <div className={styles.controlStack}>
                                <Label htmlFor="theme-gallery-input">Text input</Label>
                                <Input id="theme-gallery-input" placeholder="name@company.com" />
                            </div>
                            <div className={styles.controlStack}>
                                <Label htmlFor="theme-gallery-select">Select</Label>
                                <Select
                                    id="theme-gallery-select"
                                    value={selectValue}
                                    onValueChange={setSelectValue}
                                    options={[
                                        { value: "owner", label: "Owner" },
                                        { value: "editor", label: "Editor" },
                                        { value: "viewer", label: "Viewer" },
                                    ]}
                                />
                            </div>
                            <div className={styles.controlStack}>
                                <Label htmlFor="theme-gallery-textarea">Text area</Label>
                                <TextArea
                                    id="theme-gallery-textarea"
                                    rows={3}
                                    placeholder="Tell us about your project..."
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Composed</h2>
                    <p className={styles.sectionHint}>
                        The same tokens carrying full components: the sign-in surface, the AI chat thread, a
                        data table, and empty/loading states.
                    </p>
                    <div className={styles.composedGrid}>
                        <AuthCard
                            appName="Preview"
                            title="Welcome back"
                            subtitle="Sign in to continue"
                            methods={["email-code", "password"]}
                        />
                        <div className={styles.panel} style={{ height: 420 }}>
                            <AiChatThread
                                responses={CHAT_PREVIEW_RESPONSES}
                                streaming={false}
                                onSubmit={() => undefined}
                                onStop={() => undefined}
                            />
                        </div>
                        <div className={styles.panel}>
                            <DataTable
                                columns={[
                                    {
                                        id: "name",
                                        header: "Name",
                                        render: (row: SampleRow) => row.name,
                                        sortValue: (row: SampleRow) => row.name,
                                    },
                                    {
                                        id: "status",
                                        header: "Status",
                                        render: (row: SampleRow) => (
                                            <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>
                                        ),
                                        sortValue: (row: SampleRow) => row.status,
                                    },
                                    { id: "role", header: "Role", render: (row: SampleRow) => row.role },
                                ]}
                                rows={SAMPLE_ROWS}
                            />
                            <EmptyState
                                title="No results"
                                description="Empty states inherit the theme too."
                                action={<Button variant="secondary">Clear filters</Button>}
                            />
                            <Skeleton height={16} />
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Drill-down</h2>
                    <p className={styles.sectionHint}>
                        The detail-page scaffold: header block (title, status badge, actions, key facts) over
                        tabbed content.
                    </p>
                    <div className={styles.panel}>
                        <DetailPage
                            title="Order #1042"
                            subtitle="Amelia Chen — priority shipment"
                            status={{ label: "In transit", tone: "info" }}
                            actions={<Button variant="secondary">Print</Button>}
                            meta={[
                                { label: "Created", value: "Mar 4" },
                                { label: "Total", value: "$12,840.00" },
                            ]}
                            tabs={[
                                {
                                    id: "overview",
                                    label: "Overview",
                                    content: (
                                        <p className={styles.sectionHint}>
                                            Tab panels hold any content — stat cards, tables, timelines.
                                        </p>
                                    ),
                                },
                                {
                                    id: "documents",
                                    label: "Documents",
                                    content: <p className={styles.sectionHint}>Filed invoices land here.</p>,
                                },
                                {
                                    id: "history",
                                    label: "History",
                                    content: (
                                        <Timeline
                                            entries={[
                                                {
                                                    id: "1",
                                                    timestamp: "Mar 12, 16:40",
                                                    actor: "Amelia Chen",
                                                    title: "Rate amended",
                                                    tone: "warning",
                                                    changes: [
                                                        {
                                                            label: "Rate",
                                                            before: "$2,140.00",
                                                            after: "$2,320.00",
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: "2",
                                                    timestamp: "Mar 4, 11:30",
                                                    title: "Order created",
                                                    tone: "accent",
                                                },
                                            ]}
                                        />
                                    ),
                                },
                            ]}
                        />
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Dashboard</h2>
                    <p className={styles.sectionHint}>
                        The signed-in widget kernel: stat cards, charts, activity, filters, and settings — all
                        on the same tokens.
                    </p>
                    <StatCardRow>
                        <StatCard
                            label="Sign-ups"
                            value="106"
                            hint="This week"
                            delta={{ value: "+12%", direction: "up" }}
                        />
                        <StatCard
                            label="Active now"
                            value="23"
                            hint="Signed-in members"
                            delta={{ value: "-2", direction: "down" }}
                        />
                        <StatCard label="Open tickets" value="4" hint="Awaiting reply" />
                    </StatCardRow>
                    <ChartCard
                        kind="area"
                        title="Sign-ups"
                        description="Daily sign-ups, last 7 days"
                        series={CHART_PREVIEW_SERIES}
                        height={200}
                    />
                    <div className={styles.panel}>
                        <FiltersToolbar
                            search={{
                                value: gallerySearch,
                                onChange: setGallerySearch,
                                placeholder: "Search members...",
                            }}
                            filters={[
                                {
                                    id: "status",
                                    label: "Status",
                                    value: galleryStatus,
                                    onChange: setGalleryStatus,
                                    options: [
                                        { id: "active", label: "Active" },
                                        { id: "invited", label: "Invited" },
                                        { id: "disabled", label: "Disabled" },
                                    ],
                                },
                            ]}
                        />
                        <ActivityFeed items={ACTIVITY_PREVIEW_ITEMS} />
                    </div>
                    <SettingsGroups>
                        <SettingsGroup
                            title="Notifications"
                            description="Settings pages compose these groups."
                            footer={
                                <Button size="sm" variant="secondary">
                                    Save
                                </Button>
                            }
                        >
                            <SettingsRow
                                label="Weekly digest"
                                description="A summary email every Monday."
                                htmlFor="theme-gallery-digest"
                            >
                                <Select
                                    id="theme-gallery-digest"
                                    value="on"
                                    onValueChange={() => undefined}
                                    options={[
                                        { value: "on", label: "On" },
                                        { value: "off", label: "Off" },
                                    ]}
                                />
                            </SettingsRow>
                        </SettingsGroup>
                    </SettingsGroups>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Try it</h2>
                    <div className={styles.panel}>
                        <ul className={styles.promptList}>
                            {PROMPT_IDEAS.map((idea) => (
                                <li key={idea}>
                                    <span className={styles.promptCode}>{idea}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    )
}

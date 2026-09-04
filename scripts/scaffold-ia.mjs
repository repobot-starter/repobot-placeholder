// Deterministic IA scaffolder (docs/project-ia.md). Reads repobot.project.json
// and provisions the signed-in dashboard it declares: a stub page per
// destination blueprint, plus route keys, protected <Route> entries, and shell
// nav items — all inside `<ia:*>` managed marker blocks in Router.ts, App.tsx,
// and shellNavSections.tsx.
//
// Contract: pure function of the manifest. Managed blocks are regenerated
// wholesale on every run (idempotent, converging); stub pages are generated
// only when missing (user code is never overwritten or deleted). Marketing
// pages need no scaffolding at all — they render from the manifest at runtime
// (web/app/src/View/Site/).
//
// The kernel's Projects/Users exemplar (generic reference CRUD, wrapped in
// `<ia:exemplar-*>` blocks) is REMOVED from the nav and route tables when the
// manifest declares its own dashboard destinations: a composed product's
// sidebar shows its product IA, not the kernel's demo. The exemplar page
// sources stay in the tree as reference patterns, and the raw kernel (no
// destinations) keeps the exemplar wired.
//
// Run: npm run scaffold:ia
// Test: npm run test:scaffold

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const MANIFEST_FILE = "repobot.project.json"
const ROUTER_FILE = "web/app/src/Config/Router.ts"
const APP_FILE = "web/app/src/App.tsx"
const NAV_FILE = "web/app/src/View/Navbar/shellNavSections.tsx"
const VIEW_DIR = "web/app/src/View"
const DEPLOY_FILE = "repobot.deploy.json"

export const DASHBOARD_BLUEPRINTS = ["overview", "table", "settings", "custom"]

/** Feather-style 24x24 stroke path per blueprint, for shell nav icons. */
const NAV_ICON_PATHS = {
    overview: "M3 3h8v8H3z M13 3h8v5h-8z M13 12h8v9h-8z M3 15h8v6H3z",
    table: "M3 5h18v14H3z M3 10h18 M9 10v9",
    settings: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
    custom: "M3 3h18v18H3z M8 12h8",
}

/* A destination may pin its own nav glyph: `icon` is a feather-style 24x24
 * stroke path (the same vocabulary as NAV_ICON_PATHS). Without it, the
 * blueprint's generic glyph stands — which means two `custom` destinations
 * wear the same anonymous box, so any product with more than one custom
 * page wants its own paths (the saas pack's budgets/cards did exactly
 * this). Path data only, no markup: the scaffold writes it into a JSX
 * attribute, so the value must be quote-safe. */
const ICON_PATH_PATTERN = /^[MmLlHhVvCcSsQqTtAaZz0-9 ,.-]+$/

/**
 * The dashboard section vocabulary — the widget types a destination's
 * `sections[]` scaffold may name, the kernel component each maps to, and
 * the optional CONTENT fields the scaffolder renders verbatim (so a
 * manifest can carry real demo values and the scaffold comes out looking
 * finished, not placeholder). Append-only public vocabulary, same
 * governance as blueprint names; this table is the single source of truth
 * for the agent map's app-composition section (generate-agent-map.mjs).
 */
export const DASHBOARD_SECTION_TYPES = {
    "stat-cards": {
        component: "StatCardRow + StatCard (built-in sparklines)",
        content:
            "cards: [{ label, value, hint?, delta?: { value, direction: up|down|flat, upIsPositive? }, tone?: accent|success|danger|warning|info, trend?: [numbers → sparkline] }]",
    },
    chart: {
        component: "ChartCard (line | area | bar | donut, themed)",
        content:
            'chart: { kind?: line|area|bar|donut, unit?: "$"|suffix, stacked?, legendValues?, height?, series: [{ label, points: [{ x, y }] }] }',
    },
    "data-table": {
        component: "DataTable (sortable columns)",
        content: "table: { columns: [{ id, header }], rows: [{ <columnId>: value }] }",
    },
    "activity-feed": {
        component: "ActivityFeed",
        content: "items: [{ title, meta?, timestamp?, badge?: { label, tone? } }]",
    },
    "detail-form": { component: "form primitives (Label/Input/Button)" },
    "settings-groups": { component: "SettingsGroups" },
    "filters-toolbar": { component: "FiltersToolbar" },
    "list-detail": { component: "ListDetailLayout" },
}

const STAT_CARD_TONES = ["accent", "success", "danger", "warning", "info"]
const BADGE_TONES = ["neutral", "success", "danger", "warning", "info", "accent"]
const STAT_CARD_DELTA_DIRECTIONS = ["up", "down", "flat"]
const CHART_KINDS = ["line", "area", "bar", "donut"]
const SECTION_SPANS = ["full", "half"]
const COLUMN_ID_PATTERN = /^[a-z][a-zA-Z0-9]*$/

/**
 * Content-field validation for a destination's `sections[]`. Deliberately
 * loud and specific: the writer of a bad manifest (usually an agent) fixes
 * from the error message in one turn; a silently-skipped field ships a
 * dashboard with holes.
 */
function validateSectionContent(destId, section) {
    const at = `destination "${destId}" section "${section.id ?? section.type}"`
    if (section.span !== undefined && !SECTION_SPANS.includes(section.span)) {
        throw new Error(`${at}: span must be one of ${SECTION_SPANS.join("|")}`)
    }
    if (section.cards !== undefined) {
        if (!Array.isArray(section.cards) || section.cards.length === 0) {
            throw new Error(`${at}: cards must be a non-empty array`)
        }
        for (const card of section.cards) {
            if (typeof card.label !== "string" || card.value === undefined) {
                throw new Error(`${at}: every card needs a string label and a value`)
            }
            if (card.delta !== undefined && !STAT_CARD_DELTA_DIRECTIONS.includes(card.delta.direction)) {
                throw new Error(`${at}: delta.direction must be ${STAT_CARD_DELTA_DIRECTIONS.join("|")}`)
            }
            if (card.tone !== undefined && !STAT_CARD_TONES.includes(card.tone)) {
                throw new Error(`${at}: tone must be ${STAT_CARD_TONES.join("|")}`)
            }
            if (
                card.trend !== undefined &&
                (!Array.isArray(card.trend) || card.trend.some((v) => typeof v !== "number"))
            ) {
                throw new Error(`${at}: trend must be an array of numbers`)
            }
        }
    }
    if (section.chart !== undefined) {
        const chart = section.chart
        if (chart.kind !== undefined && !CHART_KINDS.includes(chart.kind)) {
            throw new Error(`${at}: chart.kind must be ${CHART_KINDS.join("|")}`)
        }
        if (!Array.isArray(chart.series) || chart.series.length === 0) {
            throw new Error(`${at}: chart.series must be a non-empty array`)
        }
        for (const entry of chart.series) {
            if (
                typeof entry.label !== "string" ||
                !Array.isArray(entry.points) ||
                entry.points.length === 0
            ) {
                throw new Error(`${at}: every series needs a label and non-empty points`)
            }
            for (const point of entry.points) {
                if (
                    (typeof point.x !== "string" && typeof point.x !== "number") ||
                    typeof point.y !== "number"
                ) {
                    throw new Error(`${at}: series points must be { x: string|number, y: number }`)
                }
            }
        }
    }
    if (section.table !== undefined) {
        const table = section.table
        if (!Array.isArray(table.columns) || table.columns.length === 0) {
            throw new Error(`${at}: table.columns must be a non-empty array`)
        }
        for (const column of table.columns) {
            if (!COLUMN_ID_PATTERN.test(column.id ?? "") || typeof column.header !== "string") {
                throw new Error(
                    `${at}: every column needs a camelCase id (${COLUMN_ID_PATTERN}) and a string header`,
                )
            }
        }
        if (table.rows !== undefined && !Array.isArray(table.rows)) {
            throw new Error(`${at}: table.rows must be an array of { <columnId>: value } objects`)
        }
    }
    if (section.items !== undefined) {
        if (!Array.isArray(section.items) || section.items.some((item) => typeof item.title !== "string")) {
            throw new Error(`${at}: items must be an array of { title, meta?, timestamp?, badge? }`)
        }
        for (const item of section.items) {
            if (
                item.badge !== undefined &&
                (typeof item.badge.label !== "string" ||
                    (item.badge.tone !== undefined && !BADGE_TONES.includes(item.badge.tone)))
            ) {
                throw new Error(`${at}: badge needs a string label and tone in ${BADGE_TONES.join("|")}`)
            }
        }
    }
}

export function pascalCase(id) {
    return id
        .split(/[-_]/)
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join("")
}

export function camelCase(id) {
    const pascal = pascalCase(id)
    return pascal[0].toLowerCase() + pascal.slice(1)
}

export function readManifest(repoRoot) {
    const manifestPath = path.join(repoRoot, MANIFEST_FILE)
    if (!existsSync(manifestPath)) {
        throw new Error(`${MANIFEST_FILE} not found at ${manifestPath}`)
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
    const destinations = manifest.dashboard?.destinations ?? []
    for (const dest of destinations) {
        if (!/^[a-z][a-z0-9-]*$/.test(dest.id ?? "")) {
            throw new Error(`destination id "${dest.id}" must be lowercase kebab-case`)
        }
        if (!/^\/[a-z0-9/-]*$/.test(dest.path ?? "")) {
            throw new Error(`destination "${dest.id}" path "${dest.path}" must be a lowercase absolute path`)
        }
        if (typeof dest.label !== "string" || dest.label.length === 0) {
            throw new Error(`destination "${dest.id}" needs a label`)
        }
        if (!DASHBOARD_BLUEPRINTS.includes(dest.blueprint)) {
            throw new Error(
                `destination "${dest.id}" blueprint "${dest.blueprint}" is not one of: ${DASHBOARD_BLUEPRINTS.join(", ")}`,
            )
        }
        if (dest.icon !== undefined && !ICON_PATH_PATTERN.test(dest.icon)) {
            throw new Error(
                `destination "${dest.id}" icon must be SVG path data (M/L/H/V/C/S/Q/T/A/Z commands only)`,
            )
        }
        for (const section of dest.sections ?? []) {
            validateSectionContent(dest.id, section)
        }
    }
    const ids = destinations.map((dest) => dest.id)
    if (new Set(ids).size !== ids.length) {
        throw new Error("destination ids must be unique")
    }
    return { destinations }
}

/**
 * Replace the body of a `<ia:name>` ... `</ia:name>` managed block, keeping
 * the marker lines themselves. Generated lines inherit the opening marker's
 * indentation. Throws when the markers are missing — a repo where they were
 * deleted must fail loudly, not silently skip provisioning.
 */
export function replaceManagedBlock(source, name, lines) {
    const sourceLines = source.split("\n")
    const openIndex = sourceLines.findIndex((line) => line.includes(`<ia:${name}>`))
    const closeIndex = sourceLines.findIndex((line) => line.includes(`</ia:${name}>`))
    if (openIndex === -1 || closeIndex === -1 || closeIndex < openIndex) {
        throw new Error(`managed block <ia:${name}> markers not found or malformed`)
    }
    const indent = sourceLines[openIndex].match(/^\s*/)[0]
    const body = lines.flatMap((line) => line.split("\n")).map((line) => (line === "" ? "" : indent + line))
    return [...sourceLines.slice(0, openIndex + 1), ...body, ...sourceLines.slice(closeIndex)].join("\n")
}

/** The body of a managed block as it stands, for collision checks against the rest of the file. */
function withoutManagedBlocks(source) {
    return source.replace(/<ia:(\w[\w-]*)>[\s\S]*?<\/ia:\1>/g, "")
}

/**
 * Remove an `<ia:name>` ... `</ia:name>` exemplar block, marker lines
 * included. Unlike replaceManagedBlock, absent markers are a no-op: the
 * block is removed exactly once (the compose that stamps a manifest with
 * destinations) and never comes back on later runs.
 */
export function stripExemplarBlock(source, name) {
    const sourceLines = source.split("\n")
    const openIndex = sourceLines.findIndex((line) => line.includes(`<ia:${name}>`))
    const closeIndex = sourceLines.findIndex((line) => line.includes(`</ia:${name}>`))
    if (openIndex === -1 || closeIndex === -1 || closeIndex < openIndex) {
        return source
    }
    return [...sourceLines.slice(0, openIndex), ...sourceLines.slice(closeIndex + 1)].join("\n")
}

function routerBlockLines(destinations) {
    return destinations.map((dest) => `${camelCase(dest.id)}: { path: "${dest.path}" },`)
}

function importBlockLines(destinations) {
    return destinations.map((dest) => {
        const name = pascalCase(dest.id)
        return `const ${name}Page = lazy(() => import("./View/${name}/${name}Page"))`
    })
}

function routeBlockLines(destinations) {
    return destinations.map(
        (dest) =>
            `<Route path={routes.${camelCase(dest.id)}.path} element={<${pascalCase(dest.id)}Page />} />`,
    )
}

function navBlockLines(destinations) {
    if (destinations.length === 0) return []
    const items = destinations.flatMap((dest) => [
        `        {`,
        `            id: routes.${camelCase(dest.id)}.path,`,
        `            label: ${JSON.stringify(dest.label)},`,
        `            icon: <StrokeIcon d="${dest.icon ?? NAV_ICON_PATHS[dest.blueprint]}" />,`,
        `        },`,
    ])
    return ["{", '    id: "product",', "    items: [", ...items, "    ],", "},"]
}

function stubHeader(dest) {
    return `/**
 * ${dest.label} — scaffolded from repobot.project.json by scripts/scaffold-ia.mjs
 * (blueprint: ${dest.blueprint}). This stub is yours: replace the placeholders
 * with real data and views per docs/web-app.md. Re-running the scaffolder
 * never overwrites this file.${dest.description ? `\n *\n * ${dest.description}` : ""}
 */`
}

function overviewStub(dest, name) {
    return `import { ActivityFeed, StatCard, StatCardRow } from "@ui"
import React from "react"
import * as styles from "./${name}Page.styles.css"

${stubHeader(dest)}
export default function ${name}Page(): React.ReactElement {
    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>${dest.label}</h1>
            </header>
            <StatCardRow>
                <StatCard label="This week" value="—" hint="Wire to a real query" />
                <StatCard label="All time" value="—" hint="Wire to a real query" />
                <StatCard label="Active now" value="—" hint="Wire to a real query" />
            </StatCardRow>
            <div className={styles.widget}>
                <div className={styles.widgetHeader}>
                    <h2 className={styles.widgetTitle}>Recent activity</h2>
                </div>
                <ActivityFeed
                    items={[]}
                    emptyState={{
                        title: "No activity yet",
                        description: "Point this feed at real events (docs/web-app.md).",
                    }}
                />
            </div>
        </section>
    )
}
`
}

function tableStub(dest, name) {
    return `import { DataTable, EmptyState, type DataTableColumn } from "@ui"
import React from "react"
import * as styles from "./${name}Page.styles.css"

${stubHeader(dest)}
interface Row {
    id: string
    name: string
    createdAt: string
}

const columns: DataTableColumn<Row>[] = [
    { id: "name", header: "Name", render: (row) => row.name, sortValue: (row) => row.name },
    { id: "createdAt", header: "Created", render: (row) => row.createdAt, sortValue: (row) => row.createdAt },
]

const rows: Row[] = []

export default function ${name}Page(): React.ReactElement {
    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>${dest.label}</h1>
            </header>
            {rows.length > 0 ? (
                <DataTable tableId="${dest.id}" columns={columns} rows={rows} />
            ) : (
                <EmptyState
                    title="Nothing here yet"
                    description="Define the row shape and wire it to a query (docs/web-app.md)."
                />
            )}
        </section>
    )
}
`
}

function settingsStub(dest, name) {
    return `import { Button, Input, SettingsGroup, SettingsGroups, SettingsRow } from "@ui"
import React, { useState } from "react"
import * as styles from "./${name}Page.styles.css"

${stubHeader(dest)}
export default function ${name}Page(): React.ReactElement {
    const [displayName, setDisplayName] = useState("")
    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>${dest.label}</h1>
            </header>
            <SettingsGroups>
                <SettingsGroup
                    title="General"
                    description="Placeholder settings — replace with real preferences."
                    footer={<Button size="sm">Save changes</Button>}
                >
                    <SettingsRow label="Display name" htmlFor="settings-display-name">
                        <Input
                            id="settings-display-name"
                            value={displayName}
                            onChange={(event) => setDisplayName(event.target.value)}
                            placeholder="Placeholder setting"
                        />
                    </SettingsRow>
                </SettingsGroup>
            </SettingsGroups>
        </section>
    )
}
`
}

/* ------------------------------------------------------------------ */
/* Section widget generators                                            */
/* ------------------------------------------------------------------ */

/**
 * Imports each widget type needs from `@ui` (values before `type` entries,
 * both alphabetical) and from react (named imports beyond the default).
 */
const WIDGET_IMPORTS = {
    "stat-cards": { ui: ["StatCard", "StatCardRow"] },
    chart: { ui: ["ChartCard"] },
    "data-table": { ui: ["DataTable", "EmptyState", "type DataTableColumn"] },
    "activity-feed": { ui: ["ActivityFeed"] },
    "detail-form": { ui: ["Button", "Input", "Label"], react: ["useState"] },
    "settings-groups": { ui: ["Input", "SettingsGroup", "SettingsGroups", "SettingsRow"] },
    "filters-toolbar": { ui: ["FiltersToolbar"], react: ["useState"] },
    "list-detail": { ui: ["EmptyState", "ListDetailLayout"] },
    unknown: { ui: ["EmptyState"] },
}

/**
 * Imports for one widget. A content-bearing table renders its rows directly,
 * so the EmptyState fallback arm never generates — importing it anyway would
 * fail the unused-import lint in the generated page.
 */
function widgetImports(section) {
    const imports = WIDGET_IMPORTS[section.type] ?? WIDGET_IMPORTS.unknown
    if (section.type === "data-table" && section.table !== undefined) {
        return { ...imports, ui: imports.ui.filter((entry) => entry !== "EmptyState") }
    }
    if (section.type === "activity-feed" && Array.isArray(section.items) && section.items.length > 0) {
        // The generated items array is annotated ActivityFeedItem[] so badge
        // tones keep their literal-union type instead of widening to string.
        return { ...imports, ui: [...imports.ui, "type ActivityFeedItem"] }
    }
    return imports
}

const DEFAULT_WIDGET_HINT = "Wire this widget to real data (docs/web-app.md)."

/** JSX-safe string literal, always brace-wrapped: {"All orders"}. */
function jsxString(value) {
    return `{${JSON.stringify(value)}}`
}

/**
 * A JS literal for generated code: unquoted identifier keys and one line
 * per array element (primitive arrays stay inline) — house style, where
 * JSON.stringify's quoted keys would not be. Undefined-valued keys drop.
 */
function jsLiteral(value, indent = "") {
    if (Array.isArray(value)) {
        if (value.length === 0) return "[]"
        if (value.every((item) => typeof item !== "object" || item === null)) {
            return `[${value.map((item) => JSON.stringify(item)).join(", ")}]`
        }
        const inner = `${indent}    `
        return `[\n${value.map((item) => `${inner}${jsLiteral(item, inner)},`).join("\n")}\n${indent}]`
    }
    if (value !== null && typeof value === "object") {
        const entries = Object.entries(value).filter(([, v]) => v !== undefined)
        if (entries.length === 0) return "{}"
        const parts = entries.map(([key, v]) => {
            const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
            return `${safeKey}: ${jsLiteral(v, indent)}`
        })
        return `{ ${parts.join(", ")} }`
    }
    return JSON.stringify(value)
}

/** The widget card chrome shared by table/feed/form widgets. */
function widgetCard(title, bodyLines) {
    return [
        `    return (`,
        `        <div className={styles.widget}>`,
        `            <div className={styles.widgetHeader}>`,
        `                <h2 className={styles.widgetTitle}>${jsxString(title)}</h2>`,
        `            </div>`,
        ...bodyLines.map((line) => (line === "" ? "" : `            ${line}`)),
        `        </div>`,
        `    )`,
    ]
}

function statCardsWidgetBody(section) {
    const cards = section?.cards
    if (!Array.isArray(cards) || cards.length === 0) {
        return [
            `    return (`,
            `        <StatCardRow>`,
            `            <StatCard label="This week" value="—" hint="Wire to a real query" />`,
            `            <StatCard label="All time" value="—" hint="Wire to a real query" />`,
            `            <StatCard label="Active now" value="—" hint="Wire to a real query" />`,
            `        </StatCardRow>`,
            `    )`,
        ]
    }
    const lines = [`    return (`, `        <StatCardRow>`]
    for (const card of cards) {
        lines.push(`            <StatCard`)
        lines.push(`                label=${jsxString(card.label)}`)
        lines.push(`                value=${jsxString(String(card.value))}`)
        if (card.hint !== undefined) lines.push(`                hint=${jsxString(card.hint)}`)
        if (card.delta !== undefined) lines.push(`                delta={${jsLiteral(card.delta)}}`)
        if (card.tone !== undefined) lines.push(`                tone=${jsxString(card.tone)}`)
        if (card.trend !== undefined) lines.push(`                trend={${jsLiteral(card.trend)}}`)
        lines.push(`            />`)
    }
    lines.push(`        </StatCardRow>`, `    )`)
    return lines
}

function chartWidgetBody(section) {
    const description = section.description ? ` description=${jsxString(section.description)}` : ""
    const chart = section.chart
    if (chart === undefined) {
        return [
            `    // Placeholder series — swap in real data points from a query.`,
            `    const series = [`,
            `        {`,
            `            id: "sample",`,
            `            label: "Sample",`,
            `            points: [`,
            `                { x: "Mon", y: 4 },`,
            `                { x: "Tue", y: 7 },`,
            `                { x: "Wed", y: 5 },`,
            `                { x: "Thu", y: 9 },`,
            `                { x: "Fri", y: 6 },`,
            `            ],`,
            `        },`,
            `    ]`,
            `    return <ChartCard kind="line" title=${jsxString(section.title ?? "Chart")}${description} series={series} />`,
        ]
    }
    const series = chart.series.map((entry, index) => ({
        id: entry.id ?? `s${index + 1}`,
        label: entry.label,
        points: entry.points.map((point) => ({ x: point.x, y: point.y })),
    }))
    // The unit renders as a value formatter: "$" is a prefix, anything else
    // a suffix ("%", " hrs"). Both are plain template literals in the
    // generated page.
    const formatterLine =
        chart.unit === "$"
            ? "            valueFormatter={(value) => `$${value.toLocaleString()}`}"
            : typeof chart.unit === "string" && chart.unit.length > 0
              ? `            valueFormatter={(value) => \`\${value.toLocaleString()}${chart.unit.replace(/[\\\`$]/g, "")}\`}`
              : undefined
    return [
        `    const series = ${jsLiteral(series, "    ")}`,
        `    return (`,
        `        <ChartCard`,
        `            kind=${jsxString(chart.kind ?? "line")}`,
        `            title=${jsxString(section.title ?? "Chart")}`,
        ...(section.description ? [`            description=${jsxString(section.description)}`] : []),
        `            series={series}`,
        ...(formatterLine ? [formatterLine] : []),
        ...(chart.stacked === true ? [`            stacked`] : []),
        ...(chart.legendValues === true ? [`            legendValues`] : []),
        ...(typeof chart.height === "number" ? [`            height={${Math.round(chart.height)}}`] : []),
        `        />`,
        `    )`,
    ]
}

function dataTableWidgetBody(section) {
    const table = section.table
    if (table === undefined) {
        const empty = section.description ?? "Define the row shape and wire it to a query (docs/web-app.md)."
        return [
            `    interface Row {`,
            `        id: string`,
            `        name: string`,
            `        createdAt: string`,
            `    }`,
            `    const columns: DataTableColumn<Row>[] = [`,
            `        { id: "name", header: "Name", render: (row) => row.name, sortValue: (row) => row.name },`,
            `        {`,
            `            id: "createdAt",`,
            `            header: "Created",`,
            `            render: (row) => row.createdAt,`,
            `            sortValue: (row) => row.createdAt,`,
            `        },`,
            `    ]`,
            `    const rows: Row[] = []`,
            ...widgetCard(section.title ?? "Table", [
                `{rows.length > 0 ? (`,
                `    <DataTable tableId="${section.id}" columns={columns} rows={rows} />`,
                `) : (`,
                `    <EmptyState title="No rows yet" description=${jsxString(empty)} />`,
                `)}`,
            ]),
        ]
    }
    const fields = table.columns.map((column) => column.id)
    const rows = (table.rows ?? []).map((row, index) => {
        const out = { id: `row-${index + 1}` }
        for (const field of fields) {
            out[field] = String(row[field] ?? "")
        }
        return out
    })
    return [
        `    interface Row {`,
        `        id: string`,
        ...fields.map((field) => `        ${field}: string`),
        `    }`,
        `    const columns: DataTableColumn<Row>[] = [`,
        ...table.columns.map(
            (column) =>
                `        { id: "${column.id}", header: ${JSON.stringify(column.header)}, render: (row) => row.${column.id}, sortValue: (row) => row.${column.id} },`,
        ),
        `    ]`,
        `    const rows: Row[] = ${jsLiteral(rows, "    ")}`,
        ...widgetCard(section.title ?? "Table", [
            `<DataTable tableId="${section.id}" columns={columns} rows={rows} />`,
        ]),
    ]
}

function activityFeedWidgetBody(section) {
    const items = section.items
    if (!Array.isArray(items) || items.length === 0) {
        const empty = section.description ?? "Point this feed at real events (docs/web-app.md)."
        return [
            ...widgetCard(section.title ?? "Recent activity", [
                `<ActivityFeed`,
                `    items={[]}`,
                `    emptyState={{`,
                `        title: "No activity yet",`,
                `        description: ${JSON.stringify(empty)},`,
                `    }}`,
                `/>`,
            ]),
        ]
    }
    const list = items.map((item, index) => ({
        id: item.id ?? `item-${index + 1}`,
        title: item.title,
        meta: item.meta,
        timestamp: item.timestamp,
        badge: item.badge,
    }))
    return [
        `    const items: ActivityFeedItem[] = ${jsLiteral(list, "    ")}`,
        ...widgetCard(section.title ?? "Recent activity", [`<ActivityFeed items={items} />`]),
    ]
}

function detailFormWidgetBody(section, componentName) {
    const fieldId = `${componentName.toLowerCase()}-name`
    return [
        `    const [name, setName] = useState("")`,
        ...widgetCard(section.title ?? "Details", [
            `<form`,
            `    className={styles.form}`,
            `    onSubmit={(event) => {`,
            `        event.preventDefault()`,
            `    }}`,
            `>`,
            `    <div className={styles.field}>`,
            `        <Label htmlFor="${fieldId}">Name</Label>`,
            `        <Input`,
            `            id="${fieldId}"`,
            `            value={name}`,
            `            onChange={(event) => setName(event.target.value)}`,
            `            placeholder="Replace with the record's real fields"`,
            `        />`,
            `    </div>`,
            `    <Button type="submit">Save</Button>`,
            `</form>`,
        ]),
    ]
}

function settingsGroupsWidgetBody(section, componentName) {
    const fieldId = `${componentName.toLowerCase()}-example`
    return [
        `    return (`,
        `        <SettingsGroups>`,
        `            <SettingsGroup`,
        `                title=${jsxString(section.title ?? "Settings")}`,
        ...(section.description ? [`                description=${jsxString(section.description)}`] : []),
        `            >`,
        `                <SettingsRow`,
        `                    label="Example setting"`,
        `                    description="Replace with a real preference."`,
        `                    htmlFor="${fieldId}"`,
        `                >`,
        `                    <Input id="${fieldId}" placeholder="Value" />`,
        `                </SettingsRow>`,
        `            </SettingsGroup>`,
        `        </SettingsGroups>`,
        `    )`,
    ]
}

function filtersToolbarWidgetBody() {
    return [
        `    const [search, setSearch] = useState("")`,
        `    const [status, setStatus] = useState<string | undefined>(undefined)`,
        `    return (`,
        `        <FiltersToolbar`,
        `            search={{ value: search, onChange: setSearch, placeholder: "Search..." }}`,
        `            filters={[`,
        `                {`,
        `                    id: "status",`,
        `                    label: "Status",`,
        `                    value: status,`,
        `                    onChange: setStatus,`,
        `                    options: [`,
        `                        { id: "active", label: "Active" },`,
        `                        { id: "archived", label: "Archived" },`,
        `                    ],`,
        `                },`,
        `            ]}`,
        `        />`,
        `    )`,
    ]
}

function listDetailWidgetBody(section) {
    const empty = section.description ?? "Choose an item from the list."
    return [
        `    return (`,
        `        <ListDetailLayout`,
        `            list={<EmptyState title="List" description="Render selectable rows here." />}`,
        `            emptyDetail={{`,
        `                title: "Nothing selected",`,
        `                description: ${JSON.stringify(empty)},`,
        `            }}`,
        `        />`,
        `    )`,
    ]
}

function unknownWidgetBody(section) {
    return [
        ...widgetCard(section.title ?? section.type, [
            `<EmptyState`,
            `    title="Build this widget"`,
            `    description=${jsxString(section.description ?? DEFAULT_WIDGET_HINT)}`,
            `/>`,
        ]),
    ]
}

function widgetBody(section, componentName) {
    switch (section.type) {
        case "stat-cards":
            return statCardsWidgetBody(section)
        case "chart":
            return chartWidgetBody(section)
        case "data-table":
            return dataTableWidgetBody(section)
        case "activity-feed":
            return activityFeedWidgetBody(section)
        case "detail-form":
            return detailFormWidgetBody(section, componentName)
        case "settings-groups":
            return settingsGroupsWidgetBody(section, componentName)
        case "filters-toolbar":
            return filtersToolbarWidgetBody()
        case "list-detail":
            return listDetailWidgetBody(section)
        default:
            return unknownWidgetBody(section)
    }
}

/**
 * A destination that carries a `sections[]` scaffold renders it instead of
 * the blueprint stub: one working placeholder widget per chosen section,
 * built from the kernel components that widget type maps to (`stat-cards` →
 * StatCardRow, `chart` → ChartCard, `data-table` → DataTable, ...), so the
 * screen reflects the setup-chosen composition before any agent runs. Each
 * widget function is the agent's mutation target: swap the placeholder data
 * for real queries, keep the component.
 */
/**
 * The page-body widget lines, honoring `span`: consecutive `span: "half"`
 * sections pair up inside a responsive two-column row; everything else
 * stacks full-width. A lone half (no partner) renders full-width — the
 * layout never leaves a hole.
 */
function renderWidgetTree(widgets) {
    const lines = []
    let index = 0
    while (index < widgets.length) {
        const { section, componentName } = widgets[index]
        const partner = widgets[index + 1]
        if (section.span === "half" && partner?.section.span === "half") {
            lines.push(`            <div className={styles.splitRow}>`)
            lines.push(`                <${componentName} />`)
            lines.push(`                <${partner.componentName} />`)
            lines.push(`            </div>`)
            index += 2
            continue
        }
        lines.push(`            <${componentName} />`)
        index += 1
    }
    return lines
}

function sectionsStub(dest, name) {
    const usedComponentNames = new Set()
    const widgets = dest.sections.map((section) => {
        let componentName = `${pascalCase(section.id ?? section.type)}Widget`
        let suffix = 2
        while (usedComponentNames.has(componentName)) {
            componentName = `${pascalCase(section.id ?? section.type)}Widget${suffix}`
            suffix += 1
        }
        usedComponentNames.add(componentName)
        return { section, componentName }
    })

    const uiImports = new Set()
    const reactImports = new Set()
    for (const { section } of widgets) {
        const imports = widgetImports(section)
        for (const entry of imports.ui) uiImports.add(entry)
        for (const entry of imports.react ?? []) reactImports.add(entry)
    }
    const sortedUi = [...uiImports].sort((a, b) => {
        const aType = a.startsWith("type ")
        const bType = b.startsWith("type ")
        if (aType !== bType) return aType ? 1 : -1
        return a.localeCompare(b)
    })
    const reactImport =
        reactImports.size > 0
            ? `import React, { ${[...reactImports].sort().join(", ")} } from "react"`
            : `import React from "react"`

    const rubric = widgets
        .map(({ section }, index) => {
            const title = section.title ? ` ${JSON.stringify(section.title)}` : ""
            const description = section.description ? ` — ${section.description}` : ""
            return ` *   ${index + 1}. ${section.id ?? section.type} (type: "${section.type}")${title}${description}`
        })
        .join("\n")

    const widgetFunctions = widgets
        .map(({ section, componentName }) => {
            const label = section.title ? ` — ${JSON.stringify(section.title)}` : ""
            return [
                `/** ${section.type}${label} */`,
                `function ${componentName}(): React.ReactElement {`,
                ...widgetBody(section, componentName),
                `}`,
            ].join("\n")
        })
        .join("\n\n")

    return `import { ${sortedUi.join(", ")} } from "@ui"
${reactImport}
import * as styles from "./${name}Page.styles.css"

${stubHeader(dest)}
/**
 * Setup-chosen composition (repobot.project.json):
${rubric}
 *
 * Each widget below is a working placeholder on the kernel component that
 * section type maps to — replace the placeholder data with real queries and
 * keep the component.
 */
export default function ${name}Page(): React.ReactElement {
    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>${dest.label}</h1>
            </header>
${renderWidgetTree(widgets).join("\n")}
        </section>
    )
}

${widgetFunctions}
`
}

function customStub(dest, name) {
    return `import { EmptyState } from "@ui"
import React from "react"
import * as styles from "./${name}Page.styles.css"

${stubHeader(dest)}
export default function ${name}Page(): React.ReactElement {
    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>${dest.label}</h1>
            </header>
            <EmptyState
                title="Build this destination"
                description="Compose it from @ui primitives per docs/web-app.md."
            />
        </section>
    )
}
`
}

function stylesStub() {
    return `import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const page = style({
    display: "grid",
    gap: vars.space.lg,
    padding: vars.space.lg,
})

export const header = style({
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
})

export const title = style({
    margin: 0,
    fontSize: vars.fontSize.xl,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const cardRow = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
    gap: vars.space.md,
})

export const card = style({
    display: "grid",
    gap: vars.space.xs,
    padding: vars.space.md,
    background: vars.color.surface,
    border: \`1px solid \${vars.color.border}\`,
    borderRadius: vars.radius.md,
})

export const cardLabel = style({
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const cardValue = style({
    fontSize: vars.fontSize.lg,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const form = style({
    display: "grid",
    gap: vars.space.md,
    maxWidth: "28rem",
})

export const field = style({
    display: "grid",
    gap: vars.space.xs,
})

export const widget = style({
    display: "grid",
    gap: vars.space.md,
    padding: vars.space.md,
    background: vars.color.surface,
    border: \`1px solid \${vars.color.border}\`,
    borderRadius: vars.radius.md,
})

export const widgetHeader = style({
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: vars.space.md,
})

export const widgetTitle = style({
    margin: 0,
    fontSize: vars.fontSize.md,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const widgetType = style({
    fontSize: vars.fontSize.xs,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: vars.color.textSecondary,
})

export const splitRow = style({
    display: "grid",
    gap: vars.space.lg,
    gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))",
    alignItems: "start",
})
`
}

const STUB_BUILDERS = {
    overview: overviewStub,
    table: tableStub,
    settings: settingsStub,
    custom: customStub,
}

/**
 * Run the scaffolder against a repo root. Returns a summary of what happened
 * so callers (and tests) can assert on it.
 */
export function runScaffold(repoRoot) {
    const { destinations } = readManifest(repoRoot)
    const summary = { createdFiles: [], skippedFiles: [], updatedFiles: [] }

    const routerPath = path.join(repoRoot, ROUTER_FILE)
    const appPath = path.join(repoRoot, APP_FILE)
    const navPath = path.join(repoRoot, NAV_FILE)
    const router = readFileSync(routerPath, "utf8")
    const app = readFileSync(appPath, "utf8")
    const nav = readFileSync(navPath, "utf8")

    // Collisions with hand-written code outside the managed blocks fail the
    // run: silently shadowing an existing route or component would be the
    // opposite of deterministic.
    const routerRest = withoutManagedBlocks(router)
    const appRest = withoutManagedBlocks(app)
    for (const dest of destinations) {
        const key = camelCase(dest.id)
        if (new RegExp(`^\\s*${key}:`, "m").test(routerRest)) {
            throw new Error(
                `destination "${dest.id}" collides with existing route key "${key}" in ${ROUTER_FILE}`,
            )
        }
        if (routerRest.includes(`"${dest.path}"`)) {
            throw new Error(
                `destination "${dest.id}" collides with existing path "${dest.path}" in ${ROUTER_FILE}`,
            )
        }
        if (appRest.includes(`const ${pascalCase(dest.id)}Page`)) {
            throw new Error(
                `destination "${dest.id}" collides with existing component "${pascalCase(dest.id)}Page" in ${APP_FILE}`,
            )
        }
    }

    const nextRouter = replaceManagedBlock(router, "routes", routerBlockLines(destinations))
    let nextApp = replaceManagedBlock(app, "page-imports", importBlockLines(destinations))
    nextApp = replaceManagedBlock(nextApp, "protected-routes", routeBlockLines(destinations))
    let nextNav = replaceManagedBlock(nav, "nav-sections", navBlockLines(destinations))

    // A manifest with real destinations replaces the kernel's Projects/Users
    // exemplar rather than sitting beside it. (The `users`/`projects` route
    // KEYS stay in Router.ts — postAuthRoutePath's raw-kernel fallback
    // references them — but nothing routes or links to them anymore.)
    if (destinations.length > 0) {
        nextApp = stripExemplarBlock(nextApp, "exemplar-imports")
        nextApp = stripExemplarBlock(nextApp, "exemplar-routes")
        nextNav = stripExemplarBlock(nextNav, "exemplar-nav")
    }

    for (const [filePath, before, after] of [
        [routerPath, router, nextRouter],
        [appPath, app, nextApp],
        [navPath, nav, nextNav],
    ]) {
        if (before !== after) {
            writeFileSync(filePath, after)
            summary.updatedFiles.push(path.relative(repoRoot, filePath))
        }
    }

    for (const dest of destinations) {
        const name = pascalCase(dest.id)
        const dir = path.join(repoRoot, VIEW_DIR, name)
        const pagePath = path.join(dir, `${name}Page.tsx`)
        const stylesPath = path.join(dir, `${name}Page.styles.css.ts`)
        if (existsSync(pagePath)) {
            summary.skippedFiles.push(path.relative(repoRoot, pagePath))
            continue
        }
        mkdirSync(dir, { recursive: true })
        const builder = dest.sections?.length ? sectionsStub : STUB_BUILDERS[dest.blueprint]
        writeFileSync(pagePath, builder(dest, name))
        summary.createdFiles.push(path.relative(repoRoot, pagePath))
        if (!existsSync(stylesPath)) {
            writeFileSync(stylesPath, stylesStub())
            summary.createdFiles.push(path.relative(repoRoot, stylesPath))
        }
    }

    return { destinations, summary }
}

function mobileParityReminder(repoRoot) {
    const deployPath = path.join(repoRoot, DEPLOY_FILE)
    if (!existsSync(deployPath)) return false
    try {
        const capabilities = JSON.parse(readFileSync(deployPath, "utf8")).capabilities ?? []
        return capabilities.includes("IOS") || capabilities.includes("ANDROID")
    } catch {
        return false
    }
}

function main() {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const { destinations, summary } = runScaffold(repoRoot)
    console.log(`scaffold:ia — ${destinations.length} dashboard destination(s) in ${MANIFEST_FILE}`)
    for (const file of summary.updatedFiles) console.log(`  wired   ${file}`)
    for (const file of summary.createdFiles) console.log(`  created ${file}`)
    for (const file of summary.skippedFiles) console.log(`  kept    ${file} (already exists)`)
    if (destinations.length > 0 && mobileParityReminder(repoRoot)) {
        console.log(
            "  note: this repo ships mobile apps — mirror these destinations in the iOS/Android " +
                "shell nav binders (KernelShellView), replacing their Projects/Users exemplar entries (docs/shell.md).",
        )
    }
    if (destinations.length > 0) {
        console.log(
            "  reach: the marketing site's nav CTA now points at the first destination — the " +
                "dashboard is one click from the home page, no hand-wired links needed.",
        )
        console.log(
            "  verify: `npm run typecheck` confirms the wiring. Generated pages and routes are " +
                "already covered by the kernel's scaffold contract tests — do NOT run test suites " +
                "for scaffolded pages or manifest/theme edits; suites are only worth their minutes " +
                "when you changed shared kernel code (web/core, web/design-system).",
        )
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main()
}

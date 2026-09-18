// Contract tests for the IA scaffolder (docs/project-ia.md). They run against
// copies of the repo's REAL Router.ts / App.tsx / shellNavSections.tsx, so
// they fail if someone deletes the <ia:*> managed markers those files must
// carry — the scaffolder's whole determinism story rests on them.
//
// Run: npm run test:scaffold

import assert from "node:assert/strict"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import {
    pascalCase,
    camelCase,
    replaceManagedBlock,
    runScaffold,
    stripExemplarBlock,
} from "./scaffold-ia.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const WIRED_FILES = [
    "web/app/src/Config/Router.ts",
    "web/app/src/App.tsx",
    "web/app/src/View/Navbar/shellNavSections.tsx",
]

const MANIFEST = {
    marketing: {
        preset: "dark-dev",
        pages: [{ id: "home", path: "/", title: "Home", blueprint: "landing" }],
    },
    dashboard: {
        destinations: [
            { id: "overview", path: "/overview", label: "Overview", blueprint: "overview" },
            { id: "work-orders", path: "/work-orders", label: "Work orders", blueprint: "table" },
            { id: "preferences", path: "/preferences", label: "Preferences", blueprint: "settings" },
        ],
    },
}

// A dev-pack switch (scripts/lib/pack-switch.mjs) stamps the wired files —
// including the non-convergent exemplar strip — and snapshots the pristine
// bytes to .dev/studio-overlay.json. Prefer that snapshot so these tests see
// the raw kernel whichever pack is active in the checkout.
const overlayPristine = (() => {
    const statePath = path.join(repoRoot, ".dev", "studio-overlay.json")
    try {
        return JSON.parse(readFileSync(statePath, "utf8")).pristine ?? {}
    } catch {
        return {}
    }
})()

/**
 * Whether the checkout's wired files still carry the kernel's Projects/Users
 * exemplar. In a project where scaffold:ia already ran, the exemplar strip
 * (deliberately non-convergent) removed it — the exemplar-presupposing tests
 * below must SKIP there, not fail: a workspace agent that scaffolds a
 * dashboard and then runs this suite pre-commit must see an honest green.
 */
const exemplarWired = (() => {
    const source =
        overlayPristine["web/app/src/App.tsx"] ??
        readFileSync(path.join(repoRoot, "web/app/src/App.tsx"), "utf8")
    return source.includes("<ia:exemplar-imports>")
})()

/** A scratch repo with the real wired files and a test manifest. */
function makeScratchRepo(manifest = MANIFEST) {
    const root = mkdtempSync(path.join(os.tmpdir(), "scaffold-ia-"))
    for (const file of WIRED_FILES) {
        mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
        if (overlayPristine[file] !== undefined) {
            writeFileSync(path.join(root, file), overlayPristine[file])
        } else {
            cpSync(path.join(repoRoot, file), path.join(root, file))
        }
    }
    writeFileSync(path.join(root, "repobot.project.json"), JSON.stringify(manifest, null, 4))
    return root
}

function readAll(root) {
    return Object.fromEntries(WIRED_FILES.map((file) => [file, readFileSync(path.join(root, file), "utf8")]))
}

test("name casing", () => {
    assert.equal(pascalCase("work-orders"), "WorkOrders")
    assert.equal(camelCase("work-orders"), "workOrders")
    assert.equal(pascalCase("invoices"), "Invoices")
})

test("replaceManagedBlock rejects missing markers", () => {
    assert.throws(() => replaceManagedBlock("no markers here", "routes", []), /markers not found/)
})

test("scaffold wires routes, imports, protected routes, and nav from the manifest", () => {
    const root = makeScratchRepo()
    try {
        const { summary } = runScaffold(root)
        const files = readAll(root)

        const router = files["web/app/src/Config/Router.ts"]
        assert.ok(router.includes('workOrders: { path: "/work-orders" },'), "route key missing")

        const app = files["web/app/src/App.tsx"]
        assert.ok(
            app.includes('const WorkOrdersPage = lazy(() => import("./View/WorkOrders/WorkOrdersPage"))'),
            "lazy import missing",
        )
        assert.ok(
            app.includes("<Route path={routes.workOrders.path} element={<WorkOrdersPage />} />"),
            "protected route missing",
        )
        // Managed routes must land inside the ProtectedRoutes subtree.
        const protectedStart = app.indexOf("<ProtectedRoutes />")
        assert.ok(app.indexOf("<WorkOrdersPage />") > protectedStart, "route not inside ProtectedRoutes")

        const nav = files["web/app/src/View/Navbar/shellNavSections.tsx"]
        assert.ok(nav.includes('id: "product"'), "nav section missing")
        assert.ok(nav.includes('label: "Work orders",'), "nav label missing")
        assert.ok(nav.includes("id: routes.workOrders.path,"), "nav item id missing")

        // One stub page + styles per destination.
        for (const name of ["Overview", "WorkOrders", "Preferences"]) {
            assert.ok(
                summary.createdFiles.includes(`web/app/src/View/${name}/${name}Page.tsx`),
                `${name} stub missing`,
            )
        }
        const tableStub = readFileSync(
            path.join(root, "web/app/src/View/WorkOrders/WorkOrdersPage.tsx"),
            "utf8",
        )
        assert.ok(tableStub.includes("DataTable"), "table blueprint should use DataTable")
        assert.ok(tableStub.includes("export default function WorkOrdersPage"), "stub component name wrong")
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("a destination with a sections scaffold renders the chosen widgets, not the blueprint stub", () => {
    const root = makeScratchRepo({
        marketing: { preset: "dark-dev", pages: [] },
        dashboard: {
            destinations: [
                {
                    id: "orders",
                    path: "/orders",
                    label: "Orders",
                    blueprint: "table",
                    sections: [
                        { id: "kpis", type: "stat-cards", title: "Orders this week" },
                        {
                            id: "list",
                            type: "data-table",
                            title: "All orders",
                            description: "Every order with status and total.",
                        },
                    ],
                },
            ],
        },
    })
    try {
        runScaffold(root)
        const stub = readFileSync(path.join(root, "web/app/src/View/Orders/OrdersPage.tsx"), "utf8")
        // The rubric comment carries the setup-chosen composition verbatim.
        assert.ok(stub.includes('kpis (type: "stat-cards") "Orders this week"'), "rubric line missing")
        assert.ok(
            stub.includes("Every order with status and total."),
            "section description must ride into the stub",
        )
        // Each section renders a working placeholder on its kernel component,
        // one widget function per section.
        assert.ok(stub.includes("<KpisWidget />"), "stat-cards widget not composed into the page")
        assert.ok(stub.includes("<ListWidget />"), "data-table widget not composed into the page")
        assert.ok(stub.includes("StatCardRow"), "stat-cards must render on StatCardRow")
        assert.ok(stub.includes("DataTable"), "data-table must render on DataTable")
        assert.ok(stub.includes('{"All orders"}'), "section title must ride into the widget chrome")
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("content-bearing sections render real values on the kernel components", () => {
    const root = makeScratchRepo({
        marketing: { preset: "dark-dev", pages: [] },
        dashboard: {
            destinations: [
                {
                    id: "overview",
                    path: "/overview",
                    label: "Overview",
                    blueprint: "overview",
                    sections: [
                        {
                            id: "kpis",
                            type: "stat-cards",
                            cards: [
                                {
                                    label: "Revenue",
                                    value: "$1,384,000",
                                    hint: "vs $1,318,000 last month",
                                    delta: { value: "+5.0%", direction: "up" },
                                    tone: "accent",
                                    trend: [980, 1040, 1120, 1210, 1384],
                                },
                                {
                                    label: "Churn",
                                    value: "2.1%",
                                    delta: { value: "+0.3", direction: "up", upIsPositive: false },
                                },
                            ],
                        },
                        {
                            id: "revenue-trend",
                            type: "chart",
                            title: "Revenue & profit",
                            span: "half",
                            chart: {
                                kind: "bar",
                                unit: "$",
                                stacked: true,
                                series: [
                                    {
                                        label: "Revenue",
                                        points: [
                                            { x: "Jul", y: 1210000 },
                                            { x: "Aug", y: 1318000 },
                                        ],
                                    },
                                    {
                                        label: "Profit",
                                        points: [
                                            { x: "Jul", y: 512000 },
                                            { x: "Aug", y: 555000 },
                                        ],
                                    },
                                ],
                            },
                        },
                        {
                            id: "plan-mix",
                            type: "chart",
                            title: "Revenue by plan",
                            span: "half",
                            chart: {
                                kind: "donut",
                                legendValues: true,
                                series: [
                                    {
                                        label: "Plans",
                                        points: [
                                            { x: "Enterprise", y: 552000 },
                                            { x: "Pro", y: 414000 },
                                        ],
                                    },
                                ],
                            },
                        },
                        {
                            id: "aging",
                            type: "data-table",
                            title: "Customer aging",
                            table: {
                                columns: [
                                    { id: "customer", header: "Customer" },
                                    { id: "current", header: "Current" },
                                    { id: "overdue", header: "61+ days" },
                                ],
                                rows: [
                                    { customer: "NovaTech", current: "$12,400", overdue: "$0" },
                                    { customer: "Brightline", current: "$8,900", overdue: "$2,100" },
                                ],
                            },
                        },
                        {
                            id: "activity",
                            type: "activity-feed",
                            items: [
                                {
                                    title: "Invoice #1042 paid",
                                    meta: "NovaTech",
                                    timestamp: "2h ago",
                                    badge: { label: "Paid", tone: "success" },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    })
    try {
        runScaffold(root)
        const stub = readFileSync(path.join(root, "web/app/src/View/Overview/OverviewPage.tsx"), "utf8")
        // Stat cards carry the manifest's values, deltas, tones, sparklines.
        assert.ok(stub.includes('value={"$1,384,000"}'), "card value must render verbatim")
        assert.ok(stub.includes('delta={{ value: "+5.0%", direction: "up" }}'), "delta must serialize")
        assert.ok(stub.includes("trend={[980, 1040, 1120, 1210, 1384]}"), "trend must serialize inline")
        assert.ok(stub.includes("upIsPositive: false"), "upIsPositive must survive")
        // Charts carry kind, series data, unit formatter, and flags.
        assert.ok(stub.includes('kind={"bar"}'), "chart kind must ride in")
        assert.ok(stub.includes('{ x: "Jul", y: 1210000 }'), "series points must serialize")
        assert.ok(
            stub.includes("valueFormatter={(value) => `$${value.toLocaleString()}`}"),
            "$ unit → prefix formatter",
        )
        assert.ok(stub.includes("stacked"), "stacked flag must ride in")
        assert.ok(stub.includes("legendValues"), "legendValues flag must ride in")
        // Tables carry typed rows from the manifest.
        assert.ok(stub.includes("customer: string"), "row interface must derive from columns")
        assert.ok(stub.includes('customer: "NovaTech"'), "rows must serialize")
        assert.ok(stub.includes('header: "61+ days"'), "column headers must serialize")
        // The feed carries items with badges.
        assert.ok(stub.includes('title: "Invoice #1042 paid"'), "feed items must serialize")
        assert.ok(stub.includes('badge: { label: "Paid", tone: "success" }'), "badges must serialize")
        // Consecutive halves pair into a split row.
        assert.ok(stub.includes("styles.splitRow"), "half sections must pair into a split row")
        assert.ok(
            /splitRow\}>\s*<RevenueTrendWidget \/>\s*<PlanMixWidget \/>/.test(stub),
            "the two half charts must share one row",
        )
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("content validation fails loudly on bad shapes", () => {
    const badSections = [
        [{ id: "k", type: "stat-cards", cards: [{ label: "x" }] }, /needs a string label and a value/],
        [
            { id: "k", type: "stat-cards", cards: [{ label: "x", value: "1", tone: "purple" }] },
            /tone must be/,
        ],
        [{ id: "c", type: "chart", chart: { series: [] } }, /non-empty array/],
        [
            {
                id: "c",
                type: "chart",
                chart: { kind: "scatter", series: [{ label: "a", points: [{ x: 1, y: 2 }] }] },
            },
            /chart.kind must be/,
        ],
        [
            { id: "t", type: "data-table", table: { columns: [{ id: "Bad-Id", header: "X" }] } },
            /camelCase id/,
        ],
        [{ id: "s", type: "stat-cards", span: "third" }, /span must be/],
        [{ id: "a", type: "activity-feed", items: [{ meta: "no title" }] }, /items must be/],
    ]
    for (const [section, message] of badSections) {
        const root = makeScratchRepo({
            dashboard: {
                destinations: [
                    { id: "page", path: "/page", label: "Page", blueprint: "custom", sections: [section] },
                ],
            },
        })
        try {
            assert.throws(() => runScaffold(root), message, JSON.stringify(section))
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    }
})

test("re-running converges and never overwrites stub edits", () => {
    const root = makeScratchRepo()
    try {
        runScaffold(root)
        const stubPath = path.join(root, "web/app/src/View/Overview/OverviewPage.tsx")
        const customized = "// customer-owned now\n" + readFileSync(stubPath, "utf8")
        writeFileSync(stubPath, customized)
        const firstPass = readAll(root)

        const { summary } = runScaffold(root)
        assert.deepEqual(readAll(root), firstPass, "second run must not change wired files")
        assert.equal(readFileSync(stubPath, "utf8"), customized, "stub edits must survive re-runs")
        assert.equal(summary.createdFiles.filter((file) => file.endsWith("OverviewPage.tsx")).length, 0)
        assert.ok(summary.skippedFiles.includes("web/app/src/View/Overview/OverviewPage.tsx"))
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("stripExemplarBlock removes markers and body, and is a no-op without them", () => {
    const source = "keep\n// <ia:exemplar-nav>\ngone\n// </ia:exemplar-nav>\nkeep too"
    assert.equal(stripExemplarBlock(source, "exemplar-nav"), "keep\nkeep too")
    assert.equal(stripExemplarBlock("no markers", "exemplar-nav"), "no markers")
})

test("declared destinations replace the kernel Projects/Users exemplar", (t) => {
    if (!exemplarWired) {
        return t.skip("exemplar already stripped from this checkout (scaffold:ia ran here)")
    }
    const root = makeScratchRepo()
    try {
        runScaffold(root)
        const files = readAll(root)
        const app = files["web/app/src/App.tsx"]
        const nav = files["web/app/src/View/Navbar/shellNavSections.tsx"]
        // The exemplar is gone from the nav and route tables — a composed
        // product's sidebar shows its product IA, not the kernel demo.
        assert.ok(!nav.includes('"Projects"') && !nav.includes('"Users"'), "exemplar nav must be stripped")
        assert.ok(!nav.includes('id: "workspace"'), "exemplar workspace section must be stripped")
        assert.ok(
            !app.includes("<UsersPage />") && !app.includes("<ProjectsPage />"),
            "exemplar routes must be stripped",
        )
        assert.ok(!app.includes("const ProjectsPage"), "exemplar lazy imports must be stripped")
        // The account section and settings route survive.
        assert.ok(nav.includes('id: "account"'), "account section must survive the strip")
        assert.ok(app.includes("<SettingsPage />"), "settings route must survive the strip")
        // Re-running after the strip converges (markers gone = no-op).
        const firstPass = readAll(root)
        runScaffold(root)
        assert.deepEqual(readAll(root), firstPass, "second run must converge")
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("the raw kernel (no destinations) keeps the exemplar wired", (t) => {
    if (!exemplarWired) {
        return t.skip("exemplar already stripped from this checkout (scaffold:ia ran here)")
    }
    const root = makeScratchRepo({
        marketing: { preset: "dark-dev", pages: [] },
        dashboard: { destinations: [] },
    })
    try {
        runScaffold(root)
        const files = readAll(root)
        assert.ok(files["web/app/src/View/Navbar/shellNavSections.tsx"].includes('id: "workspace"'))
        assert.ok(files["web/app/src/App.tsx"].includes("<ProjectsPage />"))
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("empty manifest is a no-op that leaves the wired files unchanged", () => {
    const root = makeScratchRepo({
        marketing: { preset: "dark-dev", pages: [] },
        dashboard: { destinations: [] },
    })
    try {
        const before = readAll(root)
        const { summary } = runScaffold(root)
        assert.deepEqual(readAll(root), before)
        assert.deepEqual(summary.createdFiles, [])
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("collisions with hand-written routes fail loudly", () => {
    // "settings" survives the exemplar strip, so this collision exists in
    // every checkout state — raw kernel and already-scaffolded alike.
    const root = makeScratchRepo({
        marketing: { preset: "dark-dev", pages: [] },
        dashboard: {
            destinations: [{ id: "settings", path: "/settings", label: "Settings", blueprint: "table" }],
        },
    })
    try {
        assert.throws(() => runScaffold(root), /collides with existing route key "settings"/)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("manifest validation rejects bad ids, paths, and blueprints", () => {
    const cases = [
        [{ id: "Bad Id", path: "/x", label: "X", blueprint: "table" }, /lowercase kebab-case/],
        [{ id: "x", path: "no-slash", label: "X", blueprint: "table" }, /absolute path/],
        [{ id: "x", path: "/x", label: "", blueprint: "table" }, /needs a label/],
        [{ id: "x", path: "/x", label: "X", blueprint: "wat" }, /is not one of/],
    ]
    for (const [destination, expected] of cases) {
        const root = makeScratchRepo({
            marketing: { preset: "dark-dev", pages: [] },
            dashboard: { destinations: [destination] },
        })
        try {
            assert.throws(() => runScaffold(root), expected)
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    }
})

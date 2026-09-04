import { readdirSync, readFileSync, statSync, unwatchFile, watchFile, type Stats } from "node:fs"
import http from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin, type ProxyOptions } from "vite"
import { templateStudio } from "./dev/templateStudio"
import { optimizeDepsInclude } from "./optimizeDepsInclude.mjs"
import { manifestDispatchPlan } from "./src/Dev/manifestDispatchPlan"

const dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dirname, "../..")

/**
 * Dev-only source attribution for the platform's "point at what you mean"
 * picker: every host (lowercase) JSX element gets data-rb-source="file:line",
 * so when a user clicks an element in the live preview, the selection the
 * agent receives names the exact file and line that rendered it — no
 * selector archaeology. Host elements only: a component's own tag carries
 * the component FILE's location via whatever host root it renders, which is
 * the actionable one. React 19 dropped fiber _debugSource, so this
 * attribute is the only reliable source signal in the DOM.
 */
function rbSourceAttributionBabelPlugin({ types: t }: { types: typeof import("@babel/types") }): object {
    type JSXOpeningElement = import("@babel/types").JSXOpeningElement
    return {
        name: "rb-source-attribution",
        visitor: {
            JSXOpeningElement(
                elementPath: { node: JSXOpeningElement },
                state: { file: { opts: { filename?: string } } },
            ): void {
                const node = elementPath.node
                if (node.name.type !== "JSXIdentifier" || !/^[a-z]/.test(node.name.name)) {
                    return
                }
                const filename = state.file.opts.filename ?? ""
                if (!filename || filename.includes("node_modules")) {
                    return
                }
                if (!node.loc) {
                    return
                }
                if (
                    node.attributes.some(
                        (attr) =>
                            attr.type === "JSXAttribute" &&
                            attr.name.type === "JSXIdentifier" &&
                            attr.name.name === "data-rb-source",
                    )
                ) {
                    return
                }
                node.attributes.push(
                    t.jsxAttribute(
                        t.jsxIdentifier("data-rb-source"),
                        t.stringLiteral(`${path.relative(repoRoot, filename)}:${node.loc.start.line}`),
                    ),
                )
            },
        },
    }
}

// The repo-root contract manifests are imported as build-time JSON but live
// outside this package, beyond Vite's default watch scope — an edit to them
// would otherwise keep serving the old bundle until a source file under
// web/app happens to change, which reads as "my change didn't work".
//
// REPOBOT_ROOT_MANIFEST_DIR points the WATCHER at a scratch copy of these
// files. Only the watcher test sets it: the test mutates manifests to prove
// flip/reload behavior, and mutating the COMMITTED copies races every
// parallel vitest worker that imports them (packs/active.json flipped to
// photography for one poll interval failed a composed template's publish
// gate on landingDocument.test's fidelity assertion). Never set outside
// tests — the app's own imports still resolve the real repo root.
const manifestRoot = process.env.REPOBOT_ROOT_MANIFEST_DIR ?? repoRoot

const ROOT_MANIFESTS = [
    "repobot.project.json",
    "repobot.theme.json",
    "repobot.landing.json",
    // The business-content contract: accepted one importer deep
    // (contentDocument.ts) and hot-applies, exactly like the landing doc.
    "repobot.content.json",
    // Glob-imported (absent in the kernel tree): capability-gated chrome
    // reads it via Config/deployCapabilities.ts.
    "repobot.deploy.json",
    "packs/active.json",
].map((relativePath) => path.resolve(manifestRoot, relativePath))

const THEME_JSON_PATH = path.resolve(manifestRoot, "repobot.theme.json")

/** The custom HMR event carrying a live repobot.theme.json contract; the
 * design system listens in themeHotUpdate.ts. */
const THEME_CONTRACT_EVENT = "repobot:theme-contract"

/** The hot-applying visual documents (accepted one importer deep by their
 * renderer modules, which ack "visual-applied" to the platform preview).
 * Their changes are ALSO broadcast by name as this custom event: Vite's
 * module update only reaches clients whose graph loaded the renderer, so a
 * client on any other route applies nothing and acks nothing — the
 * platform's repaint watchdog then escalates an already-truthful paint into
 * a multi-second buffered swap (remix on an app dashboard writes
 * repobot.landing.json for the site's marketing pages nobody is looking
 * at). The design system's always-loaded fallback (themeHotUpdate.ts)
 * hears the broadcast and acks vacuously exactly when the renderer isn't
 * loaded. */
const VISUAL_DOC_CHANGED_EVENT = "repobot:visual-doc-changed"

/** Announces an ack-bearing document's write sequence — the changed file's
 * mtime, the same clock the pod reports for its preview-writes — to every
 * client BEFORE the apply event (theme contract / module update /
 * vacuous-ack broadcast). themeHotUpdate.ts records it so every
 * visual-applied ack is stamped with the sequence it applied; the platform
 * preview correlates its "Updating preview…" arm against it, which is what
 * keeps a rapid-fire remix burst's coalesced or reordered acks from
 * wedging (or falsely clearing) the overlay. */
const VISUAL_DOC_WILL_APPLY_EVENT = "repobot:visual-doc-will-apply"
const RENDERED_DOC_PATHS = ["repobot.landing.json", "repobot.content.json"].map((relativePath) =>
    path.resolve(manifestRoot, relativePath),
)

/** Parses a manifest, tolerating the half-written state a non-atomic save
 * can leave behind (the stat-poller may fire mid-write; the next 300ms tick
 * re-reads the finished file). */
function readManifestJson(manifestPath: string): unknown {
    try {
        return JSON.parse(readFileSync(manifestPath, "utf8")) as unknown
    } catch {
        return undefined
    }
}

/** Absolute path of packs/active.json — the file a template flip rewrites. */
const ACTIVE_PACK_PATH = path.resolve(manifestRoot, "packs/active.json")

/**
 * Page-module URLs for the pack a flip just activated. Pack keys don't map
 * 1:1 onto View directories (games nest under View/Games, "chat" lives in
 * AiChat), so match by case-insensitive path substring: over-matching only
 * warms extra pages, and no match at all falls back to every page so the
 * flip target is never missed.
 *
 * The comparison strips non-alphanumerics from BOTH sides: pack keys are
 * dashed ("services-emergency", "fitness-trainer") while View directories
 * are CamelCase ("ServicesEmergency/") — a raw substring compare never
 * matched any multi-word key, so every such flip silently took the
 * warm-everything fallback and the target pack's pages queued behind the
 * whole catalog's transforms on an already-busy pod.
 */
function packPageUrls(packKey: string): string[] {
    const viewDir = path.resolve(dirname, "src/View")
    let entries: string[]
    try {
        entries = readdirSync(viewDir, { recursive: true }) as string[]
    } catch {
        return []
    }
    const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "")
    const pages = entries.filter((entry) => entry.endsWith("Page.tsx"))
    const needle = normalize(packKey)
    // Segment-wise: pack identity lives in directory / file names; gluing
    // the whole path together could invent matches across segment borders.
    const matched = pages.filter((entry) =>
        entry.split(path.sep).some((segment) => normalize(segment).includes(needle)),
    )
    return (matched.length > 0 ? matched : pages).map(
        (entry) => `/src/View/${entry.split(path.sep).join("/")}`,
    )
}

function watchRootManifests(): Plugin {
    return {
        name: "watch-root-manifests",
        configureServer(server) {
            // stat-polling (fs.watchFile) instead of server.watcher.add: the
            // platform and most editors replace these files via git reset or
            // atomic rename, which swaps the inode. chokidar's file-level
            // watch dies with the old inode and never re-arms, so the first
            // sync after server start is the last event it ever delivers —
            // every later manifest edit silently serves the stale bundle
            // (which reads as "my change didn't work" and once sent a setup
            // agent rewiring the home page around TypeScript to dodge it).
            // Three stat calls every 300ms is negligible; missing an edit
            // is not.
            const registered: [string, (current: Stats, previous: Stats) => void][] = []

            // One shared change ledger instead of each poll timer's private
            // state: a remix press writes repobot.theme.json AND
            // repobot.landing.json together, but fs.watchFile timers are
            // phase-shifted, so the two changes used to apply up to one full
            // poll interval apart — a visible two-step repaint (colors flip,
            // then the sections swap). Whichever poll fires first now sweeps
            // every root manifest through this ledger, so co-written
            // documents dispatch in the same tick and paint together.
            const lastSeen = new Map<string, { mtimeMs: number; size: number }>()
            const statManifest = (manifestPath: string): { mtimeMs: number; size: number } => {
                try {
                    const stats = statSync(manifestPath)
                    return { mtimeMs: stats.mtimeMs, size: stats.size }
                } catch {
                    // Absent files carry the same zeroed stats fs.watchFile
                    // reports for them, so existence changes still register.
                    return { mtimeMs: 0, size: 0 }
                }
            }
            for (const manifestPath of ROOT_MANIFESTS) {
                lastSeen.set(manifestPath, statManifest(manifestPath))
            }

            /** Applies one changed manifest (`seq` is the swept stat's
             * mtime, forwarded to clients as the change's sequence).
             * Returns false to leave the ledger un-advanced so the next
             * poll retries (mid-write JSON). */
            const dispatchManifestChange = (manifestPath: string, seq: number): boolean => {
                // Editing repobot.theme.json or repobot.landing.json must
                // hot-apply, never full-reload: the platform showroom
                // preview-writes both and needs ~1s repaints, not the
                // 30–60s sandbox reload. Only the changed manifest's
                // modules are invalidated — NOT invalidateAll(): a global
                // invalidation discards the optimized-dep state, stranding
                // every connected client on stale /node_modules/.vite/deps/*
                // hashes (504 "Outdated Optimize Dep", pages render an
                // empty root — a setup agent once burned minutes of git
                // archaeology on that phantom).
                const modules = server.moduleGraph.getModulesByFile(manifestPath)

                if (manifestPath === THEME_JSON_PATH) {
                    // The theme contract cannot ride Vite's own HMR
                    // propagation: the vanilla-extract compilation
                    // registers the JSON as a dependency of every compiled
                    // .css.ts module (none of which can accept it), and
                    // import-analysis skips .json modules so the JSON can
                    // never self-accept either. Instead, ship the parsed
                    // contract over a custom HMR event; the design system
                    // (themeHotUpdate.ts) re-applies the dynamic tokens as
                    // CSS custom properties and re-renders the structural
                    // presets through useThemeContract(). The module is
                    // still invalidated so the next real (re)load bakes
                    // fresh values.
                    const contract = readManifestJson(manifestPath)
                    if (contract !== undefined) {
                        for (const mod of modules ?? []) {
                            server.moduleGraph.invalidateModule(mod)
                        }
                        server.config.logger.info(
                            `root manifest changed, hot update: ${path.basename(manifestPath)}`,
                            { timestamp: true },
                        )
                        server.ws.send({
                            type: "custom",
                            event: VISUAL_DOC_WILL_APPLY_EVENT,
                            data: { doc: path.basename(manifestPath), seq },
                        })
                        server.ws.send({
                            type: "custom",
                            event: THEME_CONTRACT_EVENT,
                            data: contract,
                        })
                        return true
                    }
                    // Unparseable: usually a mid-write tick — the next
                    // 300ms poll re-fires once the write finishes. A
                    // permanently broken contract stays un-applied
                    // rather than blanking the page with a reload.
                    server.config.logger.warn(
                        `root manifest changed but is not valid JSON (mid-write?): ${path.basename(manifestPath)}`,
                        { timestamp: true },
                    )
                    return false
                }

                if (manifestPath === ACTIVE_PACK_PATH) {
                    // A template flip: the reload below makes the browser
                    // discover the new pack's modules one import level at
                    // a time — a serial waterfall of cold transforms that
                    // costs tens of seconds on a busy pod. Crawl the same
                    // subtree server-side, in parallel, right now, so the
                    // reload paints from cache (in-flight transforms are
                    // shared with the browser's own requests).
                    const manifest = readManifestJson(manifestPath) as { key?: string } | undefined
                    if (typeof manifest?.key === "string") {
                        for (const url of packPageUrls(manifest.key)) {
                            server.warmupRequest(url)
                        }
                    }
                }

                const plan = manifestDispatchPlan({
                    isRenderedDoc: RENDERED_DOC_PATHS.includes(manifestPath),
                    inModuleGraph: modules !== undefined && modules.size > 0,
                })
                if (RENDERED_DOC_PATHS.includes(manifestPath)) {
                    // Sequence first, apply second: the renderers' acks read
                    // the recorded seq, so it must be on the wire before the
                    // module update (or the broadcast) that triggers them.
                    server.ws.send({
                        type: "custom",
                        event: VISUAL_DOC_WILL_APPLY_EVENT,
                        data: { doc: path.basename(manifestPath), seq },
                    })
                }
                if (plan.propagate) {
                    // Vite's normal propagation: repobot.landing.json is
                    // accepted one importer deep (landingDocument.ts) and
                    // hot-applies; manifests without a boundary
                    // (repobot.project.json, packs/active.json) reach the
                    // entry and Vite falls back to a page reload itself.
                    server.config.logger.info(
                        `root manifest changed, propagating: ${path.basename(manifestPath)}`,
                        { timestamp: true },
                    )
                    for (const mod of modules ?? []) {
                        void server.reloadModule(mod)
                    }
                }
                if (plan.broadcastVisualDocChange) {
                    // Announce the change by name to EVERY client (module
                    // updates only reach those that loaded the renderer —
                    // and a rendered doc in NO graph reaches nobody):
                    // themeHotUpdate.ts acks vacuously for clients with
                    // nothing on screen to repaint. Without this, a remix
                    // press on a dashboard template (which never imports the
                    // landing renderer) used to full-reload every client —
                    // a multi-second "Updating preview…" buffered swap in
                    // the platform preview, per press, for a document
                    // nobody was rendering.
                    if (!plan.propagate) {
                        server.config.logger.info(
                            `root manifest changed, no loaded renderer, vacuous-ack broadcast: ${path.basename(manifestPath)}`,
                            { timestamp: true },
                        )
                    }
                    server.ws.send({
                        type: "custom",
                        event: VISUAL_DOC_CHANGED_EVENT,
                        data: { doc: path.basename(manifestPath), seq },
                    })
                }
                if (plan.fullReload) {
                    // Not in the module graph (e.g. served pre-import):
                    // the old full-reload behavior stands.
                    server.config.logger.info(
                        `root manifest changed, full reload: ${path.basename(manifestPath)}`,
                        { timestamp: true },
                    )
                    server.ws.send({ type: "full-reload" })
                }
                return true
            }

            const sweepManifests = (): void => {
                for (const manifestPath of ROOT_MANIFESTS) {
                    const current = statManifest(manifestPath)
                    const previous = lastSeen.get(manifestPath)
                    if (
                        previous !== undefined &&
                        current.mtimeMs === previous.mtimeMs &&
                        current.size === previous.size
                    ) {
                        continue
                    }
                    if (dispatchManifestChange(manifestPath, current.mtimeMs)) {
                        lastSeen.set(manifestPath, current)
                    }
                }
            }

            for (const manifestPath of ROOT_MANIFESTS) {
                // The poll's own stats only TRIGGER the sweep; change
                // detection lives in the shared ledger so a sibling's poll
                // can flush this file's change first without a double apply.
                const onStat = (current: Stats, previous: Stats): void => {
                    if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) {
                        return
                    }
                    sweepManifests()
                }
                watchFile(manifestPath, { interval: 300 }, onStat)
                registered.push([manifestPath, onStat])
            }
            server.httpServer?.on("close", () => {
                // Remove only OUR listeners: a bare unwatchFile(path) drops
                // every stat watcher on the path, including the ones the NEXT
                // server instance just registered — a vite.config.ts restart
                // would silently kill manifest watching until the next manual
                // dev-server restart.
                for (const [manifestPath, onStat] of registered) {
                    unwatchFile(manifestPath, onStat)
                }
            })
        },
    }
}

/**
 * Same-origin API bridge: dev-up serves the app with a RELATIVE GraphQL URL
 * (/api/graphql__request__api) and hands this server the emulator's real
 * function root via REPOBOT_API_PROXY_TARGET. The browser must never see an
 * absolute loopback API URL — behind the platform's workspace preview
 * gateway, 127.0.0.1 is the VIEWER's machine, not the pod, so every backend
 * call from a proxied preview died with "Failed to fetch" (sign-in still
 * "worked" — it's client-local — which made the dead dashboard read as a
 * template bug). Static marketing packs never exercised this path; the
 * first dashboard pack did. scripts/verify-preview-parity.mjs holds the
 * invariant.
 *
 * The proxy's upstream concurrency is BOUNDED (API_PROXY_MAX_SOCKETS). The
 * functions emulator spawns a whole new worker process — a full copy of the
 * functions app, ~140MB and seconds of CPU — for every concurrent request
 * that finds no idle worker (firebase-tools functionsRuntimeWorker). The
 * drive packs' grids fire dozens of storage GETs at once (one per visible
 * entry), and on a CPU-capped sandbox pod that worker-spawn storm starved
 * the whole emulator: byte GETs hung past the preview proxy's 5-minute
 * header timeout and GraphQL executions crossed the emulator's 60s function
 * timeout, which it answers with HTTP 500 — the Locker template's
 * "Received status code 500" error screen. A small keep-alive socket pool
 * makes excess requests queue here (microseconds, in-process) instead of
 * each spawning a worker; a burst now warms at most maxSockets workers and
 * drains through them at warm-worker speed. Deployed apps never use this
 * proxy (they call the real cloud functions absolutely), so the cap only
 * shapes sandbox/local traffic.
 */
const API_PROXY_MAX_SOCKETS = 8

function apiProxy(): Record<string, ProxyOptions> | undefined {
    const target = process.env.REPOBOT_API_PROXY_TARGET
    if (!target) {
        return undefined
    }
    const parsed = new URL(target)
    const functionRoot = parsed.pathname.replace(/\/$/, "")
    return {
        "/api": {
            target: parsed.origin,
            rewrite: (requestPath) => functionRoot + requestPath.slice("/api".length),
            agent: new http.Agent({ keepAlive: true, maxSockets: API_PROXY_MAX_SOCKETS }),
        },
    }
}

export default defineConfig(({ command }) => ({
    plugins: [
        react({
            // Source attribution is a dev-server affordance (the platform
            // preview); production markup stays clean.
            babel: command === "serve" ? { plugins: [rbSourceAttributionBabelPlugin] } : undefined,
        }),
        vanillaExtractPlugin(),
        watchRootManifests(),
        templateStudio(),
    ],
    server: {
        port: 5173,
        proxy: apiProxy(),
        // Pre-transform the whole module graph on server start instead of on
        // the first browser request: the platform's preview iframe attaches
        // the moment the port opens, and every second of lazy transform is a
        // second of blank preview. Also refills the cache after dev-server
        // restarts, shortening the reload the preview's buffered swap hides.
        //
        // Every pack page is lazy-imported (App.tsx), so main.tsx's graph
        // never reaches an inactive pack — its first compile used to happen
        // AT TEMPLATE SWITCH, on a busy session pod, which is exactly when
        // the user is staring at the veil (tens of seconds of "switching").
        // Warming every page pre-pays all pack subtrees during pool-pod
        // preboot idle time, so a flip's full reload paints from cache.
        warmup: {
            clientFiles: ["./src/main.tsx", "./src/View/**/*Page.tsx"],
        },
        watch: {
            // Agents and editors save non-atomically (truncate, then write);
            // without this, chokidar fires on the truncate and Vite can read
            // and cache the file mid-write — an empty module with no exports
            // that sticks in the module graph until the file is touched again.
            // Wait for the size to stabilize before reading; ~100ms of HMR
            // latency buys immunity from the race.
            awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 20 },
            // The root manifests are watched exclusively by the stat-poller
            // above (chokidar's inode-bound watch dies on the first atomic
            // replace anyway). Ignoring them here keeps the plugin the single
            // event source: a chokidar event racing the poller would also
            // recompile the vanilla-extract graph, whose invalidation has no
            // HMR boundary and would escalate a theme edit back into a full
            // reload.
            ignored: ROOT_MANIFESTS,
        },
    },
    // Pre-optimize the whole installed dependency surface at boot, not just
    // what the boot-time scan reaches: a composed project ships a subset of
    // the kernel's pages, so a dep only a lazy chunk imports (recharts via
    // ChartCard) stays undiscovered until a scaffolded or agent-written page
    // first pulls it — and that mid-session re-optimize breaks loaded
    // dynamic imports ("Failed to fetch dynamically imported module
    // ChartCardChart.tsx" in the field). Derivation + rationale in
    // optimizeDepsInclude.mjs; scripts/dep-cache-coverage.test.mjs gates it.
    optimizeDeps: {
        include: optimizeDepsInclude(dirname),
    },
    resolve: {
        // @base/core and @base/design-system are source-consumed workspace
        // packages; dedupe so only one React instance is ever bundled.
        dedupe: ["react", "react-dom"],
        alias: {
            // The component registry (eject seam) — see src/Theme/ui.ts.
            "@ui": path.resolve(dirname, "src/Theme/ui.ts"),
        },
    },
}))

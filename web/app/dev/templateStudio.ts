// Template Studio: a dev-server-only gallery for previewing and iterating on
// template packs from localhost. Serves /__studio (a dependency-free static
// page, web/app/dev/studio.html) plus a tiny JSON API; activating a pack
// delegates to scripts/lib/pack-switch.mjs (shared with scripts/dev-pack.sh),
// and the manifest watcher in vite.config.ts hot-swaps the app on its own.
//
// configureServer middleware only: nothing here reaches production builds or
// the app bundle.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import net from "node:net"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import type { Plugin } from "vite"

const dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dirname, "../../..")
const studioHtmlPath = path.join(dirname, "studio.html")
const approvedPacksPath = path.join(repoRoot, "packs", "approved.json")

/**
 * The design-review-approved pack keys (packs/approved.json). The studio
 * gallery shows only these — the same set customers can pick — so iterating
 * there always reflects what ships. Unapproved/WIP packs stay reachable via
 * `scripts/dev-pack.sh <key>`. Read per request so approving a pack shows up
 * without a dev-server restart.
 */
function readApprovedKeys(): Set<string> {
    const parsed = JSON.parse(readFileSync(approvedPacksPath, "utf8")) as { packs: string[] }
    return new Set(parsed.packs)
}

/**
 * The functions emulator port dev-up.sh boots (full-stack packs need it).
 * A non-default FUNCTIONS_PORT makes dev-up generate firebase.local.json
 * with the override (e.g. 5601 when running alongside the platform stack),
 * so probe whatever the generated config says, not a hardcoded 5001. Read
 * per probe: a stack restart on a different port changes no studio state.
 */
function readFunctionsEmulatorPort(): number {
    for (const config of ["firebase.local.json", "firebase.json"]) {
        try {
            const parsed = JSON.parse(readFileSync(path.join(repoRoot, config), "utf8")) as {
                emulators?: { functions?: { port?: number } }
            }
            const port = parsed.emulators?.functions?.port
            if (port !== undefined) return port
        } catch {
            // Missing/unparsable config: fall through to the next candidate.
        }
    }
    return 5001
}

/**
 * The platform checkout, when one is around: the studio's browse view mirrors
 * the app's template shelf by reading the platform's own source files
 * (templateBrowseCategories.ts + templateCatalog.ts), so what you validate
 * here IS what the app ships — categories, order, art, and copy, with no
 * mirrored list to drift. Resolution order: REPOBOT_PLATFORM_ROOT env var, a
 * .dev/platform-root file containing the path, then sibling directories of
 * this checkout. All dev-only; without a platform checkout the studio falls
 * back to the flat pack list.
 */
const PLATFORM_MARKER = path.join(
    "web",
    "app",
    "src",
    "View",
    "Marketing",
    "Shared",
    "templateBrowseCategories.ts",
)

function findPlatformRoot(): string | undefined {
    const fromEnv = process.env.REPOBOT_PLATFORM_ROOT
    if (fromEnv !== undefined && fromEnv !== "" && existsSync(path.join(fromEnv, PLATFORM_MARKER))) {
        return fromEnv
    }
    const configFile = path.join(repoRoot, ".dev", "platform-root")
    if (existsSync(configFile)) {
        const configured = readFileSync(configFile, "utf8").trim()
        if (configured !== "" && existsSync(path.join(configured, PLATFORM_MARKER))) {
            return configured
        }
    }
    const parent = path.dirname(repoRoot)
    const siblings = readdirSync(parent, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(parent, entry.name))
        .filter((dir) => dir !== repoRoot && existsSync(path.join(dir, PLATFORM_MARKER)))
        .sort()
    return siblings[0]
}

/** The subset of the platform's browse/catalog exports the shelf needs. */
interface PlatformTemplateEntry {
    templateKey: string
    name: string
    tagline: string
    description: string
    category: string
    imageSrc: string
    platforms: string[]
    playUrl?: string
    highlights?: string[]
    ideas?: string[]
}

interface PlatformBrowseModule {
    templateBrowseCategories: Array<{
        slug: string
        title: string
        description: string
        imageSrc?: string
        artGradient: string
        approvedTemplateKeys: string[]
    }>
    approvedTemplatesForCategory(category: unknown): PlatformTemplateEntry[]
    // Re-exported through the browse module's import graph; used to surface
    // the Shopify themes dev-only even while their category's approved list
    // is empty (shipping them is a product decision the studio must not make).
    templateCatalog?: PlatformTemplateEntry[]
}

let shelfCache: { version: string; payload: object } | undefined

/**
 * The app's template shelf, resolved through the platform's own modules.
 * The two TS files are esbuild-bundled (their imports are relative or
 * type-only, so the bundle is dependency-free) and imported as a data URL;
 * cached by source mtimes so edits show on the next request. Every image
 * path is rewritten through /__studio/pf/, the middleware's proxy into the
 * platform checkout's public dir.
 */
async function buildShelf(): Promise<object> {
    const platformRoot = findPlatformRoot()
    if (platformRoot === undefined) {
        return { platformRoot: null, categories: [] }
    }
    const sharedDir = path.join(platformRoot, "web", "app", "src", "View", "Marketing", "Shared")
    const browsePath = path.join(sharedDir, "templateBrowseCategories.ts")
    const catalogPath = path.join(sharedDir, "templateCatalog.ts")
    const version = [
        platformRoot,
        statSync(browsePath).mtimeMs,
        statSync(catalogPath).mtimeMs,
        statSync(approvedPacksPath).mtimeMs,
    ].join(":")
    if (shelfCache?.version === version) {
        return shelfCache.payload
    }
    const esbuild = await import("esbuild")
    const bundle = await esbuild.build({
        // A virtual entry so the bundle exports the full catalog alongside
        // the browse module (the browse file itself doesn't re-export it).
        stdin: {
            contents:
                `export * from ${JSON.stringify(browsePath)}\n` +
                `export { templateCatalog } from ${JSON.stringify(catalogPath)}\n`,
            resolveDir: sharedDir,
            loader: "ts",
        },
        bundle: true,
        write: false,
        format: "esm",
        platform: "neutral",
        logLevel: "silent",
    })
    const dataUrl =
        "data:text/javascript;base64," + Buffer.from(bundle.outputFiles[0].text).toString("base64")
    const module = (await import(dataUrl)) as PlatformBrowseModule
    const approved = readApprovedKeys()
    const proxied = (src: string | undefined) => (src === undefined ? undefined : `/__studio/pf${src}`)
    const shelfItem = (template: PlatformTemplateEntry, extra: object = {}) => {
        // The kernel pack key by templateKey convention (repobot-<pack>);
        // catalog shortKeys are display-oriented and don't always match.
        const packKey = template.templateKey.startsWith("repobot-")
            ? template.templateKey.slice("repobot-".length)
            : undefined
        return {
            templateKey: template.templateKey,
            name: template.name,
            tagline: template.tagline,
            description: template.description,
            category: template.category,
            imageSrc: proxied(template.imageSrc),
            platforms: template.platforms,
            playable: template.playUrl !== undefined,
            highlights: template.highlights ?? [],
            ideas: template.ideas ?? [],
            packKey,
            available: packKey !== undefined && approved.has(packKey),
            ...extra,
        }
    }
    const categories = module.templateBrowseCategories.map((category) => {
        const items = module.approvedTemplatesForCategory(category).map((template) => shelfItem(template))
        // Dev-only: the Shopify themes browse like any other category here
        // even while shopify-stores' approvedTemplateKeys is empty — they
        // preview via local `shopify theme dev`, not pack activation.
        if (category.slug === "shopify-stores" && module.templateCatalog !== undefined) {
            const present = new Set(items.map((item) => item.templateKey))
            for (const template of module.templateCatalog) {
                if (template.platforms.includes("SHOPIFY") && !present.has(template.templateKey)) {
                    items.push(shelfItem(template, { themeDev: true }))
                }
            }
        }
        return {
            slug: category.slug,
            title: category.title,
            description: category.description,
            imageSrc: proxied(category.imageSrc),
            artGradient: category.artGradient,
            items,
        }
    })
    const payload = { platformRoot, categories }
    shelfCache = { version, payload }
    return payload
}

const IMAGE_CONTENT_TYPES: Record<string, string> = {
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".avif": "image/avif",
}

interface PackCatalog {
    key: string
    templateKey?: string
    title?: string
    description?: string
    base?: string
    clientOnly?: boolean
    capabilities?: string[]
    homePath?: string
    previewPath?: string
    homeViewDir?: string
    hasProjectIa?: boolean
}

interface SwitchResult {
    pack: PackCatalog
    applied: { theme: boolean; landing: boolean; projectIa: boolean }
    scaffoldSummary?: { createdFiles: string[]; updatedFiles: string[]; skippedFiles: string[] }
    scaffoldCreated: string[]
}

interface PackSwitchModule {
    listPacks(root: string): PackCatalog[]
    readActiveKey(root: string): string
    switchPack(root: string, key: string): SwitchResult
    readScaffoldCreated(root: string): string[]
}

// Dynamic import with a computed URL: the module lives at the repo root,
// outside this package, and must load as real Node ESM rather than get
// inlined into the bundled vite config. The URL carries the file's mtime so
// an edit to pack-switch.mjs is picked up on the next request (Node caches
// ESM by exact URL) instead of needing a dev-server restart.
const packSwitchPath = path.join(repoRoot, "scripts", "lib", "pack-switch.mjs")
let packSwitchCache: { version: number; module: Promise<PackSwitchModule> } | undefined
function loadPackSwitch(): Promise<PackSwitchModule> {
    const version = statSync(packSwitchPath).mtimeMs
    if (packSwitchCache?.version !== version) {
        packSwitchCache = {
            version,
            module: import(`${pathToFileURL(packSwitchPath).href}?v=${version}`) as Promise<PackSwitchModule>,
        }
    }
    return packSwitchCache.module
}

/** True when something is listening on the given localhost port. */
function probePort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = net.connect({ host: "127.0.0.1", port })
        const finish = (up: boolean) => {
            socket.destroy()
            resolve(up)
        }
        socket.setTimeout(300)
        socket.once("connect", () => finish(true))
        socket.once("timeout", () => finish(false))
        socket.once("error", () => finish(false))
    })
}

/** True when something is listening on the functions emulator port. */
function probeFunctionsEmulator(): Promise<boolean> {
    return probePort(readFunctionsEmulatorPort())
}

/**
 * Dev-only: the standalone Shopify theme templates (templates/shopify*).
 * They aren't packs — there is nothing to activate — and they preview via
 * Shopify's own theme dev server against a real store, so the studio can
 * only link out to a locally running `shopify theme dev`. Local port
 * convention: 9611..9615, one per theme, alphabetical by template key.
 */
const SHOPIFY_THEME_DEV_PORTS: Record<string, number> = {
    shopify: 9611,
    "shopify-beauty": 9612,
    "shopify-boutique": 9613,
    "shopify-home": 9614,
    "shopify-roastery": 9615,
}

/**
 * `shopify theme dev` answers with X-Frame-Options: DENY, so the studio
 * can't embed it directly. Each up theme gets a 1:1 local reverse proxy on
 * port+10 (9621..9625) that forwards paths untouched (absolute asset paths
 * keep resolving) and drops only the frame-blocking headers. WebSocket
 * upgrades (hot reload) pipe through raw. Dev-only, bound to 127.0.0.1,
 * lives and dies with the vite process.
 */
const THEME_PROXY_OFFSET = 10
const themeProxies = new Map<number, import("node:http").Server>()

async function ensureThemeProxy(upstreamPort: number): Promise<number> {
    const proxyPort = upstreamPort + THEME_PROXY_OFFSET
    if (themeProxies.has(upstreamPort)) return proxyPort
    const http = await import("node:http")
    const server = http.createServer((req, res) => {
        const upstream = http.request(
            {
                host: "127.0.0.1",
                port: upstreamPort,
                method: req.method,
                path: req.url,
                headers: { ...req.headers, host: `127.0.0.1:${upstreamPort}` },
            },
            (upstreamRes) => {
                const headers = { ...upstreamRes.headers }
                delete headers["x-frame-options"]
                delete headers["content-security-policy"]
                // Redirects back to the upstream port re-enter the proxy.
                if (typeof headers.location === "string") {
                    headers.location = headers.location.replace(
                        `127.0.0.1:${upstreamPort}`,
                        `127.0.0.1:${proxyPort}`,
                    )
                }
                res.writeHead(upstreamRes.statusCode ?? 502, headers)
                upstreamRes.pipe(res)
            },
        )
        upstream.on("error", () => {
            if (!res.headersSent) res.writeHead(502)
            res.end("theme dev server unreachable")
        })
        req.pipe(upstream)
    })
    server.on("upgrade", (req, socket, head) => {
        const upstream = net.connect({ host: "127.0.0.1", port: upstreamPort }, () => {
            const lines = [`${req.method} ${req.url} HTTP/1.1`]
            for (let i = 0; i < req.rawHeaders.length; i += 2) {
                const name = req.rawHeaders[i]
                const value =
                    name.toLowerCase() === "host" ? `127.0.0.1:${upstreamPort}` : req.rawHeaders[i + 1]
                lines.push(`${name}: ${value}`)
            }
            upstream.write(lines.join("\r\n") + "\r\n\r\n")
            if (head.length > 0) upstream.write(head)
            upstream.pipe(socket)
            socket.pipe(upstream)
        })
        const drop = () => {
            upstream.destroy()
            socket.destroy()
        }
        upstream.on("error", drop)
        socket.on("error", drop)
    })
    await new Promise<void>((resolve) => {
        server.once("error", () => resolve()) // EADDRINUSE: an earlier server instance still holds it; reuse.
        server.listen(proxyPort, "127.0.0.1", () => resolve())
    })
    themeProxies.set(upstreamPort, server)
    return proxyPort
}

/** The shelf's link-out rows: each theme's template.json + a port probe. */
async function buildThemeDevServers(): Promise<object[]> {
    return Promise.all(
        Object.entries(SHOPIFY_THEME_DEV_PORTS).map(async ([key, port]) => {
            let templateKey = `repobot-${key}`
            let title = key
            let description = ""
            try {
                const manifest = JSON.parse(
                    readFileSync(path.join(repoRoot, "templates", key, "template.json"), "utf8"),
                ) as { templateKey?: string; title?: string; description?: string }
                templateKey = manifest.templateKey ?? templateKey
                title = manifest.title ?? title
                description = manifest.description ?? description
            } catch {
                // Template missing from this checkout: keep the fallbacks.
            }
            const up = await probePort(port)
            // The embeddable (frame-stripped) URL, only meaningful while up.
            const previewPort = up ? await ensureThemeProxy(port) : port + THEME_PROXY_OFFSET
            return {
                key,
                templateKey,
                title,
                description,
                port,
                url: `http://127.0.0.1:${port}`,
                previewUrl: `http://127.0.0.1:${previewPort}`,
                up,
            }
        }),
    )
}

function readRequestBody(req: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        let body = ""
        req.setEncoding("utf8")
        req.on("data", (chunk: string) => {
            body += chunk
        })
        req.on("end", () => resolve(body))
        req.on("error", reject)
    })
}

export function templateStudio(): Plugin {
    return {
        name: "template-studio",
        apply: "serve",
        configureServer(server) {
            server.middlewares.use("/__studio", (req, res, next) => {
                const url = (req.url ?? "/").split("?")[0]

                const sendJson = (status: number, payload: unknown) => {
                    res.statusCode = status
                    res.setHeader("Content-Type", "application/json")
                    res.end(JSON.stringify(payload))
                }

                const handle = async () => {
                    if (url === "/" || url === "") {
                        // Read per request so studio.html edits don't need a
                        // dev-server restart.
                        res.statusCode = 200
                        res.setHeader("Content-Type", "text/html; charset=utf-8")
                        res.end(readFileSync(studioHtmlPath, "utf8"))
                        return
                    }

                    if (url === "/api/state" && req.method === "GET") {
                        const packSwitch = await loadPackSwitch()
                        const approved = readApprovedKeys()
                        sendJson(200, {
                            activeKey: packSwitch.readActiveKey(repoRoot),
                            packs: packSwitch.listPacks(repoRoot).filter((pack) => approved.has(pack.key)),
                            backendUp: await probeFunctionsEmulator(),
                            scaffoldCreated: packSwitch.readScaffoldCreated(repoRoot),
                        })
                        return
                    }

                    if (url === "/api/shelf" && req.method === "GET") {
                        sendJson(200, await buildShelf())
                        return
                    }

                    // Dev-only: which local `shopify theme dev` servers are
                    // up, so the shelf's Shopify rows can link out to them.
                    if (url === "/api/theme-dev" && req.method === "GET") {
                        sendJson(200, { servers: await buildThemeDevServers() })
                        return
                    }

                    // Thumbnail proxy into the platform checkout's public dir
                    // (the shelf's imageSrc paths are rewritten through here).
                    if (url.startsWith("/pf/") && req.method === "GET") {
                        const platformRoot = findPlatformRoot()
                        const publicDir =
                            platformRoot === undefined
                                ? undefined
                                : path.join(platformRoot, "web", "app", "public")
                        const filePath =
                            publicDir === undefined
                                ? undefined
                                : path.resolve(publicDir, decodeURIComponent(url.slice("/pf/".length)))
                        const contentType =
                            filePath === undefined
                                ? undefined
                                : IMAGE_CONTENT_TYPES[path.extname(filePath).toLowerCase()]
                        if (
                            publicDir === undefined ||
                            filePath === undefined ||
                            contentType === undefined ||
                            !filePath.startsWith(publicDir + path.sep) ||
                            !existsSync(filePath)
                        ) {
                            res.statusCode = 404
                            res.end()
                            return
                        }
                        res.statusCode = 200
                        res.setHeader("Content-Type", contentType)
                        res.setHeader("Cache-Control", "max-age=60")
                        res.end(readFileSync(filePath))
                        return
                    }

                    if (url === "/api/activate" && req.method === "POST") {
                        const packSwitch = await loadPackSwitch()
                        const body = await readRequestBody(req)
                        const key = (JSON.parse(body || "{}") as { key?: string }).key
                        if (!key) {
                            sendJson(400, { error: "missing pack key" })
                            return
                        }
                        try {
                            sendJson(200, packSwitch.switchPack(repoRoot, key))
                        } catch (error) {
                            sendJson(409, { error: error instanceof Error ? error.message : String(error) })
                        }
                        return
                    }

                    next()
                }

                handle().catch((error: unknown) => {
                    sendJson(500, { error: error instanceof Error ? error.message : String(error) })
                })
            })
        },
    }
}

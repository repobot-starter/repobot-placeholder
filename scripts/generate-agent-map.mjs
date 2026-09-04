// The per-pack AGENT MAP generator: the marker-delimited "## Pack map"
// section compose-pack.sh stamps into every composed repo's AGENTS.md (and
// --write stamps into every standalone template's). It exists because a
// fresh template's first agent message used to pay a full-repo exploration
// (78 steps, 32 of them discovery, on a logo change): the kernel AGENTS.md
// says how the kernel works, but nothing said which files THIS pack's
// surfaces live in. The map does — and it is GENERATED from the pack's
// catalog.json plus the real tree, never hand-maintained, so it cannot
// drift or be forgotten (scripts/check-agent-maps.mjs dry-runs it for every
// approved pack and fails on maps that reference missing paths).
//
// The marker pair is a cross-repo contract: the platform's runtime brief
// inlines the section it finds between `<!-- AGENT_MAP:v1 -->` and
// `<!-- /AGENT_MAP -->`, and its publish gate refuses template repos
// without the opening marker. Never rename the markers or the "## Pack map"
// heading without coordinating both repos.
//
// What the map derives, and from where:
//   - identity + home surface        catalog key/title/base/homeViewDir
//     (remixes resolve through pack-switch.mjs resolveCatalog, so a derived
//     template maps as its base pack wearing the remix identity)
//   - routes -> pages -> sections    catalog landing.routes + landing.pages
//   - the view files                 the homeViewDir tree, listed
//   - user-editable surfaces         contentContract.module (+ slot groups),
//                                    catalog content domains, theme overlay,
//                                    forms, pack repobot.project.json,
//                                    web/app/public/<key> imagery
//   - authored notes                 the pack's PACK.md "## Agent map notes"
//                                    section, merged verbatim when present
//                                    (base pack's PACK.md for a remix)
//
// Standalone templates (templates/<key>/, the Shopify themes) get the same
// section derived from THEIR tree: page templates -> sections, the section/
// snippet files, and the theme-editor surfaces. Their paths are relative to
// the template dir, which is the repo root once published.
//
// Usage:
//   node scripts/generate-agent-map.mjs <pack-key>                 print
//   node scripts/generate-agent-map.mjs <pack-key> --stamp <AGENTS.md>
//                                    insert/replace the map in that file
//   node scripts/generate-agent-map.mjs --template <key>           print
//   node scripts/generate-agent-map.mjs --template <key> --write
//                                    stamp templates/<key>/AGENTS.md

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { parseDesignVocabulary } from "./lib/design-vocabulary.mjs"
import { resolveCatalog } from "./lib/pack-switch.mjs"
import { DASHBOARD_BLUEPRINTS, DASHBOARD_SECTION_TYPES } from "./scaffold-ia.mjs"

export const MAP_OPEN = "<!-- AGENT_MAP:v1 -->"
export const MAP_CLOSE = "<!-- /AGENT_MAP -->"
const KERNEL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const LANDING_SECTION_VARIANTS = parseDesignVocabulary(KERNEL_ROOT).sectionVariants

// The PACK.md heading whose body rides into the map verbatim. Opt-in and
// deliberately narrow: PACK.md as a whole is the human recipe; only notes
// the author wants in every composed repo's first read go under this
// heading. Referenced paths in the notes are gated like generated ones
// (check-agent-maps.mjs extracts every backticked path in the map).
export const NOTES_HEADING = "## Agent map notes"

/** Every file under dir, repo-relative, sorted — the map's view-file list.
 * Dotfiles (the derived .pristine-manifest.json) are machinery, not surface. */
function listFiles(root, dir) {
    const files = []
    const walk = (current) => {
        for (const entry of readdirSync(path.join(root, current), { withFileTypes: true }).sort((a, b) =>
            a.name.localeCompare(b.name),
        )) {
            if (entry.name.startsWith(".")) continue
            const relative = path.posix.join(current, entry.name)
            if (entry.isDirectory()) walk(relative)
            else files.push(relative)
        }
    }
    walk(dir)
    return files.sort()
}

/** One page's sections as a table cell: "hero · hero/split-media, ...". */
function sectionCell(sections) {
    return sections
        .map((section) =>
            section.variant === undefined
                ? `${section.id} · ${section.type}`
                : `${section.id} · ${section.type}/${section.variant}`,
        )
        .join(", ")
}

/** The body of PACK.md's "## Agent map notes" section, or undefined. */
function packNotes(packMdPath) {
    if (!existsSync(packMdPath)) return undefined
    const lines = readFileSync(packMdPath, "utf8").split("\n")
    const start = lines.findIndex((line) => line.trim() === NOTES_HEADING)
    if (start === -1) return undefined
    let end = lines.length
    for (let i = start + 1; i < lines.length; i++) {
        if (lines[i].startsWith("## ")) {
            end = i
            break
        }
    }
    const body = lines
        .slice(start + 1, end)
        .join("\n")
        .trim()
    return body === "" ? undefined : body
}

/** Top-level slot groups of a content contract: "practice.name" -> "practice". */
function slotGroups(slots) {
    const groups = []
    for (const key of Object.keys(slots)) {
        const group = key.split(".")[0]
        if (!groups.includes(group)) groups.push(group)
    }
    return groups
}

/**
 * The "Building an app" recipe every pack map carries: how to get a
 * dashboard inside the sidebar shell by DECLARING it (repobot.project.json +
 * scaffold:ia) instead of hand-writing pages. The section-type table derives
 * from scaffold-ia.mjs's DASHBOARD_SECTION_TYPES — the same object the
 * scaffolder validates against — so the recipe an agent reads and the
 * scaffolder's actual contract cannot drift apart. Born from a benchmark
 * autopsy: on a blank project, an agent hand-wrote a KPI dashboard into the
 * pinned home surface, tripped the pristine-restore, and spent 60% of a
 * 4m51s run redoing its own work.
 */
function appCompositionSection() {
    const lines = []
    const out = (line = "") => lines.push(line)
    out("### Building an app (dashboard + sidebar shell)")
    out()
    out("App-shaped asks (dashboard, admin panel, CRM, tracker…) are DECLARED, not")
    out("hand-written. Declare destinations in `repobot.project.json`, run")
    out("`npm run scaffold:ia`, and the scaffolder wires the routes, the sidebar nav")
    out("(AppShell), and one page per destination — composed from themed kernel")
    out("components, so the result is restylable and remixable (docs:")
    out("`docs/project-ia.md`).")
    out()
    out("1. Add `dashboard.destinations[]` to `repobot.project.json`:")
    out(`   \`{ id, path, label, blueprint: ${DASHBOARD_BLUEPRINTS.join("|")}, sections: [...] }\`.`)
    out("2. Each section is `{ id, type, title?, span? }` plus the content fields in")
    out("   the table below. Fill the content with REAL demo values (numbers, series,")
    out('   rows) so the page arrives finished, not placeholder. `span: "half"` puts')
    out("   consecutive sections side by side on one row.")
    out("3. Run `npm run scaffold:ia` (idempotent — re-runs never overwrite pages you")
    out("   have edited), then restyle via `repobot.theme.json`. Only hand-write a")
    out("   page body when no section type fits.")
    out("4. Verify with `npm run typecheck` — it confirms all the wiring. Generated")
    out("   pages and routes are already covered by the kernel's scaffold contract")
    out("   tests, and the marketing nav CTA auto-links the first destination, so the")
    out("   app is reachable from the site home with no hand-wired links. Do NOT run")
    out("   test suites for scaffolded pages or manifest/theme edits; suites are only")
    out("   worth their minutes when you changed shared kernel code (web/core,")
    out("   web/design-system).")
    out()
    out("| Section type | Renders on | Content fields |")
    out("| --- | --- | --- |")
    const cell = (text) => text.replaceAll("|", "\\|")
    for (const [type, spec] of Object.entries(DASHBOARD_SECTION_TYPES)) {
        out(
            `| \`${type}\` | ${cell(spec.component)} | ${spec.content === undefined ? "—" : cell(spec.content)} |`,
        )
    }
    return lines.join("\n")
}

/**
 * The "Building a site" recipe every pack map carries: how to get a real
 * landing site by DECLARING page/section manifests (repobot.project.json +
 * repobot.landing.json), not hand-writing React into view files. The
 * section-type/variant table derives from the same LANDING_SECTION_VARIANTS
 * source that runtime rendering and seed validation enforce (parsed via
 * parseDesignVocabulary), so recipe vocabulary and kernel contract cannot
 * drift apart.
 */
function siteCompositionSection() {
    const lines = []
    const out = (line = "") => lines.push(line)
    out("### Building a site (landing pages + sections)")
    out()
    out("Landing-site asks are DECLARED, not hand-written into `web/app/src/View/*`.")
    out("On blank (or any pack), define pages in `repobot.project.json` and let")
    out("the runtime map them through kernel sections (`docs/project-ia.md`).")
    out()
    out("1. Add `marketing.pages[]` entries in `repobot.project.json`:")
    out("   `{ id, path, title, blueprint, description?, sections? }`.")
    out("2. For finished from-scratch pages, add `sections[]` entries with real")
    out("   copy/media: `{ id, type, variant?, headline?, body?, ctaLabel?,")
    out("   description?, image? }` (hero also supports `accent`, `badge`,")
    out("   `secondaryCtaLabel`). Use shipped `type`/`variant` names only.")
    out("3. Optional per-page layout edits live in `repobot.landing.json`")
    out("   (`pages.<pageId>.sections`: order + variants + copy/media overrides).")
    out("4. Verify with `npm run typecheck` — marketing pages are runtime-manifest")
    out("   surfaces, so no scaffold step is needed unless you also add dashboard")
    out("   destinations (`npm run scaffold:ia`).")
    out("5. Restyle via `repobot.theme.json`; manifests keep structure remixable")
    out("   because the section skeleton stays data, not bespoke JSX.")
    out()
    out("| Section type | Allowed variants |")
    out("| --- | --- |")
    for (const [type, variants] of Object.entries(LANDING_SECTION_VARIANTS)) {
        out(`| \`${type}\` | ${variants.join(", ")} |`)
    }
    out()
    out("`nav`/`footer` section types are legacy chrome; new pages should prefer")
    out("`marketing.shell` (`navVariant`, `footerVariant`) for page chrome.")
    return lines.join("\n")
}

/**
 * The pack map for `packKey`, marker-delimited. Derivation runs against the
 * kernel checkout (repoRoot), whose paths are byte-identical in the composed
 * tree — compose stamps the exact same section it would print here.
 */
export function generatePackMap(repoRoot, packKey) {
    const catalogPath = path.join(repoRoot, "packs", packKey, "catalog.json")
    if (!existsSync(catalogPath)) {
        throw new Error(`unknown pack '${packKey}' (no ${catalogPath})`)
    }
    const catalog = resolveCatalog(repoRoot, {
        key: packKey,
        ...JSON.parse(readFileSync(catalogPath, "utf8")),
    })
    // A derived template maps as its base pack: the composed checkout IS the
    // base pack (routers, view dirs, PACK.md), wearing the remix's content.
    const packDir = catalog.activeKey
    const lines = []
    const out = (line = "") => lines.push(line)

    out(MAP_OPEN)
    out("## Pack map")
    out()
    out(`Active pack: **${packDir}** (\`packs/active.json\`). Generated by`)
    out(`\`scripts/generate-agent-map.mjs\` from \`packs/${packDir}/catalog.json\` and the`)
    out(`pack tree — regenerate with \`node scripts/generate-agent-map.mjs ${packKey}\`;`)
    out("never hand-edit between the AGENT_MAP markers.")
    out()
    const flavor = [
        catalog.title !== undefined ? `**${catalog.title}**` : undefined,
        `base family \`${catalog.base}\``,
        catalog.clientOnly === true ? "client-only" : "full-stack",
    ]
        .filter((part) => part !== undefined)
        .join(", ")
    out(`This checkout was composed with the ${packDir} pack (${flavor}). The home`)
    out(`surface at \`${catalog.homePath}\` is \`${catalog.homeViewDir}/\` — recipe:`)
    out(`\`packs/${packDir}/PACK.md\`. When the user asks to change, restyle, or redesign`)
    out(`"the page" or "the app", they mean that view. Do NOT edit`)
    out(`\`web/app/src/View/Blank/\` unless the blank pack is the active pack.`)
    if (catalog.remixOf !== undefined) {
        const base = JSON.parse(
            readFileSync(path.join(repoRoot, "packs", catalog.remixOf, "catalog.json"), "utf8"),
        )
        out(`It is the **${catalog.key}** derived template: the ${packDir} pack`)
        out(`(${base.title ?? catalog.remixOf}) composed with its own content and brand.`)
    }
    out()
    out("The paths below are this pack's whole surface — read them before exploring")
    out("anywhere else.")

    const routes = catalog.landing?.routes
    const pages = catalog.landing?.pages
    if (routes !== undefined && pages !== undefined) {
        out()
        out("### Routes")
        out()
        out("| Route | Page | Sections (id · type/variant) |")
        out("| --- | --- | --- |")
        for (const [route, pageId] of Object.entries(routes)) {
            const cell = pages[pageId] === undefined ? "—" : sectionCell(pages[pageId].sections ?? [])
            out(`| \`${route}\` | ${pageId} | ${cell} |`)
        }
        out()
        out("Section order and variants live in `repobot.landing.json` (the platform's")
        out("structural editor writes it); each section's content is built by the view")
        out("files below.")
    } else if (catalog.landing?.sections !== undefined) {
        out()
        out("### Landing sections")
        out()
        out(`\`${catalog.homePath}\` renders: ${sectionCell(catalog.landing.sections)}.`)
        out("Section order and variants live in `repobot.landing.json`; the section")
        out("content is built by the view files below.")
    }
    if (catalog.previewPath !== undefined && catalog.previewPath !== catalog.homePath) {
        out()
        out(`Preview route while another pack is active: \`${catalog.previewPath}\`.`)
    }

    out()
    out(`### View files (\`${catalog.homeViewDir}/\`)`)
    out()
    for (const file of listFiles(repoRoot, catalog.homeViewDir)) {
        out(`- \`${file}\``)
    }

    out()
    out("### User-editable surfaces")
    out()
    if (catalog.contentContract?.module !== undefined) {
        const groups = slotGroups(catalog.contentContract.slots ?? {})
        out(`- Content module: \`${catalog.contentContract.module}\` — every business fact`)
        out(`  and copy slot the site renders (slot groups: ${groups.join(", ")})`)
    }
    const domains = Object.keys(catalog.content ?? {}).filter((key) => key !== "$comment")
    if (domains.length > 0) {
        out(`- Business-content document: \`repobot.content.json\` — domains:`)
        out(`  ${domains.join(", ")} (the platform's Manage UI writes here; the content`)
        out("  module holds the code fallbacks)")
    }
    const theme = catalog.theme ?? {}
    const themeShips = [
        theme.mode !== undefined ? `mode ${theme.mode}` : undefined,
        theme.brand?.primary !== undefined ? `brand ${theme.brand.primary}` : undefined,
    ].filter((part) => part !== undefined)
    out("- Theme: `repobot.theme.json` — brand colors, radius, density, font, mode;")
    out(
        themeShips.length > 0
            ? `  edit it first for restyles (this pack ships ${themeShips.join(", ")})`
            : "  edit it first for restyles (this pack keeps the kernel defaults)",
    )
    if (catalog.landing !== undefined) {
        out("- Landing layout: `repobot.landing.json` — the route map and per-page")
        out("  section skeletons stamped from the catalog at compose")
    }
    const forms = Object.entries(catalog.forms ?? {}).filter(([key]) => key !== "$comment")
    if (forms.length > 0) {
        out(`- Forms: ${forms.map(([key, kind]) => `\`${key}\` (${kind})`).join(", ")} — submissions`)
        out("  land in the dashboard; kinds live in `repobot.deploy.json` formKinds")
    }
    if (existsSync(path.join(repoRoot, "packs", packDir, "repobot.project.json"))) {
        out(`- Project IA: \`repobot.project.json\` (from \`packs/${packDir}/repobot.project.json\`)`)
        out("  — dashboard routes and nav, scaffolded by `scripts/scaffold-ia.mjs`")
    }
    const imagery = [packDir, catalog.remixOf === undefined ? undefined : catalog.key]
        .filter((key) => key !== undefined)
        .filter((key) => existsSync(path.join(repoRoot, "web", "app", "public", key)))
        .map((key) => `\`web/app/public/${key}/\``)
    if (imagery.length > 0) {
        out(`- Pack imagery: ${imagery.join(", ")} (regenerate entries with`)
        out("  `npm run image -- responsive`)")
    }
    out("- Capability manifest: `repobot.deploy.json` — declared capabilities and the")
    out("  platform-facing template identity")

    out()
    out(siteCompositionSection())
    out()
    out(appCompositionSection())

    const notes = packNotes(path.join(repoRoot, "packs", packDir, "PACK.md"))
    if (notes !== undefined) {
        out()
        out("### Pack notes")
        out()
        out(notes)
    }

    out(MAP_CLOSE)
    return lines.join("\n")
}

/**
 * The map for a standalone template (templates/<key>/ — its own repo shape,
 * not a pack on the web kernel). Paths are relative to the template dir,
 * which is the repo root once published.
 */
export function generateTemplateMap(repoRoot, templateKey) {
    const templateDir = path.join(repoRoot, "templates", templateKey)
    const identityPath = path.join(templateDir, "template.json")
    if (!existsSync(identityPath)) {
        throw new Error(`unknown standalone template '${templateKey}' (no ${identityPath})`)
    }
    const identity = JSON.parse(readFileSync(identityPath, "utf8"))
    const lines = []
    const out = (line = "") => lines.push(line)

    out(MAP_OPEN)
    out("## Pack map")
    out()
    out(`Standalone ${identity.platform ?? "SHOPIFY"} theme: **${identity.key}**`)
    out(`(${identity.title ?? identity.templateKey}). Generated by the kernel repo's`)
    out(`scripts/generate-agent-map.mjs from this template's tree — regenerate with`)
    out(`\`node scripts/generate-agent-map.mjs --template ${templateKey} --write\` there;`)
    out("never hand-edit between the AGENT_MAP markers. The paths below are this")
    out("theme's whole surface — read them before exploring anywhere else.")

    const pageTemplates = listFiles(repoRoot, path.posix.join("templates", templateKey, "templates")).map(
        (file) => file.slice(`templates/${templateKey}/`.length),
    )
    out()
    out("### Page templates")
    out()
    out("| Template | Sections (id · type) |")
    out("| --- | --- |")
    for (const file of pageTemplates) {
        if (!file.endsWith(".json")) {
            out(`| \`${file}\` | (liquid template) |`)
            continue
        }
        const template = JSON.parse(readFileSync(path.join(templateDir, file), "utf8"))
        const order = template.order ?? Object.keys(template.sections ?? {})
        const cell = order
            .map((id) => {
                const type = template.sections?.[id]?.type
                return type === undefined ? id : `${id} · ${type}`
            })
            .join(", ")
        out(`| \`${file}\` | ${cell} |`)
    }
    out()
    out("Section order per page lives in those JSON templates (the theme editor")
    out("writes them); the section code lives in `sections/`.")

    out()
    out("### Sections and snippets")
    out()
    for (const file of listFiles(repoRoot, path.posix.join("templates", templateKey, "sections"))) {
        out(`- \`${file.slice(`templates/${templateKey}/`.length)}\``)
    }
    const snippetsDir = path.join(templateDir, "snippets")
    if (existsSync(snippetsDir)) {
        for (const file of listFiles(repoRoot, path.posix.join("templates", templateKey, "snippets"))) {
            out(`- \`${file.slice(`templates/${templateKey}/`.length)}\` (snippet — \`{% render %}\`)`)
        }
    }

    out()
    out("### User-editable surfaces")
    out()
    out("- Theme settings: `config/settings_schema.json` (the schema merchants see in")
    out("  the theme editor) and `config/settings_data.json` (current values)")
    out("- Strings: `locales/en.default.json` — every user-facing string resolves")
    out("  through the translation filter")
    out("- Styling: `assets/base.css` — the CSS custom properties declared at :root;")
    out("  wire new colors through the settings schema, never hardcode")
    out("- HTML shell: `layout/theme.liquid`")

    out(MAP_CLOSE)
    return lines.join("\n")
}

/**
 * Insert or replace the map in an AGENTS.md source. First stamp inserts the
 * section right under the H1 title (agents read top-down; the map must be
 * the first thing after the title), wrapped in prettier-ignore markers —
 * composed repos run `prettier --check "*.md"` in check-all, and prettier
 * would otherwise re-align the map's table and separate the AGENT_MAP
 * marker from its heading (the marker layout is a cross-repo contract, so
 * the map is excluded from formatting rather than bent to it). A restamp
 * replaces the existing marker-delimited span in place, keeping whatever
 * surrounds it.
 */
export function stampAgentMap(agentsSource, map) {
    const openAt = agentsSource.indexOf(MAP_OPEN)
    if (openAt !== -1) {
        const closeAt = agentsSource.indexOf(MAP_CLOSE, openAt)
        if (closeAt === -1) {
            throw new Error(`AGENTS.md has ${MAP_OPEN} but no ${MAP_CLOSE}`)
        }
        return agentsSource.slice(0, openAt) + map + agentsSource.slice(closeAt + MAP_CLOSE.length)
    }
    const lines = agentsSource.split("\n")
    lines.splice(2, 0, `<!-- prettier-ignore-start -->\n${map}\n<!-- prettier-ignore-end -->\n`)
    return lines.join("\n")
}

/**
 * Every repo-relative path a map references: the backticked tokens that
 * contain a separator and aren't absolute routes (`/book`) or globs. The
 * dangling-path gate (check-agent-maps.mjs) requires each to exist, so a
 * map — generated or note-authored — can never point agents at files that
 * aren't there.
 */
export function extractMapPaths(map) {
    const paths = []
    for (const match of map.matchAll(/`([^`\n]+)`/g)) {
        const token = match[1].replace(/\/$/, "")
        if (!token.includes("/")) continue
        if (token.startsWith("/") || token.includes("*") || token.includes(" ")) continue
        if (!paths.includes(token)) paths.push(token)
    }
    return paths
}

function main() {
    const repoRoot = KERNEL_ROOT
    const args = process.argv.slice(2)
    if (args[0] === "--template") {
        const templateKey = args[1]
        if (templateKey === undefined) {
            console.error("Usage: generate-agent-map.mjs --template <key> [--write]")
            process.exit(1)
        }
        const map = generateTemplateMap(repoRoot, templateKey)
        if (args.includes("--write")) {
            const agentsPath = path.join(repoRoot, "templates", templateKey, "AGENTS.md")
            writeFileSync(agentsPath, stampAgentMap(readFileSync(agentsPath, "utf8"), map))
            console.log(`Stamped the agent map into templates/${templateKey}/AGENTS.md`)
        } else {
            console.log(map)
        }
        return
    }
    const packKey = args[0]
    if (packKey === undefined || packKey.startsWith("--")) {
        console.error("Usage: generate-agent-map.mjs <pack-key> [--stamp <AGENTS.md>]")
        process.exit(1)
    }
    const map = generatePackMap(repoRoot, packKey)
    const stampAt = args.indexOf("--stamp")
    if (stampAt !== -1) {
        const agentsPath = args[stampAt + 1]
        if (agentsPath === undefined) {
            console.error("--stamp needs the AGENTS.md path to stamp")
            process.exit(1)
        }
        writeFileSync(agentsPath, stampAgentMap(readFileSync(agentsPath, "utf8"), map))
    } else {
        console.log(map)
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main()
}

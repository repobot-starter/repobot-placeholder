// Verifies the kernel's pristine surfaces — the trees the platform may
// mechanically refresh inside customer repos — are byte-identical to the
// manifest committed inside each surface (.pristine-manifest.json).
//
// Why: project customization happens through the kernel's documents
// (repobot.theme.json, repobot.landing.json), component props, or ejected
// copies in web/app/src/Theme/overrides/ — never by editing these trees. A
// pristine surface is what lets the platform land kernel updates in customer
// repos automatically without clobbering local customization; drifted files
// route to an agent for a manual merge instead.
//
// Two enforcement tiers:
//   - The visual surfaces (design system, landing renderer, site pages) are
//     verified EVERYWHERE — kernel and composed repos alike — because they
//     are never legitimately edited in place.
//   - The backend surfaces (packs, migrations, functions services/wrappers/
//     resolvers, GraphQL domain SDL, web/core) are verified only in the
//     kernel checkout, where the manifest must stay current with the tree.
//     In composed repos agents legitimately add and customize backend code;
//     that drift is the kernel-refresh classifier's business (routed to an
//     agent at refresh time), not a check-gate failure here. A composed repo
//     is recognized by the .repobot-template-ref stamp the publish path
//     writes; a kernel checkout never carries one.
//
// Usage:
//   node scripts/verify-ds-pristine.mjs           # verify (exit 1 on drift)
//   node scripts/verify-ds-pristine.mjs --write   # regenerate the manifests
//                                                 # (kernel changes only)

import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// Every pristine surface the kernel declares. The platform does NOT mirror
// this list: its kernel-refresh service discovers surfaces from the
// manifests the template repo ships, so committing a manifest here IS the
// declaration — a new surface refreshes with no platform change. (The
// platform keeps only optional metadata per directory: human labels, and
// the append-only rule for migrations.)
// `enforce: "kernel-only"` marks the backend surfaces described above.
const SURFACES = [
    {
        dir: "web/design-system",
        customizeHint:
            "Customize through repobot.theme.json, component props, or ejected copies in " +
            "web/app/src/Theme/overrides/ (see docs/design-system.md).",
    },
    {
        dir: "web/app/src/View/Landing",
        // The exemplar's content file is authored copy, not machinery — the
        // one file in this tree a project may legitimately rewrite.
        excludeFiles: ["landing.ts"],
        customizeHint:
            "Customize through repobot.landing.json (sections, variants, text overrides) — " +
            "the renderer and resolver are kernel-owned (see docs/landing-kernel-spec.md).",
    },
    {
        dir: "web/app/src/View/Site",
        customizeHint:
            "Customize through repobot.project.json page entries (inline landing configs, " +
            "section overrides) — the shared builders are kernel-owned (see AGENTS.md).",
    },
    {
        dir: "packs",
        enforce: "kernel-only",
        // active.json is per-repo state, not kernel content: compose-pack.sh
        // stamps it per template, the platform's template flip rewrites it,
        // and the kernel's own dev:pack switch does too.
        excludeFiles: ["active.json"],
        customizeHint:
            "Packs are kernel-owned feature definitions; customize the composed app " +
            "(root documents, views), never the pack sources.",
    },
    {
        dir: "firebase/functions/migrations",
        enforce: "kernel-only",
        customizeHint:
            "Never edit an existing migration — databases already ran it. Add a new " +
            ".sql file instead (see firebase/functions/scripts/migrate.ts).",
    },
    {
        dir: "firebase/functions/src/Services",
        enforce: "kernel-only",
        customizeHint:
            "Kernel service modules are refresh-managed; app features belong in new " +
            "domain directories, and documented customization points (AI prompts, shop " +
            "catalog) show up as refresh conflicts an agent reconciles.",
    },
    {
        dir: "firebase/functions/src/DependencyWrappers",
        enforce: "kernel-only",
        customizeHint:
            "Dependency wrappers are kernel-owned plumbing; add new wrappers for new " +
            "integrations rather than editing the shipped ones.",
    },
    {
        dir: "firebase/functions/src/Graphql/Resolvers",
        enforce: "kernel-only",
        customizeHint:
            "Kernel resolver modules are refresh-managed; new domains get their own " +
            "resolver directories, registered in src/Graphql/GraphqlResolvers.ts (a seam " +
            "file agents own).",
    },
    {
        dir: "Graphql/Core",
        enforce: "kernel-only",
        // Schema.gql is the seam file: agents extend it with their own domain
        // includes, so it can never be pristine-managed.
        excludeFiles: ["Schema.gql"],
        customizeHint:
            "Kernel domain SDL is refresh-managed; new domains get their own .gql " +
            "files, included from Schema.gql (the seam file agents own).",
    },
    {
        dir: "web/core",
        enforce: "kernel-only",
        customizeHint:
            "web/core is the kernel's transport library; app code customizes web/app, " +
            "never web/core internals.",
    },
]

// Every view tree under web/app/src/View is kernel-authored — app chrome and
// pack views alike — and View/Site's packShell.ts statically imports each
// pack's shell. A pack's view directory that is NOT a surface cannot ride a
// kernel refresh, so stale projects received a refreshed packShell.ts
// importing directories they don't have and their preview build broke (the
// View/Estate incident). Enumerate the directories instead of hand-listing
// them: a pack added tomorrow is a surface tomorrow, with no list to forget.
// Kernel-only enforcement — in composed repos agents legitimately restyle
// views; that drift is the refresh classifier's business (routed to an
// agent), not a check-gate failure.
const VIEW_ROOT = "web/app/src/View"
{
    const declared = new Set(SURFACES.map((surface) => surface.dir))
    const viewEntries = readdirSync(path.join(repoRoot, VIEW_ROOT), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    for (const name of viewEntries) {
        const dir = `${VIEW_ROOT}/${name}`
        if (declared.has(dir)) continue
        SURFACES.push({
            dir,
            enforce: "kernel-only",
            customizeHint:
                "View trees are kernel-shipped; in a project, restyling them is agent " +
                "work that the kernel refresh reconciles — in the kernel, refresh the " +
                "manifest with --write after intentional changes.",
        })
    }
}

const MANIFEST_NAME = ".pristine-manifest.json"
const EXCLUDED_DIRS = new Set(["node_modules", "storybook-static", "dist"])
// The kernel-refresh stamp is written by the platform into customer repos and
// never exists in the kernel itself; excluded so a refreshed customer tree
// can still verify pristine against the same manifest.
const EXCLUDED_FILES = new Set([MANIFEST_NAME, ".kernel-refresh-ref"])

function* walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!EXCLUDED_DIRS.has(entry.name)) yield* walk(path.join(dir, entry.name))
        } else if (!EXCLUDED_FILES.has(entry.name)) {
            yield path.join(dir, entry.name)
        }
    }
}

function computeHashes(surface) {
    const surfaceDir = path.join(repoRoot, surface.dir)
    const excluded = new Set(surface.excludeFiles ?? [])
    const hashes = {}
    for (const filePath of walk(surfaceDir)) {
        const relativePath = path.relative(surfaceDir, filePath).split(path.sep).join("/")
        if (excluded.has(relativePath)) continue
        hashes[relativePath] = createHash("sha256").update(readFileSync(filePath)).digest("hex")
    }
    return Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)))
}

const write = process.argv.includes("--write")
let failed = false

// Composed repos (published templates, customer projects) carry the
// .repobot-template-ref stamp the publish path writes; a kernel checkout
// never does. Kernel-only surfaces are skipped entirely there — verifying
// them would flag legitimate app work, and --write there would corrupt the
// manifest the refresh classifier trusts (claiming customized files are
// pristine, which would let a refresh clobber them).
const isComposedRepo = existsSync(path.join(repoRoot, ".repobot-template-ref"))

for (const surface of SURFACES) {
    if (isComposedRepo && surface.enforce === "kernel-only") continue
    const manifestPath = path.join(repoRoot, surface.dir, MANIFEST_NAME)
    const current = computeHashes(surface)

    if (write) {
        writeFileSync(manifestPath, JSON.stringify(current, null, 4) + "\n")
        console.log(
            `Wrote ${Object.keys(current).length} file hashes to ` +
                `${path.relative(repoRoot, manifestPath)}.`,
        )
        continue
    }

    let manifest
    try {
        manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
    } catch {
        console.error(
            `Missing or unreadable ${surface.dir}/${MANIFEST_NAME} — run ` +
                "`node scripts/verify-ds-pristine.mjs --write` in the kernel to create it.",
        )
        failed = true
        continue
    }

    const drifted = []
    for (const [relativePath, hash] of Object.entries(manifest)) {
        if (current[relativePath] === undefined) drifted.push(`deleted:  ${relativePath}`)
        else if (current[relativePath] !== hash) drifted.push(`modified: ${relativePath}`)
    }
    for (const relativePath of Object.keys(current)) {
        if (manifest[relativePath] === undefined) drifted.push(`added:    ${relativePath}`)
    }

    if (drifted.length > 0) {
        console.error(`${surface.dir}/ has drifted from the pristine manifest:\n`)
        for (const entry of drifted) console.error(`  ${entry}`)
        console.error(
            `\n${surface.customizeHint} If this is an intentional kernel change, ` +
                "refresh the manifest with --write.",
        )
        failed = true
        continue
    }

    console.log(`${surface.dir}/ is pristine (${Object.keys(current).length} files verified).`)
}

process.exit(failed ? 1 : 0)

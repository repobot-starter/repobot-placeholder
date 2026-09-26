// Docs drift guardrail: every repo-relative file path referenced in AGENTS.md,
// docs/**/*.md, and .cursor/rules/**/*.mdc must exist. Renames that orphan the
// guidance fail CI instead of silently rotting.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function collectMarkdownFiles(dir) {
    if (!existsSync(dir)) return []
    return readdirSync(dir).flatMap((entry) => {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) return collectMarkdownFiles(full)
        return /\.(md|mdc)$/.test(entry) ? [full] : []
    })
}

// Machine-written docs are exempt: the platform commits the setup brief into
// composed projects, and its prose cites example and to-be-created paths
// (override recipes, artwork destinations) that legitimately don't exist yet.
// Checking it turned every fresh project's first CI run red.
const generatedDocs = new Set([
    path.join(repoRoot, "docs", "setup-brief.md"),
    // Generated from kernel sources (scripts/generate-landing-reference.mjs,
    // scripts/generate-web-app-reference.mjs); their prose is JSDoc extracted
    // verbatim and may cite example paths.
    path.join(repoRoot, "docs", "landing-content.md"),
    path.join(repoRoot, "docs", "web-app-content.md"),
])

const files = [
    path.join(repoRoot, "AGENTS.md"),
    ...collectMarkdownFiles(path.join(repoRoot, "docs")),
    ...collectMarkdownFiles(path.join(repoRoot, ".cursor", "rules")),
]
    .filter(existsSync)
    .filter((file) => !generatedDocs.has(file))

// Match backticked repo-relative paths like `firebase/functions/src/...` or `docs/testing.md`.
const pathPattern =
    /`((?:AGENTS\.md|repobot\.sandbox\.json|env\.manifest\.json|firebase\/|web\/|Graphql\/|protobufs\/|scripts\/|docs\/|\.cursor\/|\.github\/)[A-Za-z0-9_\-./*]*)`/g

let failures = 0
for (const file of files) {
    const content = readFileSync(file, "utf8")
    for (const match of content.matchAll(pathPattern)) {
        const referenced = match[1].replace(/\/$/, "")
        if (referenced.includes("*") || referenced.includes("<")) continue
        // Convention: `path` (new) marks a file the reader is being told to create.
        const afterMatch = content.slice(
            (match.index ?? 0) + match[0].length,
            (match.index ?? 0) + match[0].length + 7,
        )
        if (afterMatch.startsWith(" (new)")) continue
        if (!existsSync(path.join(repoRoot, referenced))) {
            console.error(`${path.relative(repoRoot, file)}: referenced path does not exist: ${referenced}`)
            failures++
        }
    }
}

if (failures > 0) {
    console.error(`\n${failures} broken doc path reference(s). Update the docs to match the code.`)
    process.exit(1)
}
console.log(`Doc path check passed (${files.length} guidance files scanned).`)

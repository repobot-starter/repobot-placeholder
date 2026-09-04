// Blocks hand-rolled session/auth transport plumbing from drifting in beside
// the shared, self-healing helpers. The bug class this pins down: template
// previews share one browser origin (the platform serves every workspace
// under /preview/:sessionId paths), so the persisted session token
// (base.localAuthToken) can belong to a DIFFERENT project, signed with that
// project's own LOCAL_AUTH_SECRET. The shared GraphQL client recovers from
// that silently (createApolloClient's recoverUnauthenticated), but a raw
// fetch that attaches the token itself gets no recovery — the PDF generator
// and invoice packs each hand-rolled exactly that and failed forever with
// "Invalid local auth token" until 8cff2e6 consolidated them onto
// Config/documentsAuth.ts. This gate keeps the next template from
// reintroducing the class.
//
// Three marker classes, scanned line-by-line across web/app, web/core, the
// design system, and the standalone template trees:
//
// 1. Persisted-token access — any mention of `localAuthToken` outside the
//    kernel auth client that owns the storage key. Sessions are read and
//    minted through runtime.authClient (getToken / signInAnonymously /
//    signOut), never by touching localStorage.
// 2. Raw documents transport — importing or calling `generateDocumentPdf`
//    (or resurrecting the old duplicated `acquireDocumentsAuthToken`)
//    outside the transport module and the blessed recovery helper. Pages
//    call generateAuthenticatedDocumentPdf from Config/documentsAuth, which
//    wraps the transport in the one-shot UNAUTHENTICATED recovery ladder.
// 3. Hand-rolled Authorization headers — building an `Authorization:` /
//    `authorization:` header or a `"Bearer ..."` value outside the shared
//    transports. GraphQL rides the shared Apollo client (its auth link
//    attaches the token and self-heals UNAUTHENTICATED); documents ride
//    generateAuthenticatedDocumentPdf. A NEW authenticated endpoint needs a
//    shared recovering helper next to Config/documentsAuth.ts — mirror its
//    recovery ladder, then sanction the helper here.
//
// Run: node scripts/check-auth-plumbing.mjs [repoRoot]

import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const SCAN_ROOTS = ["web/app/src", "web/core/src", "web/design-system/src", "templates"]

/* Where session/auth transport plumbing is allowed to live. */
const SANCTIONED_PREFIXES = [
    "web/core/src/Auth/", // the auth-client layer: owns the storage key and the auth-endpoint bearer calls
    "web/core/src/Graphql/createApolloClient.ts", // the Apollo auth link + UNAUTHENTICATED self-heal
    "web/core/src/Documents/", // the documents transport generateAuthenticatedDocumentPdf wraps
    "web/core/src/index.ts", // the @base/core barrel re-exporting the transport
    "web/app/src/Config/documentsAuth.ts", // the blessed documents recovery helper
    "web/app/src/generated/", // codegen output; regenerated, never hand-edited
]

const PERSISTED_TOKEN = /\blocalAuthToken\b/
const RAW_DOCUMENTS_TRANSPORT = /\bgenerateDocumentPdf\b|\bacquireDocumentsAuthToken\b/
const AUTH_HEADER = /["'`]?\b[Aa]uthorization\b["'`]?\s*[:=]|["'`]Bearer[\s$]/

const PERSISTED_TOKEN_FIX =
    "Sessions are owned by the kernel auth client: use runtime.authClient (getToken / " +
    "signInAnonymously / signOut) and never touch the persisted token. Previews share one " +
    "browser origin, so the stored token can belong to a DIFFERENT project (signed with " +
    "that project's secret) — only the auth client and the shared transports know how to " +
    "recover from that."

const RAW_DOCUMENTS_TRANSPORT_FIX =
    "Call generateAuthenticatedDocumentPdf from web/app/src/Config/documentsAuth instead. " +
    "The raw transport has no UNAUTHENTICATED recovery, and previews share one browser " +
    "origin — a persisted token from another project makes every raw call fail forever " +
    'with "Invalid local auth token". The helper wraps the same transport in the one-shot ' +
    "recovery ladder the GraphQL client already applies."

const AUTH_HEADER_FIX =
    "Do not hand-roll authenticated requests. GraphQL goes through the shared Apollo " +
    "client (its auth link attaches the token and self-heals UNAUTHENTICATED); document " +
    "PDFs go through generateAuthenticatedDocumentPdf (web/app/src/Config/documentsAuth). " +
    "If you are wiring a NEW authenticated endpoint, add a shared helper next to " +
    "documentsAuth.ts that mirrors its recovery ladder, and sanction that helper in " +
    "scripts/check-auth-plumbing.mjs — never attach the token at a call site."

/**
 * Pure core, exercised by the test: given file contents keyed by
 * repo-relative POSIX path, return the list of failure messages.
 */
export function checkAuthPlumbing(files) {
    const failures = []
    for (const [relativePath, source] of Object.entries(files)) {
        if (!/\.(?:ts|tsx|js|jsx|mjs|liquid)$/.test(relativePath) || relativePath.endsWith(".css.ts")) {
            continue
        }
        if (SANCTIONED_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) continue
        source.split("\n").forEach((line, index) => {
            const flag = (marker, fix) =>
                failures.push(`${relativePath}:${index + 1} — ${marker} ${fix}\n    ${line.trim()}`)
            if (PERSISTED_TOKEN.test(line)) {
                flag("direct persisted-session-token access.", PERSISTED_TOKEN_FIX)
            } else if (RAW_DOCUMENTS_TRANSPORT.test(line)) {
                flag("raw documents transport outside the recovery helper.", RAW_DOCUMENTS_TRANSPORT_FIX)
            } else if (AUTH_HEADER.test(line)) {
                flag("hand-rolled Authorization header.", AUTH_HEADER_FIX)
            }
        })
    }
    return failures
}

function* walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".git") continue
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            yield* walk(fullPath)
        } else {
            yield fullPath
        }
    }
}

function main() {
    const repoRoot = process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const files = {}
    for (const scanRoot of SCAN_ROOTS) {
        const absoluteRoot = path.join(repoRoot, ...scanRoot.split("/"))
        if (!existsSync(absoluteRoot)) continue
        for (const filePath of walk(absoluteRoot)) {
            if (!/\.(?:ts|tsx|js|jsx|mjs|liquid)$/.test(filePath)) continue
            const relativePath = path.relative(repoRoot, filePath).split(path.sep).join("/")
            files[relativePath] = readFileSync(filePath, "utf8")
        }
    }
    const failures = checkAuthPlumbing(files)
    if (failures.length > 0) {
        console.error("[check-auth-plumbing] FAIL:\n")
        for (const failure of failures) console.error(failure + "\n")
        process.exit(1)
    }
    console.log("[check-auth-plumbing] OK - sessions and authenticated fetches stay on the shared helpers.")
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main()
}

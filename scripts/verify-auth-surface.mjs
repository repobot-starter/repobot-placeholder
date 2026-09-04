// Blocks bespoke sign-in surfaces from drifting in beside the kernel auth
// components (AGENTS.md invariant: "Auth screens are never hand-built").
// The invariant was prompt-level only; this makes it mechanical.
//
// Two marker classes, both scanned line-by-line across web/app, web/core and
// the design system:
//
// 1. Password UI — `type="password"` inputs and `autoComplete`
//    current/new-password hints. Outside the kernel auth components these
//    are a hand-rolled credential form.
// 2. Interactive sign-in wiring — calls to signInWithPassword /
//    signInWithOAuth / signInWithMagicLink outside the LoginPage and the
//    core auth-client layer mean a page grew its own login flow.
//    (`signInAnonymously` is deliberately NOT a marker: guest-session
//    bootstrap through the kernel authClient is a sanctioned pattern.)
//
// Sanctioned paths when this fires: the login experience is
// web/design-system/src/components/Auth* composed by web/app/src/View/
// LoginPage/ — restyle it via repobot.theme.json / the auth variant props,
// or eject AuthCard/AuthScreen through the @ui registry
// (web/app/src/Theme/overrides/). Non-credential fields that trip the
// password heuristics (e.g. an API-key input) opt out with an
// `auth-exempt: <reason>` comment on the same line.
//
// Run: node scripts/verify-auth-surface.mjs [repoRoot]

import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const SCAN_ROOTS = ["web/app/src", "web/design-system/src", "web/core/src"]

/* Where sign-in code is allowed to live. */
const SANCTIONED_PREFIXES = [
    "web/design-system/src/components/Auth", // AuthCard / AuthScreen / AuthShell kernel components
    "web/app/src/View/LoginPage/", // the kernel login page composing them
    "web/app/src/Theme/overrides/", // the @ui eject seam
    "web/core/src/Auth/", // the auth-client layer these markers detect calls INTO
]

/* Existing non-sign-in password UI when this gate landed (Settings hosts the
 * kernel change-password card). Baseline — never add to this list to get a
 * green; new auth UI goes through the kernel components. */
const BASELINE = new Set(["web/app/src/View/Settings/SettingsPage.tsx"])

const PASSWORD_UI = /type="password"|autoComplete="(?:current|new)-password"/
const SIGN_IN_CALL = /\bsignInWith(?:Password|OAuth|MagicLink)\b/

function* walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            yield* walk(fullPath)
        } else {
            yield fullPath
        }
    }
}

/**
 * Pure core, exercised by the test: given file contents keyed by
 * repo-relative POSIX path, return the list of failure messages.
 */
export function verifyAuthSurface(files) {
    const failures = []
    for (const [relativePath, source] of Object.entries(files)) {
        if (!/\.tsx?$/.test(relativePath) || relativePath.endsWith(".css.ts")) continue
        if (SANCTIONED_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) continue
        if (BASELINE.has(relativePath)) continue
        source.split("\n").forEach((line, index) => {
            if (line.includes("auth-exempt:")) return
            if (PASSWORD_UI.test(line)) {
                failures.push(
                    `${relativePath}:${index + 1} — password field outside the kernel auth components. ` +
                        "Sign-in UI is AuthCard/AuthScreen (web/design-system/src/components/Auth*) " +
                        "composed by View/LoginPage; restyle via theme/variant config or eject through " +
                        "the @ui registry (web/app/src/Theme/overrides/). A non-credential secret input " +
                        "may append `// auth-exempt: <reason>`.\n" +
                        `    ${line.trim()}`,
                )
            } else if (SIGN_IN_CALL.test(line)) {
                failures.push(
                    `${relativePath}:${index + 1} — interactive sign-in call outside View/LoginPage. ` +
                        "Login flows live in the kernel LoginPage (which composes AuthScreen); route " +
                        "users there instead of wiring authClient sign-in into a page. Guest sessions " +
                        "use signInAnonymously, which this gate permits.\n" +
                        `    ${line.trim()}`,
                )
            }
        })
    }
    return failures
}

function main() {
    const repoRoot = process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const files = {}
    for (const scanRoot of SCAN_ROOTS) {
        const absoluteRoot = path.join(repoRoot, ...scanRoot.split("/"))
        if (!existsSync(absoluteRoot)) continue
        for (const filePath of walk(absoluteRoot)) {
            if (!/\.tsx?$/.test(filePath)) continue
            const relativePath = path.relative(repoRoot, filePath).split(path.sep).join("/")
            files[relativePath] = readFileSync(filePath, "utf8")
        }
    }
    const failures = verifyAuthSurface(files)
    if (failures.length > 0) {
        console.error("[verify-auth-surface] FAIL:\n")
        for (const failure of failures) console.error(failure + "\n")
        process.exit(1)
    }
    console.log("[verify-auth-surface] OK - no sign-in surface outside the kernel auth components.")
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main()
}

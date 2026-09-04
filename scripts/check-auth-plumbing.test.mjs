import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { checkAuthPlumbing } from "./check-auth-plumbing.mjs"

const SCRIPT = fileURLToPath(new URL("./check-auth-plumbing.mjs", import.meta.url))
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

test("the real repository passes", () => {
    const stdout = execFileSync(process.execPath, [SCRIPT, REPO_ROOT], { encoding: "utf8" })
    assert.match(stdout, /OK/)
})

// Negative test: the observed bug — a pack view hand-rolls the documents
// transport with its own token acquisition, exactly what the PDF generator
// and invoice packs shipped before 8cff2e6.
test("calling the raw documents transport from a page is a violation", () => {
    const failures = checkAuthPlumbing({
        "web/app/src/View/Quotes/QuotePage.tsx": [
            'import { generateDocumentPdf } from "@base/core"',
            "const generated = await generateDocumentPdf(endpoint, request, { authToken: token })",
        ].join("\n"),
    })
    assert.equal(failures.length, 2, failures.join("\n"))
    assert.match(failures[0], /QuotePage\.tsx:1/)
    assert.match(
        failures[0],
        /generateAuthenticatedDocumentPdf/,
        "the failure must name the shared helper to use instead",
    )
    assert.match(failures[0], /Invalid local auth token/)
})

// Negative test: resurrecting the duplicated pre-fix helper by copy-paste.
test("a copy-pasted acquireDocumentsAuthToken is a violation", () => {
    const failures = checkAuthPlumbing({
        "web/app/src/View/Quotes/quoteAuth.ts":
            "async function acquireDocumentsAuthToken(authClient) { return authClient.getToken() }",
    })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /raw documents transport/)
})

// Negative test: a page attaches the session token to its own fetch — the
// general form of the class, for any authenticated endpoint.
test("a hand-rolled Authorization header outside the shared transports is a violation", () => {
    const failures = checkAuthPlumbing({
        "web/app/src/View/Reports/ReportsPage.tsx": [
            "const token = await runtime.authClient.getToken()",
            "const response = await fetch(endpoint, {",
            "    headers: { Authorization: `Bearer ${token}` },",
            "})",
        ].join("\n"),
    })
    assert.equal(failures.length, 1, failures.join("\n"))
    assert.match(failures[0], /ReportsPage\.tsx:3/)
    assert.match(failures[0], /shared Apollo client/)
    assert.match(failures[0], /check-auth-plumbing\.mjs/, "must say where a new helper gets sanctioned")
})

// Negative test: reading or writing the persisted token directly.
test("touching localAuthToken outside the kernel auth client is a violation", () => {
    const failures = checkAuthPlumbing({
        "web/app/src/View/Reports/ReportsPage.tsx":
            'const token = localStorage.getItem("base.localAuthToken")',
        "templates/shopify/assets/session.js": 'window.token = localStorage["base.localAuthToken"]',
    })
    assert.equal(failures.length, 2, failures.join("\n"))
    assert.match(failures[0], /runtime\.authClient/)
    assert.match(failures[1], /session\.js:1/)
})

test("the shared transports and the recovery helper are sanctioned", () => {
    const failures = checkAuthPlumbing({
        "web/core/src/Auth/LocalAuthClient.ts": 'const STORAGE_KEY = "base.localAuthToken"',
        "web/core/src/Auth/BuiltinAuthClient.ts": "headers.Authorization = `Bearer ${bearerToken}`",
        "web/core/src/Graphql/createApolloClient.ts": "authorization: `Bearer ${token}`,",
        "web/core/src/Documents/DocumentsApi.ts": "headers.Authorization = `Bearer ${options.authToken}`",
        "web/core/src/index.ts": "    generateDocumentPdf,",
        "web/app/src/Config/documentsAuth.ts": "generate: generateDocumentPdf,",
    })
    assert.deepEqual(failures, [])
})

test("session bootstrap through the auth client and unauthenticated fetches are permitted", () => {
    const failures = checkAuthPlumbing({
        "web/app/src/View/Interpreter/InterpreterPage.tsx": [
            "if ((await runtime.authClient.getToken()) === null) {",
            "    await runtime.authClient.signInAnonymously()",
            "}",
        ].join("\n"),
        "web/app/src/View/PdfGenerator/PdfGeneratorPage.tsx":
            "const templates = await fetchDocumentTemplates(documentsEndpoint())",
    })
    assert.deepEqual(failures, [])
})

test("generated codegen output and non-code files are ignored", () => {
    const failures = checkAuthPlumbing({
        "web/app/src/generated/graphql/types.ts": 'headers: { Authorization: "Bearer x" }',
        "web/app/src/View/Reports/notes.md": "attach `Authorization: Bearer <token>` by hand",
    })
    assert.deepEqual(failures, [])
})

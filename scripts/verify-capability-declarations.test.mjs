// Tests for verify-capability-declarations.mjs. Each case builds a throwaway
// repo layout in a temp dir and runs the script against it via its repoRoot
// argument.

import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { collectSourceFiles, verifyCapabilityDeclarations } from "./verify-capability-declarations.mjs"

const scriptPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "verify-capability-declarations.mjs",
)

function makeRepo({ capabilities, withManifest = true } = {}) {
    const root = mkdtempSync(path.join(tmpdir(), "capability-declarations-"))
    if (withManifest) {
        writeFileSync(
            path.join(root, "repobot.deploy.json"),
            JSON.stringify({ templateKey: "repobot-base", packKey: "blank", capabilities }, null, 4) + "\n",
        )
    }
    return root
}

function writeSource(root, relative, source) {
    const fullPath = path.join(root, relative)
    mkdirSync(path.dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, source)
}

function run(root) {
    try {
        const stdout = execFileSync(process.execPath, [scriptPath, root], { encoding: "utf8" })
        return { code: 0, output: stdout }
    } catch (error) {
        return { code: error.status, output: `${error.stdout ?? ""}${error.stderr ?? ""}` }
    }
}

const STORAGE_USAGE = `import { putUploadBytes } from "@base/core"\nexport const send = (bytes: Uint8Array) => putUploadBytes("/upload", bytes)\n`

test("storage usage without a STORAGE declaration fails, naming the capability and the fix", () => {
    const root = makeRepo({ capabilities: ["AUTH"] })
    try {
        writeSource(root, path.join("web", "app", "src", "View", "Photos", "PhotosPage.tsx"), STORAGE_USAGE)
        const result = run(root)
        assert.equal(result.code, 1)
        assert.match(result.output, /STORAGE: code uses file uploads/)
        assert.match(result.output, /PhotosPage\.tsx \(putUploadBytes\)/)
        assert.match(result.output, /Add "STORAGE" to the "capabilities" array in repobot\.deploy\.json/)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("the same usage passes once STORAGE is declared", () => {
    const root = makeRepo({ capabilities: ["STORAGE"] })
    try {
        writeSource(root, path.join("web", "app", "src", "View", "Photos", "PhotosPage.tsx"), STORAGE_USAGE)
        const result = run(root)
        assert.equal(result.code, 0, result.output)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("the documents auto-file path counts as storage usage (it writes through the storage kernel)", () => {
    const root = makeRepo({ capabilities: ["DOCUMENTS"] })
    try {
        writeSource(
            root,
            path.join("firebase", "functions", "src", "Services", "Register", "RegisterService.ts"),
            `import { documentGenerationService } from "../Documents/DocumentGenerationService.js"\n` +
                `export const file = () => documentGenerationService.generateAndFileDocument(req)\n`,
        )
        const result = run(root)
        assert.equal(result.code, 1)
        assert.match(result.output, /STORAGE: code uses file uploads/)
        assert.match(result.output, /RegisterService\.ts \(generateAndFileDocument\)/)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("client PDF generation counts as auth usage (POST /generate requires a principal)", () => {
    // Domain view path on purpose: View/Invoices is the kernel's dormant
    // documents exemplar and exempt, so the probe lives in a domain page.
    const usage = `import { generateDocumentPdf } from "@base/core"\nexport const gen = () => generateDocumentPdf(endpoint, req, { authToken: token })\n`
    const undeclared = makeRepo({ capabilities: ["DOCUMENTS"] })
    const declared = makeRepo({ capabilities: ["DOCUMENTS", "AUTH"] })
    try {
        writeSource(undeclared, path.join("web", "app", "src", "View", "Quotes", "QuotePage.tsx"), usage)
        const result = run(undeclared)
        assert.equal(result.code, 1)
        assert.match(result.output, /AUTH: code uses sign-in/)
        assert.match(result.output, /QuotePage\.tsx \(generateDocumentPdf\)/)

        writeSource(declared, path.join("web", "app", "src", "View", "Quotes", "QuotePage.tsx"), usage)
        assert.equal(run(declared).code, 0)
    } finally {
        rmSync(undeclared, { recursive: true, force: true })
        rmSync(declared, { recursive: true, force: true })
    }
})

test("a repo with no repobot.deploy.json has nothing to verify", () => {
    const root = makeRepo({ withManifest: false })
    try {
        writeSource(root, path.join("web", "app", "src", "View", "Photos", "PhotosPage.tsx"), STORAGE_USAGE)
        const result = run(root)
        assert.equal(result.code, 0, result.output)
        assert.match(result.output, /nothing to verify/)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("a domain entry in the jobs registry fails without JOBS; the kernel's own entries pass", () => {
    const kernelOnly = makeRepo({ capabilities: [] })
    const withDomainJob = makeRepo({ capabilities: [] })
    const registry = (extra) =>
        `export const scheduledJobs = [\n` +
        `    { name: "analytics-rollup", schedule: "10 * * * *", description: "x", handler: async () => {} },\n` +
        extra +
        `]\n`
    try {
        writeSource(
            kernelOnly,
            path.join("firebase", "functions", "src", "Jobs", "JobsRegistry.ts"),
            registry(""),
        )
        assert.equal(run(kernelOnly).code, 0)
        writeSource(
            withDomainJob,
            path.join("firebase", "functions", "src", "Jobs", "JobsRegistry.ts"),
            registry(
                `    { name: "trading-ecb-exchange-rates", schedule: "0 6 * * *", description: "x", handler: async () => {} },\n`,
            ),
        )
        const result = run(withDomainJob)
        assert.equal(result.code, 1)
        assert.match(result.output, /JOBS: code uses scheduled jobs/)
        assert.match(result.output, /JobsRegistry\.ts \(a domain scheduledJobs entry\)/)
    } finally {
        rmSync(kernelOnly, { recursive: true, force: true })
        rmSync(withDomainJob, { recursive: true, force: true })
    }
})

test("kernel-exempt paths never count as usage", () => {
    const root = makeRepo({ capabilities: [] })
    try {
        // The kernel's own storage service, a dormant payment exemplar, the
        // design system, and this script's own directory all name kernel
        // clients without implying a declaration.
        writeSource(
            root,
            path.join("firebase", "functions", "src", "Services", "Storage", "StorageService.ts"),
            `export const storageService = { createUpload: () => {} }\n`,
        )
        writeSource(
            root,
            path.join("web", "app", "src", "View", "Shop", "ShopPage.tsx"),
            `import { derivePaymentsEndpoint } from "@base/core"\nexport const endpoint = derivePaymentsEndpoint\n`,
        )
        writeSource(
            root,
            path.join("web", "design-system", "src", "components", "AiChatThread.tsx"),
            `export const AiChatThread = () => null\n`,
        )
        const result = run(root)
        assert.equal(result.code, 0, result.output)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("a domain data layer fails without DATABASE", () => {
    const root = makeRepo({ capabilities: ["AUTH"] })
    try {
        writeSource(
            root,
            path.join("firebase", "functions", "src", "Data", "Trading", "Order.ts"),
            `import { baseTable } from "../BaseTable.js"\nexport const ordersTable = baseTable("trading_orders", {})\n`,
        )
        const result = run(root)
        assert.equal(result.code, 1)
        assert.match(result.output, /DATABASE: code uses a domain data layer/)
        assert.match(result.output, /Data\/Trading\/Order\.ts \(baseTable\(\)/)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("the pristine kernel tree passes with a client-only manifest (composed packs are born green)", () => {
    // The invariant behind the "fresh game grows AUTH/DOCUMENTS/STORAGE on
    // its first agent run" bug: compose-pack ships the WHOLE kernel tree
    // with the pack catalog's capabilities (games declare none), so every
    // kernel-shipped surface must either be capability-gated chrome or an
    // exempt exemplar. If this fails, a kernel file gained an unconditional
    // capability signal — gate it or exempt it; do not add capabilities to
    // the pack catalogs.
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const result = verifyCapabilityDeclarations({
        declaredCapabilities: ["IOS", "ANDROID"],
        sourceFiles: collectSourceFiles(repoRoot),
    })
    assert.equal(result.ok, true, result.message)
})

test("comment-only mentions and test files do not count as usage", () => {
    const root = makeRepo({ capabilities: [] })
    try {
        writeSource(
            root,
            path.join("web", "app", "src", "View", "Photos", "PhotosPage.tsx"),
            `// Use putUploadBytes here once the backend lands.\n/* storageService is the kernel entry. */\nexport const placeholder = true\n`,
        )
        writeSource(
            root,
            path.join("web", "app", "src", "View", "Photos", "PhotosPage.test.tsx"),
            STORAGE_USAGE,
        )
        const result = run(root)
        assert.equal(result.code, 0, result.output)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

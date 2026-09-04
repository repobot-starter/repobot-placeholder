// Capability declaration check ("doctor"): statically verifies that app code
// using a platform kernel client has a matching entry in repobot.deploy.json's
// "capabilities" array. Catches the failure mode where a feature works in the
// sandbox (local mode) but fails at runtime in production because the platform
// never provisioned the backing service — e.g. documents shipping without
// STORAGE declared, then "STORAGE_BUCKET is not set" on deploy.
//
// The rule set covers every capability the platform provisions from the
// manifest (EnvironmentInfraService.requiredInfraSteps): DATABASE, AUTH,
// PAYMENTS, AI, DOCUMENTS, STORAGE, JOBS, PUSH, EMAIL. Signals come from the
// kernel's own client surface (web/core exports, the firebase services, the
// native components) — the names domain code must reference to use the
// capability.
//
// Usage:
//   node scripts/verify-capability-declarations.mjs [repoRoot]   # exit 1 on mismatch

import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Each rule maps static usage signals to a deploy manifest capability.
 * Signals are matched against non-exempt source files only. A rule with
 * `includePaths` scans ONLY those files (even if exempt) — for capabilities
 * whose only domain signal is an edit to a kernel-owned registry file.
 */
export const CAPABILITY_RULES = [
    {
        capability: "DATABASE",
        what: "a domain data layer (SQL database)",
        runtimeHint:
            "A client-only deploy provisions no SQL database without it. Non-client-only " +
            "deploys are provisioned either way, but the manifest drives setup, advisor, and " +
            "docs tooling — declare it so the manifest tells the truth.",
        signals: [
            { pattern: /\bbaseTable\s*\(/, label: "baseTable(" },
            { pattern: /\bcreateDomainDatabase\s*\(/, label: "createDomainDatabase(" },
        ],
    },
    {
        capability: "AUTH",
        what: "sign-in (auth kernel)",
        runtimeHint: "Without it, the deploy carries no AUTH_JWT_SECRET and sign-in fails at runtime.",
        signals: [
            { pattern: /\bBuiltinAuthClient\b/, label: "BuiltinAuthClient" },
            { pattern: /\bderiveAuthEndpoint\b/, label: "deriveAuthEndpoint" },
            { pattern: /\bfetchRuntimeAuthConfigFromUrl\b/, label: "fetchRuntimeAuthConfigFromUrl" },
            { pattern: /\bfetchRuntimeAuthMethodsFromUrl\b/, label: "fetchRuntimeAuthMethodsFromUrl" },
            { pattern: /\bbuiltinAuthService\b/, label: "builtinAuthService" },
            // The documents kernel's POST /generate requires an authenticated
            // principal, so its client users need AUTH provisioned too (the
            // invoice page signs signed-out visitors in as guests first).
            { pattern: /\bgenerateDocumentPdf\b/, label: "generateDocumentPdf" },
        ],
    },
    {
        capability: "PAYMENTS",
        what: "checkout and billing (payments kernel)",
        runtimeHint:
            "Without it, deployed checkout fails at runtime (PAYMENTS_MODE defaults to stripe " +
            "with no STRIPE_SECRET_KEY staged).",
        signals: [
            { pattern: /\bderivePaymentsEndpoint\b/, label: "derivePaymentsEndpoint" },
            { pattern: /\bbuildDeliveryUrl\b/, label: "buildDeliveryUrl" },
            { pattern: /\bpaymentsService\b/, label: "paymentsService" },
        ],
    },
    {
        capability: "AI",
        what: "the AI assistant (ai kernel)",
        runtimeHint:
            "Without it, deployed assistant calls fail at runtime (no OPENAI_API_KEY or " +
            "AI gateway token staged).",
        signals: [
            { pattern: /\bderiveAiChatEndpoint\b/, label: "deriveAiChatEndpoint" },
            { pattern: /\bderiveAiVoiceTurnEndpoint\b/, label: "deriveAiVoiceTurnEndpoint" },
            { pattern: /\bstreamAiChatResponse\b/, label: "streamAiChatResponse" },
            { pattern: /\buseAiChat\b/, label: "useAiChat" },
            { pattern: /\bAiChatThread\b/, label: "AiChatThread" },
            { pattern: /\baiChatService\b/, label: "aiChatService" },
            { pattern: /\baiVoiceService\b/, label: "aiVoiceService" },
            { pattern: /\baiEmbeddingsService\b/, label: "aiEmbeddingsService" },
            { pattern: /\baiRetrievalService\b/, label: "aiRetrievalService" },
            { pattern: /\bAiChatStore\b/, label: "AiChatStore" },
            { pattern: /\bAiVoiceStore\b/, label: "AiVoiceStore" },
            { pattern: /\bAiChatComponent\b/, label: "AiChatComponent" },
            { pattern: /\bAiVoiceComponent\b/, label: "AiVoiceComponent" },
        ],
    },
    {
        capability: "DOCUMENTS",
        what: "PDF generation (documents kernel)",
        runtimeHint:
            "Without it, deployed document generation fails at runtime (no " +
            "DOCUMENTS_RENDER_URL/DOCUMENTS_TOKEN staged for the render service).",
        signals: [
            { pattern: /\bgenerateDocumentPdf\b/, label: "generateDocumentPdf" },
            { pattern: /\bderiveDocumentsEndpoint\b/, label: "deriveDocumentsEndpoint" },
            { pattern: /\bfetchDocumentTemplates\b/, label: "fetchDocumentTemplates" },
            { pattern: /\bdocumentGenerationService\b/, label: "documentGenerationService" },
        ],
    },
    {
        capability: "STORAGE",
        what: "file uploads (storage kernel)",
        runtimeHint: 'Without it, deployed uploads fail at runtime (e.g. "STORAGE_BUCKET is not set").',
        signals: [
            { pattern: /\bputUploadBytes\b/, label: "putUploadBytes" },
            { pattern: /\bderiveStorageEndpoint\b/, label: "deriveStorageEndpoint" },
            { pattern: /\bbuildPublicFileUrl\b/, label: "buildPublicFileUrl" },
            { pattern: /\bresolveStorageUrl\b/, label: "resolveStorageUrl" },
            { pattern: /\buseCreateUploadMutation\b/, label: "useCreateUploadMutation" },
            { pattern: /\buseFinalizeUploadMutation\b/, label: "useFinalizeUploadMutation" },
            { pattern: /\buseDeleteUploadMutation\b/, label: "useDeleteUploadMutation" },
            { pattern: /\buseWriteFileMutation\b/, label: "useWriteFileMutation" },
            { pattern: /\bstorageService\b/, label: "storageService" },
            { pattern: /\bStorageUploadClient\b/, label: "StorageUploadClient" },
            { pattern: /\bAvatarUploadComponent\b/, label: "AvatarUploadComponent" },
            { pattern: /\bcreateUpload\s*\(/, label: "createUpload(" },
            // The documents kernel's one-call auto-file path writes through
            // the storage kernel, so its users need STORAGE provisioned too.
            { pattern: /\bgenerateAndFileDocument\b/, label: "generateAndFileDocument" },
        ],
    },
    {
        capability: "JOBS",
        what: "scheduled jobs (jobs kernel)",
        runtimeHint:
            "Without it, the platform provisions no Cloud Scheduler tick, so the registered " +
            "job never runs in deployed environments.",
        // Domain jobs are entries in the kernel-owned registry (docs/jobs.md), so the rule
        // scans only that file and flags any job name the kernel itself did not ship.
        includePaths: [path.join("firebase", "functions", "src", "Jobs", "JobsRegistry.ts")],
        signals: [
            {
                pattern:
                    /\bname:\s*["'](?!purge-expired-auth-email-codes["']|analytics-rollup["']|push-activity-digest["'])/,
                label: "a domain scheduledJobs entry",
            },
        ],
    },
    {
        capability: "PUSH",
        what: "push notifications (push kernel)",
        runtimeHint:
            "Without it, no VAPID keys are provisioned and sends degrade to log lines — " +
            "notifications silently never arrive.",
        signals: [
            { pattern: /\bpushService\s*\./, label: "pushService." },
            { pattern: /\bpushDigestService\s*\./, label: "pushDigestService." },
            { pattern: /\brenderPushTemplate\b/, label: "renderPushTemplate" },
        ],
    },
    {
        capability: "EMAIL",
        what: "transactional email (mail kernel)",
        runtimeHint:
            "Without it, no SMTP account is staged and templated sends degrade to log " +
            "lines — email silently never sends.",
        signals: [
            { pattern: /\bmailService\b/, label: "mailService" },
            { pattern: /\bsendTemplatedMail\b/, label: "sendTemplatedMail" },
        ],
    },
]

/**
 * Kernel wiring and dormant exemplar code ships in every tree; matches here
 * do not require a capability declaration (see docs/setup-web.md). The
 * kernel's own account chrome — the Settings avatar upload and the shell's
 * avatar rendering — is exempt because it is capability-gated
 * (Config/deployCapabilities.ts): without STORAGE declared it renders
 * nothing, same doctrine as the push toggle's honest "Not configured".
 * Every composed pack ships the whole kernel tree, so any unconditional
 * kernel signal here would make every client-only pack fail this check at
 * birth — and the fix prompt would then add capabilities the project never
 * wanted (the "fresh game grows AUTH/DOCUMENTS/STORAGE on its first agent
 * run" bug). Domain code stays checked: this list is kernel-owned paths
 * only, and features agents add land in their own view/service directories.
 */
export const KERNEL_EXEMPT_PREFIXES = [
    // Web kernel wiring
    path.join("web", "app", "src", "Config"),
    path.join("web", "app", "src", "Graphql", "Operations", "Gql"),
    path.join("web", "app", "src", "generated"),
    path.join("web", "app", "src", "Ai"),
    // Dormant payment exemplars
    path.join("web", "app", "src", "View", "Shop"),
    path.join("web", "app", "src", "View", "Billing"),
    // Dormant documents exemplar (the invoice pack's home view; that pack
    // declares DOCUMENTS/AUTH at compose time, like Shop with PAYMENTS)
    path.join("web", "app", "src", "View", "Invoices"),
    // Dormant feature-pack preview surfaces (App.tsx mounts /pdf, /agent,
    // /interpret in every tree so adding a feature is exposure, not code
    // movement): the owning packs (pdf, agent, interpret) declare the real
    // capabilities in their catalogs — the same class as Shop/Invoices.
    path.join("web", "app", "src", "View", "PdfGenerator"),
    path.join("web", "app", "src", "View", "AgentDesk"),
    path.join("web", "app", "src", "View", "Interpreter"),
    // Kernel account chrome, capability-gated on STORAGE (see doc above)
    path.join("web", "app", "src", "View", "Settings"),
    path.join("web", "app", "src", "View", "Navbar"),
    // Dormant AI exemplars (unrouted unless a pack wires them, and packs
    // declare AI at compose time) and the component gallery
    path.join("web", "app", "src", "View", "AiChat"),
    path.join("web", "app", "src", "View", "AiTalk"),
    path.join("web", "app", "src", "View", "Accounting"),
    path.join("web", "app", "src", "View", "ThemeGallery"),
    // Dormant finance-pack surfaces (cfo/credit/flow/pitch): unrouted unless
    // the pack's manifest wires them, and the pack catalogs declare the real
    // capabilities (STORAGE/DATABASE/EMAIL/AI/DOCUMENTS) at compose time —
    // the same class as Shop/Billing/Invoices above.
    path.join("web", "app", "src", "View", "Cfo"),
    path.join("web", "app", "src", "View", "Credit"),
    path.join("web", "app", "src", "View", "Flow"),
    path.join("web", "app", "src", "View", "Pitch"),
    // Dormant utility-pack surfaces (files/images): unrouted home views of
    // feature packs whose catalogs declare STORAGE/DATABASE/AUTH at compose
    // time — the same class as the finance packs above. src/Drive is the
    // client machinery (upload pipeline, EXIF, thumbnails, demo seed) both
    // views share.
    path.join("web", "app", "src", "View", "Files"),
    path.join("web", "app", "src", "View", "Images"),
    path.join("web", "app", "src", "Drive"),
    // Design-system package internals (presentational only)
    path.join("web", "design-system"),
    // Kernel service implementations (usage from domain code is still checked)
    path.join("firebase", "functions", "src", "Services", "Shop"),
    path.join("firebase", "functions", "src", "Services", "Saas"),
    path.join("firebase", "functions", "src", "Services", "Payments"),
    path.join("firebase", "functions", "src", "Services", "Storage"),
    path.join("firebase", "functions", "src", "Services", "Documents"),
    path.join("firebase", "functions", "src", "Services", "Mail"),
    path.join("firebase", "functions", "src", "Services", "Ai"),
    path.join("firebase", "functions", "src", "Services", "BlogKnowledge"),
    path.join("firebase", "functions", "src", "Services", "Identity"),
    path.join("firebase", "functions", "src", "Services", "Jobs"),
    path.join("firebase", "functions", "src", "Services", "Push"),
    path.join("firebase", "functions", "src", "Services", "QuickBooks"),
    // Dormant finance-pack domains and their shared kernels (spreadsheets,
    // PDF intake): shipped in every tree, exercised only by the finance
    // packs, which declare the capabilities in their catalogs.
    path.join("firebase", "functions", "src", "Services", "Cfo"),
    path.join("firebase", "functions", "src", "Services", "Credit"),
    path.join("firebase", "functions", "src", "Services", "Flow"),
    path.join("firebase", "functions", "src", "Services", "Pitch"),
    path.join("firebase", "functions", "src", "Services", "Drive"),
    path.join("firebase", "functions", "src", "Services", "DocumentIntake"),
    path.join("firebase", "functions", "src", "Services", "Xlsx"),
    // Kernel GraphQL resolvers (domain resolvers live alongside in
    // Resolvers/<Domain>/ and stay checked)
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Ai"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Documents"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Identity"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Jobs"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Payments"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Project"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Push"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "QuickBooks"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Cfo"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Credit"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Flow"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Pitch"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Drive"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Saas"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Shop"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "Storage"),
    path.join("firebase", "functions", "src", "Graphql", "Resolvers", "PartiallyResolved.ts"),
    // Kernel GraphQL server wiring: the upload dataloader binds the storage
    // service in every tree but is dormant until a storage/drive resolver is
    // exercised — the packs that route those surfaces declare STORAGE in
    // their catalogs (same doctrine as Resolvers/Storage above).
    path.join("firebase", "functions", "src", "Graphql", "GraphqlServer.ts"),
    // Kernel cloud function entry points
    path.join("firebase", "functions", "src", "CloudFunctions"),
    // Kernel data layer: the shipped domain databases and tables (a domain's
    // own Data/<Domain>/ tables stay checked)
    path.join("firebase", "functions", "src", "Data", "Ai"),
    path.join("firebase", "functions", "src", "Data", "Analytics"),
    path.join("firebase", "functions", "src", "Data", "Identity"),
    path.join("firebase", "functions", "src", "Data", "Jobs"),
    path.join("firebase", "functions", "src", "Data", "Mail"),
    path.join("firebase", "functions", "src", "Data", "Payments"),
    path.join("firebase", "functions", "src", "Data", "Project"),
    path.join("firebase", "functions", "src", "Data", "Push"),
    path.join("firebase", "functions", "src", "Data", "QuickBooks"),
    path.join("firebase", "functions", "src", "Data", "Cfo"),
    path.join("firebase", "functions", "src", "Data", "Credit"),
    path.join("firebase", "functions", "src", "Data", "Flow"),
    path.join("firebase", "functions", "src", "Data", "Pitch"),
    path.join("firebase", "functions", "src", "Data", "Drive"),
    // Dormant feature-pack data layers (entry's capture tables, band's song
    // shelf): shipped in every tree, exercised only when the owning pack —
    // which declares DATABASE in its catalog — routes the surface.
    path.join("firebase", "functions", "src", "Data", "Entry"),
    path.join("firebase", "functions", "src", "Data", "Songs"),
    path.join("firebase", "functions", "src", "Data", "Storage"),
    path.join("firebase", "functions", "src", "Data", "Utils"),
    path.join("firebase", "functions", "src", "Data", "AiDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "AnalyticsDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "BaseDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "BaseTable.ts"),
    path.join("firebase", "functions", "src", "Data", "CommonPool.ts"),
    path.join("firebase", "functions", "src", "Data", "IdempotencyKeys.ts"),
    path.join("firebase", "functions", "src", "Data", "IdentityDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "JobsDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "MailDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "PaymentsDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "ProjectDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "PushDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "QuickBooksDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "CfoDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "CreditDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "EntryDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "FlowDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "PitchDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "DriveDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "SongsDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "StorageDatabase.ts"),
    path.join("firebase", "functions", "src", "Data", "TablePrefix.ts"),
    // The kernel-owned jobs registry: exempt from every service signal (it
    // references the auth/push/analytics services); the JOBS rule re-includes
    // it via includePaths.
    path.join("firebase", "functions", "src", "Jobs", "JobsRegistry.ts"),
    // Kernel dependency wrappers (the only call sites of provider SDKs)
    path.join("firebase", "functions", "src", "DependencyWrappers"),
    // Kernel auth client implementations and entry-point wiring (the same
    // class as the exempt AuthComponent files: kernel-shipped in every
    // tree, dormant until the app routes a sign-in surface)
    path.join("ios", "App", "Auth"),
    path.join("android", "app", "src", "main", "kotlin", "com", "baseapp", "android", "auth"),
    path.join("android", "app", "src", "main", "kotlin", "com", "baseapp", "android", "MainActivity.kt"),
    // Kernel navigation shell (native counterpart of web View/Navbar: its
    // only signal is the avatar file-URL derivation, dormant without an
    // uploaded avatar to render)
    path.join("ios", "App", "View", "Navigation"),
    path.join("android", "app", "src", "main", "kotlin", "com", "baseapp", "android", "view", "navigation"),
    // Native kernel components and stores
    path.join("ios", "App", "Components", "Storage"),
    path.join("ios", "App", "Components", "AiChat"),
    path.join("ios", "App", "Components", "AiVoice"),
    path.join("ios", "App", "Components", "Billing"),
    path.join("ios", "App", "Components", "AuthComponent.swift"),
    path.join("ios", "App", "Components", "PushComponent.swift"),
    path.join("ios", "App", "Components", "ProjectComponent.swift"),
    path.join("ios", "App", "Components", "UserComponent.swift"),
    path.join("ios", "App", "Components", "Components.swift"),
    path.join("ios", "App", "Store"),
    path.join("ios", "App", "View", "AiChat"),
    path.join("ios", "App", "View", "AiVoice"),
    path.join("ios", "App", "View", "Billing"),
    path.join("ios", "App", "GraphQL"),
    path.join("ios", "App", "IOSApp.swift"),
    path.join("ios", "AppTests"),
    path.join(
        "android",
        "app",
        "src",
        "main",
        "kotlin",
        "com",
        "baseapp",
        "android",
        "components",
        "storage",
    ),
    path.join(
        "android",
        "app",
        "src",
        "main",
        "kotlin",
        "com",
        "baseapp",
        "android",
        "components",
        "billing",
    ),
    path.join(
        "android",
        "app",
        "src",
        "main",
        "kotlin",
        "com",
        "baseapp",
        "android",
        "components",
        "AppComponents.kt",
    ),
    path.join(
        "android",
        "app",
        "src",
        "main",
        "kotlin",
        "com",
        "baseapp",
        "android",
        "components",
        "AuthComponent.kt",
    ),
    path.join(
        "android",
        "app",
        "src",
        "main",
        "kotlin",
        "com",
        "baseapp",
        "android",
        "components",
        "PushComponent.kt",
    ),
    path.join(
        "android",
        "app",
        "src",
        "main",
        "kotlin",
        "com",
        "baseapp",
        "android",
        "components",
        "ProjectComponent.kt",
    ),
    path.join(
        "android",
        "app",
        "src",
        "main",
        "kotlin",
        "com",
        "baseapp",
        "android",
        "components",
        "UserComponent.kt",
    ),
    path.join("android", "app", "src", "main", "kotlin", "com", "baseapp", "android", "config"),
    path.join("android", "app", "src", "main", "kotlin", "com", "baseapp", "android", "graphql"),
    path.join("android", "app", "src", "main", "kotlin", "com", "baseapp", "android", "push"),
    path.join("android", "app", "src", "main", "kotlin", "com", "baseapp", "android", "store"),
    path.join("android", "app", "src", "test"),
    // This script (it names every signal)
    path.join("scripts", "verify-capability-declarations.mjs"),
]

const SCAN_ROOTS = [
    { root: path.join("web", "app", "src"), extensions: [".ts", ".tsx"] },
    { root: path.join("firebase", "functions", "src"), extensions: [".ts"] },
    { root: path.join("ios", "App"), extensions: [".swift"] },
    {
        root: path.join("android", "app", "src", "main", "kotlin"),
        extensions: [".kt"],
    },
]

const SKIPPED_DIRECTORIES = new Set([
    "node_modules",
    "dist",
    "build",
    ".git",
    "generated",
    "test",
    "tests",
    "__tests__",
])

function isExempt(relativePath) {
    const normalized = relativePath.split(path.sep).join(path.sep)
    return KERNEL_EXEMPT_PREFIXES.some(
        (prefix) => normalized === prefix || normalized.startsWith(prefix + path.sep),
    )
}

/** Every checkable source file under the scan roots. Exported for tests. */
export function collectSourceFiles(repoRoot) {
    const files = []
    for (const { root, extensions } of SCAN_ROOTS) {
        const absRoot = path.join(repoRoot, root)
        if (!existsSync(absRoot)) {
            continue
        }
        const walk = (dir) => {
            for (const entry of readdirSync(dir, { withFileTypes: true })) {
                const fullPath = path.join(dir, entry.name)
                if (entry.isDirectory()) {
                    if (SKIPPED_DIRECTORIES.has(entry.name)) {
                        continue
                    }
                    walk(fullPath)
                } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
                    // Test code is not runtime usage.
                    if (entry.name.includes(".test.") || entry.name.includes(".spec.")) {
                        continue
                    }
                    const relative = path.relative(repoRoot, fullPath)
                    files.push({ relative, source: readFileSync(fullPath, "utf8") })
                }
            }
        }
        walk(absRoot)
    }
    return files
}

function stripComments(source) {
    // Drop block comments, then line comments, so doc-only mentions of kernel
    // clients (e.g. paymentsService in a table comment) do not count as usage.
    return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "")
}

function findUsages(sourceFiles) {
    /** @type {Map<string, { capability: string, what: string, runtimeHint: string, hits: { file: string, signal: string }[] }>} */
    const used = new Map()
    for (const file of sourceFiles) {
        const exempt = isExempt(file.relative)
        const code = stripComments(file.source)
        for (const rule of CAPABILITY_RULES) {
            if (rule.includePaths !== undefined) {
                if (!rule.includePaths.some((include) => file.relative === include)) {
                    continue
                }
            } else if (exempt) {
                continue
            }
            for (const signal of rule.signals) {
                if (!signal.pattern.test(code)) {
                    continue
                }
                let entry = used.get(rule.capability)
                if (!entry) {
                    entry = {
                        capability: rule.capability,
                        what: rule.what,
                        runtimeHint: rule.runtimeHint,
                        hits: [],
                    }
                    used.set(rule.capability, entry)
                }
                entry.hits.push({ file: file.relative, signal: signal.label })
            }
        }
    }
    return used
}

/**
 * Pure core: compare static usage against declared capabilities.
 * Returns { ok: true } or { ok: false, violations: [...], message }.
 */
export function verifyCapabilityDeclarations({ declaredCapabilities, sourceFiles }) {
    const declared = new Set(Array.isArray(declaredCapabilities) ? declaredCapabilities : [])
    const used = findUsages(sourceFiles)
    const violations = []
    for (const entry of used.values()) {
        if (declared.has(entry.capability)) {
            continue
        }
        violations.push(entry)
    }
    if (violations.length === 0) {
        return { ok: true }
    }
    const lines = violations.map((entry) => {
        const sampleHits = entry.hits
            .slice(0, 5)
            .map((hit) => `  - ${hit.file} (${hit.signal})`)
            .join("\n")
        const more = entry.hits.length > 5 ? `\n  - …and ${entry.hits.length - 5} more location(s)` : ""
        return (
            `${entry.capability}: code uses ${entry.what} but repobot.deploy.json does not declare it. ` +
            `Add "${entry.capability}" to the "capabilities" array in repobot.deploy.json ` +
            `so the platform provisions it at deploy time. ${entry.runtimeHint}\n${sampleHits}${more}`
        )
    })
    return {
        ok: false,
        violations,
        message: lines.join("\n\n"),
    }
}

function main() {
    const repoRoot = process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const manifestPath = path.join(repoRoot, "repobot.deploy.json")
    if (!existsSync(manifestPath)) {
        console.log("[verify-capability-declarations] no repobot.deploy.json; nothing to verify.")
        return
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
    const sourceFiles = collectSourceFiles(repoRoot)
    const result = verifyCapabilityDeclarations({
        declaredCapabilities: manifest.capabilities,
        sourceFiles,
    })
    if (!result.ok) {
        console.error("[verify-capability-declarations] FAIL:\n" + result.message)
        process.exit(1)
    }
    console.log(
        "[verify-capability-declarations] OK - every kernel client used in app code is declared in repobot.deploy.json.",
    )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main()
}

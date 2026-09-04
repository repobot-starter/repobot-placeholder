#!/usr/bin/env node
// Generates docs/landing-content.md — the landing kernel field guide agents
// read instead of exploring web/design-system sources. Every setup/migration
// run used to spend minutes re-deriving the same static facts (section
// content interfaces, shell contract, preset axes, eject rules); this bakes
// them into one doc, generated from the sources so it cannot drift.
//
//   node scripts/generate-landing-reference.mjs           # write the doc
//   node scripts/generate-landing-reference.mjs --check   # verify freshness
//
// The --check mode regenerates in memory and diffs against the committed
// file, so check:all catches a kernel change that forgot to regenerate.

import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { componentBlurb, extractDeclaration } from "./lib/reference-extract.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const MARKETING_DIR = path.join(ROOT, "web/design-system/src/marketing")
const OUTPUT_PATH = path.join(ROOT, "docs/landing-content.md")

function read(relativePath) {
    return readFileSync(path.join(MARKETING_DIR, relativePath), "utf8")
}

// ---------------------------------------------------------------- the union

const landingConfigSource = read("LandingConfig.ts")

/** `{ type: "hero"; variant?: X; content: Y }` union entries, in order. */
const unionEntries = [
    ...landingConfigSource.matchAll(/\{ type: "([a-z-]+)"; variant\?: (\w+); content: (\w+) \}/g),
].map(([, type, variantType, contentType]) => ({ type, variantType, contentType }))

if (unionEntries.length === 0) {
    console.error("No LandingSection union entries found — LandingConfig.ts format changed?")
    process.exit(1)
}

/** import type { A, B } from "./Module" → A/B resolve to Module.tsx|.ts */
const importedFrom = new Map()
for (const [, names, module] of landingConfigSource.matchAll(
    /import type \{([^}]+)\} from "\.\/([\w/.]+)"/g,
)) {
    for (const name of names
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)) {
        importedFrom.set(name, module)
    }
}

function moduleSource(module) {
    try {
        return read(`${module}.tsx`)
    } catch {
        return read(`${module}.ts`)
    }
}

// ------------------------------------------------------------- doc assembly

// Shapes documented once in the shared-primitives block; section blocks
// reference them by name instead of repeating the declaration.
const SHARED_PRIMITIVES = new Set(["MarketingCta", "MarketingMedia", "MarketingBackdrop"])

/**
 * The declaration plus every `Marketing*` helper it references from the same
 * module (recursively), so e.g. `feature-grid` carries `MarketingFeature`.
 */
function declarationWithHelpers(source, rootNames) {
    const collected = []
    const seen = new Set()
    const queue = [...rootNames]
    while (queue.length > 0) {
        const name = queue.shift()
        if (seen.has(name) || SHARED_PRIMITIVES.has(name)) {
            continue
        }
        seen.add(name)
        const declaration = extractDeclaration(source, name)
        if (declaration === undefined) {
            continue
        }
        collected.push(declaration)
        for (const [, referenced] of declaration.matchAll(/\b(Marketing[A-Z]\w+)\b/g)) {
            if (!seen.has(referenced)) {
                queue.push(referenced)
            }
        }
    }
    return collected.join("\n\n")
}

const sectionBlocks = unionEntries
    // nav/footer are the legacy pre-shell chrome; the shell section documents
    // the current contract, and the synthesis vocabulary excludes them.
    .filter((entry) => entry.type !== "nav" && entry.type !== "footer")
    .map((entry) => {
        const module = importedFrom.get(entry.contentType)
        const source = moduleSource(module)
        const blurb = componentBlurb(source, module.split("/").pop())
        const block = declarationWithHelpers(source, [entry.variantType, entry.contentType])
        return [`### \`${entry.type}\``, blurb ? `\n${blurb}\n` : "", "\n```ts\n" + block + "\n```\n"].join(
            "",
        )
    })

const shellSource = read("MarketingShell.tsx")
const shellBlock = [
    "MarketingShellNavVariant",
    "MarketingShellFooterVariant",
    "MarketingShellNavContent",
    "MarketingShellFooterColumn",
    "MarketingShellFooterContent",
    "MarketingShellConfig",
]
    .map((name) => extractDeclaration(shellSource, name))
    .filter(Boolean)
    .join("\n\n")

const contentSource = read("marketingContent.ts")
const backdropSource = read("MarketingBackdrop.tsx")
const primitivesBlock = [
    extractDeclaration(contentSource, "MarketingCta"),
    extractDeclaration(contentSource, "MarketingMedia"),
    extractDeclaration(backdropSource, "MarketingBackdrop"),
]
    .filter(Boolean)
    .join("\n\n")

// The preset vocabulary lives in the plain presets module (the .css.ts
// re-exports it; vanilla-extract can't serialize the definition functions).
// The token contract itself stays in the .css.ts.
const presetsSource = read("theme/marketingPresets.ts")
const presetDeclaration = extractDeclaration(presetsSource, "MarketingPresetName")
const themeSource = read("theme/marketingTheme.css.ts")

/** The `--marketing-*` variable names, derived from the token contract. */
function marketingTokenNames(source) {
    const contractMatch = source.match(/createGlobalThemeContract\(\s*\{([\s\S]*?)\n\s*\},\s*\(/)
    if (!contractMatch) {
        return []
    }
    const names = []
    const groupStack = []
    for (const line of contractMatch[1].split("\n")) {
        const groupOpen = line.match(/^\s*(\w+): \{\s*$/)
        const leaf = line.match(/^\s*(\w+): null,?\s*$/)
        const close = /^\s*\},?\s*$/.test(line)
        if (groupOpen) {
            groupStack.push(groupOpen[1])
        } else if (leaf) {
            names.push(`--marketing-${[...groupStack, leaf[1]].join("-")}`)
        } else if (close) {
            groupStack.pop()
        }
    }
    return names
}

const tokenNames = marketingTokenNames(themeSource)

const generatedDoc = `# Landing kernel reference

> Generated by \`scripts/generate-landing-reference.mjs\` from
> \`web/design-system/src/marketing/\` — do not edit by hand. Regenerate with
> \`npm run codegen:landing-reference\`.

This is the complete landing vocabulary: every section type's content
interface, the shell chrome contract, the style presets and token names, and
the rules for ejecting. **These facts are generated from this kernel's
sources and are complete — do not re-verify them by opening
\`web/design-system\` sources or auditing the test suite.**

## How pages render

Marketing pages live in \`repobot.project.json\`. Each page renders through
\`web/app/src/View/Site/SitePage.tsx\`:

- A page with an inline \`landing\` config (a full \`LandingConfig\`) renders
  it directly — this is the surface for custom-designed pages, and where
  setup work usually lands.
- A page without one renders its blueprint's default \`LandingConfig\`
  (\`web/app/src/View/Site/blueprints.ts\`), with the page's \`seed\` (the
  copy the owner wrote during setup) rendered verbatim over the placeholders.
- \`web/app/src/View/Site/sectionsFromManifest.ts\` maps manifest section
  entries into \`LandingSection\`s for pages that carry sections without a
  full inline config.

Section \`type\` names double as on-page anchor ids (\`#pricing\`, \`#faq\`),
so CTAs can target sections with zero configuration.

## Style presets and tokens

Sections style themselves exclusively from \`--marketing-*\` variables. A
preset assigns the full set; \`LandingConfig.style.overrides\` re-assigns
individual variables at the page root. The customer's \`repobot.theme.json\`
brand always wins over the preset's accent.

\`\`\`ts
${presetDeclaration}
\`\`\`

Token names (stable public contract):

${tokenNames.map((name) => `- \`${name}\``).join("\n")}

## Page chrome (shell)

\`LandingConfig.shell\` renders sticky top nav and footer around the section
stream. Legacy configs may instead carry \`nav\`/\`footer\` sections, which
stay renderable for back-compat; new work emits shell config.

\`\`\`ts
${shellBlock}
\`\`\`

## Shared content primitives

\`\`\`ts
${primitivesBlock}
\`\`\`

## Section types

${sectionBlocks.join("\n")}
## Ejecting and overrides

Never edit \`web/design-system/\` — the pristine guard fails the build. When
tokens, presets, and \`style.overrides\` aren't enough:

1. Copy the component into \`web/app/src/Theme/overrides/<Component>/\`.
2. Re-point the export in \`web/app/src/Theme/ui.ts\` (explicit exports win
   over the \`export * from "@base/design-system"\` baseline).
3. Keep props compatible; ejected styles may reference the \`--marketing-*\`
   tokens above.

## Test contracts

The only shipped test touching marketing components is
\`web/app/tests/View/Site/blueprints.test.ts\`; it asserts blueprint seed
rendering against the pristine kernel. Ejecting components, editing manifest
copy, and adding inline \`landing\` configs cannot break it. Do not audit the
test suite before making marketing changes.
`

// check:all runs prettier over docs/**/*.md, so emit prettier-clean output.
const prettier = await import("prettier")
const prettierConfig = (await prettier.resolveConfig(OUTPUT_PATH)) ?? {}
const formattedDoc = await prettier.format(generatedDoc, {
    ...prettierConfig,
    parser: "markdown",
})

const isCheck = process.argv.includes("--check")
if (isCheck) {
    let existing = ""
    try {
        existing = readFileSync(OUTPUT_PATH, "utf8")
    } catch {
        console.error("docs/landing-content.md is missing — run: npm run codegen:landing-reference")
        process.exit(1)
    }
    if (existing !== formattedDoc) {
        console.error("docs/landing-content.md is stale — run: npm run codegen:landing-reference")
        process.exit(1)
    }
    console.log("docs/landing-content.md is fresh.")
} else {
    writeFileSync(OUTPUT_PATH, formattedDoc)
    console.log(`Wrote ${path.relative(ROOT, OUTPUT_PATH)} (${unionEntries.length} section types).`)
}

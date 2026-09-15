// Parses the kernel's design vocabulary out of its TypeScript sources — the
// one extraction both `generate-design-manifest.mjs` (which publishes it) and
// `verify-pack-catalogs.mjs` (which validates pack seeds against it) share.
// Same regex-over-source approach as generate-landing-reference.mjs: the
// sources are the single source of truth; nothing here is hand-listed.

import { readFileSync } from "node:fs"
import path from "node:path"

/** All quoted string literals in a source fragment, in order. */
function quotedStrings(fragment) {
    return [...fragment.matchAll(/"([^"]+)"/g)].map(([, value]) => value)
}

/** The bracketed initializer of `NAME = [ ... ]` (const arrays). */
function arrayInitializer(source, name) {
    const match = source.match(new RegExp(`${name}[^=]*=\\s*\\[([^\\]]*)\\]`, "s"))
    return match ? quotedStrings(match[1]) : undefined
}

/** The list of `NAME = variantsOf<...>()([ ... ])` (locked variant arrays). */
function variantsOfArray(source, name) {
    const match = source.match(new RegExp(`${name} = variantsOf<\\w+>\\(\\)\\(\\[([^\\]]*)\\]`, "s"))
    return match ? quotedStrings(match[1]) : undefined
}

/** The members of `export type NAME = "a" | "b" | ...` (string unions). */
function unionMembers(source, name) {
    const match = source.match(new RegExp(`export type ${name} =((?:[^\\n]|\\n\\s*\\|)*)`))
    return match ? quotedStrings(match[1]) : undefined
}

/** The `{ key: [...] }` entries of a record initializer following `NAME`. */
function recordOfArrays(source, name) {
    const block = source.match(new RegExp(`${name}[^{]*\\{([\\s\\S]*?)\\n\\}`))
    if (!block) {
        return undefined
    }
    const record = {}
    for (const [, key, values] of block[1].matchAll(
        /"?([\w-]+)"?:\s*(?:variantsOf<\w+>\(\)\()?\[([^\]]*)\]/g,
    )) {
        record[key] = quotedStrings(values)
    }
    return record
}

/** The `{ key: "value" }` entries of a record initializer following `NAME`. */
function recordOfStrings(source, name) {
    const block = source.match(new RegExp(`${name}[^{]*\\{([\\s\\S]*?)\\n\\}`))
    if (!block) {
        return undefined
    }
    const record = {}
    for (const [, key, value] of block[1].matchAll(/"?([\w-]+)"?:\s*"([^"]+)"/g)) {
        record[key] = value
    }
    return record
}

/**
 * Each preset's ambition axes (motion idiom, treatment flags, display
 * scale) out of the `marketingPresetDefinitions` initializer. Definitions
 * appear in declaration order, so each preset's block is the slice from its
 * key to the next preset's key — no brace balancing needed.
 */
function presetAxes(source, names) {
    const body = source.slice(source.indexOf("marketingPresetDefinitions"))
    if (body === "") {
        return undefined
    }
    const starts = names
        .map((name) => {
            const match = body.match(new RegExp(`\\n    "?${name}"?: \\{`))
            return match === null ? null : { name, index: match.index }
        })
        .filter((entry) => entry !== null)
        .sort((a, b) => a.index - b.index)
    const record = {}
    for (let i = 0; i < starts.length; i += 1) {
        const block = body.slice(starts[i].index, starts[i + 1]?.index)
        const idiom = block.match(/idiom: "([^"]+)"/)?.[1]
        const scale = block.match(/scale: "([^"]+)"/)?.[1]
        const treatment = block.match(/treatment: \[([^\]]*)\]/)
        if (idiom === undefined || scale === undefined || treatment === null) {
            return undefined
        }
        record[starts[i].name] = {
            motion: idiom,
            treatment: quotedStrings(treatment[1]),
            displayScale: Number(scale),
        }
    }
    return record
}

function required(value, what) {
    if (
        value === undefined ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0)
    ) {
        throw new Error(`design vocabulary extraction found no ${what} — source format changed?`)
    }
    return value
}

/**
 * The full design vocabulary, parsed from kernel sources under `root`.
 * Throws when any expected declaration stops matching, so a source
 * refactor breaks the check run instead of silently emptying the manifest.
 */
export function parseDesignVocabulary(root) {
    const read = (relative) => readFileSync(path.join(root, relative), "utf8")
    const vocabulary = read("web/design-system/src/marketing/landingVocabulary.ts")
    const presets = read("web/design-system/src/marketing/theme/marketingPresets.ts")
    const themeConfig = read("web/design-system/src/theme/themeConfig.ts")
    const shell = read("web/design-system/src/marketing/MarketingShell.tsx")

    return {
        sectionVariants: required(
            recordOfArrays(vocabulary, "LANDING_SECTION_VARIANTS"),
            "section variants",
        ),
        mediaDependentVariants:
            recordOfArrays(vocabulary, "LANDING_MEDIA_DEPENDENT_VARIANTS") ?? {},
        mediaEvidenceVariants: recordOfArrays(vocabulary, "LANDING_MEDIA_EVIDENCE_VARIANTS") ?? {},
        multiMediaVariants: recordOfArrays(vocabulary, "LANDING_MULTI_MEDIA_VARIANTS") ?? {},
        pairedMediaVariants: recordOfArrays(vocabulary, "LANDING_PAIRED_MEDIA_VARIANTS") ?? {},
        sectionOrderRoles: required(
            recordOfStrings(vocabulary, "LANDING_SECTION_ORDER_ROLES"),
            "section order roles",
        ),
        stylePresets: required(unionMembers(presets, "MarketingPresetName"), "style presets"),
        stylePresetAxes: required(
            presetAxes(presets, required(unionMembers(presets, "MarketingPresetName"), "style presets")),
            "style preset axes",
        ),
        shellNavVariants: required(
            arrayInitializer(shell, "marketingShellNavVariants"),
            "shell nav variants",
        ),
        shellFooterVariants: required(
            variantsOfArray(vocabulary, "MARKETING_SHELL_FOOTER_VARIANTS"),
            "shell footer variants",
        ),
        theme: {
            radius: required(unionMembers(themeConfig, "ThemeRadiusPreset"), "radius presets"),
            density: required(unionMembers(themeConfig, "ThemeDensityPreset"), "density presets"),
            mode: required(unionMembers(themeConfig, "ThemeConfiguredMode"), "mode presets"),
            motion: required(unionMembers(themeConfig, "ThemeMotionPreset"), "motion presets"),
            character: required(
                unionMembers(themeConfig, "ThemeCharacterPreset"),
                "character presets",
            ),
            navigation: required(
                arrayInitializer(themeConfig, "MARKETING_NAV_VARIANTS"),
                "marketing nav variants",
            ),
            appShellVariants: required(
                arrayInitializer(themeConfig, "APP_SHELL_VARIANTS"),
                "app shell variants",
            ),
            appShellContent: required(
                arrayInitializer(themeConfig, "APP_SHELL_CONTENT_MODES"),
                "app shell content modes",
            ),
            ui: {
                tableStyle: required(unionMembers(themeConfig, "UiTableStyle"), "table styles"),
                tablePagination: required(
                    unionMembers(themeConfig, "UiTablePagination"),
                    "table pagination",
                ),
                formPresentation: required(
                    unionMembers(themeConfig, "UiFormPresentation"),
                    "form presentations",
                ),
                formWidth: required(unionMembers(themeConfig, "UiFormWidth"), "form widths"),
                errorPresentation: required(
                    unionMembers(themeConfig, "UiErrorPresentation"),
                    "error presentations",
                ),
                loaderStyle: required(unionMembers(themeConfig, "UiLoaderStyle"), "loader styles"),
                modalChrome: required(unionMembers(themeConfig, "UiModalChrome"), "modal chromes"),
                authLayout: required(unionMembers(themeConfig, "UiAuthLayout"), "auth layouts"),
                emptyVoice: required(unionMembers(themeConfig, "UiEmptyVoice"), "empty voices"),
                toastPosition: required(
                    unionMembers(themeConfig, "UiToastPosition"),
                    "toast positions",
                ),
                toastStyle: required(unionMembers(themeConfig, "UiToastStyle"), "toast styles"),
            },
        },
    }
}

/** Slot kinds a pack `contentContract` may declare (packs/README.md). */
export const CONTENT_SLOT_KINDS = ["text", "text[]", "number", "media", "media[]", "collection"]

/**
 * Structural problems with a pack's `contentContract`, as human-readable
 * strings (empty when valid). Shared by the catalog verifier and the
 * manifest generator so "valid" means one thing.
 */
export function contentContractProblems(contract) {
    const problems = []
    if (typeof contract.module !== "string" || contract.module === "") {
        problems.push('contentContract must name its typed content "module"')
    }
    if (typeof contract.slots !== "object" || contract.slots === null) {
        problems.push('contentContract must declare a "slots" map')
        return problems
    }
    const walk = (slots, prefix) => {
        for (const [slotPath, slot] of Object.entries(slots)) {
            const label = prefix === "" ? slotPath : `${prefix}.${slotPath}`
            if (typeof slot !== "object" || slot === null || !CONTENT_SLOT_KINDS.includes(slot.kind)) {
                problems.push(
                    `slot '${label}': "kind" must be one of ${CONTENT_SLOT_KINDS.join(" | ")}`,
                )
                continue
            }
            if (slot.min !== undefined && (!Number.isInteger(slot.min) || slot.min < 0)) {
                problems.push(`slot '${label}': "min" must be a non-negative integer`)
            }
            if (slot.kind === "collection") {
                if (typeof slot.item !== "object" || slot.item === null) {
                    problems.push(`slot '${label}': collections must declare an "item" slot map`)
                } else {
                    walk(slot.item, label)
                }
            } else if (slot.item !== undefined) {
                problems.push(`slot '${label}': only collections may declare "item"`)
            }
        }
    }
    walk(contract.slots, "")
    return problems
}

/**
 * Problems with a pack catalog's `landing` seeds against the vocabulary
 * (empty when valid): every routed page must be seeded, every seeded
 * section's type must exist, and any declared variant must be shipped.
 */
export function landingSeedProblems(landing, vocabulary) {
    const problems = []
    const pages = landing.pages ?? {}
    for (const [route, pageId] of Object.entries(landing.routes ?? {})) {
        if (pages[pageId] === undefined) {
            problems.push(`route '${route}' maps to page '${pageId}' but declares no page seed`)
        }
    }
    for (const [pageId, page] of Object.entries(pages)) {
        for (const section of page.sections ?? []) {
            const variants = vocabulary.sectionVariants[section.type]
            if (variants === undefined) {
                problems.push(`page '${pageId}': unknown section type '${section.type}'`)
            } else if (section.variant !== undefined && !variants.includes(section.variant)) {
                problems.push(
                    `page '${pageId}': section '${section.id}' declares unshipped variant ` +
                        `'${section.variant}' for type '${section.type}'`,
                )
            }
        }
    }
    if (landing.style?.preset !== undefined && !vocabulary.stylePresets.includes(landing.style.preset)) {
        problems.push(`style preset '${landing.style.preset}' is not a shipped preset`)
    }
    return problems
}

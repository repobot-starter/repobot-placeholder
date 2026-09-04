import {
    LANDING_SECTION_VARIANTS,
    MARKETING_SHELL_FOOTER_VARIANTS,
    marketingLinkKey,
    marketingPresetNames,
    marketingShellNavVariants,
    registerVisualDocRenderer,
    runtimeSiteDocument,
    visualDocSeq,
    type LandingConfig,
    type LandingSection,
    type MarketingPresetName,
    type MarketingShellFooterVariant,
    type MarketingShellNavVariant,
} from "@ui"
import { useSyncExternalStore } from "react"
import landingDocumentJson from "../../../../../repobot.landing.json"
import { activePack, type PackKey } from "../../Config/activePack"
import { sectionFromEntry } from "../Site/sectionsFromManifest"

/**
 * Resolves the root `repobot.landing.json` layout document over a page's
 * code `LandingConfig` — the landing sibling of the theme contract
 * (`web/design-system/src/theme/themeConfig.ts`). The document owns the
 * page's SKELETON: style preset, shell chrome variants, and the section
 * order and variants. Code keeps the CONTENT: every section's copy, media,
 * and CTAs stay in the TypeScript config, bound to document entries by a
 * stable id (a section's id defaults to its `type`; only duplicate-type
 * sections need explicit ids). Edited via Vite JSON import, so document
 * edits hot-reload exactly like theme edits.
 *
 * The document describes the ACTIVE pack's landing surface (the same
 * "active" semantics as `packs/active.json` everywhere else): when a pack
 * with a landing surface is active, its page reads the document — compose
 * stamped the pack's skeleton into it — and the kernel's `/landing`
 * exemplar keeps its code config. Under every other pack the kernel
 * exemplar is the documented surface. `resolveLandingConfig` gates on this,
 * so the non-active exemplar always renders its code config untouched.
 *
 * Merge semantics (mirrors the theme resolver's graceful degradation — a
 * hand-edited or platform-written document can never crash the page):
 *
 * - `style.preset`: the document's preset when it names a real one,
 *   otherwise the code config's. `style.overrides` always come from code.
 * - `shell.nav.variant` / `shell.footer.variant`: applied only when the
 *   code config defines that chrome (its content lives in code) and the
 *   variant is in the shell vocabulary; otherwise the code value stands.
 * - `sections`: the document's order wins. Each entry binds to the code
 *   section whose id (or type) matches; its variant applies when valid for
 *   that section's type, else the code variant stands. An entry with no
 *   registered content is skipped; code sections absent from the document
 *   render after the documented ones, in code order; a code section is
 *   used at most once (duplicate document references are dropped). A
 *   missing or non-array `sections` leaves the code order untouched.
 * - `sections[].image`: a servable path overriding the section's primary
 *   media slot (hero `media` / first slide, content-split `media`).
 * - `sections[].media`: per-list photograph overrides (the preview editor's
 *   drop-or-Replace gesture). An array replaces that list wholesale; a
 *   map of index → path overlays individual slots. Applied on code indices
 *   before `order`, so a photo stays on its item across a reorder.
 * - `sections[].order`: per-list item permutations (the preview editor's
 *   drag-an-item gesture) applied over the code content arrays — see
 *   `withDocumentOrder` for the graceful-degradation rules.
 * - `sections[].text`: per-field copy overrides (the preview editor's
 *   click-to-edit gesture). A map of dotted field path → string, replacing
 *   an existing string at that path in the section's content ("headline",
 *   "cta.label", "features.2.title"). Only existing strings are replaced —
 *   a path that doesn't resolve to a string is ignored with a warning, so
 *   an override can never invent structure. Applied on code indices before
 *   `order`, so an edit stays on its item across a reorder.
 *
 * Every fallback warns (build-time/console, like the theme resolver)
 * instead of failing.
 */

/** Packs whose landing surface adopts the document when active. */
const LANDING_SURFACE_PACKS: readonly PackKey[] = ["launch"]

/* The live document. Editing repobot.landing.json in a running dev server
 * must re-render the page, not reload it (the platform showroom
 * preview-writes the document and expects ~1s feedback): this module is the
 * document's only importer, so accepting the JSON module's hot update here
 * stops Vite's invalidation from cascading to the entry. Pages subscribe
 * through useLandingConfig below. In production the deploy-injected
 * overlay outranks the build-time import (runtimeSiteDocuments.ts): the
 * platform republishes a layout save by re-stamping the overlay over the
 * cached bundle, so the baked JSON may be older than the deployed
 * document. Without the overlay (dev, tests, kernels served without the
 * injector) the import stands, exactly as before. */
let currentDocument: unknown = runtimeSiteDocument("repobot.landing.json") ?? landingDocumentJson
let documentVersion = 0
const documentListeners = new Set<() => void>()

/** The pack-stamp gate's quiet form, for the ack decision below: whether
 * the resolvers will refuse this document (stamped for a foreign pack) and
 * render the code config instead. No warning here — `isForeignPackDocument`
 * warns once per render where the refusal actually happens. */
function landingDocumentGated(document: unknown): boolean {
    if (typeof document !== "object" || document === null || Array.isArray(document)) return false
    const stamp = (document as { pack?: unknown }).pack
    return typeof stamp === "string" && stamp.length > 0 && stamp !== activePack.key
}

if (import.meta.hot) {
    // Claim the landing document's ack: routes that never load this module
    // get the design system's vacuous fallback ack instead (themeHotUpdate),
    // so a landing write on a non-landing route can't strand the platform's
    // repaint watchdog.
    registerVisualDocRenderer("repobot.landing.json")
    import.meta.hot.accept("../../../../../repobot.landing.json", (newModule) => {
        if (newModule !== undefined) {
            currentDocument = newModule.default
            documentVersion += 1
            for (const listener of [...documentListeners]) listener()
            // The platform holds every visual-document write to an OBSERVED
            // repaint (falling back to a full preview reload otherwise). Ack
            // only after the document actually applied — never on mere HMR
            // delivery — mirroring the theme contract's ack in
            // themeHotUpdate.ts. The iframe's platform parent and the
            // streamed kiosk's injected bridge (where parent === window)
            // both hear the same post. No listener: a no-op.
            //
            // A document the pack-stamp gate refuses (stamped for a foreign
            // pack — a stale client writing across a template flip) did NOT
            // become the page: pages re-rendered to their pristine code
            // config. Acking it would stand the watchdog down against a look
            // the user never asked for; withholding lets the fallback reload
            // re-read the real documents.
            if (!landingDocumentGated(currentDocument)) {
                // The seq (recorded from the dev server's will-apply
                // announcement, which precedes this module update on the
                // websocket) tells the platform WHICH write this ack
                // repainted — rapid-fire remix presses coalesce, and an
                // unkeyed ack used to clear the wrong press's overlay arm.
                const seq = visualDocSeq("repobot.landing.json")
                try {
                    window.parent.postMessage(
                        {
                            channel: "repobot-preview",
                            type: "visual-applied",
                            doc: "repobot.landing.json",
                            ...(seq !== undefined ? { seq } : {}),
                        },
                        "*",
                    )
                } catch {
                    /* A cross-origin parent that denies postMessage. */
                }
            }
        }
    })
}

function subscribeLandingDocument(listener: () => void): () => void {
    documentListeners.add(listener)
    return () => {
        documentListeners.delete(listener)
    }
}

function getLandingDocumentVersion(): number {
    return documentVersion
}

/** The surfaces a landing page can declare itself as. */
export type LandingDocumentSurface = "kernel" | PackKey

function warnInvalid(field: string, value: unknown, fallback: string): void {
    console.warn(`[landing] repobot.landing.json: invalid ${field} ${JSON.stringify(value)}; ${fallback}.`)
}

/**
 * The pack-stamp gate. Every writer stamps the document's top-level `pack`
 * with the active pack key (`packs/active.json`) at write time — the
 * platform's compose/remix engines, panel layout edits, template-flip
 * seeding, and the kernel's own pack switch. Templates are FULLY isolated
 * style-wise, so a document stamped for a FOREIGN pack is treated as
 * absent (the page renders its pristine code config, with a console
 * warning) — one pack's layout and copy edits must never wear another
 * pack's page after a template flip. Unstamped documents (legacy
 * projects, the pristine kernel default) and malformed stamps resolve
 * normally.
 */
function isForeignPackDocument(document: Record<string, unknown>): boolean {
    const stamp = document.pack
    if (typeof stamp !== "string" || stamp.length === 0) return false
    if (stamp === activePack.key) return false
    console.warn(
        `[landing] repobot.landing.json is stamped for pack "${stamp}" but ` +
            `"${activePack.key}" is active; keeping the code config.`,
    )
    return true
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function resolvePreset(config: LandingConfig, style: unknown): MarketingPresetName {
    if (style === undefined) return config.style.preset
    if (!isRecord(style)) {
        warnInvalid("style", style, "keeping the code config's style")
        return config.style.preset
    }
    const preset = style.preset
    if (preset === undefined) return config.style.preset
    if (typeof preset === "string" && (marketingPresetNames as readonly string[]).includes(preset)) {
        return preset as MarketingPresetName
    }
    warnInvalid("style.preset", preset, `keeping "${config.style.preset}"`)
    return config.style.preset
}

/**
 * The document's shared-chrome link order (`shell.nav.order.links`): a list
 * of link KEYS (canonical href / #anchor / label — `marketingLinkKey`), not
 * indices, because the shell filters the current page out of its own links
 * so rendered indices differ page to page. Listed links render in list
 * order; links the list doesn't mention follow in code order; unknown keys
 * are ignored — the same graceful degradation as `withDocumentOrder`.
 * Shared chrome means one order for the whole site: this applies on the
 * root landing surface and on every documented page alike.
 */
function withShellNavOrder(shell: LandingConfig["shell"], documentShell: unknown): LandingConfig["shell"] {
    if (shell?.nav === undefined || !isRecord(documentShell)) return shell
    const nav = isRecord(documentShell.nav) ? documentShell.nav : undefined
    const order = nav !== undefined && isRecord(nav.order) ? nav.order.links : undefined
    if (order === undefined || order === null) return shell
    if (!Array.isArray(order) || order.some((key) => typeof key !== "string")) {
        warnInvalid("shell.nav.order.links", order, "keeping the code link order")
        return shell
    }
    const links = shell.nav.content.links
    if (links === undefined || links.length < 2) return shell
    const position = new Map<string, number>()
    order.forEach((key: string, index) => {
        if (!position.has(key)) position.set(key, index)
    })
    const listed = links
        .filter((link) => position.has(marketingLinkKey(link)))
        .sort((a, b) => position.get(marketingLinkKey(a))! - position.get(marketingLinkKey(b))!)
    const unlisted = links.filter((link) => !position.has(marketingLinkKey(link)))
    const reordered = [...listed, ...unlisted]
    if (reordered.every((link, index) => link === links[index])) return shell
    return {
        ...shell,
        nav: { ...shell.nav, content: { ...shell.nav.content, links: reordered } },
    }
}

function resolveShell(config: LandingConfig, shell: unknown): LandingConfig["shell"] {
    if (shell === undefined) return config.shell
    if (!isRecord(shell)) {
        warnInvalid("shell", shell, "keeping the code config's chrome")
        return config.shell
    }
    if (config.shell === undefined) {
        // Chrome content lives in code; a document variant for chrome the
        // code config doesn't define has nothing to render.
        warnInvalid("shell", shell, "the code config defines no shell chrome; ignoring")
        return undefined
    }
    let resolved = config.shell
    const navVariant = isRecord(shell.nav) ? shell.nav.variant : undefined
    if (navVariant !== undefined && config.shell.nav !== undefined) {
        if (
            typeof navVariant === "string" &&
            (marketingShellNavVariants as readonly string[]).includes(navVariant)
        ) {
            resolved = {
                ...resolved,
                nav: { ...config.shell.nav, variant: navVariant as MarketingShellNavVariant },
            }
        } else {
            warnInvalid("shell.nav.variant", navVariant, "keeping the code config's nav variant")
        }
    }
    const footerVariant = isRecord(shell.footer) ? shell.footer.variant : undefined
    if (footerVariant !== undefined && config.shell.footer !== undefined) {
        if (
            typeof footerVariant === "string" &&
            (MARKETING_SHELL_FOOTER_VARIANTS as readonly string[]).includes(footerVariant)
        ) {
            resolved = {
                ...resolved,
                footer: { ...config.shell.footer, variant: footerVariant as MarketingShellFooterVariant },
            }
        } else {
            warnInvalid("shell.footer.variant", footerVariant, "keeping the code config's footer variant")
        }
    }
    return withShellNavOrder(resolved, shell)
}

/** The document's variant when it's real for this section's type, else the code variant. */
function withDocumentVariant(section: LandingSection, entry: Record<string, unknown>): LandingSection {
    const variant = entry.variant
    if (variant === undefined || variant === null) return withContentOverrides(section, entry)
    const allowed: readonly string[] = LANDING_SECTION_VARIANTS[section.type]
    if (typeof variant === "string" && allowed.includes(variant)) {
        // The runtime check above is exactly what the cast asserts: the
        // variant is one of this section type's own variant names.
        return withContentOverrides({ ...section, variant } as LandingSection, entry)
    }
    warnInvalid(
        `sections["${section.id ?? section.type}"].variant`,
        variant,
        "keeping the code config's variant",
    )
    return withContentOverrides(section, entry)
}

/** The document's content-facing overrides: copy, primary slot, per-list photos, then item order. */
function withContentOverrides(section: LandingSection, entry: Record<string, unknown>): LandingSection {
    return withDocumentOrder(
        withDocumentMedia(withDocumentImage(withDocumentText(section, entry), entry), entry),
        entry,
    )
}

/** Path grammar for text overrides: dotted identifiers and array indices,
 * bounded so a hostile document can't walk anywhere surprising. */
const TEXT_FIELD_PATH = /^[a-zA-Z][a-zA-Z0-9]*(\.(?:[a-zA-Z][a-zA-Z0-9]*|\d{1,3})){0,3}$/

/**
 * Replace the string at `path` inside `content`, immutably. Returns
 * undefined when the path doesn't resolve to an existing string — text
 * overrides only ever replace authored copy, never create fields, so a
 * stale override (the item was removed, the field renamed) degrades to
 * the code copy instead of corrupting the content shape.
 */
function replaceTextAt(container: unknown, segments: string[], value: string): unknown {
    const [head, ...rest] = segments
    if (Array.isArray(container)) {
        const index = Number(head)
        if (!Number.isInteger(index) || index < 0 || index >= container.length) return undefined
        const replaced =
            rest.length === 0
                ? typeof container[index] === "string"
                    ? value
                    : undefined
                : replaceTextAt(container[index], rest, value)
        if (replaced === undefined) return undefined
        const next = [...container]
        next[index] = replaced
        return next
    }
    if (typeof container !== "object" || container === null) return undefined
    const record = container as Record<string, unknown>
    if (!(head in record)) return undefined
    const replaced =
        rest.length === 0
            ? typeof record[head] === "string"
                ? value
                : undefined
            : replaceTextAt(record[head], rest, value)
    if (replaced === undefined) return undefined
    return { ...record, [head]: replaced }
}

/**
 * The document's per-section copy overrides: `text` maps a dotted field
 * path to a replacement string — the preview editor's click-to-edit
 * gesture. Code still authors every field; the document only carries the
 * user's replacement strings for fields that exist.
 */
function withDocumentText(section: LandingSection, entry: Record<string, unknown>): LandingSection {
    const text = entry.text
    if (text === undefined || text === null) return section
    if (!isRecord(text)) {
        warnInvalid(`sections["${section.id ?? section.type}"].text`, text, "keeping the code copy")
        return section
    }
    let content: unknown = section.content
    let changedAny = false
    for (const [path, value] of Object.entries(text)) {
        if (
            typeof value !== "string" ||
            value.length === 0 ||
            value.length > 2000 ||
            !TEXT_FIELD_PATH.test(path)
        ) {
            warnInvalid(
                `sections["${section.id ?? section.type}"].text["${path}"]`,
                value,
                "keeping the code copy",
            )
            continue
        }
        const replaced = replaceTextAt(content, path.split("."), value)
        if (replaced === undefined) {
            warnInvalid(
                `sections["${section.id ?? section.type}"].text["${path}"]`,
                value,
                "no such text field in the section's content; keeping the code copy",
            )
            continue
        }
        content = replaced
        changedAny = true
    }
    if (!changedAny) return section
    // Every replacement above swapped a string for a string at a path that
    // already existed, so the content still satisfies its section type.
    return { ...section, content } as LandingSection
}

/**
 * The document's per-section item order: `order` maps a content list's
 * field name (e.g. "links", "features", "tiers") to a permutation of the
 * code array's indices — the preview editor's drag-an-item gesture. Content
 * itself never moves out of code; the document only stores the shuffle.
 * Degrades gracefully against content drift: positions that no longer
 * exist (or repeat) are dropped, and items the permutation doesn't mention
 * render after the ordered ones in code order — a stale shuffle can
 * misplace a new item at the end, never lose or crash anything.
 */
function withDocumentOrder(section: LandingSection, entry: Record<string, unknown>): LandingSection {
    const order = entry.order
    if (order === undefined || order === null) return section
    if (!isRecord(order)) {
        warnInvalid(`sections["${section.id ?? section.type}"].order`, order, "keeping the code item order")
        return section
    }
    let content = section.content as Record<string, unknown>
    let reorderedAny = false
    for (const [list, permutation] of Object.entries(order)) {
        if (!Array.isArray(permutation)) {
            warnInvalid(
                `sections["${section.id ?? section.type}"].order["${list}"]`,
                permutation,
                "keeping the code item order",
            )
            continue
        }
        const items = content[list]
        if (!Array.isArray(items)) {
            warnInvalid(
                `sections["${section.id ?? section.type}"].order["${list}"]`,
                list,
                "the section's content has no such list; ignoring",
            )
            continue
        }
        const taken = new Set<number>()
        const reordered: unknown[] = []
        for (const position of permutation) {
            if (
                typeof position === "number" &&
                Number.isInteger(position) &&
                position >= 0 &&
                position < items.length &&
                !taken.has(position)
            ) {
                taken.add(position)
                reordered.push(items[position])
            }
        }
        items.forEach((item, index) => {
            if (!taken.has(index)) reordered.push(item)
        })
        content = { ...content, [list]: reordered }
        reorderedAny = true
    }
    if (!reorderedAny) return section
    // The loop only ever permutes arrays that exist on this section's own
    // content, so the reordered record still satisfies the content type.
    return { ...section, content } as LandingSection
}

/** Section types whose content carries a top-level media slot the document
 * may override (the preview editor's drop-an-image gesture). Hero also
 * honors it as the first full-bleed slide when `slides` is what renders. */
const IMAGE_OVERRIDE_TYPES = new Set<string>(["hero", "content-split"])

function brandImage(src: string): { kind: "image"; src: string; alt: string } {
    return { kind: "image", src, alt: "" }
}

/** Paint a photograph onto a list entry: gallery/showcase items carry
 * `media`, hero slides ARE the media. */
function overlayMediaOn(item: unknown, src: string): unknown {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
        return { media: brandImage(src) }
    }
    const record = item as Record<string, unknown>
    if ("kind" in record || "src" in record) {
        // The override replaces the ASSET, so every field describing the old
        // one must go with it. A surviving `srcSet` is the sneaky failure:
        // browsers pick from srcSet over src, so the old responsive WebPs
        // (photography's stock frames) kept rendering after a "successful"
        // replace. Stale intrinsic width/height would misbox the new photo
        // the same way.
        const { srcSet: _srcSet, sizes: _sizes, width: _width, height: _height, ...rest } = record
        return { ...rest, kind: "image", src, alt: typeof record.alt === "string" ? record.alt : "" }
    }
    return { ...record, media: brandImage(src) }
}

/**
 * The document's per-section image override: a committed brand asset
 * (servable /brand/ path) replacing the section's primary media. Hero
 * full-bleed with `slides` paints the first frame — setting `content.media`
 * alone is ignored when slides exist.
 */
function withDocumentImage(section: LandingSection, entry: Record<string, unknown>): LandingSection {
    const image = entry.image
    if (image === undefined || image === null) return section
    if (typeof image !== "string" || !image.startsWith("/")) {
        warnInvalid(`sections["${section.id ?? section.type}"].image`, image, "keeping the code media")
        return section
    }
    if (!IMAGE_OVERRIDE_TYPES.has(section.type)) {
        warnInvalid(
            `sections["${section.id ?? section.type}"].image`,
            image,
            `"${section.type}" sections have no overridable media slot; ignoring`,
        )
        return section
    }
    const content = section.content as Record<string, unknown>
    const slides = content.slides
    if (Array.isArray(slides) && slides.length > 0) {
        return {
            ...section,
            content: { ...content, slides: [overlayMediaOn(slides[0], image), ...slides.slice(1)] },
        } as LandingSection
    }
    return {
        ...section,
        content: { ...content, media: brandImage(image) },
    } as LandingSection
}

type ParsedMediaOverride =
    { kind: "replace"; paths: string[] } | { kind: "sparse"; slots: Record<number, string> }

function parseMediaOverride(value: unknown): ParsedMediaOverride | undefined {
    if (Array.isArray(value)) {
        const paths = value.filter((path): path is string => typeof path === "string" && path.startsWith("/"))
        return paths.length > 0 ? { kind: "replace", paths } : undefined
    }
    if (!isRecord(value)) return undefined
    const slots: Record<number, string> = {}
    for (const [key, src] of Object.entries(value)) {
        const index = Number(key)
        if (
            Number.isInteger(index) &&
            index >= 0 &&
            index < 200 &&
            typeof src === "string" &&
            src.startsWith("/")
        ) {
            slots[index] = src
        }
    }
    return Object.keys(slots).length > 0 ? { kind: "sparse", slots } : undefined
}

function applyListMedia(
    content: Record<string, unknown>,
    list: string,
    parsed: ParsedMediaOverride,
): Record<string, unknown> {
    if (list === "media") {
        const src = parsed.kind === "replace" ? parsed.paths[0] : parsed.slots[0]
        return src !== undefined ? { ...content, media: brandImage(src) } : content
    }
    if (parsed.kind === "replace") {
        if (list === "slides") {
            return { ...content, slides: parsed.paths.map((src) => brandImage(src)) }
        }
        const items = Array.isArray(content[list]) ? (content[list] as unknown[]) : []
        return { ...content, [list]: parsed.paths.map((src, index) => overlayMediaOn(items[index], src)) }
    }
    if (list === "slides") {
        const slides = Array.isArray(content.slides) ? [...(content.slides as unknown[])] : []
        for (const [index, src] of Object.entries(parsed.slots)) {
            slides[Number(index)] = overlayMediaOn(slides[Number(index)], src)
        }
        return { ...content, slides }
    }
    const items = Array.isArray(content[list]) ? [...(content[list] as unknown[])] : []
    for (const [index, src] of Object.entries(parsed.slots)) {
        items[Number(index)] = overlayMediaOn(items[Number(index)], src)
    }
    return { ...content, [list]: items }
}

/**
 * Per-list photograph overrides: `media[list]` is either a path array
 * (replace that list wholesale — drop a folder on a gallery) or a map of
 * code-index → path (Replace one frame). Unknown lists and junk values
 * warn and stand; a gallery with no code items still accepts a replace
 * (the drop is how the album gets its first real photographs).
 */
function withDocumentMedia(section: LandingSection, entry: Record<string, unknown>): LandingSection {
    const media = entry.media
    if (media === undefined || media === null) return section
    if (!isRecord(media)) {
        warnInvalid(`sections["${section.id ?? section.type}"].media`, media, "keeping the code media")
        return section
    }
    let content = section.content as Record<string, unknown>
    let applied = false
    for (const [list, value] of Object.entries(media)) {
        const parsed = parseMediaOverride(value)
        if (parsed === undefined) {
            warnInvalid(
                `sections["${section.id ?? section.type}"].media["${list}"]`,
                value,
                "keeping the code media",
            )
            continue
        }
        if (list !== "media" && list !== "slides" && list !== "items") {
            warnInvalid(
                `sections["${section.id ?? section.type}"].media["${list}"]`,
                list,
                "not a photograph list; ignoring",
            )
            continue
        }
        content = applyListMedia(content, list, parsed)
        applied = true
    }
    if (!applied) return section
    return { ...section, content } as LandingSection
}

/**
 * Second-chance binding for a document entry whose id bound no code
 * section: the UNIQUE unclaimed code section of the entry's declared type.
 * Writers can re-key an entry — a remix/reimagine roll rewrites the
 * skeleton, a template re-bake leaves an older document's ids behind the
 * pack code's — and the id drifts while the content it meant still stands
 * in code. Dropping the binding silently swapped live content out from
 * under a standing section (the services packs' before/after gallery lost
 * its photo pairs, and the comparison drag with them, to a placeholder).
 * A type match is only trusted when it is unambiguous: zero or several
 * unclaimed candidates keep the caller's existing fallback (root merge
 * skips the entry; page merge scaffolds a placeholder — the "add a
 * section" gesture, which must never steal a sibling's content).
 */
function bindByType(
    config: LandingConfig,
    claimed: ReadonlySet<number>,
    entry: Record<string, unknown>,
): number | undefined {
    const type = entry.type
    if (typeof type !== "string") return undefined
    let match: number | undefined
    for (let index = 0; index < config.sections.length; index += 1) {
        if (claimed.has(index) || config.sections[index]?.type !== type) continue
        if (match !== undefined) return undefined
        match = index
    }
    return match
}

function resolveSections(config: LandingConfig, sections: unknown): LandingSection[] {
    if (sections === undefined) return config.sections
    if (!Array.isArray(sections)) {
        warnInvalid("sections", sections, "keeping the code config's section order")
        return config.sections
    }
    // The content registry: a code section's key is its id (defaulting to
    // its type); when two sections share a key only the first is
    // addressable — give the others explicit ids. Unaddressed sections
    // still render, in the code-order tail below.
    const byKey = new Map<string, number>()
    config.sections.forEach((section, index) => {
        const key = section.id ?? section.type
        if (!byKey.has(key)) byKey.set(key, index)
    })
    const claimed = new Set<number>()
    // Two passes so id bindings always win before any type fallback: a
    // re-keyed entry must never steal a section whose own entry binds it
    // later in the list. Slots keep document order for the second pass.
    interface Slot {
        entry: Record<string, unknown>
        key: string
        index: number | undefined
    }
    const slots: Slot[] = []
    for (const entry of sections) {
        if (!isRecord(entry)) {
            warnInvalid("sections entry", entry, "skipping it")
            continue
        }
        const key =
            typeof entry.id === "string" ? entry.id : typeof entry.type === "string" ? entry.type : undefined
        if (key === undefined) {
            warnInvalid("sections entry", entry, "it names no id or type; skipping it")
            continue
        }
        const index = byKey.get(key)
        if (index === undefined) {
            // Bound nothing by id: the type-fallback pass below decides.
            slots.push({ entry, key, index: undefined })
            continue
        }
        if (claimed.has(index)) {
            warnInvalid(`sections["${key}"]`, key, "already rendered; skipping the duplicate")
            continue
        }
        claimed.add(index)
        const section = config.sections[index]
        if (typeof entry.type === "string" && entry.type !== section.type) {
            warnInvalid(
                `sections["${key}"].type`,
                entry.type,
                `content is registered as "${section.type}"; the document's type is descriptive only`,
            )
        }
        slots.push({ entry, key, index })
    }
    for (const slot of slots) {
        if (slot.index !== undefined) continue
        const index = bindByType(config, claimed, slot.entry)
        if (index === undefined) {
            warnInvalid(
                `sections["${slot.key}"]`,
                slot.entry.type ?? slot.key,
                "no content registered; skipping it",
            )
            continue
        }
        claimed.add(index)
        warnInvalid(
            `sections["${slot.key}"]`,
            slot.key,
            `no content under this id; binding the only "${config.sections[index]?.type}" section`,
        )
        slot.index = index
    }
    const ordered: LandingSection[] = []
    for (const slot of slots) {
        if (slot.index === undefined) continue
        const section = config.sections[slot.index]
        if (section !== undefined) ordered.push(withDocumentVariant(section, slot.entry))
    }
    // Content registered in code but absent from the document renders after
    // the documented sections, in code order — layout edits can reorder or
    // restyle, but never silently lose a section's content.
    config.sections.forEach((section, index) => {
        if (!claimed.has(index)) ordered.push(section)
    })
    return ordered
}

/**
 * Pure merge of a layout document over a code config — exported for tests;
 * pages go through `resolveLandingConfig`.
 */
export function applyLandingDocument(config: LandingConfig, document: unknown): LandingConfig {
    if (!isRecord(document)) {
        warnInvalid("document", document, "keeping the code config")
        return config
    }
    if (isForeignPackDocument(document)) return config
    return {
        style: { ...config.style, preset: resolvePreset(config, document.style) },
        shell: resolveShell(config, document.shell),
        sections: resolveSections(config, document.sections),
    }
}

/** Which surface the committed document currently describes. */
export function landingDocumentSurface(): LandingDocumentSurface {
    return LANDING_SURFACE_PACKS.includes(activePack.key) ? activePack.key : "kernel"
}

/**
 * The config a landing page should render: the committed document merged
 * over the code config when `surface` is the active landing surface,
 * otherwise the code config untouched. The kernel `/landing` exemplar
 * declares itself `"kernel"`; a pack's landing page declares its pack key.
 */
export function resolveLandingConfig(config: LandingConfig, surface: LandingDocumentSurface): LandingConfig {
    if (surface !== landingDocumentSurface()) return config
    return applyLandingDocument(config, currentDocument)
}

/**
 * `resolveLandingConfig` as a hook: identical result, plus a re-render when
 * a live repobot.landing.json edit lands (dev HMR). Pages use this so
 * document edits repaint the page instead of reloading it.
 */
export function useLandingConfig(config: LandingConfig, surface: LandingDocumentSurface): LandingConfig {
    // The version snapshot subscribes this component to live document edits;
    // resolveLandingConfig reads the current document on every render.
    useSyncExternalStore(subscribeLandingDocument, getLandingDocumentVersion, getLandingDocumentVersion)
    return resolveLandingConfig(config, surface)
}

/*
 * --- Per-page layouts (the document's `pages` map) --------------------------
 *
 * `pages["<pageId>"].sections` gives every manifest marketing page
 * (docs/project-ia.md) the same live-editable skeleton the landing surface
 * has — the platform's preview editor writes it and Vite HMR repaints the
 * page in ~1s. Semantics differ from the root `sections` merge in one
 * deliberate way: a page's documented list is AUTHORITATIVE. Entries bind
 * to the page's resolved sections by id (variant applied when valid);
 * entries that bind nothing but carry a known section type render with
 * placeholder content (`sectionFromEntry` — the same scaffold copy manifest
 * sections get), which is what makes "add a section" a pure layout edit;
 * resolved sections absent from the list are dropped ("remove"). A page
 * with no entry in the map renders its config untouched — the document
 * only speaks for pages the user has actually edited.
 */

/** A documented page entry bound to nothing: placeholder content by type. */
function placeholderSection(entry: Record<string, unknown>): LandingSection | undefined {
    const type = typeof entry.type === "string" ? entry.type : undefined
    if (type === undefined) return undefined
    const variant = typeof entry.variant === "string" ? entry.variant : undefined
    const id = typeof entry.id === "string" && entry.id.length > 0 ? entry.id : type
    const built = sectionFromEntry(
        { id, type, ...(variant !== undefined ? { variant } : {}) },
        undefined,
        undefined,
    )
    if (built === undefined) {
        warnInvalid(`pages sections["${type}"]`, type, "unknown section type; skipping it")
        return undefined
    }
    return withContentOverrides({ ...built, id }, entry)
}

function resolvePageSections(config: LandingConfig, sections: unknown): LandingSection[] {
    if (!Array.isArray(sections)) {
        warnInvalid("pages sections", sections, "keeping the page's own section list")
        return config.sections
    }
    const byKey = new Map<string, number>()
    config.sections.forEach((section, index) => {
        const key = section.id ?? section.type
        if (!byKey.has(key)) byKey.set(key, index)
    })
    const claimed = new Set<number>()
    // Same two-pass shape as resolveSections: id bindings all land first,
    // then a re-keyed entry may still bind the unique unclaimed section of
    // its type (bindByType) — real content must survive an id drift. Only
    // an entry that binds nothing either way scaffolds a placeholder (the
    // "add a section" gesture).
    interface PageSlot {
        entry: Record<string, unknown>
        index: number | undefined
        duplicate: boolean
    }
    const slots: PageSlot[] = []
    for (const entry of sections) {
        if (!isRecord(entry)) continue
        const key =
            typeof entry.id === "string" ? entry.id : typeof entry.type === "string" ? entry.type : undefined
        if (key === undefined) continue
        const index = byKey.get(key)
        if (index === undefined) {
            slots.push({ entry, index: undefined, duplicate: false })
            continue
        }
        if (claimed.has(index)) {
            // A duplicate reference never re-binds elsewhere by type — the
            // second copy scaffolds a placeholder, exactly as before.
            slots.push({ entry, index: undefined, duplicate: true })
            continue
        }
        claimed.add(index)
        slots.push({ entry, index, duplicate: false })
    }
    const ordered: LandingSection[] = []
    for (const slot of slots) {
        if (slot.index === undefined && !slot.duplicate) {
            const rebound = bindByType(config, claimed, slot.entry)
            if (rebound !== undefined) {
                claimed.add(rebound)
                slot.index = rebound
            }
        }
        if (slot.index === undefined) {
            // Nothing (left) to bind: an added section renders placeholder
            // content until the agent's content pass fills it in.
            const added = placeholderSection(slot.entry)
            if (added !== undefined) ordered.push(added)
            continue
        }
        const section = config.sections[slot.index]
        if (section !== undefined) ordered.push(withDocumentVariant(section, slot.entry))
    }
    // Unlike the root merge, unclaimed sections do NOT ride along: the
    // documented list is the page (that's what makes delete a layout edit).
    // An empty result would leave a blank page, so it falls back whole.
    return ordered.length > 0 ? ordered : config.sections
}

/** Pure per-page merge — exported for tests; pages use `useSitePageConfig`. */
export function applySitePageDocument(
    config: LandingConfig,
    pageId: string,
    document: unknown,
): LandingConfig {
    if (!isRecord(document)) return config
    if (isForeignPackDocument(document)) return config
    // Site-wide document choices apply to every page, documented sections
    // or not: the shared chrome's link order (the shell is one component
    // site-wide) and the marketing style preset — the platform's "Looks"
    // control writes the document's root `style`, and a declared preset
    // outranks the page's pinned one exactly as it does on the root
    // surface. (Before this, Look changes repainted the root landing but
    // silently skipped every page-scoped surface — pack sites like
    // photography never changed.)
    const withShell: LandingConfig = {
        ...config,
        style: { ...config.style, preset: resolvePreset(config, document.style) },
        shell: withShellNavOrder(config.shell, document.shell),
    }
    const pages = document.pages
    if (!isRecord(pages)) return withShell
    const entry = pages[pageId]
    if (entry === undefined) return withShell
    if (!isRecord(entry)) {
        warnInvalid(`pages["${pageId}"]`, entry, "keeping the page's own config")
        return withShell
    }
    return {
        ...withShell,
        sections: resolvePageSections(config, entry.sections),
    }
}

/**
 * A manifest marketing page's live layout: its resolved config with the
 * document's per-page skeleton applied, re-rendering on live document
 * edits (dev HMR) exactly like the landing surface.
 */
export function useSitePageConfig(pageId: string, config: LandingConfig): LandingConfig {
    useSyncExternalStore(subscribeLandingDocument, getLandingDocumentVersion, getLandingDocumentVersion)
    return applySitePageDocument(config, pageId, currentDocument)
}

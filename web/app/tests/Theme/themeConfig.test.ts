import {
    contrastText,
    gateThemeDocument,
    gateThemeDocumentForPack,
    mixHex,
    resolveThemeTokens,
    resolveUiConfig,
    themeConfig,
    uiConfig,
} from "@base/design-system"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"

import activePack from "../../../../packs/active.json"
import committedTheme from "../../../../repobot.theme.json"

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

describe("themeConfig", () => {
    // Projects commit their own repobot.theme.json during setup, so this
    // asserts the resolver honors whatever is committed — never a specific
    // kernel palette (that would fail in every themed project).
    it("resolves the committed theme contract faithfully", () => {
        const committed = committedTheme as {
            brand?: { primary?: string; primaryDark?: string } | null
            radius?: string
            density?: string
            mode?: string
        }
        expect(themeConfig.brand.primary).toMatch(HEX_PATTERN)
        expect(themeConfig.brand.primaryDark).toMatch(HEX_PATTERN)
        if (committed.brand?.primary != null && HEX_PATTERN.test(committed.brand.primary)) {
            expect(themeConfig.brand.primary).toBe(committed.brand.primary)
        }
        if (committed.brand?.primaryDark != null && HEX_PATTERN.test(committed.brand.primaryDark)) {
            expect(themeConfig.brand.primaryDark).toBe(committed.brand.primaryDark)
        }
        expect(["sharp", "soft", "round"]).toContain(themeConfig.radius)
        expect(["compact", "comfortable", "spacious"]).toContain(themeConfig.density)
        expect(["light", "dark", "system"]).toContain(themeConfig.mode)
        if (committed.radius === "sharp" || committed.radius === "soft" || committed.radius === "round") {
            expect(themeConfig.radius).toBe(committed.radius)
        }
        if (
            committed.density === "compact" ||
            committed.density === "comfortable" ||
            committed.density === "spacious"
        ) {
            expect(themeConfig.density).toBe(committed.density)
        }
        if (committed.mode === "light" || committed.mode === "dark" || committed.mode === "system") {
            expect(themeConfig.mode).toBe(committed.mode)
        }
    })

    // The app-chrome presets (`ui` block): the resolver honors whatever the
    // wizard committed and always lands on a valid preset — components take
    // these as their defaults, so an invalid contract must never leak.
    it("resolves the ui block into valid app-chrome presets", () => {
        const committedUi = (
            committedTheme as {
                ui?: {
                    table?: { style?: string; pagination?: string }
                    forms?: { presentation?: string; width?: string }
                    errors?: { presentation?: string }
                    loaders?: { style?: string }
                }
            }
        ).ui
        expect(["minimalist", "standard", "detailed"]).toContain(uiConfig.table.style)
        expect(["loadMore", "pages"]).toContain(uiConfig.table.pagination)
        expect(["modal", "page"]).toContain(uiConfig.forms.presentation)
        expect(["skinny", "normal", "wide"]).toContain(uiConfig.forms.width)
        expect(["modal", "corner"]).toContain(uiConfig.errors.presentation)
        expect(["gate", "progressive"]).toContain(uiConfig.loaders.style)
        expect(["centered", "sheet", "takeover"]).toContain(uiConfig.modals.chrome)
        expect(["centered", "split", "bare"]).toContain(uiConfig.auth.layout)
        expect(typeof uiConfig.auth.declared).toBe("boolean")
        expect(["standard", "illustrated", "quiet", "actionForward"]).toContain(uiConfig.empty.voice)
        expect(["bottomRight", "topRight", "bottomCenter"]).toContain(uiConfig.toasts.position)
        expect(["edge", "solid", "soft"]).toContain(uiConfig.toasts.style)
        if (committedUi?.table?.style !== undefined) {
            expect(uiConfig.table.style).toBe(committedUi.table.style)
        }
        if (committedUi?.loaders?.style !== undefined) {
            expect(uiConfig.loaders.style).toBe(committedUi.loaders.style)
        }
        // The gallery/tooling view carries the same resolution.
        expect(themeConfig.ui).toEqual(uiConfig)
    })

    // The Phase-2c chrome axes must default to today's exact rendering: an
    // empty contract lands every new axis on the pre-contract look, so no
    // project changes appearance until a remix roll actually names one.
    it("defaults the chrome axes to the pre-contract rendering", () => {
        const resolved = resolveUiConfig({})
        expect(resolved.modals.chrome).toBe("centered")
        expect(resolved.auth.layout).toBe("centered")
        // Undeclared: LoginPage keeps its own per-register lean.
        expect(resolved.auth.declared).toBe(false)
        expect(resolved.empty.voice).toBe("standard")
        expect(resolved.toasts.position).toBe("bottomRight")
        expect(resolved.toasts.style).toBe("edge")
    })

    it("resolves declared chrome axes and rejects junk", () => {
        const resolved = resolveUiConfig({
            ui: {
                modals: { chrome: "sheet" },
                auth: { layout: "bare" },
                empty: { voice: "actionForward" },
                toasts: { position: "topRight", style: "soft" },
            },
        })
        expect(resolved.modals.chrome).toBe("sheet")
        expect(resolved.auth.layout).toBe("bare")
        expect(resolved.auth.declared).toBe(true)
        expect(resolved.empty.voice).toBe("actionForward")
        expect(resolved.toasts.position).toBe("topRight")
        expect(resolved.toasts.style).toBe("soft")
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
        try {
            const junk = resolveUiConfig({
                ui: {
                    modals: { chrome: "hologram" as never },
                    auth: { layout: "diagonal" as never },
                },
            })
            expect(junk.modals.chrome).toBe("centered")
            expect(junk.auth.layout).toBe("centered")
            expect(junk.auth.declared).toBe(false)
        } finally {
            warn.mockRestore()
        }
    })
})

describe("mixHex", () => {
    it("blends toward the target channel-by-channel", () => {
        expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080")
        expect(mixHex("#ff0000", "#000000", 0.5)).toBe("#800000")
    })

    it("is an identity at amount 0 and the target at amount 1", () => {
        expect(mixHex("#1f6feb", "#000000", 0)).toBe("#1f6feb")
        expect(mixHex("#1f6feb", "#ffffff", 1)).toBe("#ffffff")
    })

    it("expands 3-digit hex colors", () => {
        expect(mixHex("#fff", "#fff", 0.5)).toBe("#ffffff")
    })
})

describe("contrastText", () => {
    it("uses light text on dark accents and dark text on light accents", () => {
        expect(contrastText("#1f6feb")).toBe("#ffffff")
        expect(contrastText("#0b0e14")).toBe("#ffffff")
        expect(contrastText("#90caf9")).toBe("#071223")
        expect(contrastText("#f9d90a")).toBe("#071223")
    })
})

/*
 * Pack-stamp isolation: templates are FULLY isolated style-wise. Every
 * writer stamps the theme document's `pack` with the active pack key; a
 * document stamped for a FOREIGN pack resolves as the default theme (with
 * a console warning), so one pack's look can never wear another pack after
 * a template flip. Unstamped documents keep today's behavior.
 */
describe("gateThemeDocumentForPack", () => {
    let warn: MockInstance

    beforeEach(() => {
        warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    })

    afterEach(() => {
        warn.mockRestore()
    })

    const branded = { pack: "gala", brand: { primary: "#8b1e3f" }, mode: "dark" }

    it("resolves a foreign-stamped document as the default theme and warns", () => {
        const gated = gateThemeDocumentForPack(branded, "band")
        expect(gated).toEqual({})
        expect(resolveThemeTokens(gated).brandIsKernelDefault).toBe(true)
        expect(warn).toHaveBeenCalledOnce()
        expect(warn.mock.calls[0]?.[0]).toContain('stamped for pack "gala"')
    })

    it("resolves a matching-stamped document normally", () => {
        const gated = gateThemeDocumentForPack(branded, "gala")
        expect(gated).toBe(branded)
        expect(resolveThemeTokens(gated).brandPrimary).toBe("#8b1e3f")
        expect(warn).not.toHaveBeenCalled()
    })

    it("keeps today's behavior for unstamped documents and malformed stamps", () => {
        for (const stamp of [undefined, null, "", 42, ["gala"]]) {
            const document = { ...branded, pack: stamp }
            if (stamp === undefined) delete (document as { pack?: unknown }).pack
            expect(gateThemeDocumentForPack(document, "band")).toBe(document)
        }
        // An unknown active pack never gates: there is nothing to compare to.
        expect(gateThemeDocumentForPack(branded, undefined)).toBe(branded)
        expect(warn).not.toHaveBeenCalled()
    })

    it("the module gate binds this checkout's active pack", () => {
        expect(gateThemeDocument({ pack: activePack.key, mode: "dark" })).toEqual({
            pack: activePack.key,
            mode: "dark",
        })
        expect(gateThemeDocument({ pack: "definitely-not-a-real-pack", mode: "dark" })).toEqual({})
    })
})

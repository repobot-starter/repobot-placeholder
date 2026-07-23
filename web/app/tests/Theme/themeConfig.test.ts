import { contrastText, mixHex, themeConfig } from "@base/design-system"
import { describe, expect, it } from "vitest"

describe("themeConfig", () => {
    it("resolves the committed contract defaults", () => {
        // The committed repobot.theme.json must express today's kernel look;
        // if these drift, every fresh template silently re-brands.
        expect(themeConfig.brand.primary).toBe("#1f6feb")
        expect(themeConfig.brand.primaryDark).toBe("#90caf9")
        expect(themeConfig.radius).toBe("soft")
        expect(themeConfig.density).toBe("comfortable")
        expect(themeConfig.mode).toBe("dark")
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

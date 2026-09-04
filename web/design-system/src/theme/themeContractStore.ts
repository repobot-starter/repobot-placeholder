import type { RepobotThemeConfig } from "./themeConfig"

/**
 * Dev-only live channel for the repobot.theme.json contract.
 *
 * The design system resolves the contract at build time (themeConfig.ts) and
 * bakes it into the vanilla-extract theme classes — that stays the source of
 * truth for production and for the first paint. But the platform's showroom
 * preview-writes the contract into a RUNNING dev server and needs the page
 * to repaint in ~1s, so editing the file must not cascade into a full Vite
 * reload. themeConfig.ts accepts the JSON module's hot updates and pushes
 * the new raw contract here; themeHotUpdate.ts subscribes and re-applies the
 * dynamic tokens as CSS custom properties plus the structural presets
 * through useThemeContract(). See docs/design-system.md "Theming".
 *
 * `null` means "no live edit yet": the build-time resolution stands. This is
 * always the case in production builds and in tests.
 */

let override: RepobotThemeConfig | null = null
const listeners = new Set<() => void>()

export function getThemeContractOverride(): RepobotThemeConfig | null {
    return override
}

/** Replaces the live contract and notifies subscribers (dev HMR only). */
export function setThemeContractOverride(next: RepobotThemeConfig): void {
    override = next
    for (const listener of [...listeners]) {
        listener()
    }
}

export function subscribeThemeContract(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

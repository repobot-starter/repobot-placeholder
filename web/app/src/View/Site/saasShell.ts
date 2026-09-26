import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"

/**
 * The saas pack's shared chrome for manifest pages added beyond the shipped
 * home and pricing (whose inline `landing` configs carry their own matching
 * shell blocks in repobot.project.json). Everything derives from the
 * manifest — site name, the page link row — so a page added from the
 * platform's Pages panel wears the same masthead as the shipped site.
 */
export function saasShell(currentPath: string): MarketingShellConfig {
    const { marketing } = projectManifest
    const siteName =
        marketing.siteName ?? marketing.pages.find((page) => page.path === "/")?.title ?? "Our product"
    const links = marketing.pages
        .filter((page) => page.path !== "/" && page.path !== currentPath)
        .map((page) => ({ label: page.title, href: page.path }))
    return {
        nav: {
            content: {
                logo: { name: siteName },
                links,
                cta: { label: "Sign in", href: "/login" },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: siteName,
                links: [...links, { label: "Sign in", href: "/login" }],
                note: `© ${siteName}. All rights reserved.`,
            },
        },
    }
}

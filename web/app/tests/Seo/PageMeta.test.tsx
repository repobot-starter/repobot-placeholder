import { cleanup, render } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { JsonLd, PageMeta } from "../../src/Seo/PageMeta"

// PageMeta's fallbacks read the live project manifest, which is CUSTOMER
// DATA: setup stamps brand assets into repobot.project.json in every real
// project. Kernel tests must therefore pin their own manifest fixture —
// asserting the template's unbranded state made this suite fail the agent
// gates the moment setup added a logo, which pushed setup agents to strip
// branding just to get green. Never assert live manifest state here.
const mockManifest = vi.hoisted(() => ({
    marketing: {
        preset: "editorial",
        pages: [] as unknown[],
        brand: undefined as { logo?: string; social?: string } | undefined,
    },
    dashboard: { destinations: [] as unknown[] },
}))
vi.mock("../../src/Config/projectManifest", async (importOriginal) => ({
    ...(await importOriginal<object>()),
    projectManifest: mockManifest,
}))

function renderAt(path: string, ui: React.ReactElement) {
    return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)
}

function metaContent(selector: string): string | null {
    return document.head.querySelector<HTMLMetaElement>(selector)?.content ?? null
}

describe("PageMeta", () => {
    afterEach(() => {
        cleanup()
        mockManifest.marketing.brand = undefined
    })

    it("applies the declared title, description, and robots hints to the document head", () => {
        renderAt(
            "/pricing",
            <PageMeta
                title="Pricing"
                siteName="Fieldbook"
                description="Plans and billing."
                robots="noindex"
            />,
        )
        expect(document.title).toBe("Pricing — Fieldbook")
        expect(metaContent('meta[name="description"]')).toBe("Plans and billing.")
        expect(metaContent('meta[name="robots"]')).toBe("noindex")
    })

    it("emits Open Graph and Twitter card tags with an absolute canonical URL", () => {
        renderAt(
            "/pricing",
            <PageMeta
                title="Pricing"
                siteName="Fieldbook"
                description="Plans and billing."
                image="/brand/social.png"
            />,
        )
        const origin = window.location.origin
        expect(metaContent('meta[property="og:title"]')).toBe("Pricing")
        expect(metaContent('meta[property="og:description"]')).toBe("Plans and billing.")
        expect(metaContent('meta[property="og:type"]')).toBe("website")
        expect(metaContent('meta[property="og:url"]')).toBe(`${origin}/pricing`)
        expect(metaContent('meta[property="og:image"]')).toBe(`${origin}/brand/social.png`)
        expect(metaContent('meta[property="og:site_name"]')).toBe("Fieldbook")
        expect(metaContent('meta[name="twitter:card"]')).toBe("summary_large_image")
        expect(metaContent('meta[name="twitter:title"]')).toBe("Pricing")
        const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
        expect(canonical?.href).toBe(`${origin}/pricing`)
    })

    it("collapses a title equal to the site name instead of doubling it", () => {
        renderAt("/", <PageMeta title="Fieldbook" siteName="Fieldbook" />)
        expect(document.title).toBe("Fieldbook")
    })

    it("prefers a declared canonical path (with query) over the current location", () => {
        renderAt("/blog", <PageMeta title="A post" siteName="Blog" path="/blog?post=a-post" />)
        expect(metaContent('meta[property="og:url"]')).toBe(`${window.location.origin}/blog?post=a-post`)
    })

    it("omits optional tags rather than emitting empty ones", () => {
        renderAt("/plain", <PageMeta title="Plain" siteName="Site" />)
        expect(document.head.querySelector('meta[name="description"]')).toBeNull()
        expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
        expect(document.head.querySelector('meta[property="og:image"]')).toBeNull()
        expect(metaContent('meta[name="twitter:card"]')).toBe("summary")
    })

    it("defaults og:image to the brand social card once setup stamps one", () => {
        mockManifest.marketing.brand = { social: "/brand/social.png", logo: "/brand/logo.png" }
        renderAt("/plain", <PageMeta title="Plain" siteName="Site" />)
        expect(metaContent('meta[property="og:image"]')).toBe(`${window.location.origin}/brand/social.png`)
        expect(metaContent('meta[name="twitter:card"]')).toBe("summary_large_image")
    })

    it("falls back to the brand logo when no social card is committed", () => {
        mockManifest.marketing.brand = { logo: "/brand/logo.png" }
        renderAt("/plain", <PageMeta title="Plain" siteName="Site" />)
        expect(metaContent('meta[property="og:image"]')).toBe(`${window.location.origin}/brand/logo.png`)
    })

    it("removes its tags on unmount, so route changes swap meta cleanly", () => {
        const first = renderAt("/a", <PageMeta title="A" siteName="Site" description="Page A." />)
        expect(metaContent('meta[name="description"]')).toBe("Page A.")
        first.unmount()
        expect(document.head.querySelector('meta[name="description"]')).toBeNull()
        renderAt("/b", <PageMeta title="B" siteName="Site" description="Page B." />)
        expect(document.title).toBe("B — Site")
        expect(metaContent('meta[name="description"]')).toBe("Page B.")
    })
})

describe("JsonLd", () => {
    afterEach(() => {
        cleanup()
    })

    it("renders parseable JSON-LD and escapes script-breaking characters", () => {
        render(<JsonLd data={{ "@type": "Article", headline: "Closing </script> tags" }} />)
        const script = document.querySelector('script[type="application/ld+json"]')
        expect(script).not.toBeNull()
        expect(script?.textContent).not.toContain("</script>")
        const parsed = JSON.parse(script?.textContent ?? "")
        expect(parsed).toEqual({ "@type": "Article", headline: "Closing </script> tags" })
    })
})

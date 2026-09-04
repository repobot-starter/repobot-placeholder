import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import {
    buildRobotsTxt,
    buildSitemapXml,
    collectDisallowedPaths,
    collectPublicPaths,
    resolveBaseUrl,
    KERNEL_DISALLOWED_PATHS,
} from "./generate-seo-files.mjs"

const SCRIPT = fileURLToPath(new URL("./generate-seo-files.mjs", import.meta.url))

const MANIFEST = {
    marketing: {
        pages: [
            { id: "home", path: "/", title: "Home" },
            { id: "pricing", path: "/pricing", title: "Pricing" },
            { id: "contact", path: "/contact", title: "Contact" },
        ],
    },
    dashboard: {
        destinations: [{ id: "overview", path: "/overview", label: "Overview" }],
    },
}

test("collectPublicPaths: '/' always, then the manifest pages, deduped", () => {
    assert.deepEqual(collectPublicPaths(MANIFEST), ["/", "/pricing", "/contact"])
    // A pack-owned home with no manifest pages still yields the home page.
    assert.deepEqual(collectPublicPaths({ marketing: { pages: [] } }), ["/"])
    assert.deepEqual(collectPublicPaths(undefined), ["/"])
})

test("collectDisallowedPaths: kernel journeys plus dashboard destinations", () => {
    const disallowed = collectDisallowedPaths(MANIFEST)
    for (const kernelPath of KERNEL_DISALLOWED_PATHS) {
        assert.ok(disallowed.includes(kernelPath), `missing kernel path ${kernelPath}`)
    }
    assert.ok(disallowed.includes("/overview"))
    // Public marketing pages are never disallowed.
    assert.ok(!disallowed.includes("/pricing"))
})

test("sitemap with a canonical host emits absolute locs", () => {
    const xml = buildSitemapXml(["/", "/pricing"], "https://fieldbook.example/")
    assert.match(xml, /<loc>https:\/\/fieldbook\.example\/<\/loc>/)
    assert.match(xml, /<loc>https:\/\/fieldbook\.example\/pricing<\/loc>/)
    assert.match(xml, /do not hand-edit/)
    assert.doesNotMatch(xml, /No canonical host/)
})

test("sitemap without a host falls back to root-relative locs and says so", () => {
    const xml = buildSitemapXml(["/", "/pricing"], undefined)
    assert.match(xml, /<loc>\/pricing<\/loc>/)
    assert.match(xml, /No canonical host/)
})

test("sitemap escapes XML-special characters in paths", () => {
    const xml = buildSitemapXml(["/blog?post=a&b"], "https://x.example")
    assert.match(xml, /<loc>https:\/\/x\.example\/blog\?post=a&amp;b<\/loc>/)
})

test("robots disallows the signed-in surface and links the sitemap when the host is known", () => {
    const robots = buildRobotsTxt(collectDisallowedPaths(MANIFEST), "https://fieldbook.example")
    assert.match(robots, /User-agent: \*/)
    assert.match(robots, /Disallow: \/login/)
    assert.match(robots, /Disallow: \/settings/)
    assert.match(robots, /Disallow: \/overview/)
    assert.match(robots, /Sitemap: https:\/\/fieldbook\.example\/sitemap\.xml/)
})

test("robots omits the Sitemap line when the host is unknown (it must be absolute)", () => {
    const robots = buildRobotsTxt(KERNEL_DISALLOWED_PATHS, undefined)
    assert.doesNotMatch(robots, /Sitemap:/)
})

test("resolveBaseUrl: flag wins, then SITE_BASE_URL, then APP_BASE_URL; junk is ignored", () => {
    assert.equal(
        resolveBaseUrl(["--base-url", "https://flag.example"], { SITE_BASE_URL: "https://site.example" }),
        "https://flag.example",
    )
    assert.equal(resolveBaseUrl([], { SITE_BASE_URL: "https://site.example/" }), "https://site.example")
    assert.equal(resolveBaseUrl([], { APP_BASE_URL: "https://app.example" }), "https://app.example")
    assert.equal(resolveBaseUrl([], { APP_BASE_URL: "not a url" }), undefined)
    assert.equal(resolveBaseUrl([], {}), undefined)
})

test("CLI writes both files into web/app/public from the repo's manifest", () => {
    const root = mkdtempSync(path.join(tmpdir(), "seo-files-"))
    try {
        writeFileSync(path.join(root, "repobot.project.json"), JSON.stringify(MANIFEST))
        mkdirSync(path.join(root, "web", "app", "public"), { recursive: true })
        execFileSync(process.execPath, [SCRIPT, "--base-url", "https://cli.example", root], {
            encoding: "utf8",
        })
        const sitemap = readFileSync(path.join(root, "web", "app", "public", "sitemap.xml"), "utf8")
        const robots = readFileSync(path.join(root, "web", "app", "public", "robots.txt"), "utf8")
        assert.match(sitemap, /<loc>https:\/\/cli\.example\/pricing<\/loc>/)
        assert.match(robots, /Disallow: \/overview/)
        assert.match(robots, /Sitemap: https:\/\/cli\.example\/sitemap\.xml/)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

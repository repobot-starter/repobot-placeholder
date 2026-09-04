import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { verifyShopIntegration } from "./verify-shop-integration.mjs"

const SCRIPT = fileURLToPath(new URL("./verify-shop-integration.mjs", import.meta.url))
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const STOCK_SHOP = ['bookTitle: "The Lighthouse Letters"', 'authorName: "Margaret Hale"'].join("\n")
const ADAPTED_SHOP = ['bookTitle: "The Cupcake Box"', 'authorName: "Wonderland Bakery"'].join("\n")

test("stock shop with no links passes (the ShopBot template's starting state)", () => {
    assert.deepEqual(
        verifyShopIntegration({
            shopSources: [STOCK_SHOP],
            linkFiles: [{ file: "web/app/src/View/Landing/Hero.tsx", source: "<a href='/about'>About</a>" }],
        }),
        { ok: true },
    )
})

test("adapted shop may be linked from anywhere", () => {
    assert.deepEqual(
        verifyShopIntegration({
            shopSources: [ADAPTED_SHOP],
            linkFiles: [
                {
                    file: "repobot.project.json",
                    source: '{ "cta": { "label": "Shop now", "href": "/shop" } }',
                },
            ],
        }),
        { ok: true },
    )
})

test("a CTA to /shop while the shop is stock fails, naming the offender", () => {
    // The observed failure mode: a themed landing page's "Shop now" CTA
    // lands on the untouched demo bookshop.
    const result = verifyShopIntegration({
        shopSources: [STOCK_SHOP],
        linkFiles: [
            { file: "repobot.project.json", source: '{ "cta": { "label": "Shop now", "href": "/shop" } }' },
        ],
    })
    assert.equal(result.ok, false)
    assert.deepEqual(result.offenders, ["repobot.project.json"])
    assert.match(result.message, /before pointing users at it/i)
})

test("linking through the route registry is caught too", () => {
    const result = verifyShopIntegration({
        shopSources: [STOCK_SHOP],
        linkFiles: [
            {
                file: "web/app/src/View/Landing/Hero.tsx",
                source: "<Link to={routes.shop.path}>Shop now</Link>",
            },
        ],
    })
    assert.equal(result.ok, false)
    assert.deepEqual(result.offenders, ["web/app/src/View/Landing/Hero.tsx"])
})

test("a stock catalog alone (copy adapted, price not) still blocks links", () => {
    const result = verifyShopIntegration({
        shopSources: [ADAPTED_SHOP, 'name: "The Lighthouse Letters", priceMinorUnits: 2400'],
        linkFiles: [{ file: "web/app/src/shellNavSections.tsx", source: 'href: "/shop"' }],
    })
    assert.equal(result.ok, false)
})

test("longer paths like /shopping do not trip the link matcher", () => {
    assert.deepEqual(
        verifyShopIntegration({
            shopSources: [STOCK_SHOP],
            linkFiles: [{ file: "a.tsx", source: '<a href="/shopping-list">list</a>' }],
        }),
        { ok: true },
    )
})

test("query strings and trailing slashes on /shop still count as links", () => {
    const result = verifyShopIntegration({
        shopSources: [STOCK_SHOP],
        linkFiles: [{ file: "a.tsx", source: 'navigate("/shop?ref=hero")' }],
    })
    assert.equal(result.ok, false)
})

test("CLI passes against the kernel tree (stock shop, but nothing links it)", () => {
    const stdout = execFileSync(process.execPath, [SCRIPT, REPO_ROOT], { encoding: "utf8" })
    assert.match(stdout, /OK/)
})

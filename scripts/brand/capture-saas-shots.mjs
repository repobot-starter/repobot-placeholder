#!/usr/bin/env node
// Recapture the saas pack's marketing screenshots at 2x — the hero/page
// shots, the bento product crops, and the hero-collage fragments that live
// under web/app/public/saas/. Run from the repo root with the dev stack up
// and the saas pack active (`npm run dev:pack -- saas`):
//
//   node scripts/brand/capture-saas-shots.mjs [--base-url http://127.0.0.1:5174]
//
// Every capture is DARK MODE with the nav rail COLLAPSED: the monolith
// register is dark-native (the marketing page is black; a light screenshot
// on it reads as a foreign object), and the collapsed rail gives the shot
// to the product instead of the chrome. The theme flip and the collapse
// both persist in localStorage, so one setup pass covers every page.
//
// Writes source PNGs into .dev/shots/marketing/; generate the responsive
// WebP ladders from them with `npm run image -- responsive` (PACK.md has the
// per-asset widths). Signs in with the sandbox "Skip as local dev user" flow
// and patches the on-page persona to the Maya Chen demo identity so the
// shots match the seeded spend data.

import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { resolveChromiumExecutablePath } from "../brief/chromium.mjs"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const outDir = path.join(rootDir, ".dev", "shots", "marketing")
const baseUrl = (() => {
    const index = process.argv.indexOf("--base-url")
    return index >= 0 ? process.argv[index + 1] : "http://127.0.0.1:5174"
})()

const requireFromFunctions = createRequire(path.join(rootDir, "firebase", "functions", "package.json"))
const { chromium } = requireFromFunctions("playwright-core")
const sharp = createRequire(path.join(rootDir, "package.json"))("sharp")

// Rewrites the signed-in dev identity ("Local Dev") to the demo persona so
// the greeting, sidebar footer, and avatar match the seeded spend story.
async function patchPersona(page) {
    await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        const nodes = []
        while (walker.nextNode()) nodes.push(walker.currentNode)
        for (const node of nodes) {
            const value = node.nodeValue ?? ""
            if (value.includes("Local Dev")) {
                node.nodeValue = value.replace(/Local Dev/g, "Maya Chen")
            } else if (/^\s*LD\s*$/.test(value)) {
                node.nodeValue = value.replace("LD", "MC")
            } else if (/^[^\s@]+@[^\s@]+$/.test(value.trim())) {
                node.nodeValue = "maya@outlay.dev"
            }
        }
        // The greeting uses the first name only, so "Local Dev" arrives as
        // ", Local" and the generic pass above misses it.
        const heading = document.querySelector("h1")
        const last = heading?.lastChild
        if (last && last.nodeType === Node.TEXT_NODE) {
            last.nodeValue = (last.nodeValue ?? "").replace(/,\s*(Local|Maya Chen)$/, ", Maya")
        }
    })
}

async function settle(page) {
    await page.waitForLoadState("networkidle").catch(() => {})
    await page.waitForTimeout(900)
    await patchPersona(page)
    await page.waitForTimeout(150)
}

// The nearest ancestor that reads as a card (background + rounded corners) —
// class names are hashed, so anchor on text and climb by computed style.
const findCardHandle = async (page, anchorText) => {
    const handle = await page.evaluateHandle((text) => {
        const iterator = document.evaluate(
            `//*[normalize-space(text())=${JSON.stringify(text)}]`,
            document.body,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
        )
        let node = iterator.singleNodeValue
        while (node && node !== document.body) {
            const cs = getComputedStyle(node)
            if (
                parseFloat(cs.borderTopLeftRadius) > 4 &&
                cs.backgroundColor !== "rgba(0, 0, 0, 0)" &&
                cs.backgroundColor !== "transparent"
            ) {
                return node
            }
            node = node.parentElement
        }
        return null
    }, anchorText)
    const element = handle.asElement()
    if (!element) throw new Error(`no card found around text "${anchorText}"`)
    return element
}

async function shootCard(page, anchorText, file) {
    const element = await findCardHandle(page, anchorText)
    await element.scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)
    await element.screenshot({ path: path.join(outDir, file), animations: "disabled" })
    console.log(`wrote ${file}`)
    return element
}

async function login(context) {
    const page = await context.newPage()
    await page.goto(`${baseUrl}/login`, { waitUntil: "load", timeout: 30_000 })
    await page.getByText("Skip as local dev user").click()
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 })
    return page
}

// Crop a captured PNG to its top slice (2x pixels), overwriting in place.
async function trimTop(file, height) {
    const full = path.join(outDir, file)
    const meta = await sharp(full).metadata()
    const buffer = await sharp(full)
        .extract({ left: 0, top: 0, width: meta.width, height: Math.min(height, meta.height) })
        .png()
        .toBuffer()
    await sharp(buffer).toFile(full)
    console.log(`trimmed ${file} to ${meta.width}x${Math.min(height, meta.height)}`)
}

async function main() {
    const executablePath = resolveChromiumExecutablePath()
    if (executablePath === undefined) throw new Error("no Chromium found")
    const browser = await chromium.launch({ headless: true, executablePath })

    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
    })
    const page = await login(context)

    // Setup pass: make sure the theme is dark, then collapse the rail. The
    // saas theme opens dark natively (the toggle then reads "Light mode"),
    // so the flip only fires when a light default sneaks back. Order
    // matters — the appearance control is a labeled row in the expanded
    // rail, so it must be pressed before the collapse hides its text.
    await page.goto(`${baseUrl}/overview`, { waitUntil: "load" })
    await page.waitForLoadState("networkidle").catch(() => {})
    const darkToggle = page.getByText("Dark mode", { exact: true })
    if ((await darkToggle.count()) > 0) {
        await darkToggle.first().click()
        await page.waitForTimeout(600)
    }
    await page.getByLabel("Collapse navigation").first().click()
    await page.waitForTimeout(400)

    // Overview: the hero shot plus the collage/bento crops.
    await settle(page)
    await page.screenshot({ path: path.join(outDir, "hero-overview-dark.png") })
    console.log("wrote hero-overview-dark.png")
    await shootCard(page, "Spend this month", "fragment-stat-card.png")
    await shootCard(page, "Daily spend", "bento-chart-area.png")
    await shootCard(page, "Approvals queue", "bento-approvals.png")
    // The collage fragment is the queue's header + first two rows.
    const approvalsRowCut = await page.evaluate(() => {
        const heading = [...document.querySelectorAll("h2")].find((el) =>
            (el.textContent ?? "").startsWith("Approvals queue"),
        )
        const card = heading?.closest("div")?.parentElement
        const rows = card?.querySelectorAll("li") ?? []
        if (!card || rows.length < 2) return null
        const cardTop = card.getBoundingClientRect().top
        return Math.round((rows[1].getBoundingClientRect().bottom - cardTop) * 2)
    })
    {
        const element = await findCardHandle(page, "Approvals queue")
        await element.scrollIntoViewIfNeeded()
        await element.screenshot({ path: path.join(outDir, "fragment-approvals.png") })
    }
    if (approvalsRowCut) await trimTop("fragment-approvals.png", approvalsRowCut + 8)

    // Transactions: the page shot plus a top slice of the ledger card.
    await page.goto(`${baseUrl}/transactions`, { waitUntil: "load" })
    await settle(page)
    await page.screenshot({ path: path.join(outDir, "page-transactions-dark.png") })
    console.log("wrote page-transactions-dark.png")
    await shootCard(page, "Merchant", "bento-ledger.png")
    {
        // A tile-sized slice — the merchant/category/member columns over the
        // first rows. The full five-column table would be illegible mush at
        // bento display width.
        const full = path.join(outDir, "bento-ledger.png")
        const meta = await sharp(full).metadata()
        const width = Math.round(meta.width * 0.62)
        const height = Math.min(Math.round(width * 0.55), meta.height)
        const buffer = await sharp(full).extract({ left: 0, top: 0, width, height }).png().toBuffer()
        await sharp(buffer).toFile(full)
        console.log(`cropped bento-ledger.png to ${width}x${height}`)
    }

    // Budgets: the page shot plus the Office budget card.
    await page.goto(`${baseUrl}/budgets`, { waitUntil: "load" })
    await settle(page)
    await page.screenshot({ path: path.join(outDir, "page-budgets-dark.png") })
    console.log("wrote page-budgets-dark.png")
    await shootCard(page, "Office", "bento-budget-card.png")

    // Cards: the page shot plus the Engineering virtual card tile.
    await page.goto(`${baseUrl}/cards`, { waitUntil: "load" })
    await settle(page)
    await page.screenshot({ path: path.join(outDir, "page-cards-dark.png") })
    console.log("wrote page-cards-dark.png")
    await shootCard(page, "Engineering", "bento-card-tile.png")

    await context.close()
    await browser.close()
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})

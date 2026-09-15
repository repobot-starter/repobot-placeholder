// Headless smoke test for the SwiftUI web preview.
// Serves nothing itself — expects `python3 -m http.server 9701` from ios/.
// Usage: node test-preview.mjs [screen] (default: both folio and quiz)
import puppeteer from "puppeteer-core"
import { mkdirSync } from "node:fs"

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const BASE = "http://localhost:9701/WebPreview/web/index.html"
const SHOTS = new URL("../shots/", import.meta.url).pathname
mkdirSync(SHOTS, { recursive: true })

const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--window-size=500,1000", "--hide-scrollbars"],
})

async function openScreen(screen) {
    const page = await browser.newPage()
    await page.setViewport({ width: 500, height: 1000, deviceScaleFactor: 2 })
    page.on("console", (msg) => {
        if (msg.type() === "error") console.log(`[${screen}] console.error:`, msg.text())
    })
    page.on("pageerror", (err) => console.log(`[${screen}] pageerror:`, err.message))
    const t0 = Date.now()
    await page.goto(`${BASE}?screen=${screen}`, { waitUntil: "domcontentloaded" })
    await page.waitForFunction(() => document.querySelector("#swiftui-root")?.children.length > 0, {
        timeout: 60000,
    })
    const coldStart = Date.now() - t0
    const stats = await page.$eval("#stats", (el) => el.textContent)
    console.log(`[${screen}] first render after ${coldStart}ms — ${stats}`)
    return page
}

// ---- Folio ----
const folio = await openScreen("folio")
await new Promise((r) => setTimeout(r, 400))
await folio.screenshot({ path: `${SHOTS}folio-initial.png` })

// Scroll to the bottom of the folio scroll view.
await folio.evaluate(() => {
    const scroller = document.querySelector("[data-scroll]")
    if (scroller) scroller.scrollTop = scroller.scrollHeight
})
await new Promise((r) => setTimeout(r, 250))
await folio.screenshot({ path: `${SHOTS}folio-bottom.png` })

// Tap the first filter chip (a Button) and verify a re-render happens.
await folio.evaluate(() => {
    const scroller = document.querySelector("[data-scroll]")
    if (scroller) scroller.scrollTop = 0
})
const chipTexts = await folio.$$eval("button", (els) =>
    els
        .map((el) => el.textContent.trim())
        .filter(Boolean)
        .slice(0, 8),
)
console.log("[folio] first buttons:", chipTexts.join(" | "))
const t1 = Date.now()
await folio.evaluate(() => {
    const chips = [...document.querySelectorAll("#swiftui-root button")]
    chips.find((b) => b.textContent.trim() === "Mobile")?.click()
})
await new Promise((r) => setTimeout(r, 300))
console.log(`[folio] chip tap + re-render round trip ≈ ${Date.now() - t1}ms (incl. 300ms settle)`)
await folio.screenshot({ path: `${SHOTS}folio-filtered.png` })

// ---- Quiz ----
const quiz = await openScreen("quiz")
await new Promise((r) => setTimeout(r, 400))
await quiz.screenshot({ path: `${SHOTS}quiz-list.png` })

// Open the first quiz, answer a question, advance (in-page clicks: the DOM
// is replaced on re-render, so element handles would go stale).
const clickButton = (page, matcher) =>
    page.evaluate((m) => {
        const target = [...document.querySelectorAll("#swiftui-root button")].find((b) =>
            m === "first" ? true : b.textContent.includes(m),
        )
        if (target) target.click()
        return Boolean(target)
    }, matcher)

await clickButton(quiz, "first")
await new Promise((r) => setTimeout(r, 300))
await quiz.screenshot({ path: `${SHOTS}quiz-question.png` })

await clickButton(quiz, "Saturn")
await new Promise((r) => setTimeout(r, 300))
await quiz.screenshot({ path: `${SHOTS}quiz-answered.png` })
const bodyText = await quiz.$eval("#swiftui-root", (el) => el.textContent)
console.log(
    `[quiz] answered; explanation shown: ${bodyText.includes("Saturn pulled ahead")}; ` +
        `advance present: ${bodyText.includes("Next question")}`,
)
await clickButton(quiz, "Next question")
await new Promise((r) => setTimeout(r, 300))
await quiz.screenshot({ path: `${SHOTS}quiz-next.png` })
const q2 = await quiz.$eval("#swiftui-root", (el) => el.textContent.includes("2 of 8"))
console.log(`[quiz] advanced to question 2: ${q2}`)

// ---- Menu (exercises the ICU-free Calendar/String(format:)/StrokeStyle shims) ----
const menu = await openScreen("menu")
await new Promise((r) => setTimeout(r, 400))
await menu.screenshot({ path: `${SHOTS}menu-initial.png` })

await clickButton(menu, "Lunch")
await new Promise((r) => setTimeout(r, 300))
const menuText = await menu.$eval("#swiftui-root", (el) => el.textContent)
console.log(`[menu] switched to Lunch section: ${menuText.includes("soup changes daily")}`)
await menu.screenshot({ path: `${SHOTS}menu-lunch.png` })

await browser.close()
console.log(`done — screenshots in ${SHOTS}`)

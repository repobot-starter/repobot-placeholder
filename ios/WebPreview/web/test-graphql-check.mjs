// Runs the GraphQLPreviewCheck wasm binary in headless Chrome and asserts
// the canned-response decode checks pass on the wasm runtime (they also run
// on the host via `swift run GraphQLPreviewCheck`).
// Expects `python3 -m http.server 9701` from ios/.
import puppeteer from "puppeteer-core"

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const URL = "http://localhost:9701/WebPreview/GraphQLPreview/web/check.html"

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" })
const page = await browser.newPage()

let verdict = null
page.on("console", (msg) => {
    const text = msg.text()
    if (text.includes("GRAPHQL_CHECK")) verdict = text
    if (msg.type() === "error") console.log("console.error:", text)
})
page.on("pageerror", (err) => console.log("pageerror:", err.message))

await page.goto(URL, { waitUntil: "domcontentloaded" })
await page.waitForFunction(() => document.getElementById("log").textContent.includes("GRAPHQL_CHECK"), {
    timeout: 60000,
})

console.log(verdict)
await browser.close()
process.exit(verdict?.includes("PASS") ? 0 : 1)

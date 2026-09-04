// Tests for the brand image tool. Fixtures are generated with sharp so the
// suite needs no binary assets; every verb runs through the real CLI to pin
// the exit codes and messages agents see.
//
// Run: npm run test:image

import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const sharp = require("sharp")

const toolPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "image-tool.mjs")
const workDir = mkdtempSync(path.join(os.tmpdir(), "image-tool-"))

function runTool(args) {
    try {
        const stdout = execFileSync("node", [toolPath, ...args], {
            cwd: workDir,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
        })
        return { exitCode: 0, stdout, stderr: "" }
    } catch (error) {
        return { exitCode: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" }
    }
}

/** A horizontal lockup: square mark at the left, wordmark blocks after a gap. */
async function writeWordmark(file) {
    const block = (width, height) =>
        sharp({ create: { width, height, channels: 4, background: "#1a2b3c" } })
            .png()
            .toBuffer()
    await sharp({ create: { width: 900, height: 300, channels: 4, background: "#ffffff" } })
        .composite([
            { input: await block(200, 200), left: 40, top: 50 },
            { input: await block(90, 140), left: 330, top: 80 },
            { input: await block(90, 140), left: 450, top: 80 },
            { input: await block(90, 140), left: 570, top: 80 },
        ])
        .png()
        .toFile(file)
}

test("info reports dimensions, background, and content bbox", async () => {
    const file = path.join(workDir, "logo.png")
    await writeWordmark(file)
    const { exitCode, stdout } = runTool(["info", file])
    assert.equal(exitCode, 0)
    const report = JSON.parse(stdout)
    assert.equal(report.width, 900)
    assert.equal(report.background, "rgb(255, 255, 255)")
    assert.equal(report.contentBbox.left, 40)
})

test("palette reports the exact dominant colors with coverage", async () => {
    // Two known color regions: 75% dark navy, 25% brand red.
    const file = path.join(workDir, "design.png")
    await sharp({ create: { width: 400, height: 400, channels: 3, background: "#101728" } })
        .composite([
            {
                input: await sharp({
                    create: { width: 400, height: 100, channels: 3, background: "#e63946" },
                })
                    .png()
                    .toBuffer(),
                top: 300,
                left: 0,
            },
        ])
        .png()
        .toFile(file)
    const { exitCode, stdout } = runTool(["palette", file, "--count", "4"])
    assert.equal(exitCode, 0)
    const colors = JSON.parse(stdout)
    assert.equal(colors[0].color, "#101728")
    assert.match(colors[0].share, /^7[0-9]\./)
    assert.equal(colors[1].color, "#E63946")
    assert.match(colors[1].share, /^2[0-9]\./)
})

test("mark extracts the square mark, never the wordmark", async () => {
    const file = path.join(workDir, "logo.png")
    const out = path.join(workDir, "logo-mark.png")
    await writeWordmark(file)
    const { exitCode } = runTool(["mark", file, out])
    assert.equal(exitCode, 0)

    const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    assert.equal(info.width, info.height)
    // Opaque content must be ~square (the mark), not mark-plus-letters.
    let minX = info.width
    let maxX = -1
    let minY = info.height
    let maxY = -1
    for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < info.width; x += 1) {
            if (data[(y * info.width + x) * 4 + 3] > 16) {
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }
    }
    const aspect = (maxX - minX + 1) / (maxY - minY + 1)
    assert.ok(aspect > 0.9 && aspect < 1.1, `mark content aspect ${aspect} is not square`)
})

test("transparent removes a uniform background and no-ops when already transparent", async () => {
    const file = path.join(workDir, "logo.png")
    const out = path.join(workDir, "logo-transparent.png")
    await writeWordmark(file)
    assert.equal(runTool(["transparent", file, out]).exitCode, 0)
    const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    // Former white gap between mark and letters — source (300, 60) is
    // (260, 10) in the trimmed crop — must be see-through now.
    assert.equal(data[(10 * info.width + 260) * 4 + 3], 0)

    // A transparent-background source has nothing to remove: succeed and
    // produce the requested output anyway (a failure here used to send
    // agents into cp + hand-rolled sharp workarounds).
    const againPath = path.join(workDir, "again.png")
    const second = runTool(["transparent", out, againPath])
    assert.equal(second.exitCode, 0)
    assert.match(second.stdout, /already has a transparent background/)
    const again = await sharp(againPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    assert.equal(again.data[(10 * again.info.width + 260) * 4 + 3], 0)

    // In-place invocation on an already-transparent file is a pure no-op.
    assert.equal(runTool(["transparent", out, out]).exitCode, 0)
})

test("slice cuts an exact grid", async () => {
    const file = path.join(workDir, "showcase.png")
    await sharp({ create: { width: 600, height: 400, channels: 3, background: "#334455" } })
        .png()
        .toFile(file)
    const outDir = path.join(workDir, "cards")
    const { exitCode } = runTool([
        "slice",
        file,
        "--cols",
        "3",
        "--rows",
        "2",
        "--out-dir",
        outDir,
        "--prefix",
        "card",
    ])
    assert.equal(exitCode, 0)
    const cell = await sharp(path.join(outDir, "card-2x3.png")).metadata()
    assert.equal(cell.width, 200)
    assert.equal(cell.height, 200)
})

test("favicons emits the standard set including a PNG-entry ico", async () => {
    const file = path.join(workDir, "icon.png")
    await sharp({ create: { width: 512, height: 512, channels: 4, background: "#27ae60" } })
        .png()
        .toFile(file)
    const outDir = path.join(workDir, "public")
    assert.equal(runTool(["favicons", file, "--out-dir", outDir]).exitCode, 0)
    for (const [name, size] of [
        ["favicon-16x16.png", 16],
        ["favicon-32x32.png", 32],
        ["apple-touch-icon.png", 180],
    ]) {
        const meta = await sharp(path.join(outDir, name)).metadata()
        assert.equal(meta.width, size, name)
    }
    const ico = readFileSync(path.join(outDir, "favicon.ico"))
    assert.equal(ico.readUInt16LE(2), 1) // type: icon
    assert.equal(ico.readUInt16LE(4), 1) // one entry
    // The entry payload is a PNG (magic bytes at the recorded offset).
    assert.equal(ico.readUInt32LE(18), 22)
    assert.equal(ico.subarray(22, 26).toString("latin1"), "\u0089PNG")
})

test("guard rails: unsegmentable art refuses mark and trim with a clear message", async () => {
    // A four-corner gradient — no uniform background, no alpha.
    const pixels = Buffer.alloc(200 * 100 * 3)
    for (let index = 0; index < pixels.length; index += 3) {
        const pixel = index / 3
        const value = ((pixel % 200) + Math.floor(pixel / 200) * 2) % 256
        pixels[index] = value
        pixels[index + 1] = value
        pixels[index + 2] = value
    }
    const file = path.join(workDir, "photo.png")
    await sharp(pixels, { raw: { width: 200, height: 100, channels: 3 } })
        .png()
        .toFile(file)

    const markResult = runTool(["mark", file, path.join(workDir, "photo-mark.png")])
    assert.equal(markResult.exitCode, 1)
    assert.match(markResult.stderr, /no clean square mark/)

    const trimResult = runTool(["trim", file, path.join(workDir, "photo-trim.png")])
    assert.equal(trimResult.exitCode, 1)
    assert.match(trimResult.stderr, /no separable content/)
})

test("responsive emits capped WebP widths and a paste-ready media snippet", async () => {
    // A 1800x1200 photo: the 2400 rung must collapse to the 1800 original.
    const file = path.join(workDir, "Portrait Shot.png")
    await sharp({ create: { width: 1800, height: 1200, channels: 3, background: "#7a6a5a" } })
        .png()
        .toFile(file)
    const outDir = path.join(workDir, "web", "app", "public", "photography")
    const { exitCode, stdout } = runTool(["responsive", file, "--out-dir", outDir, "--alt", "A test frame"])
    assert.equal(exitCode, 0, stdout)

    for (const width of [640, 1024, 1600, 1800]) {
        const meta = await sharp(path.join(outDir, `portrait-shot-${width}w.webp`)).metadata()
        assert.equal(meta.format, "webp")
        assert.equal(meta.width, width)
    }
    const snippet = JSON.parse(stdout.slice(stdout.indexOf("{")))
    assert.equal(snippet.kind, "image")
    // Servable path: everything after the public/ root.
    assert.equal(snippet.src, "/photography/portrait-shot-1800w.webp")
    assert.equal(snippet.alt, "A test frame")
    assert.equal(snippet.width, 1800)
    assert.equal(snippet.height, 1200)
    assert.deepEqual(
        snippet.srcSet.map((source) => source.width),
        [640, 1024, 1600, 1800],
    )
})

test("responsive honors custom widths and refuses bad input", async () => {
    const file = path.join(workDir, "photo-small.png")
    await sharp({ create: { width: 800, height: 500, channels: 3, background: "#334455" } })
        .png()
        .toFile(file)
    const outDir = path.join(workDir, "web", "app", "public", "gallery")
    const custom = runTool([
        "responsive",
        file,
        "--out-dir",
        outDir,
        "--name",
        "frame",
        "--widths",
        "400,800",
    ])
    assert.equal(custom.exitCode, 0, custom.stdout)
    assert.equal((await sharp(path.join(outDir, "frame-400w.webp")).metadata()).width, 400)
    assert.equal((await sharp(path.join(outDir, "frame-800w.webp")).metadata()).width, 800)

    const noOutDir = runTool(["responsive", file])
    assert.equal(noOutDir.exitCode, 1)
    assert.match(noOutDir.stderr, /needs --out-dir/)

    const badWidths = runTool(["responsive", file, "--out-dir", outDir, "--widths", "a,b"])
    assert.equal(badWidths.exitCode, 1)
    assert.match(badWidths.stderr, /positive integers/)
})

test("bare invocation and --help print usage", () => {
    const bare = runTool([])
    assert.equal(bare.exitCode, 0)
    assert.match(bare.stdout, /usage: npm run image/)
    const unknown = runTool(["explode"])
    assert.equal(unknown.exitCode, 1)
})

test("generate emits the full starter kit and stamps the manifest", async () => {
    const kitDir = mkdtempSync(path.join(os.tmpdir(), "brand-kit-"))
    const manifest = path.join(kitDir, "repobot.project.json")
    writeFileSync(manifest, JSON.stringify({ marketing: { preset: "editorial", pages: [] } }, null, 4))
    const { exitCode, stdout } = runTool([
        "generate",
        "--name",
        "Elmo Tribute",
        "--color",
        "#E63946",
        "--out-dir",
        path.join(kitDir, "brand"),
        "--favicons-dir",
        path.join(kitDir, "public"),
        "--manifest",
        manifest,
    ])
    assert.equal(exitCode, 0, stdout)

    const social = await sharp(path.join(kitDir, "brand", "social.png")).metadata()
    assert.equal(social.width, 1200)
    assert.equal(social.height, 630)
    const icon = await sharp(path.join(kitDir, "brand", "icon.png")).metadata()
    assert.equal(icon.width, 1024)
    // The wordmark is transparent (it sits on the site's own surfaces) and
    // wider than the square mark (it carries the name).
    const wordmark = await sharp(path.join(kitDir, "brand", "logo-transparent.png")).metadata()
    assert.equal(wordmark.hasAlpha, true)
    assert.ok(wordmark.width > wordmark.height, "wordmark should be a horizontal lockup")
    // Favicons landed next to index.html's expectations.
    assert.equal((await sharp(path.join(kitDir, "public", "favicon-32x32.png")).metadata()).width, 32)
    // The manifest contract is stamped with the servable paths.
    const stamped = JSON.parse(readFileSync(manifest, "utf8"))
    assert.deepEqual(stamped.marketing.brand, {
        logo: "/brand/logo-transparent.png",
        logoMark: "/brand/logo-mark.png",
        icon: "/brand/icon.png",
        social: "/brand/social.png",
    })
    // Untouched manifest fields survive the stamp.
    assert.equal(stamped.marketing.preset, "editorial")
})

test("generate honors adjacent boolean flags and defaults color from the theme", async () => {
    // Boolean flags back to back — the parser must not eat one as the
    // other's value (the pre-generate parser did exactly that).
    writeFileSync(path.join(workDir, "repobot.theme.json"), JSON.stringify({ brand: { primary: "#27ae60" } }))
    const outDir = path.join(workDir, "kit-defaults")
    const { exitCode, stdout } = runTool([
        "generate",
        "--name",
        "Acme",
        "--out-dir",
        outDir,
        "--no-favicons",
        "--no-manifest",
    ])
    assert.equal(exitCode, 0, stdout)
    assert.match(stdout, /add to repobot\.project\.json/)
    assert.ok(!existsSync(path.join(workDir, "favicon.ico")), "favicons must be suppressed")
    // The mark carries the theme green: sample the square's center pixel.
    const { data, info } = await sharp(path.join(outDir, "logo-mark.png"))
        .raw()
        .toBuffer({ resolveWithObject: true })
    const offset = (Math.floor(info.height / 2) * info.width + Math.floor(info.width * 0.1)) * info.channels
    assert.ok(data[offset + 1] > data[offset] && data[offset + 1] > data[offset + 2], "mark should be green")
})

test("generate refuses without a name or a color source", () => {
    const noName = runTool(["generate", "--color", "#123456"])
    assert.equal(noName.exitCode, 1)
    assert.match(noName.stderr, /needs --name/)
    const noColor = runTool(["generate", "--name", "Acme", "--out-dir", path.join(workDir, "x")])
    // The theme file written by the previous test may supply the color; a
    // bare temp cwd must refuse instead.
    const bareDir = mkdtempSync(path.join(os.tmpdir(), "brand-bare-"))
    const refused = execFileSyncResult(bareDir, ["generate", "--name", "Acme"])
    assert.equal(refused.exitCode, 1)
    assert.match(refused.stderr, /needs --color/)
    assert.equal(noColor.exitCode, 0)
})

function execFileSyncResult(cwd, args) {
    try {
        const stdout = execFileSync("node", [toolPath, ...args], {
            cwd,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
        })
        return { exitCode: 0, stdout, stderr: "" }
    } catch (error) {
        return { exitCode: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" }
    }
}

// Guard-railed image operations for brand work: trim, background removal,
// mark extraction, grid slicing, favicons. Agents (and humans) reach for
// these verbs instead of hand-writing sharp pixel math — a hand-rolled
// extract once cropped a logo mark with half the wordmark attached, and two
// more crashed on bad extract geometry. Every verb here computes its own
// geometry from the image content, so those failure modes cannot happen.
//
//   npm run image -- info <file>
//   npm run image -- palette <file> [--count 8]
//   npm run image -- trim <in> <out>
//   npm run image -- transparent <in> <out>
//   npm run image -- mark <in> <out> [--size 512]
//   npm run image -- slice <in> --cols N --rows N --out-dir <dir> [--prefix name]
//   npm run image -- favicons <in> [--out-dir web/app/public]
//   npm run image -- responsive <in> --out-dir <dir> [--name slug] [--widths 640,1024,1600,2400] [--quality 82] [--alt "..."]
//   npm run brand:generate -- --name "Acme" [--color "#E63946"] [--svg mark.svg]
//
// Requires sharp: a devDependency here, and preinstalled globally on
// Repobot workspace pods.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

function loadSharp() {
    const require = createRequire(import.meta.url)
    try {
        return require("sharp")
    } catch {
        console.error("image-tool: sharp is not installed (npm install --save-dev sharp)")
        process.exit(1)
    }
}
const sharp = loadSharp()

const ALPHA_FLOOR = 16
const BG_COLOR_TOLERANCE = 40

// ---------------------------------------------------------------------------
// Content segmentation (shared by trim / transparent / mark)
// ---------------------------------------------------------------------------

async function decode(file) {
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    return { data, width: info.width, height: info.height }
}

function cornerSample(raw, left, top) {
    const patch = Math.max(1, Math.floor(Math.min(raw.width, raw.height) * 0.02))
    let r = 0
    let g = 0
    let b = 0
    let alpha = 0
    let count = 0
    for (let y = top; y < top + patch; y += 1) {
        for (let x = left; x < left + patch; x += 1) {
            const offset = (y * raw.width + x) * 4
            r += raw.data[offset]
            g += raw.data[offset + 1]
            b += raw.data[offset + 2]
            alpha += raw.data[offset + 3]
            count += 1
        }
    }
    return alpha / count < ALPHA_FLOOR ? undefined : { r: r / count, g: g / count, b: b / count }
}

const colorDistance = (a, b) => Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b))

/**
 * Artwork/background separation: alpha for transparent sources, distance
 * from the (uniform) corner color for opaque ones. Photos and gradients
 * have neither and yield no mask — the verbs then refuse rather than cut
 * something arbitrary.
 */
function segment(raw) {
    const patch = Math.max(1, Math.floor(Math.min(raw.width, raw.height) * 0.02))
    const corners = [
        cornerSample(raw, 0, 0),
        cornerSample(raw, raw.width - patch, 0),
        cornerSample(raw, 0, raw.height - patch),
        cornerSample(raw, raw.width - patch, raw.height - patch),
    ]
    let background
    if (corners.filter((corner) => corner === undefined).length < 2) {
        const opaque = corners.filter((corner) => corner !== undefined)
        if (!opaque.every((corner) => colorDistance(corner, opaque[0]) < 24)) {
            return { raw, mask: new Uint8Array(raw.width * raw.height) }
        }
        background = {
            r: opaque.reduce((sum, corner) => sum + corner.r, 0) / opaque.length,
            g: opaque.reduce((sum, corner) => sum + corner.g, 0) / opaque.length,
            b: opaque.reduce((sum, corner) => sum + corner.b, 0) / opaque.length,
        }
    }
    const mask = new Uint8Array(raw.width * raw.height)
    let minX = raw.width
    let minY = raw.height
    let maxX = -1
    let maxY = -1
    for (let y = 0; y < raw.height; y += 1) {
        for (let x = 0; x < raw.width; x += 1) {
            const offset = (y * raw.width + x) * 4
            const alpha = raw.data[offset + 3]
            const isContent =
                background === undefined
                    ? alpha >= ALPHA_FLOOR
                    : alpha >= ALPHA_FLOOR &&
                      colorDistance(
                          { r: raw.data[offset], g: raw.data[offset + 1], b: raw.data[offset + 2] },
                          background,
                      ) > BG_COLOR_TOLERANCE
            if (isContent) {
                mask[y * raw.width + x] = 1
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }
    }
    const bbox =
        maxX < 0 ? undefined : { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
    return { raw, mask, background, bbox }
}

function trimTo(segmentation, fromX, toX) {
    const { raw, mask } = segmentation
    let minX = raw.width
    let minY = raw.height
    let maxX = -1
    let maxY = -1
    for (let y = 0; y < raw.height; y += 1) {
        for (let x = fromX; x <= toX; x += 1) {
            if (mask[y * raw.width + x] === 1) {
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }
    }
    return maxX < 0 ? undefined : { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

/**
 * The square mark inside a horizontal lockup: first real column gap whose
 * left segment is roughly square. A near-square logo is its own mark.
 */
function findMark(segmentation) {
    const { raw, mask, bbox } = segmentation
    if (!bbox) return undefined
    if (bbox.width / bbox.height <= 1.25) return bbox
    const occupancy = new Array(bbox.width).fill(0)
    for (let y = bbox.top; y < bbox.top + bbox.height; y += 1) {
        for (let x = 0; x < bbox.width; x += 1) {
            occupancy[x] += mask[y * raw.width + bbox.left + x]
        }
    }
    const emptyThreshold = Math.max(1, Math.floor(bbox.height * 0.01))
    const minGap = Math.max(2, Math.floor(bbox.width * 0.015))
    let gapStart = -1
    for (let x = Math.floor(bbox.width * 0.08); x < bbox.width; x += 1) {
        if (occupancy[x] <= emptyThreshold) {
            if (gapStart < 0) gapStart = x
            if (x - gapStart + 1 >= minGap) {
                const candidate = trimTo(segmentation, bbox.left, bbox.left + gapStart - 1)
                if (
                    candidate !== undefined &&
                    candidate.width / candidate.height >= 0.5 &&
                    candidate.width / candidate.height <= 1.6
                ) {
                    return candidate
                }
                while (x < bbox.width && occupancy[x] <= emptyThreshold) x += 1
                gapStart = -1
            }
        } else {
            gapStart = -1
        }
    }
    return undefined
}

function transparentPixels(segmentation) {
    const { raw, mask } = segmentation
    const out = Buffer.from(raw.data)
    for (let index = 0; index < mask.length; index += 1) {
        if (mask[index] === 0) out[index * 4 + 3] = 0
    }
    return sharp(out, { raw: { width: raw.width, height: raw.height, channels: 4 } })
}

// ---------------------------------------------------------------------------
// Verbs
// ---------------------------------------------------------------------------

async function info(file) {
    const meta = await sharp(file).metadata()
    const segmentation = segment(await decode(file))
    console.log(
        JSON.stringify(
            {
                width: meta.width,
                height: meta.height,
                format: meta.format,
                hasAlpha: meta.hasAlpha === true,
                background: segmentation.background
                    ? `rgb(${Math.round(segmentation.background.r)}, ${Math.round(segmentation.background.g)}, ${Math.round(segmentation.background.b)})`
                    : segmentation.bbox
                      ? "transparent"
                      : "unsegmentable (photo/gradient)",
                contentBbox: segmentation.bbox ?? null,
            },
            null,
            2,
        ),
    )
}

// Dominant colors of a screenshot/design as exact hex values. Agents
// matching an uploaded design were eyeballing hexes from the vision read
// and landing near-miss colors; this samples the real pixels instead.
async function palette(file, options) {
    const count = Number(options.count ?? 8)
    const { data } = await sharp(file)
        .resize(128, 128, { fit: "inside" })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
    // Quantize to 16 levels per channel, then report each bucket's true mean
    // color — coarse enough to absorb anti-aliasing and JPEG noise, fine
    // enough to keep distinct brand hues apart.
    const buckets = new Map()
    for (let index = 0; index < data.length; index += 3) {
        const key = ((data[index] >> 4) << 8) | ((data[index + 1] >> 4) << 4) | (data[index + 2] >> 4)
        let bucket = buckets.get(key)
        if (bucket === undefined) buckets.set(key, (bucket = { n: 0, r: 0, g: 0, b: 0 }))
        bucket.n += 1
        bucket.r += data[index]
        bucket.g += data[index + 1]
        bucket.b += data[index + 2]
    }
    const total = data.length / 3
    const hex = (value) => Math.round(value).toString(16).padStart(2, "0")
    const top = [...buckets.values()]
        .sort((a, b) => b.n - a.n)
        .slice(0, count)
        .map((bucket) => ({
            color: `#${hex(bucket.r / bucket.n)}${hex(bucket.g / bucket.n)}${hex(bucket.b / bucket.n)}`.toUpperCase(),
            share: `${((bucket.n / total) * 100).toFixed(1)}%`,
        }))
    console.log(JSON.stringify(top, null, 2))
}

async function trim(file, out) {
    const segmentation = segment(await decode(file))
    if (!segmentation.bbox) fail(`${file} has no separable content to trim (photo/gradient?)`)
    await sharp(file).extract(segmentation.bbox).toFile(out)
    console.log(`trimmed ${file} -> ${out} (${segmentation.bbox.width}x${segmentation.bbox.height})`)
}

async function transparent(file, out) {
    const segmentation = segment(await decode(file))
    if (segmentation.background === undefined) {
        if (!segmentation.bbox) {
            fail(`${file} has no uniform background to remove (photo/gradient?)`)
        }
        // Already transparent: a no-op, not an error. The old failure here
        // sent agents into cp + hand-rolled sharp workarounds; produce the
        // requested output and exit 0 instead.
        if (path.resolve(file) === path.resolve(out)) {
            console.log(`${file} already has a transparent background; nothing to do`)
            return
        }
        await sharp(file).png().toFile(out)
        console.log(`${file} already has a transparent background; copied to ${out}`)
        return
    }
    await transparentPixels(segmentation).extract(segmentation.bbox).png().toFile(out)
    console.log(`removed background: ${file} -> ${out}`)
}

async function mark(file, out, options) {
    const size = Number(options.size ?? 512)
    const segmentation = segment(await decode(file))
    const region = findMark(segmentation)
    if (!region) {
        fail(`${file} has no clean square mark (no column gap found) — use the full logo instead`)
    }
    const source = segmentation.background !== undefined ? transparentPixels(segmentation) : sharp(file)
    const content = await source.extract(region).png().toBuffer()
    const side = Math.min(size, Math.ceil(Math.max(region.width, region.height) * 1.16))
    const inner = Math.floor(side / 1.16)
    await sharp({
        create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
        .composite([{ input: await sharp(content).resize(inner, inner, { fit: "inside" }).toBuffer() }])
        .png()
        .toFile(out)
    console.log(`extracted mark: ${file} -> ${out} (${side}x${side})`)
}

async function slice(file, options) {
    const cols = Number(options.cols)
    const rows = Number(options.rows)
    const outDir = options["out-dir"]
    if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1 || !outDir) {
        fail("slice needs --cols N --rows N --out-dir <dir>")
    }
    const prefix = options.prefix ?? path.basename(file, path.extname(file))
    const meta = await sharp(file).metadata()
    const cellWidth = Math.floor(meta.width / cols)
    const cellHeight = Math.floor(meta.height / rows)
    mkdirSync(outDir, { recursive: true })
    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            const out = path.join(outDir, `${prefix}-${row + 1}x${col + 1}.png`)
            await sharp(file)
                .extract({
                    left: col * cellWidth,
                    top: row * cellHeight,
                    width: cellWidth,
                    height: cellHeight,
                })
                .png()
                .toFile(out)
            console.log(`wrote ${out}`)
        }
    }
}

async function favicons(file, options) {
    const outDir = options["out-dir"] ?? "web/app/public"
    mkdirSync(outDir, { recursive: true })
    const square = (size) => sharp(file).resize(size, size, { fit: "cover" }).png().toBuffer()
    const targets = [
        ["apple-touch-icon.png", await square(180)],
        ["favicon-32x32.png", await square(32)],
        ["favicon-16x16.png", await square(16)],
    ]
    for (const [name, contents] of targets) {
        await sharp(contents).toFile(path.join(outDir, name))
        console.log(`wrote ${path.join(outDir, name)}`)
    }
    // Single-entry ICO wrapping the 32px PNG (PNG entries are valid ICO).
    const png32 = targets[1][1]
    const header = Buffer.alloc(6)
    header.writeUInt16LE(1, 2)
    header.writeUInt16LE(1, 4)
    const entry = Buffer.alloc(16)
    entry.writeUInt8(32, 0)
    entry.writeUInt8(32, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(png32.length, 8)
    entry.writeUInt32LE(22, 12)
    writeFileSync(path.join(outDir, "favicon.ico"), Buffer.concat([header, entry, png32]))
    console.log(`wrote ${path.join(outDir, "favicon.ico")}`)
}

// The default responsive ladder: phone, tablet, desktop, retina-desktop.
const RESPONSIVE_WIDTHS = [640, 1024, 1600, 2400]

/**
 * Servable URL base for files written under the Vite public root: the path
 * after the "public" segment. Files outside a public root fall back to the
 * out-dir itself (with a warning) so the snippet is still copy-editable.
 */
function servableBase(outDir) {
    const segments = path.normalize(outDir).split(path.sep).filter(Boolean)
    const publicIndex = segments.lastIndexOf("public")
    if (publicIndex >= 0) {
        const rest = segments.slice(publicIndex + 1)
        return rest.length === 0 ? "" : `/${rest.join("/")}`
    }
    console.error(`image-tool: warning — ${outDir} is not under a public/ root; snippet paths need editing`)
    return `/${segments.join("/")}`
}

/**
 * Responsive variants for photography-grade pages: several WebP widths plus
 * a ready-to-paste MarketingMedia snippet carrying intrinsic dimensions and
 * the srcSet — the kernel's layout-shift-free loading path
 * (docs/landing.md, "The photography-grade set").
 */
async function responsive(file, options) {
    const outDir = options["out-dir"]
    if (typeof outDir !== "string") fail("responsive needs --out-dir <dir> (e.g. web/app/public/photography)")
    const meta = await sharp(file).metadata()
    if (!meta.width || !meta.height) fail(`${file} has no readable dimensions`)
    const quality = Number(options.quality ?? 82)
    const name =
        typeof options.name === "string"
            ? options.name
            : path
                  .basename(file, path.extname(file))
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "")
    const requested =
        typeof options.widths === "string"
            ? options.widths.split(",").map((value) => Number(value.trim()))
            : RESPONSIVE_WIDTHS
    if (requested.some((width) => !Number.isInteger(width) || width < 1)) {
        fail("responsive --widths must be comma-separated positive integers")
    }
    // Never upscale: widths above the original collapse to the original.
    const widths = [...new Set(requested.map((width) => Math.min(width, meta.width)))].sort((a, b) => a - b)

    mkdirSync(outDir, { recursive: true })
    const base = servableBase(outDir)
    const srcSet = []
    for (const width of widths) {
        const outFile = `${name}-${width}w.webp`
        await sharp(file).resize(width).webp({ quality }).toFile(path.join(outDir, outFile))
        srcSet.push({ src: `${base}/${outFile}`, width })
        console.log(`wrote ${path.join(outDir, outFile)}`)
    }
    const largest = srcSet[srcSet.length - 1]
    const snippet = {
        kind: "image",
        src: largest.src,
        alt: typeof options.alt === "string" ? options.alt : "",
        width: largest.width,
        height: Math.round((meta.height / meta.width) * largest.width),
        srcSet,
    }
    console.log("media entry (paste into content.ts):")
    console.log(JSON.stringify(snippet, null, 4))
}

// ---------------------------------------------------------------------------
// generate: the full starter brand kit from a name + color (or a mark SVG)
// ---------------------------------------------------------------------------

const FONT_STACK = "Helvetica, 'Helvetica Neue', Arial, 'Liberation Sans', 'DejaVu Sans', sans-serif"

function parseHexColor(value) {
    const match = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.exec(String(value).trim())
    if (!match) fail(`"${value}" is not a hex color (use e.g. #E63946)`)
    const hex = match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1]
    return {
        hex: `#${hex.toLowerCase()}`,
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
    }
}

/** White or near-black, whichever reads against the given color. */
function contrastColor(color) {
    const channel = (v) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }
    const luminance = 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b)
    return luminance > 0.45 ? "#16181d" : "#ffffff"
}

const escapeXml = (text) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** Rounded-square lettermark: the name's initial on the brand color. */
function lettermarkSvg(initial, size, background, foreground) {
    const fontSize = Math.round(size * 0.58)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="${background}"/>
  <text x="50%" y="${Math.round(size * 0.5 + fontSize * 0.355)}" text-anchor="middle"
    font-family="${FONT_STACK}" font-weight="700" font-size="${fontSize}"
    fill="${foreground}">${escapeXml(initial)}</text>
</svg>`
}

/** The name as a trimmed transparent raster (librsvg text via sharp). */
async function renderText(text, fontSize, fill) {
    const canvasWidth = Math.ceil(fontSize * 0.75 * (text.length + 2))
    const canvasHeight = Math.ceil(fontSize * 1.6)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
  <text x="${fontSize}" y="${Math.round(fontSize * 1.1)}" font-family="${FONT_STACK}"
    font-weight="700" font-size="${fontSize}" fill="${fill}">${escapeXml(text)}</text>
</svg>`
    const rendered = await sharp(Buffer.from(svg)).png().toBuffer()
    return sharp(rendered).trim().png().toBuffer()
}

/** Mark + name side by side on a transparent canvas, sized to content. */
async function composeWordmark(markBuffer, textBuffer, markSide) {
    const text = await sharp(textBuffer).metadata()
    const gap = Math.round(markSide * 0.22)
    const width = markSide + gap + text.width
    const height = Math.max(markSide, text.height)
    return sharp({
        create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
        .composite([
            { input: markBuffer, left: 0, top: Math.round((height - markSide) / 2) },
            { input: textBuffer, left: markSide + gap, top: Math.round((height - text.height) / 2) },
        ])
        .png()
}

async function generate(options) {
    const name = typeof options.name === "string" ? options.name.trim() : ""
    if (name === "") fail('generate needs --name "Product Name"')
    const outDir = options["out-dir"] ?? "web/app/public/brand"
    const manifestPath = options.manifest ?? "repobot.project.json"

    // Color: --color wins, else the committed theme accent — the setup flow
    // stamps repobot.theme.json before brand work, so the kit matches the
    // theme without repeating the hex on the command line.
    let colorInput = options.color
    if (colorInput === undefined && existsSync("repobot.theme.json")) {
        colorInput = JSON.parse(readFileSync("repobot.theme.json", "utf8"))?.brand?.primary
    }
    if (typeof colorInput !== "string") {
        fail("generate needs --color #RRGGBB (no committed repobot.theme.json brand.primary to default from)")
    }
    const color = parseHexColor(colorInput)
    const onColor = contrastColor(color)
    const initial = [...name][0].toUpperCase()

    // The mark: a provided SVG rasterized, else the generated lettermark.
    const markSide = 512
    const markBuffer = options.svg
        ? await sharp(readFileSync(String(options.svg)))
              .resize(markSide, markSide, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
              .png()
              .toBuffer()
        : await sharp(Buffer.from(lettermarkSvg(initial, markSide, color.hex, onColor)))
              .png()
              .toBuffer()

    mkdirSync(outDir, { recursive: true })
    const wrote = []
    const write = async (pipeline, file) => {
        await pipeline.toFile(path.join(outDir, file))
        wrote.push(file)
    }

    await write(sharp(markBuffer), "logo-mark.png")
    // Wordmark text in a neutral ink — it sits on the site's own surfaces,
    // not on the brand color.
    const textBuffer = await renderText(name, 200, "#16181d")
    await write(await composeWordmark(markBuffer, textBuffer, markSide), "logo-transparent.png")

    // App icon: full-bleed on the brand color (icons never have alpha).
    const iconSide = 1024
    await write(
        sharp({ create: { width: iconSide, height: iconSide, channels: 4, background: color.hex } })
            .composite([
                {
                    input: options.svg
                        ? await sharp(markBuffer)
                              .resize(Math.round(iconSide * 0.64))
                              .png()
                              .toBuffer()
                        : Buffer.from(lettermarkSvg(initial, iconSide, color.hex, onColor)),
                },
            ])
            .png(),
        "icon.png",
    )

    // Social card (og:image, 1200×630): mark on a contrast tile so it reads
    // against the brand-color field, the name beneath in the contrast ink.
    const tileSide = 200
    const tile = await sharp(
        Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSide}" height="${tileSide}">
  <rect width="${tileSide}" height="${tileSide}" rx="${Math.round(tileSide * 0.22)}" fill="${onColor === "#ffffff" ? "#ffffff" : "#16181d"}"/>
</svg>`,
        ),
    )
        .composite([
            {
                input: options.svg
                    ? await sharp(markBuffer)
                          .resize(Math.round(tileSide * 0.7))
                          .png()
                          .toBuffer()
                    : await sharp(
                          Buffer.from(lettermarkSvg(initial, Math.round(tileSide * 0.7), color.hex, onColor)),
                      )
                          .png()
                          .toBuffer(),
                gravity: "centre",
            },
        ])
        .png()
        .toBuffer()
    const socialName = await renderText(name, 96, onColor)
    const socialNameMeta = await sharp(socialName).metadata()
    await write(
        sharp({ create: { width: 1200, height: 630, channels: 4, background: color.hex } })
            .composite([
                { input: tile, left: Math.round((1200 - tileSide) / 2), top: 140 },
                {
                    input: socialName,
                    left: Math.round((1200 - socialNameMeta.width) / 2),
                    top: 400 + Math.round((96 - socialNameMeta.height) / 2),
                },
            ])
            .png(),
        "social.png",
    )
    for (const file of wrote) console.log(`wrote ${path.join(outDir, file)}`)

    // Favicons replace the default Repobot set next to index.html.
    if (options["no-favicons"] !== true) {
        await favicons(path.join(outDir, "icon.png"), {
            "out-dir": options["favicons-dir"] ?? path.resolve(outDir, ".."),
        })
    }

    // Stamp the manifest contract (marketing.brand) so the kernel picks the
    // kit up everywhere — see AGENTS.md's brand section for what renders
    // where. Servable paths are fixed: the files live under public/brand/.
    const brandEntry = {
        logo: "/brand/logo-transparent.png",
        logoMark: "/brand/logo-mark.png",
        icon: "/brand/icon.png",
        social: "/brand/social.png",
    }
    if (options["no-manifest"] === true || !existsSync(manifestPath)) {
        console.log(`add to ${manifestPath} marketing: "brand": ${JSON.stringify(brandEntry)}`)
        return
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
    manifest.marketing = { ...manifest.marketing, brand: { ...manifest.marketing?.brand, ...brandEntry } }
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`)
    console.log(`stamped marketing.brand into ${manifestPath}`)
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = [
    "usage: npm run image -- <verb> ...",
    "  info <file>                              dimensions, background, content bbox",
    "  palette <file> [--count 8]               dominant colors as exact hex + coverage",
    "  trim <in> <out>                          crop to content bounding box",
    "  transparent <in> <out>                   uniform background -> alpha",
    "  mark <in> <out> [--size 512]             square mark from a wordmark lockup",
    "  slice <in> --cols N --rows N --out-dir d grid-slice into cells",
    "  favicons <in> [--out-dir web/app/public] favicon set (16/32/180/ico)",
    "  responsive <in> --out-dir <dir> [--name slug] [--widths 640,1024,1600,2400] [--quality 82] [--alt text]",
    "      sized WebP variants + a paste-ready MarketingMedia snippet with",
    "      intrinsic dimensions and srcSet (photography-grade image loading).",
    '  generate --name "Acme" [--color #E63946] [--svg mark.svg] [--no-favicons] [--no-manifest]',
    "      full starter kit: wordmark, mark, icon, social card, favicons —",
    "      written under web/app/public/brand/ and stamped into the manifest.",
    "      Color defaults to the committed repobot.theme.json brand.primary.",
].join("\n")

function fail(message) {
    console.error(`image-tool: ${message}`)
    process.exit(1)
}

function parse(argv) {
    const positional = []
    const options = {}
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index]
        if (arg.startsWith("--")) {
            // A flag followed by another flag (or nothing) is boolean —
            // e.g. `--no-favicons --no-manifest` must not eat its neighbor.
            const next = argv[index + 1]
            options[arg.slice(2)] = next === undefined || next.startsWith("--") ? true : argv[++index]
        } else {
            positional.push(arg)
        }
    }
    return { positional, options }
}

async function main() {
    const [verb, ...rest] = process.argv.slice(2)
    const { positional, options } = parse(rest)
    switch (verb) {
        case "info":
            return info(required(positional[0], "info <file>"))
        case "palette":
            return palette(required(positional[0], "palette <file> [--count 8]"), options)
        case "trim":
            return trim(
                required(positional[0], "trim <in> <out>"),
                required(positional[1], "trim <in> <out>"),
            )
        case "transparent":
            return transparent(
                required(positional[0], "transparent <in> <out>"),
                required(positional[1], "transparent <in> <out>"),
            )
        case "mark":
            return mark(
                required(positional[0], "mark <in> <out>"),
                required(positional[1], "mark <in> <out>"),
                options,
            )
        case "slice":
            return slice(required(positional[0], "slice <in> --cols N --rows N --out-dir <dir>"), options)
        case "favicons":
            return favicons(required(positional[0], "favicons <in>"), options)
        case "responsive":
            return responsive(required(positional[0], "responsive <in> --out-dir <dir>"), options)
        case "generate":
            return generate(options)
        default:
            console.log(USAGE)
            process.exit(verb === undefined || verb === "--help" ? 0 : 1)
    }
}

function required(value, usage) {
    if (value === undefined) fail(`missing argument — usage: ${usage}`)
    return value
}

main().catch((error) => {
    fail(error instanceof Error ? error.message : String(error))
})

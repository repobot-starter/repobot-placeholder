// Store-free storefront preview: when no Shopify store is connected, the
// workspace preview renders the THEME ITSELF — layout, section groups, and
// templates — against bundled sample data (products, collections, cart),
// through a small dependency-free Liquid subset interpreter below. The
// preview is honest about what it is (a corner badge links the store
// connection), but it is the real theme: edit a section and reload to see
// it. `shopify theme dev` (a connected store) remains the live storefront
// path with full Liquid fidelity; this renderer intentionally implements
// only the subset the Repobot theme family uses.
import { readFileSync, existsSync, statSync } from "node:fs"
import { createServer } from "node:http"
import path from "node:path"

const port = Number(process.env.PORT ?? 9292)
const themeRoot = process.cwd()

// ---------------------------------------------------------------------------
// Sample storefront data. Prices are cents (Shopify's unit).
// ---------------------------------------------------------------------------

function mockImage(handle, alt) {
    return {
        src: `/mock/images/${handle}.svg`,
        alt,
        aspect_ratio: 1,
        width: 900,
        height: 900,
    }
}

function mockProduct(index, handle, title, price, compareAt, tags, extra = {}) {
    const image = mockImage(handle, title)
    const variant = { id: index * 100 + 1, title: "Default", price, available: true }
    return {
        id: index,
        handle,
        title,
        url: `/products/${handle}`,
        description: `<p>${title} — a sample product so the preview has something real to render. Connect a Shopify store to see your live catalog.</p>`,
        price,
        compare_at_price: compareAt,
        available: true,
        sold_out: false,
        tags,
        vendor: "Sample Goods Co.",
        type: "Sample",
        options: ["Title"],
        has_only_default_variant: true,
        variants: [variant],
        selected_or_first_available_variant: variant,
        featured_image: image,
        images: [image],
        ...extra,
    }
}

const products = [
    mockProduct(1, "morning-blend", "Morning Blend", 1600, null, ["featured", "new"]),
    mockProduct(2, "field-jacket", "Field Jacket", 12800, 16000, ["featured"]),
    mockProduct(3, "studio-mug", "Studio Mug", 2400, null, ["featured", "home"]),
    mockProduct(4, "linen-throw", "Linen Throw", 8900, null, ["home"]),
    mockProduct(5, "travel-kit", "Travel Kit", 4200, 5400, ["featured", "new"]),
    mockProduct(6, "daily-serum", "Daily Serum", 5800, null, ["new"]),
    mockProduct(7, "canvas-tote", "Canvas Tote", 3600, null, ["featured"]),
    mockProduct(8, "desk-lamp", "Desk Lamp", 9800, 11900, ["home"]),
]

function mockCollection(handle, title, members) {
    return {
        handle,
        title,
        url: `/collections/${handle}`,
        products: members,
        all_products_count: members.length,
    }
}

const allProducts = mockCollection("all", "All products", products)
const collectionList = [
    allProducts,
    mockCollection(
        "featured",
        "Featured",
        products.filter((p) => p.tags.includes("featured")),
    ),
    mockCollection(
        "new",
        "New arrivals",
        products.filter((p) => p.tags.includes("new")),
    ),
    mockCollection(
        "home",
        "Home",
        products.filter((p) => p.tags.includes("home")),
    ),
]
const collectionsByHandle = Object.fromEntries(collectionList.map((c) => [c.handle, c]))

const shop = { name: "Sample Store", description: "A sample storefront preview." }
const cart = { item_count: 0, items: [], total_price: 0 }
const routes = {
    root_url: "/",
    all_products_collection_url: "/collections/all",
    cart_url: "/cart",
    search_url: "/search",
}

// ---------------------------------------------------------------------------
// Theme file access (re-read per request: the preview follows edits).
// ---------------------------------------------------------------------------

function readThemeFile(relPath) {
    const filePath = path.join(themeRoot, relPath)
    if (!filePath.startsWith(themeRoot) || !existsSync(filePath)) {
        return null
    }
    return readFileSync(filePath, "utf8")
}

function readThemeJson(relPath) {
    const raw = readThemeFile(relPath)
    if (raw === null) {
        return null
    }
    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}

let localeCache = null
function locales() {
    if (!localeCache) {
        localeCache = readThemeJson("locales/en.default.json") ?? {}
    }
    return localeCache
}

// ---------------------------------------------------------------------------
// Liquid subset: tokenizer.
// ---------------------------------------------------------------------------

function tokenize(source) {
    const tokens = []
    const pattern = /(\{\{-?[\s\S]*?-?\}\}|\{%-?[\s\S]*?-?%\})/g
    let lastIndex = 0
    let match
    let trimNext = false
    while ((match = pattern.exec(source)) !== null) {
        let text = source.slice(lastIndex, match.index)
        if (trimNext) {
            text = text.replace(/^\s+/, "")
        }
        const tag = match[0]
        const isOutput = tag.startsWith("{{")
        const trimLeft = tag[2] === "-"
        const trimRight = tag[tag.length - 3] === "-"
        if (trimLeft) {
            text = text.replace(/\s+$/, "")
        }
        if (text.length > 0) {
            tokens.push({ kind: "text", value: text })
        }
        const inner = tag
            .slice(isOutput ? 2 : 2, isOutput ? -2 : -2)
            .replace(/^-/, "")
            .replace(/-$/, "")
            .trim()
        tokens.push({ kind: isOutput ? "output" : "tag", value: inner })
        trimNext = trimRight
        lastIndex = match.index + tag.length
    }
    let tail = source.slice(lastIndex)
    if (trimNext) {
        tail = tail.replace(/^\s+/, "")
    }
    if (tail.length > 0) {
        tokens.push({ kind: "text", value: tail })
    }
    return tokens
}

// ---------------------------------------------------------------------------
// Liquid subset: parser. Produces a node list; block tags nest.
// ---------------------------------------------------------------------------

const BLOCK_TAGS = new Set([
    "if",
    "unless",
    "for",
    "case",
    "form",
    "paginate",
    "capture",
    "comment",
    "schema",
    "raw",
    "style",
    "stylesheet",
    "javascript",
])

function parseTokens(tokens, position, closers) {
    const nodes = []
    let index = position
    while (index < tokens.length) {
        const token = tokens[index]
        if (token.kind === "text") {
            nodes.push({ type: "text", value: token.value })
            index += 1
            continue
        }
        if (token.kind === "output") {
            nodes.push({ type: "output", expression: token.value })
            index += 1
            continue
        }
        const [, name, rest] = token.value.match(/^(\S+)\s*([\s\S]*)$/) ?? [null, token.value, ""]
        if (closers.includes(name)) {
            return { nodes, closer: name, closerArgs: rest, next: index + 1 }
        }
        index += 1
        if (name === "comment" || name === "schema" || name === "raw") {
            // Content dropped (schema is design metadata, comments are
            // comments; raw would need pass-through but is unused here).
            const end = `end${name}`
            while (index < tokens.length) {
                const inner = tokens[index]
                index += 1
                if (inner.kind === "tag" && inner.value.trim() === end) {
                    break
                }
            }
            continue
        }
        if (name === "if" || name === "unless") {
            const branches = []
            let condition = rest
            let block = parseTokens(tokens, index, ["elsif", "else", `end${name}`])
            branches.push({ condition, body: block.nodes })
            while (block.closer === "elsif") {
                condition = block.closerArgs
                block = parseTokens(tokens, block.next, ["elsif", "else", `end${name}`])
                branches.push({ condition, body: block.nodes })
            }
            let elseBody = []
            if (block.closer === "else") {
                block = parseTokens(tokens, block.next, [`end${name}`])
                elseBody = block.nodes
            }
            nodes.push({ type: name, branches, elseBody })
            index = block.next
            continue
        }
        if (name === "case") {
            const subject = rest
            let block = parseTokens(tokens, index, ["when", "else", "endcase"])
            const whens = []
            let elseBody = []
            while (block.closer === "when") {
                const values = block.closerArgs
                block = parseTokens(tokens, block.next, ["when", "else", "endcase"])
                whens.push({ values, body: block.nodes })
            }
            if (block.closer === "else") {
                block = parseTokens(tokens, block.next, ["endcase"])
                elseBody = block.nodes
            }
            nodes.push({ type: "case", subject, whens, elseBody })
            index = block.next
            continue
        }
        if (name === "for") {
            let block = parseTokens(tokens, index, ["else", "endfor"])
            let elseBody = []
            const body = block.nodes
            if (block.closer === "else") {
                block = parseTokens(tokens, block.next, ["endfor"])
                elseBody = block.nodes
            }
            nodes.push({ type: "for", args: rest, body, elseBody })
            index = block.next
            continue
        }
        if (name === "form" || name === "paginate" || name === "capture") {
            const block = parseTokens(tokens, index, [`end${name}`])
            nodes.push({ type: name, args: rest, body: block.nodes })
            index = block.next
            continue
        }
        if (name === "style" || name === "stylesheet" || name === "javascript") {
            const block = parseTokens(tokens, index, [`end${name}`])
            nodes.push({
                type: "wrapped",
                tag: name === "javascript" ? "script" : "style",
                body: block.nodes,
            })
            index = block.next
            continue
        }
        if (BLOCK_TAGS.has(name)) {
            // A block tag with no special handling above: skip its body.
            const block = parseTokens(tokens, index, [`end${name}`])
            index = block.next
            continue
        }
        nodes.push({ type: "tag", name, args: rest })
    }
    return { nodes, closer: null, closerArgs: "", next: index }
}

function parseTemplate(source) {
    return parseTokens(tokenize(source), 0, []).nodes
}

// ---------------------------------------------------------------------------
// Liquid subset: expressions and filters.
// ---------------------------------------------------------------------------

const BLANK = Symbol("blank")
const EMPTY = Symbol("empty")

function isBlank(value) {
    if (value === null || value === undefined || value === false) {
        return true
    }
    if (typeof value === "string") {
        return value.trim().length === 0
    }
    if (Array.isArray(value)) {
        return value.length === 0
    }
    return false
}

function splitTop(input, separator) {
    // Split at top level: quotes protect separators.
    const parts = []
    let current = ""
    let quote = null
    for (const char of input) {
        if (quote) {
            current += char
            if (char === quote) {
                quote = null
            }
            continue
        }
        if (char === "'" || char === '"') {
            quote = char
            current += char
            continue
        }
        if (char === separator) {
            parts.push(current)
            current = ""
            continue
        }
        current += char
    }
    parts.push(current)
    return parts
}

function resolvePath(expression, scope) {
    // path segments: dots and [expr] lookups.
    let value
    let rest = expression
    const headMatch = rest.match(/^[A-Za-z_][\w-]*/)
    if (!headMatch) {
        return undefined
    }
    const head = headMatch[0]
    value = scope[head]
    rest = rest.slice(head.length)
    while (rest.length > 0 && value !== null && value !== undefined) {
        if (rest.startsWith(".")) {
            const segMatch = rest.slice(1).match(/^[A-Za-z_][\w-]*|^\d+/)
            if (!segMatch) {
                return undefined
            }
            value = lookup(value, segMatch[0], scope)
            rest = rest.slice(1 + segMatch[0].length)
            continue
        }
        if (rest.startsWith("[")) {
            const close = rest.indexOf("]")
            if (close === -1) {
                return undefined
            }
            const key = evaluateExpression(rest.slice(1, close), scope)
            value = lookup(value, key, scope)
            rest = rest.slice(close + 1)
            continue
        }
        break
    }
    return value
}

function lookup(container, key, scope) {
    if (container === null || container === undefined) {
        return undefined
    }
    if (container.__collectionsLookup) {
        // The collections drop: unknown or blank handles resolve to the
        // all-products collection so an unconfigured "collection" setting
        // still previews a full grid instead of an empty state.
        const handle = typeof key === "string" && key.length > 0 ? key : "all"
        return collectionsByHandle[handle] ?? allProducts
    }
    if (key === "first" && Array.isArray(container)) {
        return container[0]
    }
    if (key === "last" && Array.isArray(container)) {
        return container[container.length - 1]
    }
    if (key === "size") {
        if (Array.isArray(container) || typeof container === "string") {
            return container.length
        }
    }
    return container[key]
}

function parsePrimary(raw, scope) {
    const text = raw.trim()
    if (text.length === 0) {
        return undefined
    }
    if (text === "true") return true
    if (text === "false") return false
    if (text === "nil" || text === "null") return null
    if (text === "blank") return BLANK
    if (text === "empty") return EMPTY
    const stringMatch = text.match(/^'([\s\S]*)'$|^"([\s\S]*)"$/)
    if (stringMatch) {
        return stringMatch[1] ?? stringMatch[2]
    }
    if (/^-?\d+(\.\d+)?$/.test(text)) {
        return Number(text)
    }
    return resolvePath(text, scope)
}

function compareValues(left, operator, right) {
    if (right === BLANK || left === BLANK) {
        const value = left === BLANK ? right : left
        const blank = isBlank(value)
        return operator === "==" ? blank : operator === "!=" ? !blank : false
    }
    if (right === EMPTY || left === EMPTY) {
        const value = left === EMPTY ? right : left
        const empty = Array.isArray(value) ? value.length === 0 : isBlank(value)
        return operator === "==" ? empty : operator === "!=" ? !empty : false
    }
    switch (operator) {
        case "==":
            return left == right // eslint-disable-line eqeqeq
        case "!=":
            return left != right // eslint-disable-line eqeqeq
        case ">":
            return Number(left ?? 0) > Number(right ?? 0)
        case "<":
            return Number(left ?? 0) < Number(right ?? 0)
        case ">=":
            return Number(left ?? 0) >= Number(right ?? 0)
        case "<=":
            return Number(left ?? 0) <= Number(right ?? 0)
        case "contains":
            if (typeof left === "string") return left.includes(String(right))
            if (Array.isArray(left)) return left.includes(right)
            return false
        default:
            return false
    }
}

function evaluateCondition(raw, scope) {
    // or / and (Liquid: right-associative, no parens — good enough here).
    const orParts = splitTop(raw, "\u0000") // placeholder no-op; split below
    void orParts
    const orSegments = raw.split(/\s+or\s+/)
    if (orSegments.length > 1) {
        return orSegments.some((part) => evaluateCondition(part, scope))
    }
    const andSegments = raw.split(/\s+and\s+/)
    if (andSegments.length > 1) {
        return andSegments.every((part) => evaluateCondition(part, scope))
    }
    const comparison =
        raw.match(/^([\s\S]+?)\s*(==|!=|>=|<=|>|<|\scontains\s)\s*([\s\S]+)$/) ??
        raw.match(/^([\s\S]+?)\s+(contains)\s+([\s\S]+)$/)
    if (comparison) {
        const operator = comparison[2].trim()
        const left = parsePrimary(comparison[1], scope)
        const right = parsePrimary(comparison[3], scope)
        return compareValues(left, operator, right)
    }
    const value = parsePrimary(raw, scope)
    return !(value === false || value === null || value === undefined)
}

function parseFilterArgs(raw, scope) {
    // "width: 480" / "', '" / "tags: current_tags" — named args become an
    // object, positionals an array; both offered to the filter.
    const positional = []
    const named = {}
    if (raw.trim().length === 0) {
        return { positional, named }
    }
    for (const piece of splitTop(raw, ",")) {
        const namedMatch = piece.match(/^\s*([A-Za-z_][\w]*)\s*:\s*([\s\S]+)$/)
        if (namedMatch && !/^['"]/.test(piece.trim())) {
            named[namedMatch[1]] = parsePrimary(namedMatch[2], scope)
        } else {
            positional.push(parsePrimary(piece, scope))
        }
    }
    return { positional, named }
}

function translate(key, named) {
    const segments = String(key).split(".")
    let node = locales()
    for (const segment of segments) {
        if (node && typeof node === "object") {
            node = node[segment]
        } else {
            node = undefined
            break
        }
    }
    let text =
        typeof node === "string"
            ? node
            : segments[segments.length - 1].replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
    text = text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => String(named[name] ?? ""))
    return text
}

function formatMoney(value) {
    const cents = Number(value ?? 0)
    return `$${(cents / 100).toFixed(2)}`
}

function placeholderSvg(name) {
    const label = String(name ?? "placeholder")
        .replace(/[^\w -]/g, "")
        .slice(0, 24)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="${label}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dbe3f4"/><stop offset="1" stop-color="#b9c6e6"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><path d="M0 300 L120 180 L220 270 L300 200 L400 290 L400 400 L0 400 Z" fill="#93a5cf" opacity="0.55"/><circle cx="300" cy="110" r="42" fill="#f4f7ff" opacity="0.8"/></svg>`
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

const filters = {
    t: (value, args) => translate(value, args.named),
    escape: (value) => escapeHtml(value),
    escape_once: (value) => escapeHtml(value),
    money: (value) => formatMoney(value),
    money_with_currency: (value) => `${formatMoney(value)} USD`,
    money_without_trailing_zeros: (value) => `$${Math.round(Number(value ?? 0) / 100)}`,
    image_url: (value) => {
        if (value && typeof value === "object" && value.src) {
            return value.src
        }
        if (typeof value === "string" && value.length > 0) {
            return value.startsWith("/") ? value : `/mock/images/${encodeURIComponent(value)}.svg`
        }
        return "/mock/images/placeholder.svg"
    },
    img_url: (value) => filters.image_url(value, { positional: [], named: {} }),
    asset_url: (value) => `/assets/${String(value ?? "")}`,
    stylesheet_tag: (value) => `<link rel="stylesheet" href="${escapeHtml(value)}">`,
    script_tag: (value) => `<script src="${escapeHtml(value)}" defer></script>`,
    placeholder_svg_tag: (value) => placeholderSvg(value),
    default: (value, args) => (isBlank(value) ? args.positional[0] : value),
    join: (value, args) =>
        Array.isArray(value) ? value.join(String(args.positional[0] ?? " ")) : String(value ?? ""),
    split: (value, args) => String(value ?? "").split(String(args.positional[0] ?? " ")),
    first: (value) => (Array.isArray(value) ? value[0] : value),
    last: (value) => (Array.isArray(value) ? value[value.length - 1] : value),
    size: (value) => (Array.isArray(value) || typeof value === "string" ? value.length : 0),
    upcase: (value) => String(value ?? "").toUpperCase(),
    downcase: (value) => String(value ?? "").toLowerCase(),
    capitalize: (value) => String(value ?? "").replace(/^\w/, (c) => c.toUpperCase()),
    strip: (value) => String(value ?? "").trim(),
    strip_html: (value) => String(value ?? "").replace(/<[^>]*>/g, ""),
    newline_to_br: (value) => String(value ?? "").replace(/\n/g, "<br>"),
    append: (value, args) => `${value ?? ""}${args.positional[0] ?? ""}`,
    prepend: (value, args) => `${args.positional[0] ?? ""}${value ?? ""}`,
    replace: (value, args) =>
        String(value ?? "")
            .split(String(args.positional[0] ?? ""))
            .join(String(args.positional[1] ?? "")),
    remove: (value, args) =>
        String(value ?? "")
            .split(String(args.positional[0] ?? ""))
            .join(""),
    truncate: (value, args) => {
        const limit = Number(args.positional[0] ?? 50)
        const text = String(value ?? "")
        return text.length > limit ? `${text.slice(0, Math.max(0, limit - 3))}...` : text
    },
    truncatewords: (value, args) => {
        const limit = Number(args.positional[0] ?? 15)
        const words = String(value ?? "").split(/\s+/)
        return words.length > limit ? `${words.slice(0, limit).join(" ")}...` : String(value ?? "")
    },
    plus: (value, args) => Number(value ?? 0) + Number(args.positional[0] ?? 0),
    minus: (value, args) => Number(value ?? 0) - Number(args.positional[0] ?? 0),
    times: (value, args) => Number(value ?? 0) * Number(args.positional[0] ?? 0),
    divided_by: (value, args) => {
        const divisor = Number(args.positional[0] ?? 1)
        return divisor === 0 ? 0 : Number(value ?? 0) / divisor
    },
    modulo: (value, args) => Number(value ?? 0) % Number(args.positional[0] ?? 1),
    ceil: (value) => Math.ceil(Number(value ?? 0)),
    floor: (value) => Math.floor(Number(value ?? 0)),
    round: (value) => Math.round(Number(value ?? 0)),
    abs: (value) => Math.abs(Number(value ?? 0)),
    at_least: (value, args) => Math.max(Number(value ?? 0), Number(args.positional[0] ?? 0)),
    at_most: (value, args) => Math.min(Number(value ?? 0), Number(args.positional[0] ?? 0)),
    date: (value, args) => {
        const date = value === "now" || value === "today" ? new Date() : new Date(value)
        if (Number.isNaN(date.getTime())) {
            return String(value ?? "")
        }
        const pattern = String(args.positional[0] ?? "%Y-%m-%d")
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ]
        return pattern
            .replace(/%Y/g, String(date.getFullYear()))
            .replace(/%m/g, String(date.getMonth() + 1).padStart(2, "0"))
            .replace(/%d/g, String(date.getDate()).padStart(2, "0"))
            .replace(/%B/g, months[date.getMonth()])
            .replace(/%y/g, String(date.getFullYear()).slice(-2))
    },
    default_pagination: () => "",
    where: (value, args) => {
        if (!Array.isArray(value)) {
            return []
        }
        const key = String(args.positional[0] ?? "")
        const expected = args.positional.length > 1 ? args.positional[1] : undefined
        return value.filter((item) =>
            expected === undefined ? !isBlank(item?.[key]) : item?.[key] === expected,
        )
    },
    map: (value, args) =>
        Array.isArray(value) ? value.map((item) => item?.[String(args.positional[0] ?? "")]) : [],
    sort: (value) => (Array.isArray(value) ? [...value].sort() : value),
    reverse: (value) => (Array.isArray(value) ? [...value].reverse() : value),
    uniq: (value) => (Array.isArray(value) ? [...new Set(value)] : value),
    handleize: (value) =>
        String(value ?? "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
    url_encode: (value) => encodeURIComponent(String(value ?? "")),
    json: (value) => JSON.stringify(value ?? null),
    within: (value) => String(value ?? ""),
}

function evaluateExpression(raw, scope) {
    const segments = splitTop(raw, "|")
    let value = parsePrimary(segments[0], scope)
    for (const segment of segments.slice(1)) {
        const filterMatch = segment.match(/^\s*([\w]+)\s*(?::\s*([\s\S]*))?$/)
        if (!filterMatch) {
            continue
        }
        const filter = filters[filterMatch[1]]
        const args = parseFilterArgs(filterMatch[2] ?? "", scope)
        value = filter ? filter(value, args) : value
    }
    return value === BLANK || value === EMPTY ? "" : value
}

// ---------------------------------------------------------------------------
// Liquid subset: renderer.
// ---------------------------------------------------------------------------

function renderNodes(nodes, scope, output) {
    for (const node of nodes) {
        switch (node.type) {
            case "text":
                output.push(node.value)
                break
            case "output": {
                const value = evaluateExpression(node.expression, scope)
                output.push(value === null || value === undefined ? "" : String(value))
                break
            }
            case "if":
            case "unless": {
                let rendered = false
                for (const branch of node.branches) {
                    let truthy = evaluateCondition(branch.condition, scope)
                    if (node.type === "unless") {
                        truthy = !truthy
                    }
                    if (truthy) {
                        renderNodes(branch.body, scope, output)
                        rendered = true
                        break
                    }
                }
                if (!rendered) {
                    renderNodes(node.elseBody, scope, output)
                }
                break
            }
            case "case": {
                const subject = parsePrimary(node.subject, scope)
                let matched = false
                for (const when of node.whens) {
                    const candidates = splitTop(when.values, ",").map((piece) => parsePrimary(piece, scope))
                    if (candidates.some((candidate) => candidate == subject)) {
                        // eslint-disable-line eqeqeq
                        renderNodes(when.body, scope, output)
                        matched = true
                        break
                    }
                }
                if (!matched) {
                    renderNodes(node.elseBody, scope, output)
                }
                break
            }
            case "for": {
                const forMatch = node.args.match(/^(\w+)\s+in\s+([\s\S]+)$/)
                if (!forMatch) {
                    break
                }
                let listExpression = forMatch[2]
                let limit
                let offset = 0
                const limitMatch = listExpression.match(/\blimit\s*:\s*([\w.[\]'"-]+)/)
                if (limitMatch) {
                    limit = Number(parsePrimary(limitMatch[1], scope) ?? 0) || undefined
                    listExpression = listExpression.replace(limitMatch[0], "")
                }
                const offsetMatch = listExpression.match(/\boffset\s*:\s*([\w.[\]'"-]+)/)
                if (offsetMatch) {
                    offset = Number(parsePrimary(offsetMatch[1], scope) ?? 0)
                    listExpression = listExpression.replace(offsetMatch[0], "")
                }
                const list = parsePrimary(listExpression.replace(/\breversed\b/, "").trim(), scope)
                let items = Array.isArray(list) ? [...list] : []
                if (/\breversed\b/.test(listExpression)) {
                    items.reverse()
                }
                items = items.slice(offset, limit === undefined ? undefined : offset + limit)
                if (items.length === 0) {
                    renderNodes(node.elseBody, scope, output)
                    break
                }
                for (let index = 0; index < items.length; index += 1) {
                    const child = Object.create(scope)
                    child[forMatch[1]] = items[index]
                    child.forloop = {
                        index: index + 1,
                        index0: index,
                        first: index === 0,
                        last: index === items.length - 1,
                        length: items.length,
                    }
                    renderNodes(node.body, child, output)
                }
                break
            }
            case "form": {
                output.push('<form action="#" method="post" onsubmit="return false">')
                renderNodes(node.body, scope, output)
                output.push("</form>")
                break
            }
            case "paginate": {
                const paginateMatch = node.args.match(/^([\s\S]+?)\s+by\s+(\S+)/)
                const child = Object.create(scope)
                if (paginateMatch) {
                    const items = parsePrimary(paginateMatch[1], scope)
                    const pageSize = Number(parsePrimary(paginateMatch[2], scope) ?? 12) || 12
                    const total = Array.isArray(items) ? items.length : 0
                    child.paginate = {
                        current_page: 1,
                        items: total,
                        pages: Math.max(1, Math.ceil(total / pageSize)),
                        page_size: pageSize,
                        parts: [],
                        previous: null,
                        next: null,
                    }
                }
                renderNodes(node.body, child, output)
                break
            }
            case "capture": {
                const captured = []
                renderNodes(node.body, scope, captured)
                scope[node.args.trim()] = captured.join("")
                break
            }
            case "wrapped": {
                output.push(`<${node.tag}>`)
                renderNodes(node.body, scope, output)
                output.push(`</${node.tag}>`)
                break
            }
            case "tag":
                renderSimpleTag(node, scope, output)
                break
            default:
                break
        }
    }
}

function renderSimpleTag(node, scope, output) {
    switch (node.name) {
        case "assign": {
            const assignMatch = node.args.match(/^([\w-]+)\s*=\s*([\s\S]+)$/)
            if (assignMatch) {
                scope[assignMatch[1]] = evaluateExpression(assignMatch[2], scope)
            }
            break
        }
        case "render":
        case "include": {
            const pieces = splitTop(node.args, ",")
            const nameValue = parsePrimary(pieces[0], scope)
            if (typeof nameValue !== "string") {
                break
            }
            const source = readThemeFile(path.join("snippets", `${nameValue}.liquid`))
            if (source === null) {
                break
            }
            // render gets an isolated scope (globals + args); include shares.
            const child =
                node.name === "render" ? Object.create(scope.__globals ?? scope) : Object.create(scope)
            child.__globals = scope.__globals ?? scope
            for (const piece of pieces.slice(1)) {
                const argMatch = piece.match(/^\s*([\w-]+)\s*:\s*([\s\S]+)$/)
                if (argMatch) {
                    child[argMatch[1]] = evaluateExpression(argMatch[2], scope)
                }
            }
            renderNodes(parseTemplate(source), child, output)
            break
        }
        case "sections": {
            const groupName = parsePrimary(node.args, scope)
            if (typeof groupName === "string") {
                output.push(renderSectionGroup(groupName, scope.__globals ?? scope))
            }
            break
        }
        case "section": {
            const sectionName = parsePrimary(node.args, scope)
            if (typeof sectionName === "string") {
                output.push(
                    renderSection(sectionName, { settings: {} }, sectionName, scope.__globals ?? scope),
                )
            }
            break
        }
        case "break":
        case "continue":
        case "cycle":
        case "increment":
        case "decrement":
        case "echo":
        default:
            break
    }
}

// ---------------------------------------------------------------------------
// Sections, groups, templates.
// ---------------------------------------------------------------------------

function parseSectionFile(type) {
    const source = readThemeFile(path.join("sections", `${type}.liquid`))
    if (source === null) {
        return null
    }
    let schema = {}
    const schemaMatch = source.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/)
    if (schemaMatch) {
        try {
            schema = JSON.parse(schemaMatch[1])
        } catch {
            schema = {}
        }
    }
    return { source, schema }
}

function schemaSettingDefaults(settingsSchema) {
    const defaults = {}
    for (const setting of settingsSchema ?? []) {
        if (
            setting &&
            typeof setting === "object" &&
            setting.id !== undefined &&
            setting.default !== undefined
        ) {
            defaults[setting.id] = setting.default
        }
    }
    return defaults
}

function resolveBlocks(entry, schema) {
    // Template-declared blocks win; otherwise the schema's first preset.
    if (entry.blocks && typeof entry.blocks === "object") {
        const order = Array.isArray(entry.block_order) ? entry.block_order : Object.keys(entry.blocks)
        return order.map((blockId, index) => {
            const block = entry.blocks[blockId] ?? {}
            const blockSchema = (schema.blocks ?? []).find((candidate) => candidate.type === block.type)
            return {
                id: blockId || `block-${index}`,
                type: block.type,
                settings: { ...schemaSettingDefaults(blockSchema?.settings), ...(block.settings ?? {}) },
                shopify_attributes: "",
            }
        })
    }
    const preset = (schema.presets ?? [])[0]
    return (preset?.blocks ?? []).map((block, index) => {
        const blockSchema = (schema.blocks ?? []).find((candidate) => candidate.type === block.type)
        return {
            id: `preset-block-${index}`,
            type: block.type,
            settings: { ...schemaSettingDefaults(blockSchema?.settings), ...(block.settings ?? {}) },
            shopify_attributes: "",
        }
    })
}

function renderSection(type, entry, sectionId, globals) {
    const parsed = parseSectionFile(type)
    if (!parsed) {
        return ""
    }
    const presetSettings = (parsed.schema.presets ?? [])[0]?.settings ?? {}
    const scope = Object.create(globals)
    scope.__globals = globals
    scope.section = {
        id: sectionId,
        settings: {
            ...schemaSettingDefaults(parsed.schema.settings),
            ...presetSettings,
            ...(entry.settings ?? {}),
        },
        blocks: resolveBlocks(entry, parsed.schema),
    }
    const output = []
    try {
        renderNodes(parseTemplate(parsed.source), scope, output)
    } catch (error) {
        output.push(
            `<!-- section ${type} failed: ${escapeHtml(error instanceof Error ? error.message : String(error))} -->`,
        )
    }
    return `<div id="shopify-section-${escapeHtml(sectionId)}" class="shopify-section">${output.join("")}</div>`
}

function renderSectionMap(document, globals) {
    if (!document || typeof document !== "object") {
        return ""
    }
    const order = Array.isArray(document.order) ? document.order : Object.keys(document.sections ?? {})
    const html = []
    for (const sectionId of order) {
        const entry = (document.sections ?? {})[sectionId]
        if (entry && typeof entry === "object" && typeof entry.type === "string") {
            html.push(renderSection(entry.type, entry, sectionId, globals))
        }
    }
    return html.join("\n")
}

function renderSectionGroup(groupName, globals) {
    // Group file first (sections/<name>.json); a bare section as fallback.
    const group = readThemeJson(path.join("sections", `${groupName}.json`))
    if (group) {
        return renderSectionMap(group, globals)
    }
    return renderSection(groupName, { settings: {} }, groupName, globals)
}

function globalSettings() {
    const data = readThemeJson("config/settings_data.json")
    const schema = readThemeJson("config/settings_schema.json") ?? []
    const defaults = {}
    for (const group of Array.isArray(schema) ? schema : []) {
        Object.assign(defaults, schemaSettingDefaults(group?.settings))
    }
    return { ...defaults, ...(data?.current && typeof data.current === "object" ? data.current : {}) }
}

// ---------------------------------------------------------------------------
// Routing + page assembly.
// ---------------------------------------------------------------------------

const PREVIEW_BADGE = `
<div style="position:fixed;left:14px;bottom:14px;z-index:2147483000;display:flex;gap:8px;align-items:center;padding:8px 14px;border-radius:999px;background:rgba(17,24,39,0.86);color:#f9fafb;font:500 12px/1.4 system-ui,-apple-system,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,0.35);backdrop-filter:blur(6px)">
  <span style="width:8px;height:8px;border-radius:50%;background:#6d95f8"></span>
  Sample-data preview — connect a Shopify store for the live storefront
</div>`

function buildGlobals(route) {
    const globals = {
        shop,
        cart,
        routes,
        settings: globalSettings(),
        collections: { __collectionsLookup: true },
        all_products: products,
        request: { locale: { iso_code: "en" }, path: route.path },
        page_title: route.title,
        page_description: `${route.title} — ${shop.name}`,
        canonical_url: route.path,
        content_for_header: '<meta name="repobot-mock-preview" content="true">',
        current_tags: null,
        current_page: 1,
        template: { name: route.template, suffix: null },
        ...route.objects,
    }
    globals.__globals = globals
    return globals
}

function renderRoute(route) {
    const globals = buildGlobals(route)
    const templateDocument = readThemeJson(path.join("templates", `${route.template}.json`))
    let content
    if (templateDocument) {
        content = renderSectionMap(templateDocument, globals)
    } else {
        // .liquid template fallback (rare in OS 2.0; render directly).
        const source = readThemeFile(path.join("templates", `${route.template}.liquid`))
        if (source === null) {
            return null
        }
        const buffer = []
        renderNodes(parseTemplate(source), globals, buffer)
        content = buffer.join("")
    }
    const layoutSource = readThemeFile("layout/theme.liquid") ?? "{{ content_for_layout }}"
    const layoutScope = Object.create(globals)
    layoutScope.content_for_layout = content
    const output = []
    renderNodes(parseTemplate(layoutSource), layoutScope, output)
    let html = output.join("")
    html = html.includes("</body>")
        ? html.replace("</body>", `${PREVIEW_BADGE}</body>`)
        : html + PREVIEW_BADGE
    return html
}

function resolveRoute(pathname) {
    if (pathname === "/" || pathname === "") {
        return { template: "index", title: shop.name, path: "/", objects: {} }
    }
    const productMatch = pathname.match(/^\/products\/([\w-]+)$/)
    if (productMatch) {
        const product = products.find((candidate) => candidate.handle === productMatch[1]) ?? products[0]
        return { template: "product", title: product.title, path: pathname, objects: { product } }
    }
    const collectionMatch = pathname.match(/^\/collections\/([\w-]+)$/)
    if (collectionMatch) {
        const collection = collectionsByHandle[collectionMatch[1]] ?? allProducts
        return { template: "collection", title: collection.title, path: pathname, objects: { collection } }
    }
    if (pathname === "/collections") {
        return {
            template: "collection",
            title: allProducts.title,
            path: pathname,
            objects: { collection: allProducts },
        }
    }
    if (pathname === "/cart") {
        return { template: "cart", title: "Cart", path: pathname, objects: {} }
    }
    const pageMatch = pathname.match(/^\/pages\/([\w-]+)$/)
    if (pageMatch) {
        const title = pageMatch[1].replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())
        return {
            template: "page",
            title,
            path: pathname,
            objects: { page: { title, content: `<p>Sample page content for ${title}.</p>` } },
        }
    }
    return { template: "404", title: "Not found", path: pathname, objects: {} }
}

const ASSET_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".json": "application/json; charset=utf-8",
}

function productImageSvg(handle) {
    const product = products.find((candidate) => candidate.handle === handle)
    const label = product ? product.title : "Sample"
    const hues = [216, 262, 174, 20, 330, 196, 44, 288]
    const index = Math.max(
        0,
        products.findIndex((candidate) => candidate.handle === handle),
    )
    const hue = hues[index % hues.length]
    const initial =
        label
            .replace(/[^A-Za-z0-9 ]/g, "")
            .trim()
            .charAt(0)
            .toUpperCase() || "S"
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" role="img" aria-label="${escapeHtml(label)}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue}, 42%, 88%)"/><stop offset="1" stop-color="hsl(${hue}, 38%, 72%)"/>
</linearGradient></defs>
<rect width="900" height="900" fill="url(#bg)"/>
<circle cx="450" cy="400" r="190" fill="hsl(${hue}, 45%, 62%)" opacity="0.45"/>
<text x="450" y="452" font-family="system-ui, sans-serif" font-size="220" font-weight="700" fill="hsl(${hue}, 50%, 30%)" text-anchor="middle" dominant-baseline="middle" opacity="0.85">${escapeHtml(initial)}</text>
<text x="450" y="720" font-family="system-ui, sans-serif" font-size="44" font-weight="500" fill="hsl(${hue}, 38%, 28%)" text-anchor="middle" opacity="0.75">${escapeHtml(label)}</text>
</svg>`
}

createServer((request, response) => {
    try {
        const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`)
        const pathname = decodeURIComponent(url.pathname)

        if (pathname.startsWith("/assets/")) {
            const assetPath = path.join(themeRoot, "assets", path.basename(pathname))
            if (existsSync(assetPath) && statSync(assetPath).isFile()) {
                const extension = path.extname(assetPath).toLowerCase()
                response.writeHead(200, {
                    "Content-Type": ASSET_TYPES[extension] ?? "application/octet-stream",
                    "Cache-Control": "no-store",
                })
                response.end(readFileSync(assetPath))
                return
            }
            response.writeHead(404, { "Content-Type": "text/plain" })
            response.end("asset not found")
            return
        }

        if (pathname.startsWith("/mock/images/")) {
            const handle = path.basename(pathname, ".svg")
            response.writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" })
            response.end(productImageSvg(handle))
            return
        }

        localeCache = null // Locales follow edits like everything else.
        const route = resolveRoute(pathname)
        const html = renderRoute(route)
        if (html === null) {
            response.writeHead(404, { "Content-Type": "text/plain" })
            response.end("template not found")
            return
        }
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" })
        response.end(html)
    } catch (error) {
        response.writeHead(500, { "Content-Type": "text/html; charset=utf-8" })
        response.end(
            `<pre>preview renderer error:\n${escapeHtml(error instanceof Error ? (error.stack ?? error.message) : String(error))}</pre>`,
        )
    }
}).listen(port, "127.0.0.1", () => {
    console.log(`mock storefront preview listening on http://127.0.0.1:${port}`)
})

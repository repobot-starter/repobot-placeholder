/**
 * The SchemaForm derivation layer: declarative `ui:derived` rules (and the
 * `ui:summary` computed table) that the backend ships inside the uiSchema and
 * the runtime evaluates client-side on every change. Pure functions, no eval —
 * expressions parse into a tiny AST with a fixed function set.
 *
 * Rule vocabulary (each rule targets a dotted path; "[]" scopes per array item):
 *
 *   { "target": "containers[].reference", "template": "${contractNumber}.C${index + 1}" }
 *   { "target": "totalQty",               "expr": "sum(containers[].qty)" }
 *   { "target": "containers",             "arraySize": "containerCount" }
 *   { "target": "oceanFreight",           "visibleWhen": "freightBillable" }
 *   { "target": "notifyParty2",           "enabledWhen": "notifyParty != ''" }
 *
 * Expressions support: numbers, 'single'/"double" strings, true/false/null,
 * field paths (relative to the nearest enclosing array item, then outward to
 * the root), `index` (0-based position inside "[]" targets), + - * / %,
 * comparisons, && || !, parentheses, and the functions sum(), count(),
 * round(), min(), max(), currency(), percent().
 */

type FormDataObject = Record<string, unknown>

export interface SchemaFormDerivedRule {
    /** Dotted field path; "[]" after an array field applies the rule per item. */
    target: string
    /** String interpolation: literal text with ${expression} placeholders. */
    template?: string
    /** Expression whose value is written to the target field. */
    expr?: string
    /** Expression (usually a field path) controlling the target array's length. */
    arraySize?: string
    /** Expression: when falsy the target field hides (data is kept). */
    visibleWhen?: string
    /** Expression: when falsy the target field disables. */
    enabledWhen?: string
    /** template/expr targets render read-only unless explicitly set to false. */
    readOnly?: boolean
}

const MAX_ARRAY_SIZE = 100

/** Reads and sanity-checks `ui:derived`; malformed entries are dropped. */
export function parseDerivedRules(uiSchema: Record<string, unknown>): SchemaFormDerivedRule[] {
    const raw = uiSchema["ui:derived"]
    if (!Array.isArray(raw)) {
        return []
    }
    const rules: SchemaFormDerivedRule[] = []
    for (const entry of raw) {
        if (typeof entry !== "object" || entry === null) continue
        const candidate = entry as Record<string, unknown>
        if (typeof candidate.target !== "string" || candidate.target.length === 0) continue
        const hasRule = ["template", "expr", "arraySize", "visibleWhen", "enabledWhen"].some(
            (key) => typeof candidate[key] === "string",
        )
        if (!hasRule) continue
        rules.push(candidate as unknown as SchemaFormDerivedRule)
    }
    return rules
}

// --------------------------------------------------------------- expressions

type AstNode =
    | { kind: "literal"; value: unknown }
    | { kind: "path"; path: string }
    | { kind: "unary"; op: string; operand: AstNode }
    | { kind: "binary"; op: string; left: AstNode; right: AstNode }
    | { kind: "call"; name: string; args: AstNode[] }

interface Token {
    kind: "number" | "string" | "path" | "op"
    value: string
}

function tokenize(source: string): Token[] {
    const tokens: Token[] = []
    let i = 0
    while (i < source.length) {
        const char = source[i]!
        if (/\s/.test(char)) {
            i += 1
            continue
        }
        if (/[0-9]/.test(char)) {
            let end = i
            while (end < source.length && /[0-9]/.test(source[end]!)) end += 1
            if (source[end] === "." && /[0-9]/.test(source[end + 1] ?? "")) {
                end += 1
                while (end < source.length && /[0-9]/.test(source[end]!)) end += 1
            }
            tokens.push({ kind: "number", value: source.slice(i, end) })
            i = end
            continue
        }
        if (char === "'" || char === '"') {
            const close = source.indexOf(char, i + 1)
            if (close === -1) throw new Error(`Unterminated string in expression: ${source}`)
            tokens.push({ kind: "string", value: source.slice(i + 1, close) })
            i = close + 1
            continue
        }
        if (/[A-Za-z_]/.test(char)) {
            let end = i
            while (end < source.length && /[A-Za-z0-9_]/.test(source[end]!)) end += 1
            // Continue the path across "[]" and "." segments.
            for (;;) {
                if (source[end] === "[" && source[end + 1] === "]") {
                    end += 2
                    continue
                }
                if (source[end] === "." && /[A-Za-z_]/.test(source[end + 1] ?? "")) {
                    end += 1
                    while (end < source.length && /[A-Za-z0-9_]/.test(source[end]!)) end += 1
                    continue
                }
                break
            }
            tokens.push({ kind: "path", value: source.slice(i, end) })
            i = end
            continue
        }
        const two = source.slice(i, i + 2)
        if (["==", "!=", "<=", ">=", "&&", "||"].includes(two)) {
            tokens.push({ kind: "op", value: two })
            i += 2
            continue
        }
        if ("+-*/%<>()!,".includes(char)) {
            tokens.push({ kind: "op", value: char })
            i += 1
            continue
        }
        throw new Error(`Unexpected character "${char}" in expression: ${source}`)
    }
    return tokens
}

const EXPRESSION_FUNCTIONS = new Set(["sum", "count", "round", "min", "max", "currency", "percent"])

function parseExpression(source: string): AstNode {
    const tokens = tokenize(source)
    let position = 0

    const peek = (): Token | undefined => tokens[position]
    const consume = (): Token => {
        const token = tokens[position]
        if (token === undefined) throw new Error(`Unexpected end of expression: ${source}`)
        position += 1
        return token
    }
    const expectOp = (value: string): void => {
        const token = consume()
        if (token.kind !== "op" || token.value !== value) {
            throw new Error(`Expected "${value}" in expression: ${source}`)
        }
    }
    const matchOp = (...values: string[]): string | null => {
        const token = peek()
        if (token !== undefined && token.kind === "op" && values.includes(token.value)) {
            position += 1
            return token.value
        }
        return null
    }

    function primary(): AstNode {
        const token = consume()
        if (token.kind === "number") return { kind: "literal", value: Number(token.value) }
        if (token.kind === "string") return { kind: "literal", value: token.value }
        if (token.kind === "path") {
            if (token.value === "true") return { kind: "literal", value: true }
            if (token.value === "false") return { kind: "literal", value: false }
            if (token.value === "null") return { kind: "literal", value: null }
            const next = peek()
            if (next !== undefined && next.kind === "op" && next.value === "(") {
                if (!EXPRESSION_FUNCTIONS.has(token.value)) {
                    throw new Error(`Unknown function "${token.value}" in expression: ${source}`)
                }
                expectOp("(")
                const args: AstNode[] = []
                if (matchOp(")") === null) {
                    for (;;) {
                        args.push(or())
                        if (matchOp(",") !== null) continue
                        expectOp(")")
                        break
                    }
                }
                return { kind: "call", name: token.value, args }
            }
            return { kind: "path", path: token.value }
        }
        if (token.value === "(") {
            const inner = or()
            expectOp(")")
            return inner
        }
        throw new Error(`Unexpected token "${token.value}" in expression: ${source}`)
    }

    function unary(): AstNode {
        const op = matchOp("!", "-")
        if (op !== null) {
            return { kind: "unary", op, operand: unary() }
        }
        return primary()
    }

    const binaryLevel =
        (next: () => AstNode, ...ops: string[]) =>
        (): AstNode => {
            let left = next()
            for (;;) {
                const op = matchOp(...ops)
                if (op === null) return left
                left = { kind: "binary", op, left, right: next() }
            }
        }

    const multiplicative = binaryLevel(unary, "*", "/", "%")
    const additive = binaryLevel(multiplicative, "+", "-")
    const comparison = binaryLevel(additive, "<", "<=", ">", ">=")
    const equality = binaryLevel(comparison, "==", "!=")
    const and = binaryLevel(equality, "&&")
    const or = binaryLevel(and, "||")

    const root = or()
    if (position !== tokens.length) {
        throw new Error(`Trailing tokens in expression: ${source}`)
    }
    return root
}

const expressionCache = new Map<string, AstNode>()

function parsedExpression(source: string): AstNode {
    let ast = expressionCache.get(source)
    if (ast === undefined) {
        ast = parseExpression(source)
        expressionCache.set(source, ast)
    }
    return ast
}

// ------------------------------------------------------------------- scopes

/** One level of path resolution; innermost scope last. Array-item frames carry their index. */
export interface ScopeFrame {
    data: unknown
    index?: number
}

function toNumber(value: unknown): number {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0
    if (typeof value === "boolean") return value ? 1 : 0
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
}

interface PathSegment {
    key: string
    each: boolean
}

function parsePath(path: string): PathSegment[] {
    return path.split(".").map((part) => {
        const each = part.endsWith("[]")
        return { key: each ? part.slice(0, -2) : part, each }
    })
}

/** Walks segments from a start value; "[]" segments flatten across array items. */
function traverse(start: unknown, segments: PathSegment[]): unknown {
    let values: unknown[] = [start]
    let flattened = false
    for (const segment of segments) {
        values = values.map((value) =>
            typeof value === "object" && value !== null ? (value as FormDataObject)[segment.key] : undefined,
        )
        if (segment.each) {
            flattened = true
            values = values.flatMap((value) => (Array.isArray(value) ? value : []))
        }
    }
    if (flattened) {
        return values.filter((value) => value !== undefined && value !== null)
    }
    return values[0]
}

function resolvePath(path: string, scopes: ScopeFrame[]): unknown {
    if (path === "index") {
        for (let i = scopes.length - 1; i >= 0; i -= 1) {
            const frame = scopes[i]!
            if (frame.index !== undefined) return frame.index
        }
        return undefined
    }
    const segments = parsePath(path)
    const firstKey = segments[0]!.key
    for (let i = scopes.length - 1; i >= 0; i -= 1) {
        const data = scopes[i]!.data
        if (typeof data === "object" && data !== null && firstKey in (data as FormDataObject)) {
            return traverse(data, segments)
        }
    }
    return undefined
}

// --------------------------------------------------------------- evaluation

function looseTruthy(value: unknown): boolean {
    if (Array.isArray(value)) return value.length > 0
    return Boolean(value)
}

function evaluateAst(node: AstNode, scopes: ScopeFrame[]): unknown {
    switch (node.kind) {
        case "literal":
            return node.value
        case "path":
            return resolvePath(node.path, scopes)
        case "unary": {
            const operand = evaluateAst(node.operand, scopes)
            return node.op === "!" ? !looseTruthy(operand) : -toNumber(operand)
        }
        case "binary": {
            if (node.op === "&&") {
                return (
                    looseTruthy(evaluateAst(node.left, scopes)) &&
                    looseTruthy(evaluateAst(node.right, scopes))
                )
            }
            if (node.op === "||") {
                return (
                    looseTruthy(evaluateAst(node.left, scopes)) ||
                    looseTruthy(evaluateAst(node.right, scopes))
                )
            }
            const left = evaluateAst(node.left, scopes)
            const right = evaluateAst(node.right, scopes)
            switch (node.op) {
                case "==":
                    return left === right
                case "!=":
                    return left !== right
                case "<":
                    return toNumber(left) < toNumber(right)
                case "<=":
                    return toNumber(left) <= toNumber(right)
                case ">":
                    return toNumber(left) > toNumber(right)
                case ">=":
                    return toNumber(left) >= toNumber(right)
                case "+":
                    return toNumber(left) + toNumber(right)
                case "-":
                    return toNumber(left) - toNumber(right)
                case "*":
                    return toNumber(left) * toNumber(right)
                case "/": {
                    const divisor = toNumber(right)
                    return divisor === 0 ? 0 : toNumber(left) / divisor
                }
                case "%": {
                    const divisor = toNumber(right)
                    return divisor === 0 ? 0 : toNumber(left) % divisor
                }
                default:
                    throw new Error(`Unknown operator "${node.op}"`)
            }
        }
        case "call": {
            const args = node.args.map((arg) => evaluateAst(arg, scopes))
            return callFunction(node.name, args)
        }
    }
}

function numericElements(value: unknown): number[] {
    if (Array.isArray(value)) return value.map(toNumber)
    if (value === undefined || value === null) return []
    return [toNumber(value)]
}

function callFunction(name: string, args: unknown[]): unknown {
    switch (name) {
        case "sum":
            return args.flatMap(numericElements).reduce((total, value) => total + value, 0)
        case "count":
            return args.reduce(
                (total: number, arg) =>
                    total + (Array.isArray(arg) ? arg.length : arg === undefined || arg === null ? 0 : 1),
                0,
            )
        case "round": {
            const digits = args.length > 1 ? toNumber(args[1]) : 0
            const factor = 10 ** digits
            return Math.round(toNumber(args[0]) * factor) / factor
        }
        case "min": {
            const values = args.flatMap(numericElements)
            return values.length === 0 ? 0 : Math.min(...values)
        }
        case "max": {
            const values = args.flatMap(numericElements)
            return values.length === 0 ? 0 : Math.max(...values)
        }
        case "currency": {
            const code = typeof args[1] === "string" && args[1] !== "" ? args[1] : "USD"
            const amount = toNumber(args[0])
            // Whole amounts stay clean ($9,005); fractional ones keep cents ($12.50).
            const digits = Math.round(amount * 100) % 100 === 0 ? 0 : 2
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: code,
                minimumFractionDigits: digits,
                maximumFractionDigits: digits,
            }).format(amount)
        }
        case "percent": {
            const digits = args.length > 1 ? toNumber(args[1]) : 1
            return `${(toNumber(args[0]) * 100).toFixed(digits)}%`
        }
        default:
            throw new Error(`Unknown function "${name}"`)
    }
}

/** Evaluates one expression against scope frames (throws on malformed input). */
export function evaluateExpression(source: string, scopes: ScopeFrame[]): unknown {
    return evaluateAst(parsedExpression(source), scopes)
}

function valueToText(value: unknown): string {
    if (value === undefined || value === null) return ""
    if (typeof value === "string") return value
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : ""
    if (typeof value === "boolean") return value ? "true" : "false"
    return ""
}

/** Fills ${expression} placeholders; literal text passes through verbatim. */
export function evaluateTemplate(template: string, scopes: ScopeFrame[]): string {
    return template.replace(/\$\{([^}]+)\}/g, (_match, inner: string) =>
        valueToText(evaluateExpression(inner, scopes)),
    )
}

function safeEvaluate(source: string, scopes: ScopeFrame[]): unknown {
    try {
        return evaluateExpression(source, scopes)
    } catch {
        return undefined
    }
}

function safeTemplate(template: string, scopes: ScopeFrame[]): string {
    try {
        return evaluateTemplate(template, scopes)
    } catch {
        return ""
    }
}

// --------------------------------------------------------- applying to data

export interface ApplyDerivationsResult {
    formData: FormDataObject
    changed: boolean
}

/**
 * Applies value rules (template / expr / arraySize) in declaration order over
 * a copy of the form data — later rules see earlier results, so derived
 * per-line totals can feed a grand total. Idempotent: applying the result
 * again reports no change.
 */
export function applyDerivations(
    rules: SchemaFormDerivedRule[],
    formData: FormDataObject,
): ApplyDerivationsResult {
    const working = structuredClone(formData)
    let changed = false
    const rootScope: ScopeFrame = { data: working }

    for (const rule of rules) {
        const segments = parsePath(rule.target)
        if (typeof rule.arraySize === "string") {
            changed = applyArraySizeRule(working, segments, rule.arraySize, rootScope) || changed
            continue
        }
        if (typeof rule.template !== "string" && typeof rule.expr !== "string") {
            continue
        }
        changed = applyValueRule(working, segments, rule, [rootScope]) || changed
    }
    return { formData: working, changed }
}

function applyValueRule(
    node: unknown,
    segments: PathSegment[],
    rule: SchemaFormDerivedRule,
    scopes: ScopeFrame[],
): boolean {
    if (typeof node !== "object" || node === null) {
        return false
    }
    const container = node as FormDataObject
    const [segment, ...rest] = segments as [PathSegment, ...PathSegment[]]

    if (segment.each) {
        const items = container[segment.key]
        if (!Array.isArray(items)) {
            return false
        }
        let changed = false
        items.forEach((item, index) => {
            const itemScopes = [...scopes, { data: item, index }]
            if (rest.length === 0) {
                // "containers[]" with no leaf: derive each item wholesale is
                // not supported; value rules need a field to write to.
                return
            }
            changed = applyValueRule(item, rest, rule, itemScopes) || changed
        })
        return changed
    }

    if (rest.length > 0) {
        return applyValueRule(container[segment.key], rest, rule, scopes)
    }

    const nextValue =
        typeof rule.template === "string"
            ? safeTemplate(rule.template, scopes)
            : safeEvaluate(rule.expr!, scopes)
    if (Object.is(container[segment.key], nextValue)) {
        return false
    }
    container[segment.key] = nextValue
    return true
}

function applyArraySizeRule(
    root: FormDataObject,
    segments: PathSegment[],
    sizeExpression: string,
    rootScope: ScopeFrame,
): boolean {
    // arraySize targets a single array field (no "[]" scoping).
    let parent: unknown = root
    for (const segment of segments.slice(0, -1)) {
        if (typeof parent !== "object" || parent === null) return false
        parent = (parent as FormDataObject)[segment.key]
    }
    if (typeof parent !== "object" || parent === null) return false
    const container = parent as FormDataObject
    const key = segments[segments.length - 1]!.key

    const desiredRaw = toNumber(safeEvaluate(sizeExpression, [rootScope]))
    const desired = Math.max(0, Math.min(MAX_ARRAY_SIZE, Math.floor(desiredRaw)))

    const current = container[key]
    const items = Array.isArray(current) ? current : []
    if (items.length === desired && Array.isArray(current)) {
        return false
    }
    const next = items.slice(0, desired)
    while (next.length < desired) {
        next.push({})
    }
    container[key] = next
    return true
}

// ------------------------------------------------------------ uiSchema overlay

/**
 * The formData-dependent uiSchema patch: hidden/disabled flags from
 * visibleWhen/enabledWhen and read-only marks on derived targets. Merge the
 * result over the pristine uiSchema on every change (see mergeUiSchema).
 */
export function derivedUiSchemaOverlay(
    rules: SchemaFormDerivedRule[],
    formData: FormDataObject,
): Record<string, unknown> {
    const overlay: Record<string, unknown> = {}
    const scopes: ScopeFrame[] = [{ data: formData }]
    for (const rule of rules) {
        if ((typeof rule.template === "string" || typeof rule.expr === "string") && rule.readOnly !== false) {
            setUiPath(overlay, rule.target, { "ui:readonly": true })
        }
        if (typeof rule.visibleWhen === "string" && !looseTruthy(safeEvaluate(rule.visibleWhen, scopes))) {
            setUiPath(overlay, rule.target, { "ui:hidden": true })
        }
        if (typeof rule.enabledWhen === "string" && !looseTruthy(safeEvaluate(rule.enabledWhen, scopes))) {
            setUiPath(overlay, rule.target, { "ui:disabled": true })
        }
    }
    return overlay
}

/** "containers[].reference" → uiSchema position containers.items.reference. */
function setUiPath(overlay: Record<string, unknown>, target: string, patch: Record<string, unknown>): void {
    const segments = parsePath(target)
    let node = overlay
    for (const [index, segment] of segments.entries()) {
        const keys = segment.each ? [segment.key, "items"] : [segment.key]
        for (const [keyIndex, key] of keys.entries()) {
            const isLeaf = index === segments.length - 1 && keyIndex === keys.length - 1
            if (isLeaf) {
                const existing = node[key]
                node[key] = {
                    ...(typeof existing === "object" && existing !== null ? existing : {}),
                    ...patch,
                }
            } else {
                const next = node[key]
                if (typeof next === "object" && next !== null) {
                    node = next as Record<string, unknown>
                } else {
                    const created: Record<string, unknown> = {}
                    node[key] = created
                    node = created
                }
            }
        }
    }
}

/** Deep-merges a derived overlay over the pristine uiSchema (arrays replace). */
export function mergeUiSchema(
    base: Record<string, unknown>,
    overlay: Record<string, unknown>,
): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...base }
    for (const [key, value] of Object.entries(overlay)) {
        const existing = merged[key]
        if (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value) &&
            typeof existing === "object" &&
            existing !== null &&
            !Array.isArray(existing)
        ) {
            merged[key] = mergeUiSchema(existing as Record<string, unknown>, value as Record<string, unknown>)
        } else {
            merged[key] = value
        }
    }
    return merged
}

// ------------------------------------------------------------------ summary

export interface SchemaFormSummaryColumn {
    key: string
    title: string
    align?: "left" | "right"
}

export interface SchemaFormSummaryRowConfig {
    /** Repeat this row per item of an array path (e.g. "containers[].products[]"). */
    forEach?: string
    /** Column key → template string, evaluated in the row's scope. */
    cells: Record<string, string>
    /** Bold treatment for totals rows. */
    emphasis?: boolean
}

export interface SchemaFormSummaryConfig {
    title?: string
    description?: string
    columns: SchemaFormSummaryColumn[]
    rows: SchemaFormSummaryRowConfig[]
}

/** Reads and sanity-checks the root `ui:summary` block. */
export function parseSummaryConfig(uiSchema: Record<string, unknown>): SchemaFormSummaryConfig | null {
    const raw = uiSchema["ui:summary"]
    if (typeof raw !== "object" || raw === null) {
        return null
    }
    const candidate = raw as Record<string, unknown>
    if (!Array.isArray(candidate.columns) || !Array.isArray(candidate.rows)) {
        return null
    }
    const columns = candidate.columns.filter(
        (column): column is SchemaFormSummaryColumn =>
            typeof column === "object" &&
            column !== null &&
            typeof (column as SchemaFormSummaryColumn).key === "string" &&
            typeof (column as SchemaFormSummaryColumn).title === "string",
    )
    const rows = candidate.rows.filter(
        (row): row is SchemaFormSummaryRowConfig =>
            typeof row === "object" &&
            row !== null &&
            typeof (row as SchemaFormSummaryRowConfig).cells === "object",
    )
    if (columns.length === 0 || rows.length === 0) {
        return null
    }
    return {
        title: typeof candidate.title === "string" ? candidate.title : undefined,
        description: typeof candidate.description === "string" ? candidate.description : undefined,
        columns,
        rows,
    }
}

export interface SchemaFormSummaryRow {
    cells: string[]
    emphasis: boolean
}

/** Evaluates the summary rows against the live form data. */
export function evaluateSummary(
    config: SchemaFormSummaryConfig,
    formData: FormDataObject,
): SchemaFormSummaryRow[] {
    const rootScopes: ScopeFrame[] = [{ data: formData }]
    const rows: SchemaFormSummaryRow[] = []
    for (const rowConfig of config.rows) {
        const scopeStacks =
            typeof rowConfig.forEach === "string"
                ? collectScopeStacks(parsePath(rowConfig.forEach), rootScopes)
                : [rootScopes]
        for (const scopes of scopeStacks) {
            rows.push({
                cells: config.columns.map((column) => {
                    const template = rowConfig.cells[column.key]
                    return typeof template === "string" ? safeTemplate(template, scopes) : ""
                }),
                emphasis: rowConfig.emphasis === true,
            })
        }
    }
    return rows
}

/** Expands "containers[].products[]" into one scope stack per (nested) item. */
function collectScopeStacks(segments: PathSegment[], scopes: ScopeFrame[]): ScopeFrame[][] {
    if (segments.length === 0) {
        return [scopes]
    }
    const [segment, ...rest] = segments as [PathSegment, ...PathSegment[]]
    const data = scopes[scopes.length - 1]!.data
    if (typeof data !== "object" || data === null) {
        return []
    }
    const value = (data as FormDataObject)[segment.key]
    if (segment.each) {
        if (!Array.isArray(value)) {
            return []
        }
        return value.flatMap((item, index) => collectScopeStacks(rest, [...scopes, { data: item, index }]))
    }
    return collectScopeStacks(rest, [...scopes, { data: value }])
}

// Brief schema validation + the assertion vocabulary (docs/brief-spec.md).
//
// The vocabulary is the append-only contract the setup flow builds against:
// names are never renamed or removed once shipped. Validation is strict about
// the documented shape (tiers, per-tier fields, assertion arguments) and
// tolerant about extensions (unknown content kinds and unknown extra fields
// are carried, not rejected — a brief may be written by a newer setup flow
// than the repo that receives it).

/** The tiers a promise can be classified into. Append-only. */
export const BRIEF_TIERS = ["compiled", "checkable", "judged"]

/** Quality gates gate-passes may name. Append-only. */
export const BRIEF_GATES = ["check:all", "test", "test:web", "check:web"]

/**
 * The assertion vocabulary this repo version can execute (docs/brief-spec.md
 * §3). `args` documents each argument: required?, type, and a note. Printed
 * by `brief:check --vocabulary` so the setup flow only emits assertions the
 * target repo can check.
 */
export const BRIEF_VOCABULARY = {
    version: 1,
    tiers: BRIEF_TIERS,
    asserts: {
        "manifest-entry": {
            args: {
                manifest: {
                    required: true,
                    type: "string",
                    note: "Root manifest filename, e.g. repobot.project.json",
                },
                pointer: {
                    required: true,
                    type: "string",
                    note: "Dotted path; [x] selects the array element whose id (or key) is x",
                },
            },
            note: "The entry exists in the named manifest. Missing manifest file reports blocked (repo not composed).",
        },
        "capability-declared": {
            args: {
                capability: { required: true, type: "string", note: "e.g. PAYMENTS" },
            },
            note: "repobot.deploy.json declares the capability.",
        },
        "route-renders": {
            args: {
                path: { required: true, type: "string", note: "Absolute app path, e.g. /shop" },
                signedIn: {
                    required: false,
                    type: "boolean",
                    note: "Visit as the sandbox's signed-in local dev user (auth-gated routes)",
                },
            },
            note: "The route loads in a real browser with no page errors and a non-empty root. Needs the dev stack.",
        },
        "content-present": {
            args: {
                path: { required: true, type: "string", note: "Absolute app path" },
                text: {
                    required: true,
                    type: "string",
                    note: "Case-insensitive text expected on the rendered page",
                },
                signedIn: {
                    required: false,
                    type: "boolean",
                    note: "Visit as the sandbox's signed-in local dev user (auth-gated routes)",
                },
            },
            note: "The rendered route contains the text. Needs the dev stack.",
        },
        "query-returns": {
            args: {
                operation: {
                    required: true,
                    type: "string",
                    note: "Root query field name, or a full GraphQL document",
                },
                variables: { required: false, type: "object" },
                expectCount: {
                    required: false,
                    type: "number",
                    note: "Expected list length (array result or connection nodes)",
                },
            },
            note: "The operation succeeds through the in-process GraphQL server. Needs the database.",
        },
        "mutation-roundtrip": {
            args: {
                operation: {
                    required: true,
                    type: "string",
                    note: "Root mutation field name, or a full GraphQL document",
                },
                variables: { required: false, type: "object" },
            },
            note: "The mutation succeeds through the in-process GraphQL server. Needs the database.",
        },
        "gate-passes": {
            args: {
                gate: { required: true, type: "string", note: `One of: ${BRIEF_GATES.join(", ")}` },
            },
            note: "The named quality gate exits 0.",
        },
        screenshot: {
            args: {
                path: { required: true, type: "string", note: "Absolute app path to capture" },
                signedIn: {
                    required: false,
                    type: "boolean",
                    note: "Capture as the sandbox's signed-in local dev user (auth-gated routes)",
                },
            },
            note: "Evidence capture for judged review; never pass/fail. Needs the dev stack.",
        },
    },
}

const KEBAB_ID = /^[a-z][a-z0-9-]*$/
const APP_PATH = /^\/[a-zA-Z0-9/_-]*$/

/**
 * Validates a parsed brief against the documented shape. Returns a list of
 * problem strings; an empty list means the brief is valid. Never throws on
 * malformed input — the runner reports problems, it doesn't crash.
 */
export function validateBrief(brief) {
    const problems = []
    if (brief === null || typeof brief !== "object" || Array.isArray(brief)) {
        return ["brief must be a JSON object"]
    }

    if (brief.business !== undefined && (typeof brief.business !== "object" || brief.business === null)) {
        problems.push("business must be an object")
    }

    const content = brief.content ?? {}
    if (typeof content !== "object" || content === null || Array.isArray(content)) {
        problems.push("content must be an object map of id -> entry")
    }

    const asks = brief.asks ?? []
    if (!Array.isArray(asks)) {
        return [...problems, "asks must be an array"]
    }

    const seenIds = new Set()
    asks.forEach((ask, index) => {
        const where = `asks[${index}]`
        if (ask === null || typeof ask !== "object") {
            problems.push(`${where} must be an object`)
            return
        }
        if (typeof ask.id !== "string" || !KEBAB_ID.test(ask.id)) {
            problems.push(`${where}.id must be a lowercase kebab-case slug`)
        } else if (seenIds.has(ask.id)) {
            problems.push(`${where}.id "${ask.id}" is duplicated — ask ids must be stable and unique`)
        } else {
            seenIds.add(ask.id)
        }
        if (typeof ask.statement !== "string" || ask.statement.length === 0) {
            problems.push(`${where}.statement is required (the promise in the user's words)`)
        }
        if (!BRIEF_TIERS.includes(ask.tier)) {
            problems.push(`${where}.tier must be one of: ${BRIEF_TIERS.join(", ")}`)
            return
        }

        if (ask.tier === "compiled") {
            const realizedBy = ask.realizedBy
            if (
                realizedBy === null ||
                typeof realizedBy !== "object" ||
                typeof realizedBy.manifest !== "string" ||
                typeof realizedBy.pointer !== "string"
            ) {
                problems.push(`${where} (compiled) needs realizedBy { manifest, pointer }`)
            }
        }

        if (ask.tier === "checkable") {
            if (!Array.isArray(ask.acceptance) || ask.acceptance.length === 0) {
                problems.push(`${where} (checkable) needs a non-empty acceptance array`)
            } else {
                ask.acceptance.forEach((assertion, assertIndex) => {
                    problems.push(
                        ...validateAssertion(assertion).map(
                            (problem) => `${where}.acceptance[${assertIndex}] ${problem}`,
                        ),
                    )
                })
            }
            for (const ref of ask.contentRefs ?? []) {
                if (content[ref] === undefined) {
                    problems.push(`${where}.contentRefs "${ref}" does not exist in content`)
                }
            }
        }

        if (ask.tier === "judged") {
            if (typeof ask.rubric !== "string" || ask.rubric.length === 0) {
                problems.push(`${where} (judged) needs a rubric`)
            }
            for (const assertion of ask.acceptance ?? []) {
                if (assertion?.assert !== "screenshot") {
                    problems.push(
                        `${where} (judged) may only carry screenshot assertions (evidence, never gates)`,
                    )
                }
            }
        }
    })

    return problems
}

/** Validates one acceptance assertion against the vocabulary. */
export function validateAssertion(assertion) {
    if (assertion === null || typeof assertion !== "object") {
        return ["must be an object"]
    }
    const spec = BRIEF_VOCABULARY.asserts[assertion.assert]
    if (spec === undefined) {
        return [
            `assert "${assertion.assert}" is not in this repo's vocabulary (run brief:check --vocabulary)`,
        ]
    }
    const problems = []
    for (const [name, argSpec] of Object.entries(spec.args)) {
        const value = assertion[name]
        if (value === undefined) {
            if (argSpec.required) problems.push(`missing required argument "${name}"`)
            continue
        }
        if (argSpec.type === "object") {
            if (typeof value !== "object" || value === null || Array.isArray(value)) {
                problems.push(`argument "${name}" must be an object`)
            }
        } else if (typeof value !== argSpec.type) {
            problems.push(`argument "${name}" must be a ${argSpec.type}`)
        }
    }
    if (
        assertion.assert === "gate-passes" &&
        typeof assertion.gate === "string" &&
        !BRIEF_GATES.includes(assertion.gate)
    ) {
        problems.push(`gate "${assertion.gate}" must be one of: ${BRIEF_GATES.join(", ")}`)
    }
    if (
        typeof assertion.expectCount === "number" &&
        (!Number.isInteger(assertion.expectCount) || assertion.expectCount < 0)
    ) {
        problems.push("expectCount must be a non-negative integer")
    }
    for (const name of ["path"]) {
        if (
            typeof assertion[name] === "string" &&
            ["route-renders", "content-present", "screenshot"].includes(assertion.assert)
        ) {
            if (!APP_PATH.test(assertion[name])) {
                problems.push(`argument "${name}" must be an absolute app path like /shop`)
            }
        }
    }
    return problems
}

/**
 * Resolves a manifest pointer like "marketing.pages[pricing]" against parsed
 * JSON: dotted segments walk objects; a [key] suffix selects the array
 * element whose `id` (or `key`) equals key. Returns undefined when the path
 * does not resolve.
 */
export function resolveManifestPointer(root, pointer) {
    let current = root
    for (const segment of pointer.split(".")) {
        if (current === null || typeof current !== "object") return undefined
        const match = segment.match(/^([^[\]]+)(?:\[([^[\]]+)\])?$/)
        if (match === null) return undefined
        const [, name, elementKey] = match
        current = current[name]
        if (elementKey !== undefined) {
            if (!Array.isArray(current)) return undefined
            current = current.find((entry) => entry?.id === elementKey || entry?.key === elementKey)
        }
    }
    return current
}

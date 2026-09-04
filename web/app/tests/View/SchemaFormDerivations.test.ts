import {
    applyDerivations,
    derivedUiSchemaOverlay,
    evaluateExpression,
    evaluateSummary,
    evaluateTemplate,
    mergeUiSchema,
    parseDerivedRules,
    parseSummaryConfig,
    type SchemaFormDerivedRule,
} from "@base/design-system"
import { describe, expect, it } from "vitest"

describe("schemaFormDerivations expressions", () => {
    const scopes = [{ data: { qty: 12, price: 2.5, incoterms: "FOB", flag: true } }]

    it("evaluates arithmetic with precedence and parentheses", () => {
        expect(evaluateExpression("1 + 2 * 3", scopes)).toBe(7)
        expect(evaluateExpression("(1 + 2) * 3", scopes)).toBe(9)
        expect(evaluateExpression("10 / 4", scopes)).toBe(2.5)
        expect(evaluateExpression("10 / 0", scopes)).toBe(0)
        expect(evaluateExpression("-qty + 2", scopes)).toBe(-10)
    })

    it("resolves field paths, comparisons, and logic", () => {
        expect(evaluateExpression("qty * price", scopes)).toBe(30)
        expect(evaluateExpression("qty >= 10 && incoterms == 'FOB'", scopes)).toBe(true)
        expect(evaluateExpression("incoterms != 'FOB' || !flag", scopes)).toBe(false)
        expect(evaluateExpression("missing == null", scopes)).toBe(false)
        expect(evaluateExpression("missing + 5", scopes)).toBe(5)
    })

    it("flattens [] paths for aggregates", () => {
        const data = {
            containers: [{ products: [{ qty: 2 }, { qty: 3 }] }, { products: [{ qty: 5 }] }],
        }
        const frames = [{ data }]
        expect(evaluateExpression("sum(containers[].products[].qty)", frames)).toBe(10)
        expect(evaluateExpression("count(containers[].products[])", frames)).toBe(3)
        expect(evaluateExpression("count(containers[])", frames)).toBe(2)
        expect(evaluateExpression("max(containers[].products[].qty)", frames)).toBe(5)
    })

    it("formats currency and percent", () => {
        expect(evaluateExpression("currency(9005)", scopes)).toBe("$9,005")
        expect(evaluateExpression("currency(12.5, 'USD')", scopes)).toBe("$12.50")
        expect(evaluateExpression("percent(0.065)", scopes)).toBe("6.5%")
        expect(evaluateExpression("round(2.678, 2)", scopes)).toBe(2.68)
    })

    it("rejects unknown functions and malformed input", () => {
        expect(() => evaluateExpression("alert('x')", scopes)).toThrow(/Unknown function/)
        expect(() => evaluateExpression("1 +", scopes)).toThrow()
    })

    it("interpolates templates with expressions and index", () => {
        const frames = [{ data: { contractNumber: "C0003" } }, { data: { qty: 1 }, index: 1 }]
        expect(evaluateTemplate("${contractNumber}.C${index + 1}", frames)).toBe("C0003.C2")
        expect(evaluateTemplate("no placeholders", frames)).toBe("no placeholders")
    })
})

describe("applyDerivations", () => {
    it("derives templated refs per array item", () => {
        const rules: SchemaFormDerivedRule[] = [
            { target: "containers[].reference", template: "${contractNumber}.C${index + 1}" },
        ]
        const result = applyDerivations(rules, {
            contractNumber: "C0003",
            containers: [{}, {}],
        })
        expect(result.changed).toBe(true)
        const containers = result.formData.containers as Array<Record<string, unknown>>
        expect(containers[0]!.reference).toBe("C0003.C1")
        expect(containers[1]!.reference).toBe("C0003.C2")

        const again = applyDerivations(rules, result.formData)
        expect(again.changed).toBe(false)
    })

    it("chains expr rules in declaration order (line totals feed the grand total)", () => {
        const rules: SchemaFormDerivedRule[] = [
            { target: "containers[].products[].lineTotal", expr: "qty * sellPrice" },
            { target: "grandTotal", expr: "sum(containers[].products[].lineTotal)" },
        ]
        const result = applyDerivations(rules, {
            containers: [
                {
                    products: [
                        { qty: 2, sellPrice: 100 },
                        { qty: 1, sellPrice: 50 },
                    ],
                },
                { products: [{ qty: 3, sellPrice: 10 }] },
            ],
        })
        expect(result.formData.grandTotal).toBe(280)
    })

    it("binds an array's length to a count field", () => {
        const rules: SchemaFormDerivedRule[] = [{ target: "containers", arraySize: "containerCount" }]
        const grown = applyDerivations(rules, { containerCount: 3 })
        expect(grown.formData.containers).toEqual([{}, {}, {}])

        const shrunk = applyDerivations(rules, {
            containerCount: 1,
            containers: [{ sku: "a" }, { sku: "b" }],
        })
        expect(shrunk.formData.containers).toEqual([{ sku: "a" }])

        const unchanged = applyDerivations(rules, shrunk.formData)
        expect(unchanged.changed).toBe(false)
    })

    it("parses rules from the uiSchema and drops malformed entries", () => {
        const rules = parseDerivedRules({
            "ui:derived": [
                { target: "a", expr: "1" },
                { target: "", expr: "1" },
                { notATarget: true },
                "junk",
            ],
        })
        expect(rules).toHaveLength(1)
        expect(rules[0]!.target).toBe("a")
    })
})

describe("derivedUiSchemaOverlay", () => {
    it("hides and disables from visibleWhen / enabledWhen conditions", () => {
        const rules: SchemaFormDerivedRule[] = [
            { target: "oceanFreight", visibleWhen: "freightBillable" },
            { target: "secondNotify", enabledWhen: "notifyParty != ''" },
        ]
        const overlay = derivedUiSchemaOverlay(rules, { freightBillable: false, notifyParty: "" })
        expect(overlay.oceanFreight).toEqual({ "ui:hidden": true })
        expect(overlay.secondNotify).toEqual({ "ui:disabled": true })

        const visible = derivedUiSchemaOverlay(rules, { freightBillable: true, notifyParty: "x" })
        expect(visible.oceanFreight).toBeUndefined()
        expect(visible.secondNotify).toBeUndefined()
    })

    it("marks derived targets read-only and maps [] to items", () => {
        const rules: SchemaFormDerivedRule[] = [
            { target: "containers[].reference", template: "${contractNumber}.C${index + 1}" },
            { target: "editable", expr: "1 + 1", readOnly: false },
        ]
        const overlay = derivedUiSchemaOverlay(rules, {})
        expect(overlay).toEqual({
            containers: { items: { reference: { "ui:readonly": true } } },
        })
    })

    it("deep-merges overlays over the pristine uiSchema", () => {
        const merged = mergeUiSchema(
            { containers: { items: { reference: { "ui:widget": "text" } } }, "ui:order": ["a"] },
            { containers: { items: { reference: { "ui:readonly": true } } } },
        )
        expect(merged).toEqual({
            containers: { items: { reference: { "ui:widget": "text", "ui:readonly": true } } },
            "ui:order": ["a"],
        })
    })
})

describe("ui:summary", () => {
    const uiSchema = {
        "ui:summary": {
            title: "Line economics",
            columns: [
                { key: "line", title: "Line" },
                { key: "qty", title: "Qty", align: "right" },
                { key: "total", title: "Total", align: "right" },
            ],
            rows: [
                {
                    forEach: "containers[].products[]",
                    cells: {
                        line: "${description}",
                        qty: "${qty}",
                        total: "${currency(qty * sellPrice)}",
                    },
                },
                {
                    cells: {
                        line: "Total",
                        total: "${currency(sum(containers[].products[].sellPrice))}",
                    },
                    emphasis: true,
                },
            ],
        },
    }

    it("parses the config and evaluates per-item and totals rows", () => {
        const config = parseSummaryConfig(uiSchema)
        expect(config).not.toBeNull()
        const rows = evaluateSummary(config!, {
            containers: [
                { products: [{ description: "18mm HMR", qty: 2, sellPrice: 100 }] },
                { products: [{ description: "16mm HMR", qty: 1, sellPrice: 50 }] },
            ],
        })
        expect(rows).toHaveLength(3)
        expect(rows[0]!.cells).toEqual(["18mm HMR", "2", "$200"])
        expect(rows[1]!.cells).toEqual(["16mm HMR", "1", "$50"])
        expect(rows[2]!.emphasis).toBe(true)
        expect(rows[2]!.cells[0]).toBe("Total")
    })

    it("returns null for malformed configs", () => {
        expect(parseSummaryConfig({})).toBeNull()
        expect(parseSummaryConfig({ "ui:summary": { columns: [], rows: [] } })).toBeNull()
    })
})

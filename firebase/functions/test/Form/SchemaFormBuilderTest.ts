import { expect } from "chai"
import { JsonSchemaDefinition } from "../../generated/GraphqlSchemaDefinitions.js"
import { buildSchemaFormFromDefinition } from "../../src/Utils/SchemaForms.js"

/**
 * Unit coverage for the nested-schema features of the form builder: nested
 * titles, dotted-path overrides (property / uiSchema / omit), and root
 * uiSchema merging. Blackbox coverage of the GraphQL surface stays in
 * SchemaFormTest.ts; this exercises shapes no starter *Fields type has yet.
 */
const orderDefinition: JsonSchemaDefinition = {
    properties: {
        contractNumber: { type: "string" },
        incoterms: { type: "string", enum: ["FOB", "CIF"] },
        containers: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    description: { type: "string" },
                    qty: { type: "integer" },
                    products: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                sku: { type: "string" },
                                sellPrice: { type: "number" },
                            },
                            required: ["sku"],
                        },
                    },
                },
                required: ["description"],
            },
        },
    },
    required: ["contractNumber"],
}

interface ParsedForm {
    jsonSchema: Record<string, any>
    uiSchema: Record<string, any>
    defaultData: Record<string, unknown>
}

function build(options: Parameters<typeof buildSchemaFormFromDefinition>[2]): ParsedForm {
    const form = buildSchemaFormFromDefinition(orderDefinition, "OrderFields", options)
    return {
        jsonSchema: JSON.parse(form.jsonSchema),
        uiSchema: JSON.parse(form.uiSchema),
        defaultData: JSON.parse(form.defaultData),
    }
}

describe("SchemaForm builder (nested definitions)", function () {
    it("humanizes titles on every nested object field", function () {
        const { jsonSchema } = build({})
        const items = jsonSchema.properties.containers.items
        expect(jsonSchema.properties.containers.title).to.equal("Containers")
        expect(items.properties.description.title).to.equal("Description")
        expect(items.properties.qty.title).to.equal("Qty")
        expect(items.properties.products.items.properties.sellPrice.title).to.equal("Sell Price")
        expect(items.required).to.deep.equal(["description"])
    })

    it("honors dotted-path fieldTitles", function () {
        const { jsonSchema } = build({
            fieldTitles: { "containers.items.products.items.sku": "SKU" },
        })
        const products = jsonSchema.properties.containers.items.properties.products
        expect(products.items.properties.sku.title).to.equal("SKU")
    })

    it("merges dotted-path property overrides onto the nested node", function () {
        const { jsonSchema } = build({
            overrides: {
                "containers.items.description": { property: { enum: ["18mm HMR", "16mm HMR"] } },
            },
        })
        const description = jsonSchema.properties.containers.items.properties.description
        expect(description.enum).to.deep.equal(["18mm HMR", "16mm HMR"])
        expect(description.type).to.equal("string")
    })

    it("lands dotted-path uiSchema overrides at the rjsf-equivalent position", function () {
        const { uiSchema } = build({
            overrides: {
                containers: { uiSchema: { "ui:options": { addLabel: "+ Container" } } },
                "containers.items.products": {
                    uiSchema: { "ui:options": { addLabel: "+ Product" } },
                },
            },
        })
        expect(uiSchema.containers["ui:options"]).to.deep.equal({ addLabel: "+ Container" })
        expect(uiSchema.containers.items.products["ui:options"]).to.deep.equal({
            addLabel: "+ Product",
        })
    })

    it("omits nested fields from their parent (properties and required)", function () {
        const { jsonSchema } = build({
            overrides: { "containers.items.description": { omit: true } },
        })
        const items = jsonSchema.properties.containers.items
        expect(items.properties).to.not.have.property("description")
        expect(items.required).to.deep.equal([])
        expect(items.properties).to.have.property("qty")
    })

    it("merges root uiSchema entries verbatim", function () {
        const derived = [{ target: "reference", rule: { template: "${contractNumber}.C${index}" } }]
        const { uiSchema } = build({ uiSchema: { "ui:derived": derived } })
        expect(uiSchema["ui:derived"]).to.deep.equal(derived)
        expect(uiSchema["ui:order"]).to.deep.equal(["contractNumber", "incoterms", "containers"])
    })

    it("rejects override paths that do not exist", function () {
        expect(() => build({ overrides: { "containers.items.nope": { omit: true } } })).to.throw(
            /does not exist in schema definition "OrderFields"/,
        )
    })
})

import {
    graphqlSchemaDefinitions,
    GraphqlSchemaDefinitionKey,
    JsonSchemaDefinition,
    JsonSchemaProperty,
} from "../../generated/GraphqlSchemaDefinitions.js"
import { checkArgument } from "./RpcError.js"
import { camelCaseToWords } from "./Strings.js"

/**
 * The wire shape of the SchemaForm GraphQL type: three JSON-encoded strings
 * that a JSON-Schema form renderer (for example react-jsonschema-form)
 * consumes directly. The backend owns the entire form definition, so clients
 * render create/edit forms with zero frontend form code.
 */
export interface SchemaForm {
    jsonSchema: string
    uiSchema: string
    defaultData: string
}

export interface SchemaFormFieldOverride {
    /**
     * Merged over the generated JSON Schema property (for example a custom
     * title or a narrowed enum).
     */
    property?: Partial<JsonSchemaProperty> & { title?: string }

    /**
     * Merged into the field's uiSchema entry (for example
     * {"ui:widget": "textarea"}).
     */
    uiSchema?: Record<string, unknown>

    /**
     * Removes the field from the form entirely.
     */
    omit?: boolean
}

export interface BuildSchemaFormOptions {
    /**
     * Which generated JSON Schema definition (a GraphQL *Fields input type)
     * this form is based on.
     */
    baseSchemaKey: GraphqlSchemaDefinitionKey

    title?: string
    description?: string

    /**
     * Field order in the form. When provided, only these fields are shown.
     */
    displayOrder?: string[]

    /**
     * Overrides for the default humanized field titles. Keys may be nested
     * dotted paths — object fields chain by name and array items use the
     * literal segment "items" (for example "containers.items.sku").
     */
    fieldTitles?: Record<string, string>

    /**
     * Per-field overrides. Keys address top-level fields by name or nested
     * fields by dotted path (see fieldTitles). Nested uiSchema overrides
     * land at the rjsf-equivalent position (arrays nest under "items").
     */
    overrides?: Record<string, SchemaFormFieldOverride>

    /**
     * Root-level uiSchema entries merged verbatim (for example "ui:steps"
     * wizard pages or "ui:derived" reactivity rules).
     */
    uiSchema?: Record<string, unknown>

    /**
     * Values to pre-populate the form with (for update forms, taken from the
     * existing row). Keys must exist in the form's properties.
     */
    defaultData?: Record<string, unknown>
}

/**
 * Builds a complete backend-driven form from a generated GraphQL input type.
 * Nested input objects and lists render as titled sections and repeatable
 * rows; every nested field gets a humanized title unless overridden.
 */
export function buildSchemaForm(options: BuildSchemaFormOptions): SchemaForm {
    const { baseSchemaKey, ...rest } = options
    return buildSchemaFormFromDefinition(graphqlSchemaDefinitions[baseSchemaKey], baseSchemaKey, rest)
}

/**
 * The generated-definition-independent core of buildSchemaForm, for forms
 * composed from a hand-built definition (and for unit tests).
 */
export function buildSchemaFormFromDefinition(
    baseSchema: JsonSchemaDefinition,
    schemaName: string,
    options: Omit<BuildSchemaFormOptions, "baseSchemaKey">,
): SchemaForm {
    const basePropertyKeys = Object.keys(baseSchema.properties)

    let propertyKeys = options.displayOrder ?? basePropertyKeys
    for (const propertyKey of propertyKeys) {
        checkArgument(
            basePropertyKeys.includes(propertyKey),
            `Field "${propertyKey}" does not exist in schema definition "${schemaName}".`,
        )
    }
    propertyKeys = propertyKeys.filter((propertyKey) => options.overrides?.[propertyKey]?.omit !== true)

    const properties: Record<string, JsonSchemaProperty & { title: string }> = {}
    const uiSchema: Record<string, unknown> = { "ui:order": propertyKeys, ...options.uiSchema }
    for (const propertyKey of propertyKeys) {
        const override = options.overrides?.[propertyKey]
        properties[propertyKey] = {
            ...withNestedTitles(baseSchema.properties[propertyKey], propertyKey, options.fieldTitles),
            title: fieldTitle(propertyKey, propertyKey, options.fieldTitles),
            ...override?.property,
        }
        if (override?.uiSchema !== undefined) {
            uiSchema[propertyKey] = override.uiSchema
        }
    }

    for (const [overrideKey, override] of Object.entries(options.overrides ?? {})) {
        if (!overrideKey.includes(".")) {
            continue
        }
        applyNestedOverride(properties, uiSchema, overrideKey, override, schemaName)
    }

    const includedKeys = new Set(propertyKeys)
    const required = baseSchema.required.filter((propertyKey) => includedKeys.has(propertyKey))

    const defaultData = options.defaultData ?? {}
    for (const defaultKey of Object.keys(defaultData)) {
        checkArgument(
            includedKeys.has(defaultKey),
            `defaultData key "${defaultKey}" is not a field of this form.`,
        )
    }

    return {
        jsonSchema: JSON.stringify({
            type: "object",
            title: options.title ?? "",
            description: options.description,
            properties,
            required,
        }),
        uiSchema: JSON.stringify(uiSchema),
        defaultData: JSON.stringify(
            Object.fromEntries(Object.entries(defaultData).filter(([, value]) => value !== undefined)),
        ),
    }
}

function fieldTitle(fieldKey: string, path: string, fieldTitles?: Record<string, string>): string {
    const explicitTitle = fieldTitles?.[path] ?? fieldTitles?.[fieldKey]
    if (explicitTitle !== undefined) {
        return explicitTitle
    }
    const withoutIdSuffix = fieldKey.endsWith("Id") ? fieldKey.slice(0, -2) : fieldKey
    return camelCaseToWords(withoutIdSuffix)
}

/**
 * Deep-copies a generated property, stamping humanized titles onto every
 * nested object field so sections and repeatable rows label themselves.
 */
function withNestedTitles(
    property: JsonSchemaProperty,
    path: string,
    fieldTitles?: Record<string, string>,
): JsonSchemaProperty {
    if (property.type === "object" && property.properties !== undefined) {
        const nested: Record<string, JsonSchemaProperty> = {}
        for (const [key, child] of Object.entries(property.properties)) {
            const childPath = `${path}.${key}`
            nested[key] = {
                ...withNestedTitles(child, childPath, fieldTitles),
                title: fieldTitle(key, childPath, fieldTitles),
            } as JsonSchemaProperty
        }
        return { ...property, properties: nested }
    }
    if (property.type === "array" && property.items !== undefined) {
        return { ...property, items: withNestedTitles(property.items, `${path}.items`, fieldTitles) }
    }
    return { ...property }
}

/**
 * Applies a dotted-path override: the property merge lands on the nested
 * JSON Schema node, the uiSchema merge lands at the rjsf-equivalent nested
 * position, and omit removes the nested field from its parent.
 */
function applyNestedOverride(
    properties: Record<string, JsonSchemaProperty & { title: string }>,
    uiSchema: Record<string, unknown>,
    overrideKey: string,
    override: SchemaFormFieldOverride,
    baseSchemaKey: string,
): void {
    const segments = overrideKey.split(".")
    const rootKey = segments[0]
    const root = properties[rootKey] as JsonSchemaProperty | undefined
    checkArgument(
        root !== undefined,
        `Override path "${overrideKey}" does not exist in schema definition "${baseSchemaKey}".`,
    )

    // Walk to the parent node of the addressed field so omit can splice it out.
    let parent: JsonSchemaProperty = root as JsonSchemaProperty
    for (let index = 1; index < segments.length - 1; index += 1) {
        parent = childProperty(parent, segments[index], overrideKey, baseSchemaKey)
    }
    const leafKey = segments[segments.length - 1]

    if (override.omit === true) {
        checkArgument(
            leafKey !== "items" && parent.type === "object",
            `Override path "${overrideKey}" cannot be omitted (not an object field).`,
        )
        checkArgument(
            parent.properties?.[leafKey] !== undefined,
            `Override path "${overrideKey}" does not exist in schema definition "${baseSchemaKey}".`,
        )
        delete parent.properties![leafKey]
        parent.required = (parent.required ?? []).filter((key) => key !== leafKey)
        return
    }

    if (override.property !== undefined) {
        const leaf = childProperty(parent, leafKey, overrideKey, baseSchemaKey)
        Object.assign(leaf, override.property)
    }

    if (override.uiSchema !== undefined) {
        let node = uiSchema
        for (const segment of segments.slice(0, -1)) {
            const next = node[segment]
            if (typeof next === "object" && next !== null) {
                node = next as Record<string, unknown>
            } else {
                const created: Record<string, unknown> = {}
                node[segment] = created
                node = created
            }
        }
        const existing = node[leafKey]
        node[leafKey] = {
            ...(typeof existing === "object" && existing !== null ? existing : {}),
            ...override.uiSchema,
        }
    }
}

function childProperty(
    parent: JsonSchemaProperty,
    segment: string,
    overrideKey: string,
    baseSchemaKey: string,
): JsonSchemaProperty {
    const child = segment === "items" && parent.type === "array" ? parent.items : parent.properties?.[segment]
    checkArgument(
        child !== undefined,
        `Override path "${overrideKey}" does not exist in schema definition "${baseSchemaKey}".`,
    )
    return child as JsonSchemaProperty
}

import {
    graphqlSchemaDefinitions,
    GraphqlSchemaDefinitionKey,
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
     * Overrides for the default humanized field titles.
     */
    fieldTitles?: Record<string, string>

    overrides?: Record<string, SchemaFormFieldOverride>

    /**
     * Values to pre-populate the form with (for update forms, taken from the
     * existing row). Keys must exist in the form's properties.
     */
    defaultData?: Record<string, unknown>
}

/**
 * Builds a complete backend-driven form from a generated GraphQL input type.
 */
export function buildSchemaForm(options: BuildSchemaFormOptions): SchemaForm {
    const baseSchema = graphqlSchemaDefinitions[options.baseSchemaKey]
    const basePropertyKeys = Object.keys(baseSchema.properties)

    let propertyKeys = options.displayOrder ?? basePropertyKeys
    for (const propertyKey of propertyKeys) {
        checkArgument(
            basePropertyKeys.includes(propertyKey),
            `Field "${propertyKey}" does not exist in schema definition "${options.baseSchemaKey}".`,
        )
    }
    propertyKeys = propertyKeys.filter((propertyKey) => options.overrides?.[propertyKey]?.omit !== true)

    const properties: Record<string, JsonSchemaProperty & { title: string }> = {}
    const uiSchema: Record<string, unknown> = { "ui:order": propertyKeys }
    for (const propertyKey of propertyKeys) {
        const override = options.overrides?.[propertyKey]
        properties[propertyKey] = {
            ...baseSchema.properties[propertyKey],
            title: fieldTitle(propertyKey, options.fieldTitles),
            ...override?.property,
        }
        if (override?.uiSchema !== undefined) {
            uiSchema[propertyKey] = override.uiSchema
        }
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

function fieldTitle(fieldKey: string, fieldTitles?: Record<string, string>): string {
    const explicitTitle = fieldTitles?.[fieldKey]
    if (explicitTitle !== undefined) {
        return explicitTitle
    }
    const withoutIdSuffix = fieldKey.endsWith("Id") ? fieldKey.slice(0, -2) : fieldKey
    return camelCaseToWords(withoutIdSuffix)
}

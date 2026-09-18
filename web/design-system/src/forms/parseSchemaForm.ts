import type { RJSFSchema, UiSchema } from "@rjsf/utils"

/** Wire shape of the backend's SchemaForm GraphQL type: three JSON-encoded strings. */
export interface SchemaFormPayload {
    jsonSchema: string
    uiSchema: string
    defaultData: string
}

export interface ParsedSchemaForm {
    schema: RJSFSchema
    uiSchema: UiSchema
    defaultData: Record<string, unknown>
}

/** Parses a backend SchemaForm payload into the objects @rjsf/core consumes. */
export function parseSchemaForm(payload: SchemaFormPayload): ParsedSchemaForm {
    return {
        schema: JSON.parse(payload.jsonSchema) as RJSFSchema,
        uiSchema: JSON.parse(payload.uiSchema) as UiSchema,
        defaultData: JSON.parse(payload.defaultData) as Record<string, unknown>,
    }
}

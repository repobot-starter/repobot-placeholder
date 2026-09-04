import { RpcError } from "../../Utils/RpcError.js"
import { DocumentTemplateField, DocumentTemplateSchema } from "./DocumentTemplateTypes.js"

/**
 * Validates caller-supplied overrides against a template's field schema:
 * every key must be declared, required fields must be present, and values
 * must match their declared type (plus "email"/"date" string formats).
 * Unknown keys are rejected so typos fail loudly instead of rendering as
 * blank Mustache tags.
 */
export function validateDocumentOverrides(request: {
    schema: DocumentTemplateSchema
    overrides: Record<string, unknown>
}): Record<string, unknown> {
    validateObjectAgainstFields(request.schema.fields ?? {}, request.overrides, "overrides")
    return request.overrides
}

function validateObjectAgainstFields(
    fieldSchemas: Record<string, DocumentTemplateField>,
    value: unknown,
    path: string,
): asserts value is Record<string, unknown> {
    if (!isPlainObject(value)) {
        throw new RpcError("INVALID_ARGUMENT", `${path} must be an object.`)
    }
    for (const key of Object.keys(value)) {
        if (!(key in fieldSchemas)) {
            throw new RpcError("INVALID_ARGUMENT", `${path}.${key} is not defined in template schema.`)
        }
    }
    for (const [fieldName, fieldSchema] of Object.entries(fieldSchemas)) {
        validateField(fieldSchema, value[fieldName], `${path}.${fieldName}`)
    }
}

function validateField(schema: DocumentTemplateField, value: unknown, path: string): void {
    const isRequired = schema.required === true
    if (value === undefined || value === null) {
        if (isRequired) {
            throw new RpcError("INVALID_ARGUMENT", `${path} is required.`)
        }
        return
    }

    const type = typeof schema.type === "string" ? schema.type : inferSchemaType(schema)
    switch (type) {
        case "string":
            if (typeof value !== "string") {
                throw new RpcError("INVALID_ARGUMENT", `${path} must be a string.`)
            }
            validateStringFormat(value, schema.format, path)
            return
        case "number":
            if (typeof value !== "number" || Number.isNaN(value)) {
                throw new RpcError("INVALID_ARGUMENT", `${path} must be a number.`)
            }
            return
        case "boolean":
            if (typeof value !== "boolean") {
                throw new RpcError("INVALID_ARGUMENT", `${path} must be a boolean.`)
            }
            return
        case "array":
            if (!Array.isArray(value)) {
                throw new RpcError("INVALID_ARGUMENT", `${path} must be an array.`)
            }
            validateArrayItems(schema, value, path)
            return
        case "object":
            if (!isPlainObject(value)) {
                throw new RpcError("INVALID_ARGUMENT", `${path} must be an object.`)
            }
            validateObjectAgainstFields(schema.fields ?? {}, value, path)
            return
        default:
            throw new RpcError("FAILED_PRECONDITION", `${path} has unsupported schema type '${type}'.`)
    }
}

function validateArrayItems(schema: DocumentTemplateField, value: unknown[], path: string): void {
    if (!schema.items) {
        return
    }
    value.forEach((item, index) => {
        validateField(schema.items as DocumentTemplateField, item, `${path}[${index}]`)
    })
}

function validateStringFormat(value: string, format: unknown, path: string): void {
    if (format === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
            throw new RpcError("INVALID_ARGUMENT", `${path} must be a valid email.`)
        }
    }
    if (format === "date") {
        const isDateLike = /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
        if (!isDateLike) {
            throw new RpcError("INVALID_ARGUMENT", `${path} must be a valid YYYY-MM-DD date.`)
        }
    }
}

function inferSchemaType(schema: DocumentTemplateField): string {
    if (schema.fields) {
        return "object"
    }
    return "string"
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value)
}

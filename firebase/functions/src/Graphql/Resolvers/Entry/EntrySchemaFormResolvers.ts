import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { EntryField } from "../../../Data/Entry/EntryField.js"
import { entryService } from "../../../Services/Entry/EntryService.js"
import { buildSchemaForm, SchemaForm } from "../../../Utils/SchemaForms.js"

export const entrySchemaFormResolvers: GqlResolvers = {
    Query: {
        //
        // Field designer forms: static, derived from the generated input
        // types exactly like the Project exemplar.
        //

        entryFieldCreateFormSchema: () => {
            return buildSchemaForm({
                baseSchemaKey: "CreateEntryFieldFields",
                title: "Create Field",
                displayOrder: ["label", "fieldType", "required", "options"],
            })
        },

        entryFieldUpdateFormSchema: async (_parent, { input }) => {
            const field = await entryService.getEntryFieldByIdOrThrow(input.objectId)
            return buildSchemaForm({
                baseSchemaKey: "UpdateEntryFieldFields",
                title: "Update Field",
                displayOrder: ["label", "required", "options"],
                defaultData: {
                    label: field.label,
                    required: field.required,
                    options: field.options ?? undefined,
                },
            })
        },

        //
        // Record entry forms: THE SHOWCASE. Built dynamically from the live
        // field definitions, so the modal form always IS the user's schema.
        //

        entryRecordCreateFormSchema: async () => {
            const fields = await entryService.listEntryFields()
            return buildEntryRecordSchemaForm(fields, { title: "New Record" })
        },

        entryRecordUpdateFormSchema: async (_parent, { input }) => {
            const record = await entryService.getEntryRecordByIdOrThrow(input.objectId)
            const fields = await entryService.listEntryFields()
            // Only cells of live fields pre-populate the form; orphaned cells
            // (from deleted fields) are kept in storage but have no widget.
            const defaultData = Object.fromEntries(
                fields
                    .filter((field) => record.values[field.fieldKey] !== undefined)
                    .map((field) => [field.fieldKey, record.values[field.fieldKey]]),
            )
            return buildEntryRecordSchemaForm(fields, { title: "Update Record", defaultData })
        },
    },
}

interface EntryRecordFormOptions {
    title: string
    defaultData?: Record<string, unknown>
}

/**
 * The dynamic record form: properties are keyed by fieldKey and typed from
 * the field's EntryFieldType, `required` mirrors the required flags, and
 * "ui:order" follows the column positions. The client submits the form data
 * object and wraps it as valuesJson itself.
 *
 * Type -> JSON Schema mapping (what the web runtime renders):
 *   TEXT   -> string                  (text input)
 *   NUMBER -> number                  (number input)
 *   DATE   -> string, format "date"   (native date picker, "YYYY-MM-DD")
 *   YESNO  -> boolean                 (checkbox)
 *   SELECT -> string enum of options  (select dropdown)
 */
function buildEntryRecordSchemaForm(fields: EntryField[], options: EntryRecordFormOptions): SchemaForm {
    const orderedFields = [...fields].sort((left, right) => left.position - right.position)
    const properties: Record<string, unknown> = {}
    for (const field of orderedFields) {
        properties[field.fieldKey] = recordFormProperty(field)
    }
    return {
        jsonSchema: JSON.stringify({
            type: "object",
            title: options.title,
            properties,
            required: orderedFields.filter((field) => field.required).map((field) => field.fieldKey),
        }),
        uiSchema: JSON.stringify({
            "ui:order": orderedFields.map((field) => field.fieldKey),
        }),
        defaultData: JSON.stringify(options.defaultData ?? {}),
    }
}

function recordFormProperty(field: EntryField): Record<string, unknown> {
    switch (field.fieldType) {
        case "TEXT":
            return { type: "string", title: field.label }
        case "NUMBER":
            return { type: "number", title: field.label }
        case "DATE":
            return { type: "string", format: "date", title: field.label }
        case "YESNO":
            return { type: "boolean", title: field.label }
        case "SELECT":
            return { type: "string", enum: field.options ?? [], title: field.label }
    }
}

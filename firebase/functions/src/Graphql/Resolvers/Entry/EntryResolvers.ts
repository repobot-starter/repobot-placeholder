import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { entryService } from "../../../Services/Entry/EntryService.js"

// Every Entry operation is authenticated by the execution-level gate in
// GraphqlServer.ts (layer 1 of docs/authorization.md): none of these root
// fields are in the public sets, so no resolver here can be reached
// anonymously. The workbook is workspace-global, so no per-resource check
// (layer 2) applies.
export const entryResolvers: GqlResolvers = {
    Query: {
        entryFields: async () => {
            return await entryService.listEntryFields()
        },

        entryRecords: async (_parent, { input }) => {
            return await entryService.listEntryRecords({
                connection: input.connection,
                filters: input.filters,
            })
        },
    },

    Mutation: {
        createEntryField: async (_parent, { input }) => {
            return await entryService.createEntryField({
                idempotencyKey: input.idempotencyKey,
                fields: input.fields,
            })
        },

        updateEntryField: async (_parent, { input }) => {
            return await entryService.updateEntryField({
                objectId: input.objectId,
                idempotencyKey: input.idempotencyKey,
                fields: input.fields,
            })
        },

        deleteEntryField: async (_parent, { input }) => {
            await entryService.deleteEntryField({ objectId: input.objectId })
            return true
        },

        createEntryRecord: async (_parent, { input }) => {
            return await entryService.createEntryRecord({
                idempotencyKey: input.idempotencyKey,
                fields: input.fields,
            })
        },

        updateEntryRecord: async (_parent, { input }) => {
            return await entryService.updateEntryRecord({
                objectId: input.objectId,
                idempotencyKey: input.idempotencyKey,
                fields: input.fields,
            })
        },

        deleteEntryRecord: async (_parent, { input }) => {
            await entryService.deleteEntryRecord({ objectId: input.objectId })
            return true
        },
    },

    EntryField: {
        options: (field) => field.options ?? undefined,
        createdTime: (field) => field.rowCreatedAt,
    },

    EntryRecord: {
        // The wire shape is the JSON encoding of the jsonb cells column.
        valuesJson: (record) => JSON.stringify(record.values),
        createdTime: (record) => record.rowCreatedAt,
        updatedTime: (record) => record.rowUpdatedAt,
    },
}

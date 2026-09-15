import {
    GqlCreateEntryFieldInput,
    GqlCreateEntryRecordInput,
    GqlDeleteEntryFieldInput,
    GqlDeleteEntryRecordInput,
    GqlEntryField,
    GqlEntryRecord,
    GqlEntryRecordConnection,
    GqlEntryRecordConnectionInput,
    GqlSchemaForm,
    GqlUpdateEntryFieldInput,
    GqlUpdateEntryRecordInput,
} from "../../generated/GraphqlResolverTypes.js"
import { executeGqlAt } from "../Utils/Gql/GqlUtils.js"
import { BaseTestHelper } from "../Utils/Helpers/BaseTestHelper.js"

export const entryFieldGqlFields = `
    id
    label
    fieldKey
    fieldType
    required
    options
    position
    createdTime
`

export const entryRecordGqlFields = `
    id
    valuesJson
    createdTime
    updatedTime
`

const pageInfoGqlFields = `
    hasPreviousPage
    hasNextPage
    startCursor
    endCursor
`

const schemaFormGqlFields = `
    jsonSchema
    uiSchema
    defaultData
`

export class EntryTestHelper extends BaseTestHelper {
    async getEntryFields(): Promise<GqlEntryField[]> {
        return await executeGqlAt(
            this.server,
            `query EntryFields {
                entryFields { ${entryFieldGqlFields} }
            }`,
            {},
            "entryFields",
        )
    }

    async createEntryField(input: GqlCreateEntryFieldInput): Promise<GqlEntryField> {
        return await executeGqlAt(
            this.server,
            `mutation CreateEntryField($input: CreateEntryFieldInput!) {
                createEntryField(input: $input) { ${entryFieldGqlFields} }
            }`,
            { input },
            "createEntryField",
        )
    }

    async updateEntryField(input: GqlUpdateEntryFieldInput): Promise<GqlEntryField> {
        return await executeGqlAt(
            this.server,
            `mutation UpdateEntryField($input: UpdateEntryFieldInput!) {
                updateEntryField(input: $input) { ${entryFieldGqlFields} }
            }`,
            { input },
            "updateEntryField",
        )
    }

    async deleteEntryField(input: GqlDeleteEntryFieldInput): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation DeleteEntryField($input: DeleteEntryFieldInput!) {
                deleteEntryField(input: $input)
            }`,
            { input },
            "deleteEntryField",
        )
    }

    async getEntryRecords(input: GqlEntryRecordConnectionInput): Promise<GqlEntryRecordConnection> {
        return await executeGqlAt(
            this.server,
            `query EntryRecords($input: EntryRecordConnectionInput!) {
                entryRecords(input: $input) {
                    nodes { ${entryRecordGqlFields} }
                    pageInfo { ${pageInfoGqlFields} }
                }
            }`,
            { input },
            "entryRecords",
        )
    }

    async createEntryRecord(input: GqlCreateEntryRecordInput): Promise<GqlEntryRecord> {
        return await executeGqlAt(
            this.server,
            `mutation CreateEntryRecord($input: CreateEntryRecordInput!) {
                createEntryRecord(input: $input) { ${entryRecordGqlFields} }
            }`,
            { input },
            "createEntryRecord",
        )
    }

    async updateEntryRecord(input: GqlUpdateEntryRecordInput): Promise<GqlEntryRecord> {
        return await executeGqlAt(
            this.server,
            `mutation UpdateEntryRecord($input: UpdateEntryRecordInput!) {
                updateEntryRecord(input: $input) { ${entryRecordGqlFields} }
            }`,
            { input },
            "updateEntryRecord",
        )
    }

    async deleteEntryRecord(input: GqlDeleteEntryRecordInput): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation DeleteEntryRecord($input: DeleteEntryRecordInput!) {
                deleteEntryRecord(input: $input)
            }`,
            { input },
            "deleteEntryRecord",
        )
    }

    async getEntryFieldCreateFormSchema(): Promise<GqlSchemaForm> {
        return await executeGqlAt(
            this.server,
            `query EntryFieldCreateFormSchema {
                entryFieldCreateFormSchema { ${schemaFormGqlFields} }
            }`,
            {},
            "entryFieldCreateFormSchema",
        )
    }

    async getEntryFieldUpdateFormSchema(objectId: string): Promise<GqlSchemaForm> {
        return await executeGqlAt(
            this.server,
            `query EntryFieldUpdateFormSchema($input: SchemaFormUpdateInput!) {
                entryFieldUpdateFormSchema(input: $input) { ${schemaFormGqlFields} }
            }`,
            { input: { objectId } },
            "entryFieldUpdateFormSchema",
        )
    }

    async getEntryRecordCreateFormSchema(): Promise<GqlSchemaForm> {
        return await executeGqlAt(
            this.server,
            `query EntryRecordCreateFormSchema {
                entryRecordCreateFormSchema { ${schemaFormGqlFields} }
            }`,
            {},
            "entryRecordCreateFormSchema",
        )
    }

    async getEntryRecordUpdateFormSchema(objectId: string): Promise<GqlSchemaForm> {
        return await executeGqlAt(
            this.server,
            `query EntryRecordUpdateFormSchema($input: SchemaFormUpdateInput!) {
                entryRecordUpdateFormSchema(input: $input) { ${schemaFormGqlFields} }
            }`,
            { input: { objectId } },
            "entryRecordUpdateFormSchema",
        )
    }
}

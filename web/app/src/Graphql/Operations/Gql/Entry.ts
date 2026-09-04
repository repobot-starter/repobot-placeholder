import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _EntryFieldFields = gql`
    fragment EntryFieldFields on EntryField {
        id
        label
        fieldKey
        fieldType
        required
        options
        position
        createdTime
    }
`

export const _EntryRecordFields = gql`
    fragment EntryRecordFields on EntryRecord {
        id
        valuesJson
        createdTime
        updatedTime
    }
`

export const _EntryFields = gql`
    query EntryFields {
        entryFields {
            ...EntryFieldFields
        }
    }
`

export const _EntryRecords = gql`
    query EntryRecords($input: EntryRecordConnectionInput!) {
        entryRecords(input: $input) {
            nodes {
                ...EntryRecordFields
            }
            pageInfo {
                ...PageInfoFields
            }
        }
    }
`

export const _EntryFieldCreateFormSchema = gql`
    query EntryFieldCreateFormSchema {
        schema: entryFieldCreateFormSchema {
            jsonSchema
            uiSchema
            defaultData
        }
    }
`

export const _EntryFieldUpdateFormSchema = gql`
    query EntryFieldUpdateFormSchema($input: SchemaFormUpdateInput!) {
        schema: entryFieldUpdateFormSchema(input: $input) {
            jsonSchema
            uiSchema
            defaultData
        }
    }
`

export const _EntryRecordCreateFormSchema = gql`
    query EntryRecordCreateFormSchema {
        schema: entryRecordCreateFormSchema {
            jsonSchema
            uiSchema
            defaultData
        }
    }
`

export const _EntryRecordUpdateFormSchema = gql`
    query EntryRecordUpdateFormSchema($input: SchemaFormUpdateInput!) {
        schema: entryRecordUpdateFormSchema(input: $input) {
            jsonSchema
            uiSchema
            defaultData
        }
    }
`

export const _CreateEntryField = gql`
    mutation CreateEntryField($input: CreateEntryFieldInput!) {
        createEntryField(input: $input) {
            ...EntryFieldFields
        }
    }
`

export const _UpdateEntryField = gql`
    mutation UpdateEntryField($input: UpdateEntryFieldInput!) {
        updateEntryField(input: $input) {
            ...EntryFieldFields
        }
    }
`

export const _DeleteEntryField = gql`
    mutation DeleteEntryField($input: DeleteEntryFieldInput!) {
        deleteEntryField(input: $input)
    }
`

export const _CreateEntryRecord = gql`
    mutation CreateEntryRecord($input: CreateEntryRecordInput!) {
        createEntryRecord(input: $input) {
            ...EntryRecordFields
        }
    }
`

export const _UpdateEntryRecord = gql`
    mutation UpdateEntryRecord($input: UpdateEntryRecordInput!) {
        updateEntryRecord(input: $input) {
            ...EntryRecordFields
        }
    }
`

export const _DeleteEntryRecord = gql`
    mutation DeleteEntryRecord($input: DeleteEntryRecordInput!) {
        deleteEntryRecord(input: $input)
    }
`

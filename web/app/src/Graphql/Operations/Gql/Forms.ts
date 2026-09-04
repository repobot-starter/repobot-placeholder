import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
// Every form-schema query aliases its root field to "schema" so the modal
// wiring can read result.schema regardless of entity.
//

export const _SchemaFormFields = gql`
    fragment SchemaFormFields on SchemaForm {
        jsonSchema
        uiSchema
        defaultData
    }
`

export const _UserCreateFormSchema = gql`
    query UserCreateFormSchema {
        schema: userCreateFormSchema {
            ...SchemaFormFields
        }
    }
`

export const _UserUpdateFormSchema = gql`
    query UserUpdateFormSchema($input: SchemaFormUpdateInput!) {
        schema: userUpdateFormSchema(input: $input) {
            ...SchemaFormFields
        }
    }
`

export const _ProjectCreateFormSchema = gql`
    query ProjectCreateFormSchema {
        schema: projectCreateFormSchema {
            ...SchemaFormFields
        }
    }
`

export const _ProjectUpdateFormSchema = gql`
    query ProjectUpdateFormSchema($input: SchemaFormUpdateInput!) {
        schema: projectUpdateFormSchema(input: $input) {
            ...SchemaFormFields
        }
    }
`

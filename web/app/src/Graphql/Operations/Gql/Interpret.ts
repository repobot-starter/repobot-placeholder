import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _InterpretDocument = gql`
    mutation InterpretDocument($input: InterpretDocumentInput!) {
        interpretDocument(input: $input) {
            documentType
            title
            summary
            keyPoints
            fields {
                label
                value
            }
            pageCount
        }
    }
`

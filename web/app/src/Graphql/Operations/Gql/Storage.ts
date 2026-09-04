import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _CreateUpload = gql`
    mutation CreateUpload($input: CreateUploadInput!) {
        createUpload(input: $input) {
            uploadId
            uploadUrl
            headersJson
            upload {
                id
                contentType
                sizeBytes
                visibility
                status
            }
        }
    }
`

export const _FinalizeUpload = gql`
    mutation FinalizeUpload($input: FinalizeUploadInput!) {
        finalizeUpload(input: $input) {
            id
            status
            sizeBytes
        }
    }
`

export const _DeleteUpload = gql`
    mutation DeleteUpload($input: DeleteUploadInput!) {
        deleteUpload(input: $input)
    }
`

export const _FileUrl = gql`
    query FileUrl($uploadId: Id!) {
        fileUrl(uploadId: $uploadId) {
            url
        }
    }
`

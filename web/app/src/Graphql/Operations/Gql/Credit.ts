import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _CreditDocumentFields = gql`
    fragment CreditDocumentFields on CreditDocument {
        id
        uploadId
        kind
        fileName
        reference
        currency
        amountMinorUnits
        shipmentDate
        portOfLoading
        portOfDischarge
        goodsDescription
        attachedTime
    }
`

export const _CreditFindingFields = gql`
    fragment CreditFindingFields on CreditFinding {
        code
        severity
        title
        detail
        documentId
    }
`

export const _CreditLcFields = gql`
    fragment CreditLcFields on CreditLc {
        id
        uploadId
        reference
        issuingBank
        applicant
        beneficiary
        currency
        amountMinorUnits
        tolerancePercent
        issueDate
        expiryDate
        latestShipmentDate
        presentationPeriodDays
        portOfLoading
        portOfDischarge
        partialShipments
        transhipment
        goodsDescription
        documentsRequired
        ingestedTime
        documents {
            ...CreditDocumentFields
        }
        findings {
            ...CreditFindingFields
        }
    }
`

export const _CreditLcs = gql`
    query CreditLcs {
        creditLcs {
            ...CreditLcFields
        }
    }
`

export const _CreditLc = gql`
    query CreditLc($lcId: Id!) {
        creditLc(lcId: $lcId) {
            ...CreditLcFields
        }
    }
`

export const _CreditIngestLc = gql`
    mutation CreditIngestLc($input: CreditIngestLcInput!) {
        creditIngestLc(input: $input) {
            ...CreditLcFields
        }
    }
`

export const _CreditAttachDocument = gql`
    mutation CreditAttachDocument($input: CreditAttachDocumentInput!) {
        creditAttachDocument(input: $input) {
            ...CreditDocumentFields
        }
    }
`

export const _CreditRemoveDocument = gql`
    mutation CreditRemoveDocument($input: CreditRemoveDocumentInput!) {
        creditRemoveDocument(input: $input)
    }
`

export const _CreditDeleteLc = gql`
    mutation CreditDeleteLc($input: CreditDeleteLcInput!) {
        creditDeleteLc(input: $input)
    }
`

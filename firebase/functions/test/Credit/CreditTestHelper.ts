import {
    GqlCreditAttachDocumentInput,
    GqlCreditDocument,
    GqlCreditIngestLcInput,
    GqlCreditLc,
    GqlUser,
} from "../../generated/GraphqlResolverTypes.js"
import { asUser, executeGqlAt } from "../Utils/Gql/GqlUtils.js"
import { BaseTestHelper } from "../Utils/Helpers/BaseTestHelper.js"

export const creditDocumentGqlFields = `
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
`

export const creditFindingGqlFields = `
    code
    severity
    title
    detail
    documentId
`

export const creditLcGqlFields = `
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
    documents { ${creditDocumentGqlFields} }
    findings { ${creditFindingGqlFields} }
`

export class CreditTestHelper extends BaseTestHelper {
    async ingestLc(user: GqlUser, input: GqlCreditIngestLcInput): Promise<GqlCreditLc> {
        return await executeGqlAt(
            this.server,
            `mutation CreditIngestLc($input: CreditIngestLcInput!) {
                creditIngestLc(input: $input) { ${creditLcGqlFields} }
            }`,
            { input },
            "creditIngestLc",
            asUser(user),
        )
    }

    async listLcs(user: GqlUser): Promise<GqlCreditLc[]> {
        return await executeGqlAt(
            this.server,
            `query CreditLcs {
                creditLcs { ${creditLcGqlFields} }
            }`,
            {},
            "creditLcs",
            asUser(user),
        )
    }

    async getLc(user: GqlUser, lcId: string): Promise<GqlCreditLc> {
        return await executeGqlAt(
            this.server,
            `query CreditLc($lcId: Id!) {
                creditLc(lcId: $lcId) { ${creditLcGqlFields} }
            }`,
            { lcId },
            "creditLc",
            asUser(user),
        )
    }

    async attachDocument(user: GqlUser, input: GqlCreditAttachDocumentInput): Promise<GqlCreditDocument> {
        return await executeGqlAt(
            this.server,
            `mutation CreditAttachDocument($input: CreditAttachDocumentInput!) {
                creditAttachDocument(input: $input) { ${creditDocumentGqlFields} }
            }`,
            { input },
            "creditAttachDocument",
            asUser(user),
        )
    }

    async removeDocument(user: GqlUser, documentId: string): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation CreditRemoveDocument($input: CreditRemoveDocumentInput!) {
                creditRemoveDocument(input: $input)
            }`,
            { input: { documentId } },
            "creditRemoveDocument",
            asUser(user),
        )
    }

    async deleteLc(user: GqlUser, lcId: string): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation CreditDeleteLc($input: CreditDeleteLcInput!) {
                creditDeleteLc(input: $input)
            }`,
            { input: { lcId } },
            "creditDeleteLc",
            asUser(user),
        )
    }
}

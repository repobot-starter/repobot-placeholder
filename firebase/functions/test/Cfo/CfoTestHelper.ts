import {
    GqlCfoConnectMyBooksInput,
    GqlCfoExportClientStatementsXlsxInput,
    GqlCfoInvite,
    GqlCfoInviteClientInput,
    GqlCfoMembership,
    GqlQuickBooksConnection,
    GqlUpload,
    GqlUser,
} from "../../generated/GraphqlResolverTypes.js"
import { asUser, executeGqlAt } from "../Utils/Gql/GqlUtils.js"
import { BaseTestHelper } from "../Utils/Helpers/BaseTestHelper.js"
import { quickBooksConnectionGqlFields } from "../QuickBooks/QuickBooksTestHelper.js"

export const cfoMembershipGqlFields = `
    id
    role
    user { id email displayName }
    joinedTime
`

export const cfoInviteGqlFields = `
    id
    email
    role
    status
    invitedTime
`

/** The books fields a CfoClient carries (statement periods trimmed to the shape tests assert). */
export const cfoClientGqlFields = `
    membership { ${cfoMembershipGqlFields} }
    connection { ${quickBooksConnectionGqlFields} }
    snapshot {
        companyName
        currency
        revenueMinorUnits
        outstandingMinorUnits
        overdueMinorUnits
        paidInvoiceCount
        openInvoiceCount
        overdueInvoiceCount
        customerCount
    }
    profitAndLoss {
        month
        totalIncomeMinorUnits
        totalExpensesMinorUnits
        netIncomeMinorUnits
    }
    balanceSheet {
        month
        totalAssetsMinorUnits
        totalLiabilitiesMinorUnits
        totalEquityMinorUnits
    }
`

export interface GqlCfoClientView {
    membership: GqlCfoMembership
    connection: GqlQuickBooksConnection | null
    snapshot: {
        companyName: string
        currency: string
        revenueMinorUnits: number
        outstandingMinorUnits: number
        overdueMinorUnits: number
        paidInvoiceCount: number
        openInvoiceCount: number
        overdueInvoiceCount: number
        customerCount: number
    } | null
    profitAndLoss: {
        month: string
        totalIncomeMinorUnits: number
        totalExpensesMinorUnits: number
        netIncomeMinorUnits: number
    }[]
    balanceSheet: {
        month: string
        totalAssetsMinorUnits: number
        totalLiabilitiesMinorUnits: number
        totalEquityMinorUnits: number
    }[]
}

export class CfoTestHelper extends BaseTestHelper {
    async getMyMembership(user: GqlUser): Promise<GqlCfoMembership> {
        return await executeGqlAt(
            this.server,
            `query CfoMyMembership {
                cfoMyMembership { ${cfoMembershipGqlFields} }
            }`,
            {},
            "cfoMyMembership",
            asUser(user),
        )
    }

    async listClients(user: GqlUser): Promise<GqlCfoClientView[]> {
        return await executeGqlAt(
            this.server,
            `query CfoClients {
                cfoClients { ${cfoClientGqlFields} }
            }`,
            {},
            "cfoClients",
            asUser(user),
        )
    }

    async getClient(user: GqlUser, clientUserId: string): Promise<GqlCfoClientView> {
        return await executeGqlAt(
            this.server,
            `query CfoClient($clientUserId: Id!) {
                cfoClient(clientUserId: $clientUserId) { ${cfoClientGqlFields} }
            }`,
            { clientUserId },
            "cfoClient",
            asUser(user),
        )
    }

    async listInvites(user: GqlUser): Promise<GqlCfoInvite[]> {
        return await executeGqlAt(
            this.server,
            `query CfoInvites {
                cfoInvites { ${cfoInviteGqlFields} }
            }`,
            {},
            "cfoInvites",
            asUser(user),
        )
    }

    async inviteClient(user: GqlUser, input: GqlCfoInviteClientInput): Promise<GqlCfoInvite> {
        return await executeGqlAt(
            this.server,
            `mutation CfoInviteClient($input: CfoInviteClientInput!) {
                cfoInviteClient(input: $input) { ${cfoInviteGqlFields} }
            }`,
            { input },
            "cfoInviteClient",
            asUser(user),
        )
    }

    async revokeInvite(user: GqlUser, inviteId: string): Promise<GqlCfoInvite> {
        return await executeGqlAt(
            this.server,
            `mutation CfoRevokeInvite($input: CfoRevokeInviteInput!) {
                cfoRevokeInvite(input: $input) { ${cfoInviteGqlFields} }
            }`,
            { input: { inviteId } },
            "cfoRevokeInvite",
            asUser(user),
        )
    }

    async connectMyBooks(user: GqlUser, input: GqlCfoConnectMyBooksInput): Promise<GqlQuickBooksConnection> {
        return await executeGqlAt(
            this.server,
            `mutation CfoConnectMyBooks($input: CfoConnectMyBooksInput!) {
                cfoConnectMyBooks(input: $input) { ${quickBooksConnectionGqlFields} }
            }`,
            { input },
            "cfoConnectMyBooks",
            asUser(user),
        )
    }

    async disconnectMyBooks(user: GqlUser): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation CfoDisconnectMyBooks {
                cfoDisconnectMyBooks
            }`,
            {},
            "cfoDisconnectMyBooks",
            asUser(user),
        )
    }

    async exportClientStatementsXlsx(
        user: GqlUser,
        input: GqlCfoExportClientStatementsXlsxInput,
    ): Promise<GqlUpload> {
        return await executeGqlAt(
            this.server,
            `mutation CfoExportClientStatementsXlsx($input: CfoExportClientStatementsXlsxInput!) {
                cfoExportClientStatementsXlsx(input: $input) {
                    id
                    contentType
                    fileName
                    visibility
                    status
                    sizeBytes
                }
            }`,
            { input },
            "cfoExportClientStatementsXlsx",
            asUser(user),
        )
    }
}

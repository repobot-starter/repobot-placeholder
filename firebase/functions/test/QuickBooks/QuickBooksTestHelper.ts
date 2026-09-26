import {
    GqlCompleteQuickBooksAuthorizationInput,
    GqlConnectQuickBooksInput,
    GqlExportQuickBooksStatementsXlsxInput,
    GqlQuickBooksBalanceSheetPeriod,
    GqlQuickBooksCompanySnapshot,
    GqlQuickBooksConnection,
    GqlQuickBooksCustomer,
    GqlQuickBooksInvoice,
    GqlQuickBooksInvoicesInput,
    GqlQuickBooksProfitAndLossPeriod,
    GqlQuickBooksStatus,
    GqlUpload,
    GqlUser,
} from "../../generated/GraphqlResolverTypes.js"
import { asUser, executeGqlAt } from "../Utils/Gql/GqlUtils.js"
import { BaseTestHelper } from "../Utils/Helpers/BaseTestHelper.js"

export const quickBooksConnectionGqlFields = `
    id
    realmId
    companyName
    mode
    provider
    connectedTime
`

export const quickBooksInvoiceGqlFields = `
    id
    docNumber
    customerId
    customerName
    status
    issueDate
    dueDate
    totalMinorUnits
    balanceMinorUnits
`

export class QuickBooksTestHelper extends BaseTestHelper {
    /** Connects QuickBooks as the given user (the mutation requires a user principal). */
    async connectQuickBooks(
        input: GqlConnectQuickBooksInput,
        user: GqlUser,
    ): Promise<GqlQuickBooksConnection> {
        return await executeGqlAt(
            this.server,
            `mutation ConnectQuickBooks($input: ConnectQuickBooksInput!) {
                connectQuickBooks(input: $input) { ${quickBooksConnectionGqlFields} }
            }`,
            { input },
            "connectQuickBooks",
            asUser(user),
        )
    }

    /** Connects the caller's own books (the per-user surface). */
    async connectMyBooks(input: GqlConnectQuickBooksInput, user: GqlUser): Promise<GqlQuickBooksConnection> {
        return await executeGqlAt(
            this.server,
            `mutation ConnectMyBooks($input: ConnectQuickBooksInput!) {
                connectMyBooks(input: $input) { ${quickBooksConnectionGqlFields} }
            }`,
            { input },
            "connectMyBooks",
            asUser(user),
        )
    }

    async disconnectMyBooks(user: GqlUser): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation DisconnectMyBooks {
                disconnectMyBooks
            }`,
            {},
            "disconnectMyBooks",
            asUser(user),
        )
    }

    async getMyBooksConnection(user: GqlUser): Promise<GqlQuickBooksConnection | null> {
        return await executeGqlAt(
            this.server,
            `query MyBooksConnection {
                myBooksConnection { ${quickBooksConnectionGqlFields} }
            }`,
            {},
            "myBooksConnection",
            asUser(user),
        )
    }

    async disconnectQuickBooks(): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation DisconnectQuickBooks {
                disconnectQuickBooks
            }`,
            {},
            "disconnectQuickBooks",
        )
    }

    async getStatus(): Promise<GqlQuickBooksStatus> {
        return await executeGqlAt(
            this.server,
            `query QuickBooksStatus {
                quickBooksStatus {
                    connected
                    mode
                    connection { ${quickBooksConnectionGqlFields} }
                }
            }`,
            {},
            "quickBooksStatus",
        )
    }

    /** Starts the intuit-mode OAuth connect; returns the consent URL. */
    async beginAuthorization(redirectUri: string, user: GqlUser): Promise<string> {
        const result = await executeGqlAt<{ authorizationUrl: string }>(
            this.server,
            `mutation BeginQuickBooksAuthorization($input: BeginQuickBooksAuthorizationInput!) {
                beginQuickBooksAuthorization(input: $input) { authorizationUrl }
            }`,
            { input: { redirectUri } },
            "beginQuickBooksAuthorization",
            asUser(user),
        )
        return result.authorizationUrl
    }

    /** Finishes the intuit-mode OAuth connect from callback parameters. */
    async completeAuthorization(
        input: GqlCompleteQuickBooksAuthorizationInput,
        user: GqlUser,
    ): Promise<GqlQuickBooksConnection> {
        return await executeGqlAt(
            this.server,
            `mutation CompleteQuickBooksAuthorization($input: CompleteQuickBooksAuthorizationInput!) {
                completeQuickBooksAuthorization(input: $input) { ${quickBooksConnectionGqlFields} }
            }`,
            { input },
            "completeQuickBooksAuthorization",
            asUser(user),
        )
    }

    async getCompanySnapshot(): Promise<GqlQuickBooksCompanySnapshot> {
        return await executeGqlAt(
            this.server,
            `query QuickBooksCompanySnapshot {
                quickBooksCompanySnapshot {
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
            }`,
            {},
            "quickBooksCompanySnapshot",
        )
    }

    async getCustomers(): Promise<GqlQuickBooksCustomer[]> {
        return await executeGqlAt(
            this.server,
            `query QuickBooksCustomers {
                quickBooksCustomers {
                    id
                    displayName
                    companyName
                    email
                    city
                    state
                    customerSince
                    openBalanceMinorUnits
                }
            }`,
            {},
            "quickBooksCustomers",
        )
    }

    async getInvoices(input?: GqlQuickBooksInvoicesInput): Promise<GqlQuickBooksInvoice[]> {
        return await executeGqlAt(
            this.server,
            `query QuickBooksInvoices($input: QuickBooksInvoicesInput) {
                quickBooksInvoices(input: $input) { ${quickBooksInvoiceGqlFields} }
            }`,
            { input: input ?? null },
            "quickBooksInvoices",
        )
    }

    async getProfitAndLoss(): Promise<GqlQuickBooksProfitAndLossPeriod[]> {
        return await executeGqlAt(
            this.server,
            `query QuickBooksProfitAndLoss {
                quickBooksProfitAndLoss {
                    month
                    incomeLines { category minorUnits }
                    totalIncomeMinorUnits
                    expenseLines { category minorUnits }
                    totalExpensesMinorUnits
                    netIncomeMinorUnits
                }
            }`,
            {},
            "quickBooksProfitAndLoss",
        )
    }

    async exportStatementsXlsx(
        input: GqlExportQuickBooksStatementsXlsxInput,
        user: GqlUser,
    ): Promise<GqlUpload> {
        return await executeGqlAt(
            this.server,
            `mutation ExportQuickBooksStatementsXlsx($input: ExportQuickBooksStatementsXlsxInput!) {
                exportQuickBooksStatementsXlsx(input: $input) {
                    id
                    contentType
                    fileName
                    visibility
                    status
                    sizeBytes
                }
            }`,
            { input },
            "exportQuickBooksStatementsXlsx",
            asUser(user),
        )
    }

    async getBalanceSheet(): Promise<GqlQuickBooksBalanceSheetPeriod[]> {
        return await executeGqlAt(
            this.server,
            `query QuickBooksBalanceSheet {
                quickBooksBalanceSheet {
                    month
                    assetLines { category minorUnits }
                    totalAssetsMinorUnits
                    liabilityLines { category minorUnits }
                    totalLiabilitiesMinorUnits
                    equityLines { category minorUnits }
                    totalEquityMinorUnits
                }
            }`,
            {},
            "quickBooksBalanceSheet",
        )
    }
}

import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _CfoMembershipFields = gql`
    fragment CfoMembershipFields on CfoMembership {
        id
        role
        joinedTime
        user {
            id
            email
            displayName
        }
    }
`

export const _CfoInviteFields = gql`
    fragment CfoInviteFields on CfoInvite {
        id
        email
        role
        status
        invitedTime
    }
`

export const _CfoMyMembership = gql`
    query CfoMyMembership {
        cfoMyMembership {
            ...CfoMembershipFields
        }
    }
`

export const _CfoClients = gql`
    query CfoClients {
        cfoClients {
            membership {
                ...CfoMembershipFields
            }
            connection {
                id
                companyName
                provider
                connectedTime
            }
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
        }
    }
`

export const _CfoClientStatements = gql`
    query CfoClientStatements($clientUserId: Id!) {
        cfoClient(clientUserId: $clientUserId) {
            membership {
                ...CfoMembershipFields
            }
            connection {
                id
                companyName
                provider
                connectedTime
            }
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
                incomeLines {
                    category
                    minorUnits
                }
                totalIncomeMinorUnits
                expenseLines {
                    category
                    minorUnits
                }
                totalExpensesMinorUnits
                netIncomeMinorUnits
            }
            balanceSheet {
                month
                assetLines {
                    category
                    minorUnits
                }
                totalAssetsMinorUnits
                liabilityLines {
                    category
                    minorUnits
                }
                totalLiabilitiesMinorUnits
                equityLines {
                    category
                    minorUnits
                }
                totalEquityMinorUnits
            }
        }
    }
`

export const _CfoInvites = gql`
    query CfoInvites {
        cfoInvites {
            ...CfoInviteFields
        }
    }
`

export const _CfoInviteClient = gql`
    mutation CfoInviteClient($input: CfoInviteClientInput!) {
        cfoInviteClient(input: $input) {
            ...CfoInviteFields
        }
    }
`

export const _CfoRevokeInvite = gql`
    mutation CfoRevokeInvite($input: CfoRevokeInviteInput!) {
        cfoRevokeInvite(input: $input) {
            ...CfoInviteFields
        }
    }
`

export const _CfoConnectMyBooks = gql`
    mutation CfoConnectMyBooks($input: CfoConnectMyBooksInput!) {
        cfoConnectMyBooks(input: $input) {
            id
            companyName
            provider
            connectedTime
        }
    }
`

export const _CfoDisconnectMyBooks = gql`
    mutation CfoDisconnectMyBooks {
        cfoDisconnectMyBooks
    }
`

export const _CfoExportClientStatementsXlsx = gql`
    mutation CfoExportClientStatementsXlsx($input: CfoExportClientStatementsXlsxInput!) {
        cfoExportClientStatementsXlsx(input: $input) {
            id
            fileName
        }
    }
`
